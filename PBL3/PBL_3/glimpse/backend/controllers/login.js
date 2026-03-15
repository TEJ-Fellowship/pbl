const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const loginRouter = require("express").Router();
const User = require("../models/user");

loginRouter.post("/", async (request, response) => {
  const { email, password } = request.body;
  console.log(email, password);
  const user = await User.findOne({ email });
  console.log(user);
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash);

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: "invalid username or password",
    });
  }
  if (!user.isVerified) {
    return response
      .status(403)
      .json({ error: "Email not verified. Please check your inbox." });
  }

  const userForToken = {
    username: user.username,
    id: user.id,
  };

  const token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn: 60 * 60 * 60 * 60,
  });

  response
    .status(200)
    .send({ token, name: user.username, email: user.email });
});

module.exports = loginRouter;
