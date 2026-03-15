const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");

const createJWT = (data) => {
  return jwt.sign(data, JWT_SECRET); //signing user data with a secret private key
};

const verifyJWT = (authToken) => {
  const verifyJwtPromise = new Promise((resolve, reject) => {
    jwt.verify(authToken, JWT_SECRET, (error, decodedToken) => {
      if (error) return reject(error);
      resolve(decodedToken); //Decoded token contains userData
    });
  });

  return verifyJwtPromise;
};

module.exports = { createJWT, verifyJWT };
