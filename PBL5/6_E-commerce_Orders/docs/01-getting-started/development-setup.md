# Development Setup

Local development environment configuration and best practices.

## Development Environment

### Recommended Tools

- **IDE:** VS Code (recommended) or WebStorm
- **Node Version Manager:** nvm (Node Version Manager)
- **Database Client:** pgAdmin, DBeaver, or TablePlus
- **Redis Client:** RedisInsight or redis-cli
- **API Testing:** Postman or Insomnia

### VS Code Extensions

Recommended extensions:
- ESLint
- Prettier
- GitLens
- Docker (if using containers)
- PostgreSQL (database management)

## Development Workflow

### 1. Start Development Servers

#### Terminal 1: Backend
```bash
cd backend
npm run dev
# or
npm start
```

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

#### Terminal 3: Redis (if not running as service)
```bash
redis-server
```

### 2. Database Setup for Development

For development, you can use a single database instance:

```env
# backend/.env (development)
DATABASE_URL1=postgresql://user:password@localhost:5432/ecommerce_dev
DATABASE_URL2=postgresql://user:password@localhost:5432/ecommerce_dev
DATABASE_URL3=postgresql://user:password@localhost:5432/ecommerce_dev
```

Note: Replication is not required for local development.

### 3. Hot Reload

- **Frontend:** Vite provides hot module replacement (HMR)
- **Backend:** Use `nodemon` for auto-restart:
  ```bash
  npm install -g nodemon
  nodemon backend/index.js
  ```

## Code Quality Tools

### Linting

```bash
# Frontend
cd frontend
npm run lint

# Backend (if configured)
cd backend
npm run lint
```

### Formatting

```bash
# Frontend (if Prettier configured)
npm run format
```

## Testing

### Run Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests (if configured)
cd backend
npm test
```

## Debugging

### Frontend Debugging

1. Use React DevTools browser extension
2. Use VS Code debugger:
   - Create `.vscode/launch.json`
   - Configure Chrome debugger

### Backend Debugging

1. Use VS Code debugger:
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Backend",
     "runtimeExecutable": "node",
     "runtimeArgs": ["--inspect"],
     "program": "${workspaceFolder}/backend/index.js"
   }
   ```

2. Use `console.log` for quick debugging
3. Use `debugger` statement for breakpoints

## Environment Variables

### Development `.env` Files

**backend/.env:**
```env
NODE_ENV=development
PORT=3000
# ... other variables
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:3000/api
```

## Database Management

### Reset Database

```bash
cd backend
npm run reset-db  # If script exists
# or manually:
psql -U postgres -d ecommerce_dev -f database/schema.sql
```

### Seed Data

```bash
cd backend
npm run seed
```

## Common Development Tasks

### Add New Product

1. Update `backend/scripts/seedProducts.js`
2. Run `npm run seed`

### Test API Endpoints

Use Postman or curl:
```bash
curl http://localhost:3000/api/products
```

### View Logs

- **Backend:** Console output
- **Frontend:** Browser console (F12)
- **Database:** PostgreSQL logs
- **Redis:** `redis-cli monitor`

## Best Practices

1. **Use Environment Variables:** Never hardcode configuration
2. **Follow Coding Standards:** See [Coding Standards](../05-development/coding-standards.md)
3. **Write Tests:** Test new features
4. **Commit Often:** Small, focused commits
5. **Use Branches:** Feature branches for new work

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
- Verify PostgreSQL is running
- Check `.env` configuration
- Test connection: `psql -U postgres -d ecommerce_dev`

## Next Steps

- [Coding Standards](../05-development/coding-standards.md)
- [Testing Strategy](../05-development/testing-strategy.md)
- [Debugging Guide](../05-development/debugging.md)

