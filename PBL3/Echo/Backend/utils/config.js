//utils/config
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

const passwordofDB = process.env.MONGODB_PASSWORD;
const secret_key = process.env.SECRET_KEY;
const port = process.env.PORT;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


module.exports = { passwordofDB, secret_key, port, cloudinary };
