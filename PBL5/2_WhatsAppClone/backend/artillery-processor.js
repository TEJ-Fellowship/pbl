// Track which servers handle requests
const serverStats = {
  'server-1': 0,
  'server-2': 0,
  'server-3': 0,
  'unknown': 0
};

export function beforeRequest(requestParams, context, ee, next) {
  return next();
}

export function afterResponse(requestParams, response, context, ee, next) {
  // Track server distribution
  if (response.body) {
    try {
      const body = typeof response.body === 'string' 
        ? JSON.parse(response.body) 
        : response.body;
      
      if (body.serverId) {
        const serverId = body.serverId;
        if (serverStats[serverId] !== undefined) {
          serverStats[serverId]++;
        } else {
          serverStats['unknown']++;
        }
        
        // Store in context for reporting
        context.vars.serverId = serverId;
        context.vars.port = body.port;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return next();
}

export function beforeExit(scriptMetrics, ee, done) {
  console.log('\n📊 Server Distribution Summary:');
  console.log('================================');
  const total = Object.values(serverStats).reduce((a, b) => a + b, 0);
  
  Object.entries(serverStats).forEach(([server, count]) => {
    if (count > 0) {
      const percentage = ((count / total) * 100).toFixed(2);
      console.log(`${server}: ${count} requests (${percentage}%)`);
    }
  });
  
  console.log(`\nTotal requests: ${total}`);
  console.log('\n✅ Load balancing is working if requests are distributed across servers');
  console.log('❌ If all requests go to one server, check Nginx configuration\n');
  
  done();
}
