import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/User.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv with explicit path
dotenv.config({ path: join(__dirname, "..", ".env") });

// Debug environment variables
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("GITHUB_CLIENT_ID exists:", !!process.env.GITHUB_CLIENT_ID);

// GitHub OAuth Strategy - only if credentials are provided
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          process.env.GITHUB_CALLBACK_URL ||
          `http://localhost:5001/api/auth/github/callback`,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const { state } = req.query; // This contains the invite token

          // Check if user already exists
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            // User exists, update their GitHub data and login time
            user.githubData = {
              bio: profile._json.bio,
              location: profile._json.location,
              company: profile._json.company,
              publicRepos: profile._json.public_repos,
              followers: profile._json.followers,
              following: profile._json.following,
              githubCreatedAt: new Date(profile._json.created_at),
              htmlUrl: profile._json.html_url,
            };
            await user.updateLastLogin();
            return done(null, user);
          }

          // New user registration requires valid invite
          if (!state) {
            return done(
              new Error("Invitation required for registration"),
              null
            );
          }

          // Store user data in session for later use with invite validation
          const userData = {
            githubId: profile.id,
            username: profile.username,
            email: profile._json.email || profile.emails?.[0]?.value,
            name: profile.displayName || profile.username,
            avatar: profile._json.avatar_url,
            githubData: {
              bio: profile._json.bio,
              location: profile._json.location,
              company: profile._json.company,
              publicRepos: profile._json.public_repos,
              followers: profile._json.followers,
              following: profile._json.following,
              githubCreatedAt: new Date(profile._json.created_at),
              htmlUrl: profile._json.html_url,
            },
            inviteToken: state,
          };

          return done(null, userData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn(
    "GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET"
  );
}

// JWT Strategy for API authentication
if (process.env.JWT_SECRET) {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await User.findById(payload.userId).select("-__v");
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
} else {
  console.error("JWT_SECRET not found in environment variables");
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
