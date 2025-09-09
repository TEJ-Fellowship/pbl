//utils/config
require("dotenv").config();

const passwordofDB = process.env.MONGODB_PASSWORD;
const secret_key = process.env.SECRET_KEY;
const port = process.env.PORT;

module.exports = { passwordofDB, secret_key, port };
