require("dotenv").config();
const dbUrl = process.env.MONGODB_URL;
const PORT = process.env.PORT;
const dbName = process.env.MONGODB_DB;
const url = `${dbUrl}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;

module.exports = { url, PORT };
