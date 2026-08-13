require("isomorphic-fetch");

const env = require("../config/env");

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TIMEOUT_MS = 8000;

class TurnstileVerificationError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "TurnstileVerificationError";
    this.statusCode = statusCode;
  }
}

async function verifyTurnstile(token, remoteIp) {
  if (!env.TURNSTILE_ENABLED) {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TURNSTILE_TIMEOUT_MS);

  try {
    const formData = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token
    });

    if (remoteIp) {
      formData.set("remoteip", remoteIp);
    }

    const verificationResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
      signal: controller.signal
    });

    if (!verificationResponse.ok) {
      throw new TurnstileVerificationError("Unable to verify the security check. Please try again.", 503);
    }

    const verification = await verificationResponse.json();
    const hostname = typeof verification.hostname === "string" ? verification.hostname.toLowerCase() : "";

    if (!verification.success || !env.TURNSTILE_ALLOWED_HOSTNAMES.includes(hostname)) {
      throw new TurnstileVerificationError("Please complete the security check and try again.", 400);
    }
  } catch (error) {
    if (error instanceof TurnstileVerificationError) {
      throw error;
    }

    throw new TurnstileVerificationError("Unable to verify the security check. Please try again.", 503);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { TurnstileVerificationError, verifyTurnstile };
