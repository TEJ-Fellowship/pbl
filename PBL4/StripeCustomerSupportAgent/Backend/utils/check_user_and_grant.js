import pool from "../config/database.js";

/**
 * Check Current User and Grant Permissions
 * Identifies the current database user and grants necessary permissions
 */
async function checkUserAndGrant() {
  console.log("🔍 Checking current database user and granting permissions...");

  try {
    // Test connection
    await pool.query("SELECT 1");
    console.log("✅ Connected to PostgreSQL database");

    // Get current user
    const userResult = await pool.query(
      "SELECT current_user, session_user, user"
    );
    console.log("👤 Current database user:", userResult.rows[0]);

    const currentUser = userResult.rows[0].current_user;

    // Try to grant permissions to the current user
    const permissionQueries = [
      `GRANT CREATE ON SCHEMA public TO ${currentUser}`,
      `GRANT USAGE ON SCHEMA public TO ${currentUser}`,
      `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${currentUser}`,
      `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${currentUser}`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${currentUser}`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${currentUser}`,
    ];

    for (const query of permissionQueries) {
      try {
        await pool.query(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        console.log(`⚠️  Failed to execute: ${query} - ${error.message}`);
      }
    }

    // Also try to grant to stripe_user if it exists
    const stripeUserQueries = [
      "GRANT CREATE ON SCHEMA public TO stripe_user",
      "GRANT USAGE ON SCHEMA public TO stripe_user",
      "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stripe_user",
      "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stripe_user",
      "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stripe_user",
      "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO stripe_user",
    ];

    console.log("\n🔐 Also trying to grant permissions to stripe_user...");
    for (const query of stripeUserQueries) {
      try {
        await pool.query(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        console.log(`⚠️  Failed to execute: ${query} - ${error.message}`);
      }
    }

    console.log("✅ Permission grant attempt completed");
  } catch (error) {
    console.error(
      "❌ Failed to check user and grant permissions:",
      error.message
    );
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith("check_user_and_grant.js")) {
  checkUserAndGrant().catch(console.error);
}

export default checkUserAndGrant;
