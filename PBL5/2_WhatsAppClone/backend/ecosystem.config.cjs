module.exports = {
  apps: [
    {
      name: "whatsapp-server-1",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        PORT: 3000,
        SERVER_ID: "server-1",
      },
    },
    {
      name: "whatsapp-server-2",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        PORT: 3001,
        SERVER_ID: "server-2",
      },
    },
    {
      name: "whatsapp-server-3",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        PORT: 3002,
        SERVER_ID: "server-3",
      },
    },
  ],
};
