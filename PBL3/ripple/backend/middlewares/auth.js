import JWTUtils from "../utils/jwt.js";

const authenticateToken = (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({ error: "Access token expired" });
    }

    const decoded = JWTUtils.verifyAccessToken(accessToken);
    req.user = decoded;
    console.log(decoded);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(403).json({ error: "Invalid token" });
  }
};

export default authenticateToken;
