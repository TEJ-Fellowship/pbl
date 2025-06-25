const { verifyJWT } = require("../utils/jwt.js");

const getCookie = (cookieString, name) => {
  if (!cookieString) return null;
  const value = `; ${cookieString}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const auth = async (req, res, next) => {
  try {
    const cookie = req.headers.cookie;

    console.log("=== Auth Middleware Debug ===");
    console.log("Headers:", req.headers);
    console.log("Cookie header:", cookie);
    console.log("Origin:", req.headers.origin);
    console.log("User-Agent:", req.headers["user-agent"]);

    if (!cookie) {
      console.log("No cookie header found");
      return res.status(401).json("User not authenticated.");
    }

    const authToken = getCookie(cookie, "authToken");
    console.log(
      "Extracted authToken:",
      authToken ? "Token found" : "No token found"
    );

    if (!authToken) {
      console.log("Auth token not found in cookies");
      return res.status(401).json("Auth token not found.");
    }

    const data = await verifyJWT(authToken);
    req.user = data;
    console.log("Auth Middleware - User authenticated:", req.user);
    next();
  } catch (error) {
    console.log("Invalid Token in Auth Middleware", error);
    res.status(401).json("Invalid Token");
  }
};

module.exports = auth;
