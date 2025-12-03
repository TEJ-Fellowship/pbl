module.exports = {
  apps: [
    {
      name: "movie-booking-api",
      script: "./index.js",
      instances: 4, // Use 4 cores (leaves 4 cores for OS, Redis, Kafka, and your device)
      exec_mode: "cluster", // Enable cluster mode
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      // Auto-restart on crash
      autorestart: true,
      // Watch for file changes (disable in production)
      watch: false,
      // Max memory before restart (optional safety)
      max_memory_restart: "500M",
      // Logging
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Merge logs from all instances
      merge_logs: true,
    },
  ],
};
