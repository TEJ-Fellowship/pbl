/**
 * Setup Cron Job for Automatic Replication Sync
 * Creates a cron job to run sync-replicas periodically
 * 
 * Usage:
 *   node scripts/setupCronSync.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function generateCronJob() {
  const projectPath = path.resolve(__dirname, '..');
  const scriptPath = path.join(projectPath, 'scripts', 'autoSyncReplicas.js');
  
  // Default: Run every hour
  const cronSchedule = process.env.SYNC_CRON_SCHEDULE || '0 * * * *'; // Every hour
  
  const cronJob = `${cronSchedule} cd ${projectPath} && node ${scriptPath}\n`;
  
  return cronJob;
}

function setupCron() {
  console.log('📅 Setting up Cron Job for Automatic Replication Sync\n');
  
  const cronJob = generateCronJob();
  const cronFile = path.join(os.homedir(), 'replication-sync.cron');
  
  // Write cron job to file
  fs.writeFileSync(cronFile, cronJob);
  
  console.log('✅ Cron job file created:');
  console.log(`   ${cronFile}\n`);
  console.log('📝 Cron job content:');
  console.log(`   ${cronJob}`);
  console.log('📋 To install this cron job, run:');
  console.log(`   crontab ${cronFile}\n`);
  console.log('📋 To view current cron jobs:');
  console.log('   crontab -l\n');
  console.log('📋 To remove cron job:');
  console.log('   crontab -r\n');
  console.log('💡 Cron Schedule Examples:');
  console.log('   Every hour:     0 * * * *');
  console.log('   Every 30 min:   */30 * * * *');
  console.log('   Every 6 hours:  0 */6 * * *');
  console.log('   Daily at 2 AM:  0 2 * * *');
  console.log('   Every 15 min:   */15 * * * *\n');
}

if (require.main === module) {
  setupCron();
}

module.exports = { setupCron, generateCronJob };

