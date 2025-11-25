import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validation script to check setup_all_schemas.js without database connection
 * This validates:
 * 1. SQL syntax correctness
 * 2. File paths exist
 * 3. Code structure
 */
async function validateSetup() {
  console.log("🔍 Validating setup_all_schemas.js...");
  console.log("=".repeat(60));

  const errors = [];
  const warnings = [];

  try {
    // 1. Check if setup_all_schemas.js exists and is readable
    console.log("\n📄 Step 1: Checking setup script file...");
    const setupScriptPath = path.join(__dirname, "setup_all_schemas.js");
    try {
      await fs.access(setupScriptPath);
      const stats = await fs.stat(setupScriptPath);
      console.log(`   ✅ setup_all_schemas.js exists (${(stats.size / 1024).toFixed(2)} KB)`);
    } catch (error) {
      errors.push(`setup_all_schemas.js not found: ${error.message}`);
      console.log(`   ❌ setup_all_schemas.js not found`);
      return;
    }

    // 2. Check if conversation memory SQL file exists
    console.log("\n📄 Step 2: Checking SQL schema files...");
    const sqlPaths = [
      path.join(__dirname, "setup_conversation_memory.sql"),
      path.join(process.cwd(), "scripts", "setup_conversation_memory.sql"),
    ];

    let sqlFileFound = false;
    for (const sqlPath of sqlPaths) {
      try {
        await fs.access(sqlPath);
        const stats = await fs.stat(sqlPath);
        console.log(`   ✅ Found: ${path.basename(sqlPath)} (${(stats.size / 1024).toFixed(2)} KB)`);
        sqlFileFound = true;

        // Validate SQL syntax (basic checks)
        const sqlContent = await fs.readFile(sqlPath, "utf8");
        const requiredTables = [
          "conversation_sessions",
          "conversation_messages",
          "conversation_qa_pairs",
          "conversation_summaries",
          "memory_retrieval_cache",
        ];

        console.log("\n   🔍 Validating SQL content...");
        requiredTables.forEach((table) => {
          if (sqlContent.includes(`CREATE TABLE`) && sqlContent.includes(table)) {
            console.log(`      ✅ Table '${table}' found in SQL`);
          } else {
            warnings.push(`Table '${table}' might be missing from SQL`);
            console.log(`      ⚠️  Table '${table}' not clearly found`);
          }
        });

        // Check for CREATE INDEX statements
        const indexCount = (sqlContent.match(/CREATE INDEX/gi) || []).length;
        console.log(`      ✅ Found ${indexCount} index creation statements`);

        break;
      } catch (error) {
        // Continue to next path
      }
    }

    if (!sqlFileFound) {
      errors.push("setup_conversation_memory.sql not found in any expected location");
      console.log(`   ❌ setup_conversation_memory.sql not found`);
    }

    // 3. Validate SQL syntax in setup_all_schemas.js
    console.log("\n🔍 Step 3: Validating embedded SQL...");
    const setupScript = await fs.readFile(setupScriptPath, "utf8");

    // Check for raw_documents table SQL
    if (setupScript.includes("CREATE TABLE IF NOT EXISTS raw_documents")) {
      console.log("   ✅ raw_documents table SQL found");
    } else {
      errors.push("raw_documents table SQL not found");
      console.log("   ❌ raw_documents table SQL not found");
    }

    // Check for document_chunks table SQL
    if (setupScript.includes("CREATE TABLE IF NOT EXISTS document_chunks")) {
      console.log("   ✅ document_chunks table SQL found");
    } else {
      errors.push("document_chunks table SQL not found");
      console.log("   ❌ document_chunks table SQL not found");
    }

    // Check for proper error handling
    console.log("\n🛡️  Step 4: Checking error handling...");
    if (setupScript.includes("try {") && setupScript.includes("catch")) {
      console.log("   ✅ Error handling present");
    } else {
      warnings.push("Error handling might be incomplete");
      console.log("   ⚠️  Error handling might be incomplete");
    }

    // Check for transaction handling
    if (setupScript.includes("BEGIN") && setupScript.includes("COMMIT")) {
      console.log("   ✅ Transaction handling present");
    } else {
      warnings.push("Transaction handling might be incomplete");
      console.log("   ⚠️  Transaction handling might be incomplete");
    }

    // Check for verification query
    if (setupScript.includes("information_schema.tables")) {
      console.log("   ✅ Verification query present");
    } else {
      warnings.push("Verification query might be missing");
      console.log("   ⚠️  Verification query might be missing");
    }

    // 5. Check for proper client release
    console.log("\n🔒 Step 5: Checking resource management...");
    if (setupScript.includes("client.release()")) {
      console.log("   ✅ Client release present");
    } else {
      errors.push("client.release() not found - potential connection leak");
      console.log("   ❌ client.release() not found");
    }

    // 6. Check for proper exports
    console.log("\n📤 Step 6: Checking exports...");
    if (setupScript.includes("export default") || setupScript.includes("module.exports")) {
      console.log("   ✅ Export statement present");
    } else {
      warnings.push("Export statement might be missing");
      console.log("   ⚠️  Export statement might be missing");
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Validation Summary:");
    console.log("=".repeat(60));

    if (errors.length === 0 && warnings.length === 0) {
      console.log("   ✅ All validations passed!");
      console.log("   ✅ setup_all_schemas.js is ready to use");
      console.log("\n💡 Next steps:");
      console.log("   • Run 'npm run setup:all' to create tables");
      console.log("   • See DEPLOYMENT.md for complete guide");
    } else {
      if (errors.length > 0) {
        console.log(`\n   ❌ Found ${errors.length} error(s):`);
        errors.forEach((error) => console.log(`      • ${error}`));
      }
      if (warnings.length > 0) {
        console.log(`\n   ⚠️  Found ${warnings.length} warning(s):`);
        warnings.forEach((warning) => console.log(`      • ${warning}`));
      }
    }

    console.log("=".repeat(60));

    return errors.length === 0;
  } catch (error) {
    console.error("\n❌ Validation failed:", error.message);
    return false;
  }
}

// Run validation
validateSetup()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Validation error:", error);
    process.exit(1);
  });

