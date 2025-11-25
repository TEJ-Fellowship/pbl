import { existsSync, mkdirSync, cpSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const backendDir = join(__dirname, "..");
const frontendDir = join(backendDir, "..", "Frontend");
const frontendDist = join(frontendDir, "dist");
const backendDist = join(backendDir, "dist");

console.log("📦 Copying frontend dist to backend...");
console.log(`   Frontend dist: ${frontendDist}`);
console.log(`   Backend dist: ${backendDist}`);

// Check if frontend dist exists
if (!existsSync(frontendDist)) {
  console.error("❌ Frontend dist folder not found!");
  console.log("   Please build the frontend first:");
  console.log("   cd ../Frontend && npm run build");
  process.exit(1);
}

// Create backend dist directory if it doesn't exist
if (!existsSync(backendDist)) {
  mkdirSync(backendDist, { recursive: true });
  console.log("   ✅ Created backend dist directory");
}

// Copy frontend dist to backend dist
try {
  cpSync(frontendDist, backendDist, { recursive: true, force: true });
  console.log("   ✅ Frontend dist copied successfully!");
  console.log(`   📁 Files copied to: ${backendDist}`);
} catch (error) {
  console.error("❌ Error copying frontend dist:", error.message);
  process.exit(1);
}
