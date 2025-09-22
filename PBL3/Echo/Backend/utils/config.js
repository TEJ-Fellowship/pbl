//utils/config
require("dotenv").config();

const passwordofDB = process.env.MONGODB_PASSWORD;
const secret_key = process.env.SECRET_KEY;
const port = process.env.PORT;
const mongodbUrl = process.env.MONGODB_URL;

module.exports = { passwordofDB, mongodbUrl, secret_key, port };
