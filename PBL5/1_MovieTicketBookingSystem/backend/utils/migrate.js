const { sequelize, runMigrations } = require("./db");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    await runMigrations();
    console.log("✅ Migrations completed successfully");
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    await sequelize.close();
    process.exit(1);
  }
})();
