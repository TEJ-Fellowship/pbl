import AuthService from "../services/authService.js";
import { COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from "../utils/cookies.js";

class AuthController {
  static async signup(req, res) {
    try {
      const result = await AuthService.signup(req.body);

      res.cookie("accessToken", result.accessToken, COOKIE_OPTIONS);
      res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(201).json({
        message: "User created Successfully",
        user: result.user,
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error.message === "User already exits") {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      res.cookie("accessToken", result.accessToken, COOKIE_OPTIONS);
      res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json({
        message: "Login Successfully",
        user: result.user,
      });
    } catch (error) {
      console.error("Login error:", error);
      if (
        error.message === "Invalid credentials" ||
        error.message === "Invalid password"
      ) {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async refresh(req, res) {
    try {
      const refreshToken = req.cookie.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token error" });
      }

      const accessToken = await AuthService.refreshToken(refreshToken);

      res.cookie("accessToken", accessToken, COOKIE_OPTIONS);

      res.json({ message: "Token refresh successfully" });
    } catch (error) {
      console.error("Refresh error: ", error);
      if (
        error.message === "TokenExpiredError" ||
        error.message.includes("invalid")
      ) {
        return res
          .status(403)
          .json({ error: "Invalid or expired refresh token" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async logout(req, res) {
    try {
      const refreshToken = req.cookie.refreshToken;
      await AuthService.logout(refreshToken);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

      res.json({ message: "Logout successfully" });
    } catch (error) {
      console.error("Logout error: ", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default AuthController;
