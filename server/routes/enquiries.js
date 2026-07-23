const express = require("express");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const env = require("../config/env");
const { sendFormEmail } = require("../services/mailer");
const { createEnquiry, updateEnquiryStatus } = require("../services/enquiry-service");

const router = express.Router();

function optionalText(maximumLength) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmedValue = value.trim();
      return trimmedValue === "" ? undefined : trimmedValue;
    },
    z.string().max(maximumLength).optional()
  );
}

const enquirySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    phone: optionalText(40),
    subject: optionalText(180),
    message: z.string().trim().min(10).max(5000)
  })
  .strict();

const enquiryRateLimit = rateLimit({
  windowMs: env.CONTACT_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: env.CONTACT_RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many enquiries were sent from this connection. Please try again later."
  }
});

router.post("/", enquiryRateLimit, async (request, response, next) => {
  const parsedEnquiry = enquirySchema.safeParse(request.body);

  if (!parsedEnquiry.success) {
    return response.status(400).json({
      message: "Please check the required fields and try again.",
      fields: parsedEnquiry.error.issues.map((issue) => issue.path.join("."))
    });
  }

  let enquiryId;

  try {
    enquiryId = await createEnquiry(parsedEnquiry.data);
  } catch (error) {
    return next(error);
  }

  try {
    await sendFormEmail(parsedEnquiry.data);
  } catch (error) {
    console.error(`Failed to send email notification for enquiry ${enquiryId}`, error);

    try {
      await updateEnquiryStatus(enquiryId, "failed");
    } catch (statusError) {
      console.error(`Failed to mark enquiry ${enquiryId} as failed`, statusError);
    }

    return response.status(500).json({
      success: false,
      message: "Failed to send email notification"
    });
  }

  try {
    await updateEnquiryStatus(enquiryId, "sent");
  } catch (error) {
    console.error(`Failed to update enquiry ${enquiryId} to 'sent'`, error);
  }

  return response.status(200).json({
    success: true,
    message: "Enquiry submitted successfully"
  });
});

module.exports = router;
