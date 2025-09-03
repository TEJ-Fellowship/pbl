import JWTUtils from "../utils/jwt.js";

const authenticateToken = (req, res, next) => {
  try {
    const accessToken = req.cookie.accessToken;

    if (!accessToken) {
      return res.status(401).json({ error: "Access token expired" });
    }

    const decoded = JWTUtils.verifyAccessToken(accessToken);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.message === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(403).json({ error: "Invalid token" });
  }
};

export default authenticateToken;
