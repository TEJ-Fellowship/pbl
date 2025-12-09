import http from 'http';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:80/api/server-info';
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || '100');
const CONCURRENT = parseInt(process.env.CONCURRENT || '10');

const serverStats = {
  'server-1': 0,
  'server-2': 0,
  'server-3': 0,
  'unknown': 0,
  'errors': 0
};

function makeRequest() {
  return new Promise((resolve) => {
    const url = new URL(TARGET_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const body = JSON.parse(data);
          const serverId = body.serverId || 'unknown';
          if (serverStats[serverId] !== undefined) {
            serverStats[serverId]++;
          } else {
            serverStats['unknown']++;
          }
        } catch (e) {
          serverStats['errors']++;
        }
        resolve();
      });
    });

    req.on('error', () => {
      serverStats['errors']++;
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      serverStats['errors']++;
      resolve();
    });

    req.end();
  });
}

async function runTest() {
  console.log(`🚀 Starting load test: ${TOTAL_REQUESTS} requests, ${CONCURRENT} concurrent\n`);
  console.log(`Target: ${TARGET_URL}\n`);
  
  const startTime = Date.now();
  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENT);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(CONCURRENT, TOTAL_REQUESTS - (batch * CONCURRENT));
    const promises = [];
    
    for (let i = 0; i < batchSize; i++) {
      promises.push(makeRequest());
    }
    
    await Promise.all(promises);
    const completed = Math.min((batch + 1) * CONCURRENT, TOTAL_REQUESTS);
    process.stdout.write(`\rProgress: ${completed}/${TOTAL_REQUESTS} (${((completed / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n\n📊 Results:');
  console.log('===========');
  const total = Object.values(serverStats).reduce((a, b) => a + b, 0);
  
  Object.entries(serverStats).forEach(([server, count]) => {
    if (count > 0) {
      const percentage = ((count / total) * 100).toFixed(2);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`${server.padEnd(12)}: ${String(count).padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
    }
  });
  
  console.log(`\nTotal requests: ${total}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Requests/sec: ${(total / parseFloat(duration)).toFixed(2)}`);
  
  // Check distribution
  const serversUsed = Object.entries(serverStats)
    .filter(([k, v]) => k !== 'errors' && k !== 'unknown' && v > 0)
    .length;
  
  console.log('\n' + '='.repeat(50));
  if (serversUsed > 1) {
    console.log('✅ Load balancing is working! Requests distributed across', serversUsed, 'servers');
  } else if (serversUsed === 1) {
    console.log('❌ All requests went to one server. Check Nginx configuration.');
    console.log('   - Verify Nginx is running and using correct config');
    console.log('   - Check that all 3 backend servers are running (pm2 status)');
    console.log('   - Try changing ip_hash to least_conn in nginx.conf');
  } else {
    console.log('⚠️  No requests were processed. Check server connectivity.');
  }
  console.log('='.repeat(50) + '\n');
}

runTest().catch(console.error);
