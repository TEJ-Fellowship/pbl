import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import JWTUtils from "../utils/jwt.js";
import passwordUtils from "../utils/bcrypt.js";

class AuthService {
  static async signup(userData) {
    const { username, email, password } = userData;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await passwordUtils.hash(password);

    const user = await User.create({
      username: username,
      email: email,
      passwordHash: hashedPassword,
    });

    return this.generateUserTokens(user);
  }

  static async login(email, password) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Invalid Credentials");
    }

    const isValidPassword = await passwordUtils.compare(
      password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new Error("Invalid Password");
    }

    return this.generateUserTokens(user);
  }

  static async refreshToken(refreshToken) {
    const decoded = JWTUtils.verifyRefreshToken(refreshToken);

    const storedToken = RefreshToken.findOne({
      token: refreshToken,
      userId: decoded.userId,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) throw new Error("Invalid Refresh Token");

    const user = await User.findOne(decoded.userId);

    if (!user) throw new Error("User not found");

    const { accessToken } = JWTUtils.generateTokens(user);
    return accessToken;
  }

  static async logout(refreshToken) {
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
  }

  static async generateUserTokens(user) {
    const { accessToken, refreshToken } = JWTUtils.generateTokens(user);

    await RefreshToken.deleteOne({ userId: user._id });

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    };
  }
}

export default AuthService;
