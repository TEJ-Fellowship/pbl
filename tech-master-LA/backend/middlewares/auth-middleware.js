const { verifyJWT } = require("../utils/jwt.js");

const auth = async (req, res, next) => {
  try {
    const cookie = req.headers.cookie;

    console.log("This is auth middleware cookie", cookie);

    if (!cookie) return res.status(401).json("User not authenticated.");
    const authToken = cookie.split("=")[1];
    const data = await verifyJWT(authToken);

    req.user = data;

    next();
  } catch (error) {
    res.status(400).send("Invalid Token");

    console.log("Invalid Token in Auth Middleware", error);
  }
};

module.exports = auth;
