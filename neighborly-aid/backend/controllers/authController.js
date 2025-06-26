const { formatUserData } = require("../helpers/dataFormatter.js");
const authService = require("../services/authService.js");
const { createJWT } = require("../utils/jwt.js");
const {
  EMAIL_REGEX,
  PASSWORD_REGEX,
  PHONE_REGEX,
} = require("../utils/regex/userRegex.js");

const loginController = async (req, res) => {
  console.log("login Register", req.data);
  try {
    const data = req.body;
    const { email, phone, password } = data;
    if (!email && !phone)
      return res.status(422).send("Email or Phone is required!");

    if (!password) return res.status(422).send("Password is required!");

    const user = await authService.login(data);

    const formattedData = formatUserData(user);
    const token = createJWT(formattedData);

    // console.log("=== Login Debug ===");
    // console.log("Setting cookie with token:", token.substring(0, 20) + "...");
    // console.log("Request origin:", req.headers.origin);
    // console.log("Request headers:", req.headers);

    // Set cookie with appropriate settings for development
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true, //  REQUIRED on Render (HTTPS only)
      sameSite: "None", //  REQUIRED for cross-origin cookie
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("Cookie set successfully");
    console.log("Response headers:", res.getHeaders());

    res.status(200).json({
      success: true,
      message: "Login Successful!!",
      user: formattedData,
      token, // Send token in response for development
    });
  } catch (error) {
    console.error("Login Error:", error);

    let statusCode = 500;
    let errorMessage = "Internal Server Error";

    if (error.message === "User not found!") {
      statusCode = 404;
      errorMessage = "User not found!";
    } else if (error.message === "Credentials do not match!!") {
      statusCode = 401;
      errorMessage = "Invalid credentials!";
    } else if (error.message === "secretOrPrivateKey must have a value") {
      statusCode = 500;
      errorMessage =
        "Server configuration error. Please contact administrator.";
    }

    res.status(statusCode).json({ error: errorMessage });
  }
};

const registerController = async (req, res) => {
  console.log("register controller - received data:", req.body);

  try {
    const { name, password, confirmPassword, email, phone, role } = req.body;

    // Collect errors in an array
    const errors = [];

    if (!name) errors.push("Name is required");
    if (!email) errors.push("Email is required");
    if (!phone) errors.push("Phone number is required");
    if (!password) errors.push("Password is required");
    if (!confirmPassword) errors.push("Confirm password is required");
    if (!role) errors.push("Role is required");
    if (password && confirmPassword && password !== confirmPassword) {
      errors.push("Passwords do not match");
    }
    if (!EMAIL_REGEX.test(email)) errors.push("Invalid email format!");
    if (!PASSWORD_REGEX.test(password))
      errors.push(
        "Password must be at least 8 characters and include letters and numbers!"
      );
    if (!PHONE_REGEX.test(phone)) errors.push("Invalid phone format!");

    console.log("Validation errors:", errors);

    if (errors.length > 0) {
      return res.status(422).json({ errors });
    }
    console.log("register controller", req.body);

    const user = await authService.register(req.body);

    //Storing token in cookie right after registration
    const formattedData = formatUserData(user);
    const token = createJWT(formattedData);

    // Set cookie to match the working login controller's method
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true, //  REQUIRED on Render (HTTPS only)
      sameSite: "None", //  REQUIRED for cross-origin cookie
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Registration Successful!",
      user: formattedData,
      token, // Send token in response for consistency
    });
  } catch (error) {
    console.error("Register Error:", error);

    let statusCode = 500;
    let errorMessage = "Internal Server Error";

    if (error.name === "ValidationError") {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.code === 11000) {
      statusCode = 409;
      errorMessage = "Email or phone already exists!!";
    } else if (error.message === "secretOrPrivateKey must have a value") {
      statusCode = 500;
      errorMessage =
        "Server configuration error. Please contact administrator.";
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
};

const logoutController = async (req, res) => {
  try {
    console.log("Logout request received");

    // Clear the auth cookie with all possible settings to ensure it's removed
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    // Also try clearing without secure flag for development
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });

    console.log("Cookies cleared");

    res.status(200).json({
      success: true,
      message: "Logout successful!",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const verifyAuthController = async (req, res) => {
  try {
    // Check if user exists in request (set by auth middleware)
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
        authenticated: false,
      });
    }

    // If middleware passed, user is authenticated
    res.status(200).json({
      message: "User is authenticated",
      authenticated: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Verify Auth Error:", error);
    res.status(401).json({
      message: "User not authenticated",
      authenticated: false,
    });
  }
};

module.exports = {
  loginController,
  registerController,
  logoutController,
  verifyAuthController,
};
