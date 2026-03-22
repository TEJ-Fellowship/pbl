const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL || "/api/auth/google/callback",
      proxy: true,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        //check if the user already exists
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          //extract email from profile
          const email =
            (profile.emails?.[0]?.value &&
              String(profile.emails[0].value).toLowerCase().trim()) ||
            `${profile.id}@google.local`;

          //create a base username from display name and email
          const raw =
            (profile.displayName &&
              String(profile.displayName).replace(/\s+/g, "_").toLowerCase()) ||
            email.split("@")[0];

          //create a base username from display name and email
          let baseUsername = raw.replace(/[^a-z0-9_]/g, "").slice(0, 24);
          if (baseUsername.length < 3) {
            baseUsername = `user_${profile.id.slice(-8)}`;
          }

          //create a unique username
          let username = baseUsername;
          let n = 0;
          while (await User.findOne({ username })) {
            n += 1;
            const extra = `_${n}`;
            username = (baseUsername.slice(0, 30 - extra.length) + extra).slice(
              0,
              30,
            );
          }

          //create a new user if they don't exist
          user = await User.create({
            googleId: profile.id,
            username,
            email,
            password: `google_${profile.id}`,
            lastLogin: new Date(),
          });
        } else {
          //update the last login date for existing user
          user.lastLogin = new Date();
          await user.save();
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

// Serialize user for session: how user data is stored in the session
passport.serializeUser((user, done) => {
  //store only the user's ID in the session
  done(null, user._id.toString());
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
