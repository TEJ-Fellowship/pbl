const mongoUrl = require("./config/urlConfig");
const app = require("./app");

app.listen(mongoUrl.PORT, () => {
  console.log(`Server is running on port ${mongoUrl.PORT}`);
});
