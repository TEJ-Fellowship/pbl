// backend/index.js
const app = require("./app");
const config = require("./utils/config");
const http = require("http");
const { initSocket } = require("./socket");

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start server
server.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});
