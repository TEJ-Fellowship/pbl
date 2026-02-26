require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

const passport = require("./config/passport");

const app = express();

app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/profile");
  }
);

app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.send("Not logged in");
  }

  res.send(`
    <h1>Profile</h1>
    <p>Name: ${req.user.displayName}</p>
    <p>Email: ${req.user.emails[0].value}</p>
    <a href="/logout">Logout</a>
  `);
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});