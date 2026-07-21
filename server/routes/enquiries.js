const express = require("express");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const env = require("../config/env");
const { createEnquiry } = require("../services/enquiry-service");

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

  try {
    await createEnquiry(parsedEnquiry.data);

    return response.status(201).json({
      message: "Your enquiry has been received. Our reservations team will be in touch within one business day."
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
