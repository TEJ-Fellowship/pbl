/* Imports the express library (web server framework)*/
const express = require("express");
const session = require("express-session");
const { mongooseConnection } = require("./index");
const { MongoStore } = require("connect-mongo");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

/*- Imports the cors library (cross-origin resource sharing)
  - (allows requests from other origins like your React frontend)
*/
const cors = require("cors");
const passport = require("./config/passport");

/* - Creates the Express app instance (app)*/
const app = express();
const requiredEnv = ["FRONTEND_URL", "MONGO_URI", "SESSION_SECRET"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is required`);
  }
}

/* - Middleware to allow cross-origin requests 
- (allows requests from other origins like React frontend)
*/
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    /* - Session is saved only when something actually changes */
    resave: false,
    /* - No session is created until something is stored in it e.g user ID after login */
    saveUninitialized: false,
    /* - Stores session in MongoDB using connect-mongo */
    store: MongoStore.create({
      //client: get the client from the mongoose connection
      client: mongooseConnection.getClient(),
      /* - ttl (Time to live): session expire after this time */
      ttl: 7 * 24 * 60 * 60, // 7 days
      /* - Uses MongoDB's built-in TTL index to automatically delete expired sessions */
      autoRemove: "native",
    }),
    cookie: {
      /* - Secure cookie is only sent over HTTPS in production */
      secure: process.env.NODE_ENV === "production",
      /* - maxAge (Time to live): cookie expire after this time and browser will delete it */
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      /* - HttpOnly: cookie is not accessible by JavaScript 
           - cookie can only be accessed by server-side code. (Prevents XSS (cross-site scripting) attacks)
        */
      httpOnly: true,
      /* - SameSite: cookie is only sent in same-site requests e.g. clicking a link in the same domain */
      sameSite: "lax",
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
/* - Middleware to parse JSON bodies for incoming requests */
app.use(express.json());

//Routes
app.use("/api/books", require("./routes/book"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/library", require("./routes/library"));
app.use("/api/shelves", require("./routes/shelves"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
