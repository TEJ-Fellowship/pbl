const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const loginRouter = require("express").Router();
const { User } = require("../models/user");

loginRouter.post("/", async (request, response) => {
  const { email, password } = request.body;
  const user = await User.findOne({ email });
  const passwordCorrect = user === null ? false : await bcrypt.compare(password, user.password);

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: "invalid email or password",
    });
  }
  if (!user.isVerified) {
    return response
      .status(403)
      .json({ error: "Email not verified. Please check your inbox." });
  }
  const userForToken = {
    email: user.email,
    id: user.id,
  };

  const token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn: 60 * 60,
  });
  response.status(200).send({ token, email: user.email, name: user.username });
});

module.exports = loginRouter;