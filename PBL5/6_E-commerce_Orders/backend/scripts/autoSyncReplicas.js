/**
 * Automatic Periodic Replication Sync
 * Syncs data from PRIMARY to REPLICAS on a schedule
 * 
 * Usage:
 *   - Run once: node scripts/autoSyncReplicas.js
 *   - Run continuously: node scripts/autoSyncReplicas.js --watch
 *   - Run with custom interval: node scripts/autoSyncReplicas.js --interval 3600000
 */

require('dotenv').config();
const { syncAllTables } = require('./syncReplicas');

const DEFAULT_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const WATCH_MODE = process.argv.includes('--watch');
const INTERVAL_ARG = process.argv.find(arg => arg.startsWith('--interval='));
const CUSTOM_INTERVAL = INTERVAL_ARG ? parseInt(INTERVAL_ARG.split('=')[1]) : null;
const SYNC_INTERVAL = CUSTOM_INTERVAL || DEFAULT_INTERVAL;

let syncInProgress = false;
let syncCount = 0;
let lastSyncTime = null;
let lastSyncError = null;

/**
 * Perform sync operation
 */
async function performSync() {
  if (syncInProgress) {
    console.log('⏳ Sync already in progress, skipping...');
    return;
  }

  syncInProgress = true;
  const startTime = Date.now();
  
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Starting automatic sync #${++syncCount}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    
    await syncAllTables();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    lastSyncTime = new Date();
    lastSyncError = null;
    
    console.log('='.repeat(60));
    console.log(`✅ Sync completed successfully in ${duration}s`);
    console.log(`   Next sync in: ${(SYNC_INTERVAL / 1000 / 60).toFixed(0)} minutes`);
    console.log('='.repeat(60));
    
  } catch (error) {
    lastSyncError = error;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error('='.repeat(60));
    console.error(`❌ Sync failed after ${duration}s`);
    console.error(`   Error: ${error.message}`);
    console.error('='.repeat(60));
    
    // Don't exit on error, continue with next sync
  } finally {
    syncInProgress = false;
  }
}

/**
 * Display status information
 */
function displayStatus() {
  console.log('\n📊 Sync Status:');
  console.log(`   Total syncs: ${syncCount}`);
  console.log(`   Last sync: ${lastSyncTime ? lastSyncTime.toISOString() : 'Never'}`);
  console.log(`   Last error: ${lastSyncError ? lastSyncError.message : 'None'}`);
  console.log(`   Sync interval: ${(SYNC_INTERVAL / 1000 / 60).toFixed(0)} minutes`);
  console.log(`   Next sync: ${new Date(Date.now() + SYNC_INTERVAL).toISOString()}`);
}

/**
 * Run sync once
 */
async function runOnce() {
  try {
    await performSync();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

/**
 * Run sync continuously with interval
 */
async function runContinuous() {
  console.log('🚀 Automatic Replication Sync Started');
  console.log('='.repeat(60));
  console.log(`   Mode: Continuous (watch mode)`);
  console.log(`   Interval: ${(SYNC_INTERVAL / 1000 / 60).toFixed(0)} minutes`);
  console.log(`   Press Ctrl+C to stop`);
  console.log('='.repeat(60));
  
  // Perform initial sync
  await performSync();
  
  // Set up periodic sync
  const intervalId = setInterval(async () => {
    await performSync();
  }, SYNC_INTERVAL);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    clearInterval(intervalId);
    displayStatus();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Shutting down...');
    clearInterval(intervalId);
    displayStatus();
    process.exit(0);
  });
  
  // Display status periodically
  setInterval(() => {
    displayStatus();
  }, SYNC_INTERVAL);
}

/**
 * Main execution
 */
async function main() {
  if (WATCH_MODE) {
    await runContinuous();
  } else {
    await runOnce();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { performSync, runOnce, runContinuous };

