//index.js
const app = require("./app");
const config = require("./utils/config");

app.listen(config.port, () =>
  console.log(`Sever running at http://localhost:${config.port}`)
);
