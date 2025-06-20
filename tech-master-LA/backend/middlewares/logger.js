const logger = (req, res, next) => {
  console.log(`Method:${req.method} and Url:${req.originalUrl}`);

  if (req.method == "PATCH")
    return res.status(405).send("Patch method not allowed.");

  next();
};

module.exports = logger;
