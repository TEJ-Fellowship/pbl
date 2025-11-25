#!/usr/bin/env node

/**
 * Database Migration Manager
 *
 * This script helps you manage database migrations for the Stripe Support Agent.
 *
 * Usage:
 *   node scripts/migrate.js fresh     - Drop all tables and recreate from scratch
 *   node scripts/migrate.js status    - Check current database status
 *   node scripts/migrate.js backup    - Create a backup of current database
 */

import DatabaseMigrator from "../migrate-database.js";
import pool from "../config/database.js";

class MigrationManager {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      this.client = await pool.connect();
      return true;
    } catch (error) {
      console.error("❌ Failed to connect to database:", error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      this.client.release();
    }
    await pool.end();
  }

  async checkStatus() {
    console.log("🔍 Checking database status...");

    if (!(await this.connect())) {
      return;
    }

    try {
      // Check tables
      const tablesResult = await this.client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'conversation_%'
        ORDER BY table_name;
      `);

      console.log("📋 Existing tables:");
      if (tablesResult.rows.length === 0) {
        console.log("   ❌ No conversation tables found");
      } else {
        tablesResult.rows.forEach((row) => {
          console.log(`   ✅ ${row.table_name}`);
        });
      }

      // Check functions
      const functionsResult = await this.client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%token%'
        ORDER BY routine_name;
      `);

      console.log("\n🔧 Available functions:");
      if (functionsResult.rows.length === 0) {
        console.log("   ❌ No token-related functions found");
      } else {
        functionsResult.rows.forEach((row) => {
          console.log(`   ✅ ${row.routine_name}`);
        });
      }

      // Check data
      const dataResult = await this.client.query(`
        SELECT 
          (SELECT COUNT(*) FROM conversation_sessions) as sessions,
          (SELECT COUNT(*) FROM conversation_messages) as messages,
          (SELECT COUNT(*) FROM conversation_qa_pairs) as qa_pairs;
      `);

      console.log("\n📊 Data counts:");
      console.log(`   Sessions: ${dataResult.rows[0].sessions}`);
      console.log(`   Messages: ${dataResult.rows[0].messages}`);
      console.log(`   Q&A Pairs: ${dataResult.rows[0].qa_pairs}`);
    } catch (error) {
      console.error("❌ Error checking status:", error.message);
    } finally {
      await this.disconnect();
    }
  }

  async createBackup() {
    console.log("💾 Creating database backup...");
    console.log(
      "⚠️  Note: This is a simple backup. For production, use pg_dump"
    );

    if (!(await this.connect())) {
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = `backup_${timestamp}.sql`;

      // Get all table data
      const tables = [
        "conversation_sessions",
        "conversation_messages",
        "conversation_qa_pairs",
        "conversation_summaries",
      ];
      let backupContent = `-- Database backup created at ${new Date().toISOString()}\n\n`;

      for (const table of tables) {
        const dataResult = await this.client.query(`SELECT * FROM ${table}`);
        if (dataResult.rows.length > 0) {
          backupContent += `-- Data for table ${table}\n`;
          backupContent += `INSERT INTO ${table} VALUES\n`;
          const values = dataResult.rows.map((row) => {
            const values = Object.values(row).map((val) =>
              val === null ? "NULL" : `'${val.toString().replace(/'/g, "''")}'`
            );
            return `(${values.join(", ")})`;
          });
          backupContent += values.join(",\n") + ";\n\n";
        }
      }

      const fs = await import("fs");
      fs.writeFileSync(backupFile, backupContent);
      console.log(`✅ Backup created: ${backupFile}`);
    } catch (error) {
      console.error("❌ Backup failed:", error.message);
    } finally {
      await this.disconnect();
    }
  }

  async runFreshMigration() {
    console.log("🔄 Running fresh migration...");
    const migrator = new DatabaseMigrator();
    return await migrator.runMigration();
  }
}

// CLI handling
const command = process.argv[2];

if (!command) {
  console.log("📖 Database Migration Manager");
  console.log("=".repeat(40));
  console.log("Usage:");
  console.log(
    "  node scripts/migrate.js fresh     - Drop all tables and recreate"
  );
  console.log("  node scripts/migrate.js status    - Check database status");
  console.log("  node scripts/migrate.js backup    - Create backup");
  console.log("=".repeat(40));
  process.exit(1);
}

const manager = new MigrationManager();

switch (command) {
  case "fresh":
    manager.runFreshMigration().then((success) => {
      process.exit(success ? 0 : 1);
    });
    break;

  case "status":
    manager.checkStatus().then(() => {
      process.exit(0);
    });
    break;

  case "backup":
    manager.createBackup().then(() => {
      process.exit(0);
    });
    break;

  default:
    console.log(`❌ Unknown command: ${command}`);
    console.log("Available commands: fresh, status, backup");
    process.exit(1);
}
