/**
 * Request logging middleware
 * Logs all incoming requests with details
 */
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get("User-Agent") || "Unknown";
  const ip = req.ip || req.connection.remoteAddress || "Unknown";

  // Log basic request info
  console.log(`\n📨 ${method} ${url}`);
  console.log(`   ⏰ Time: ${timestamp}`);
  console.log(`   🌐 IP: ${ip}`);
  console.log(
    `   🖥️  User-Agent: ${userAgent.substring(0, 50)}${
      userAgent.length > 50 ? "..." : ""
    }`
  );

  // Log request headers (important ones)
  console.log(`   📋 Headers:`);
  console.log(`      • Content-Type: ${req.get("Content-Type") || "Not set"}`);
  console.log(
    `      • Content-Length: ${req.get("Content-Length") || "Not set"}`
  );
  console.log(`      • Origin: ${req.get("Origin") || "Not set"}`);
  console.log(`      • Referer: ${req.get("Referer") || "Not set"}`);

  // Log request body for POST/PUT requests
  if (["POST", "PUT", "PATCH"].includes(method) && req.body) {
    console.log(`   📦 Request Body:`);

    // Handle different body types
    if (req.body.message) {
      console.log(
        `      • Message: "${req.body.message.substring(0, 100)}${
          req.body.message.length > 100 ? "..." : ""
        }"`
      );
    }

    if (req.body.sessionId) {
      console.log(`      • Session ID: ${req.body.sessionId}`);
    }

    if (req.body.userId) {
      console.log(`      • User ID: ${req.body.userId}`);
    }

    if (req.body.context) {
      console.log(`      • Context: ${JSON.stringify(req.body.context)}`);
    }

    // Log other body properties
    const bodyKeys = Object.keys(req.body);
    const loggedKeys = ["message", "sessionId", "userId", "context"];
    const otherKeys = bodyKeys.filter((key) => !loggedKeys.includes(key));

    if (otherKeys.length > 0) {
      console.log(`      • Other fields: ${otherKeys.join(", ")}`);
    }
  }

  // Log query parameters for GET requests
  if (method === "GET" && Object.keys(req.query).length > 0) {
    console.log(`   🔍 Query Parameters:`);
    Object.entries(req.query).forEach(([key, value]) => {
      console.log(`      • ${key}: ${value}`);
    });
  }

  // Log route parameters
  if (Object.keys(req.params).length > 0) {
    console.log(`   🛣️  Route Parameters:`);
    Object.entries(req.params).forEach(([key, value]) => {
      console.log(`      • ${key}: ${value}`);
    });
  }

  console.log(`   ⏳ Processing...`);

  // Log response when it's sent
  const originalSend = res.send;
  res.send = function (data) {
    const responseTime = Date.now() - req.startTime;
    console.log(`   ✅ Response sent:`);
    console.log(`      • Status: ${res.statusCode}`);
    console.log(`      • Response time: ${responseTime}ms`);
    console.log(
      `      • Content-Length: ${res.get("Content-Length") || "Not set"}`
    );

    // Log response data for chat requests
    if (url.includes("/chat") && method === "POST" && data) {
      try {
        const responseData = JSON.parse(data);
        if (responseData.data) {
          console.log(
            `      • Response type: ${
              responseData.success ? "Success" : "Error"
            }`
          );
          if (responseData.data.message) {
            console.log(
              `      • AI Response length: ${responseData.data.message.length} characters`
            );
          }
          if (responseData.data.sources) {
            console.log(
              `      • Sources found: ${responseData.data.sources.length}`
            );
          }
          if (responseData.data.confidence) {
            console.log(
              `      • Confidence: ${(
                responseData.data.confidence * 100
              ).toFixed(1)}%`
            );
          }
        }
      } catch (e) {
        // Not JSON, skip detailed logging
      }
    }

    console.log(`   📤 Request completed\n`);
    originalSend.call(this, data);
  };

  // Add start time for response time calculation
  req.startTime = Date.now();

  next();
};

export default requestLogger;
