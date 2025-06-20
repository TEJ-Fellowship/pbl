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

    // Set cookie with appropriate settings for development
    res.cookie("authToken", token, {
      expires: new Date(Date.now() + 25892000000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only true in production
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    console.log("token", token);

    res.status(200).json({
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
  console.log("login Register", req.data);

  try {
    const { name, password, confirmPassword, email, phone } = req.body;

    // Collect errors in an array
    const errors = [];

    if (!name) errors.push("Name is required");
    if (!email) errors.push("Email is required");
    if (!phone) errors.push("Phone number is required");
    if (!password) errors.push("Password is required");
    if (!confirmPassword) errors.push("Confirm password is required");
    if (password && confirmPassword && password !== confirmPassword) {
      errors.push("Passwords do not match");
    }
    if (!EMAIL_REGEX.test(email)) errors.push("Invalid email format!");
    if (!PASSWORD_REGEX.test(password))
      errors.push(
        "Password must be at least 8 characters and include letters and numbers!"
      );
    if (!PHONE_REGEX.test(phone)) errors.push("Invalid phone format!");

    if (errors.length > 0) {
      return res.status(422).json({ errors });
    }
    console.log("register controller", req.body);

    const user = await authService.register(req.body);

    //Storing token in cookie right after registration
    const formattedData = formatUserData(user);
    const token = createJWT(formattedData);

    // Set cookie with appropriate settings for development
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only true in production
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    return res.status(201).json({
      message: "Registration Successful!",
      user: formattedData,
      token, // Send token in response for development
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

module.exports = { loginController, registerController };
