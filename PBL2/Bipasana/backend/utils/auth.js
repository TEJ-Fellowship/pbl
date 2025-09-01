// middleware/auth.js
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.js");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

const authenticateToken = async (req, res, next) => {
  try {
    const token = getTokenFrom(req);
    
    if (!token) {
      return res.status(401).json({ error: "token missing" });
    }

    const decodedToken = jwt.verify(token, process.env.SECRET);

    if (!decodedToken.id) {
      return res.status(401).json({ error: "token invalid" });
    }

    const user = await User.findById(decodedToken.id);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Attach user info to request object for use in route handlers
    req.user = {
      id: decodedToken.id,
      userDoc: user
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "token invalid" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "token expired" });
    }
    next(error);
  }
};

module.exports = {
  authenticateToken,
  getTokenFrom
};