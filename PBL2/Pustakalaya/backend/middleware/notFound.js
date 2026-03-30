// 404 not found handler for API routes
function notFound(req, res) {
  return res.status(404).json({
    error: { message: "Route not found", details: null },
  });
}

module.exports = notFound;
