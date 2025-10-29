# Quick Fixes Checklist

## Priority Order for Immediate Fixes

### 🔴 MUST FIX TODAY

- [ ] **Install MCP SDK and rewrite server**

  ```bash
  cd mcp-server
  npm install @modelcontextprotocol/sdk
  ```

  See `MCP_IMPLEMENTATION_GUIDE.md` for full rewrite

- [ ] **Remove hardcoded password fallback**
      Files: `backend/services/queryServiceHybrid.js`, `backend/dbHybrid.js`

  ```javascript
  // DELETE THIS:
  password: process.env.POSTGRES_PASSWORD || "your_password_here";
  // REPLACE WITH:
  password: process.env.POSTGRES_PASSWORD;
  // Then add validation at startup
  ```

- [ ] **Add environment variable validation**
      Create: `backend/utils/validateEnv.js`

  ```javascript
  const required = ["POSTGRES_PASSWORD", "GEMINI_API_KEY", "PINECONE_INDEX"];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length) {
    throw new Error(`Missing: ${missing.join(", ")}`);
  }
  ```

- [ ] **Fix CORS configuration**
      File: `backend/appHybrid.js`
  ```javascript
  origin: process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "development" ? true : false);
  ```

---

### 🟠 FIX THIS WEEK

- [ ] **Standardize on ES Modules**

  - Convert `mcp-server/` to ES modules
  - Convert `backend/` to ES modules
  - Update all `require()` to `import`
  - Update all `module.exports` to `export`

- [ ] **Add proper error handling class**
      Create: `backend/utils/errors.js`

  ```javascript
  export class AppError extends Error {
    constructor(message, code, statusCode = 500) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
    }
  }
  ```

- [ ] **Add request validation**
      Install: `npm install zod`
      Create: `backend/validators/queryValidator.js`

  ```javascript
  import { z } from "zod";
  export const querySchema = z.object({
    question: z.string().min(1).max(1000),
    sessionId: z.string().uuid().optional(),
  });
  ```

- [ ] **Replace console.log with proper logger**
      File: `backend/utils/logger.js`

  ```javascript
  import winston from "winston";
  export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  });
  ```

- [ ] **Fix async file I/O**
      File: `mcp-server/src/components/cacheService.js`
  ```javascript
  // Replace all fs.readFileSync with:
  await fs.promises.readFile(...)
  // Replace all fs.writeFileSync with:
  await fs.promises.writeFile(...)
  ```

---

### 🟡 FIX THIS MONTH

- [ ] **Add testing framework**

  ```bash
  npm install -D vitest @vitest/ui
  ```

  Create test files for each component

- [ ] **Add health check endpoint**
      File: `backend/appHybrid.js`

  ```javascript
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  ```

- [ ] **Add rate limiting**

  ```bash
  npm install express-rate-limit
  ```

- [ ] **Add TypeScript or JSDoc**
      Option A: Full TypeScript migration
      Option B: Add JSDoc to all public methods

- [ ] **Improve code organization**

  - Remove "Hybrid" suffixes
  - Add barrel exports (`index.js` files)
  - Centralize configuration

- [ ] **Add API documentation**
  ```bash
  npm install swagger-jsdoc swagger-ui-express
  ```

---

### 🔵 NICE TO HAVE

- [ ] Add Dockerfile and docker-compose.yml
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Add Prettier and ESLint
- [ ] Add pre-commit hooks (Husky)
- [ ] Improve README with architecture diagrams
- [ ] Add structured logging (Winston/Pino)
- [ ] Add monitoring/observability

---

## File-by-File Fix List

### `mcp-server/server.js`

- [ ] Replace with proper MCP SDK implementation
- [ ] Remove console.log statements

### `mcp-server/src/index.js`

- [ ] Convert to ES modules
- [ ] Remove `processQuery()` method
- [ ] Implement proper MCP tool registration

### `mcp-server/src/components/*.js`

- [ ] Convert all to ES modules (`export` instead of `module.exports`)
- [ ] Add JSDoc comments
- [ ] Add input validation

### `backend/appHybrid.js`

- [ ] Fix CORS configuration
- [ ] Add rate limiting
- [ ] Add health check route

### `backend/services/queryServiceHybrid.js`

- [ ] Remove hardcoded database credentials
- [ ] Use environment variables for all config
- [ ] Add proper error handling

### `backend/dbHybrid.js`

- [ ] Remove hardcoded credentials
- [ ] Add connection retry logic
- [ ] Add proper error propagation

### `backend/utils/config.js`

- [ ] Expand to include all configuration
- [ ] Add validation
- [ ] Add defaults with clear documentation

### `backend/utils/logger.js`

- [ ] Replace with Winston or Pino
- [ ] Add structured logging
- [ ] Add log levels

### `backend/controllers/chatControllerHybrid.js`

- [ ] Add request validation
- [ ] Add proper error handling
- [ ] Add rate limiting per route

---

## Environment Variables Checklist

Create `.env.example` file with:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=paypalAgent

# APIs
GEMINI_API_KEY=your_key
PINECONE_INDEX=your_index
PINECONE_NAMESPACE=your_namespace

# Google Search
GOOGLE_WEB_KEY=your_key
GOOGLE_SEARCH_ID=your_id

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
FRONTEND_URL=http://localhost:5173

# MCP Server (if needed)
MCP_SERVER_ENABLED=true
```

---

## Testing Checklist

- [ ] Unit tests for all services
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical flows
- [ ] Load testing for performance
- [ ] Security testing (OWASP checklist)

---

## Documentation Checklist

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture diagrams
- [ ] Deployment guide
- [ ] Contributing guidelines
- [ ] JSDoc for all public APIs
- [ ] README improvements
