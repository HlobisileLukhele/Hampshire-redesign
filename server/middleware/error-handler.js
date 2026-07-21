function notFound(request, response) {
  if (request.path.startsWith("/api/")) {
    return response.status(404).json({ message: "API endpoint not found." });
  }

  return response.status(404).type("text").send("Page not found.");
}

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  console.error(`Request failed: ${request.method} ${request.originalUrl}`, error.message);

  if (error.type === "entity.too.large") {
    return response.status(413).json({ message: "The request is too large." });
  }

  if (error instanceof SyntaxError && Object.hasOwn(error, "body")) {
    return response.status(400).json({ message: "Request body must be valid JSON." });
  }

  return response.status(500).json({
    message: "Unable to process your request at the moment. Please try again later."
  });
}

module.exports = { errorHandler, notFound };
