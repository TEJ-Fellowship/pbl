const app = require("./app");
const { PORT } = require("./config/keys");

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
