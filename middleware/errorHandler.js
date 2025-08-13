// Global error handler middleware
function errorHandler(err, req, res, next) {
  const now = new Date().toISOString();
  console.error(`[${now}] ERROR: ${err.message}`);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
}

module.exports = errorHandler;
