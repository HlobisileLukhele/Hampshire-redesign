const path = require("node:path");
const express = require("express");
const helmet = require("helmet");
const env = require("./config/env");
const healthRouter = require("./routes/health");
const enquiriesRouter = require("./routes/enquiries");
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
  "rooms.html"
];

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);
  app.use(
    helmet({
      // The existing site uses third-party resources. Add a strict CSP after those sources are finalised.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );
  app.use(express.json({ limit: "25kb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/enquiries", enquiriesRouter);
  app.use("/api", (_request, response) => response.status(404).json({ message: "API endpoint not found." }));

  app.use("/css", express.static(path.join(siteRoot, "css"), { index: false }));
  app.use("/images", express.static(path.join(siteRoot, "images"), { index: false }));
  app.use("/js", express.static(path.join(siteRoot, "js"), { index: false }));

  app.get("/", (_request, response) => response.sendFile(path.join(siteRoot, "index.html")));
  pages.filter((page) => page !== "index.html").forEach((page) => {
    app.get(`/${page}`, (_request, response) => response.sendFile(path.join(siteRoot, page)));
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
