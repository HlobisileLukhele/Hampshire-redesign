const path = require("node:path");
const express = require("express");
const helmet = require("helmet");
const env = require("./config/env");
const healthRouter = require("./routes/health");
const enquiriesRouter = require("./routes/enquiries");
const publicConfigRouter = require("./routes/public-config");
const { errorHandler, notFound } = require("./middleware/error-handler");

const siteRoot = path.resolve(__dirname, "..");
const pages = [
  "about.html",
  "attractions.html",
  "booknow.html",
  "conferences.html",
  "contact.html",
  "facilities.html",
  "gallery.html",
  "index.html",
  "king-mobility-room.html",
  "king-room.html",
  "pool-view-room.html",
  "queen-mobility-room.html",
  "queen-room.html",
  "rooms.html",
  "terms.html"
];

const contentSecurityPolicy = {
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    connectSrc: [
      "'self'",
      "https://challenges.cloudflare.com",
      "https://nebulacrs.hti.app",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com"
    ],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    frameSrc: [
      "https://challenges.cloudflare.com",
      "https://maps.google.com",
      "https://nebulacrs.hti.app",
      "https://www.googletagmanager.com",
      "https://www.youtube.com"
    ],
    imgSrc: ["'self'", "data:", "https://www.google-analytics.com", "https://www.googletagmanager.com"],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    scriptSrc: [
      "'self'",
      "https://challenges.cloudflare.com",
      "https://nebulacrs.hti.app",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://www.youtube.com"
    ],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://nebulacrs.hti.app"],
    ...(env.NODE_ENV === "production" ? { upgradeInsecureRequests: [] } : {})
  }
};

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);
  app.use(
    helmet({
      contentSecurityPolicy,
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    })
  );
  app.use((_request, response, next) => {
    response.setHeader(
      "Permissions-Policy",
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), usb=()"
    );
    next();
  });
  app.use(express.json({ limit: "25kb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/public-config", publicConfigRouter);
  app.use("/api/enquiries", enquiriesRouter);
  app.use("/api", (_request, response) => response.status(404).json({ message: "API endpoint not found." }));

  app.use("/css", express.static(path.join(siteRoot, "css"), { index: false }));
  // Image assets are stored in the capitalised Images directory; serve that exact
  // directory so the hero video fallback also works on case-sensitive hosts.
  app.use("/Images", express.static(path.join(siteRoot, "Images"), { index: false }));
  app.use("/images", express.static(path.join(siteRoot, "Images"), { index: false }));
  app.use("/js", express.static(path.join(siteRoot, "js"), { index: false }));

  app.get("/", (_request, response) => response.sendFile(path.join(siteRoot, "index.html")));
  pages.forEach((page) => {
    app.get(`/${page}`, (_request, response) => response.sendFile(path.join(siteRoot, page)));
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
