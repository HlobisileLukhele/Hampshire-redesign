const express = require("express");
const env = require("../config/env");

const router = express.Router();

router.get("/", (_request, response) => {
  response.set("Cache-Control", "no-store").json({
    turnstileEnabled: env.TURNSTILE_ENABLED,
    turnstileSiteKey: env.TURNSTILE_ENABLED ? env.TURNSTILE_SITE_KEY : ""
  });
});

module.exports = router;
