const express = require("express");
const { ipKeyGenerator, rateLimit } = require("express-rate-limit");
const crypto = require("node:crypto");
const { z } = require("zod");
const env = require("../config/env");
const { sendFormEmail } = require("../services/mailer");
const {
  createEnquiry,
  releaseEnquiryFingerprint,
  reserveEnquiryFingerprint,
  updateEnquiryStatus
} = require("../services/enquiry-service");
const { TurnstileVerificationError, verifyTurnstile } = require("../services/turnstile-service");

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
    message: z.string().trim().min(10).max(5000),
    website: z.string().max(256).optional(),
    turnstileToken: z.string().min(1).max(2048).optional()
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

const emailRateLimit = rateLimit({
  windowMs: env.CONTACT_EMAIL_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: env.CONTACT_EMAIL_RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (request) => {
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
    return email ? `email:${email}` : `ip:${ipKeyGenerator(request.ip)}`;
  },
  message: {
    message: "Too many enquiries were sent using this email address. Please try again later."
  }
});

function enquiryFingerprint(enquiry) {
  return crypto
    .createHash("sha256")
    .update([enquiry.name, enquiry.email, enquiry.phone || "", enquiry.subject || "", enquiry.message].join("\u0000"))
    .digest("hex");
}

router.post("/", enquiryRateLimit, emailRateLimit, async (request, response, next) => {
  const parsedEnquiry = enquirySchema.safeParse(request.body);

  if (!parsedEnquiry.success) {
    return response.status(400).json({
      message: "Please check the required fields and try again.",
      fields: parsedEnquiry.error.issues.map((issue) => issue.path.join("."))
    });
  }

  const { website, turnstileToken, ...enquiry } = parsedEnquiry.data;

  // Bots that complete a hidden field are accepted silently so they cannot tune their attack.
  if (website) {
    return response.status(200).json({ success: true, message: "Enquiry submitted successfully" });
  }

  if (env.TURNSTILE_ENABLED && !turnstileToken) {
    return response.status(400).json({ message: "Please complete the security check and try again." });
  }

  try {
    await verifyTurnstile(turnstileToken, request.ip);
  } catch (error) {
    if (error instanceof TurnstileVerificationError) {
      return response.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }

  const fingerprint = enquiryFingerprint(enquiry);

  try {
    const isNewEnquiry = await reserveEnquiryFingerprint(
      fingerprint,
      env.CONTACT_DEDUPLICATION_WINDOW_MINUTES
    );

    if (!isNewEnquiry) {
      return response.status(409).json({
        message: "We already received this enquiry. Please allow us time to reply."
      });
    }
  } catch (error) {
    return next(error);
  }

  let enquiryId;

  try {
    enquiryId = await createEnquiry(enquiry);
  } catch (error) {
    await releaseEnquiryFingerprint(fingerprint).catch((releaseError) => {
      console.error("Failed to release enquiry fingerprint after database error", releaseError);
    });
    return next(error);
  }

  try {
    await sendFormEmail(enquiry);
  } catch (error) {
    console.error(`Failed to send email notification for enquiry ${enquiryId}`, error);

    await releaseEnquiryFingerprint(fingerprint).catch((releaseError) => {
      console.error("Failed to release enquiry fingerprint after mail error", releaseError);
    });

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
