# Using MongoDB Atlas Instead of Local Docker

MongoDB Atlas is a cloud-hosted MongoDB service. You can use it instead of (or alongside) the local Docker MongoDB.

## Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account (M0 Free Tier available)
3. Verify your email

## Step 2: Create a Cluster

1. Log in to MongoDB Atlas
2. Click "Build a Database"
3. Choose **FREE (M0)** tier
4. Select a cloud provider and region (choose closest to you)
5. Click "Create"
6. Wait 3-5 minutes for cluster to be created

## Step 3: Create Database User

1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username and password (save these!)
5. Set privileges: "Atlas admin" or "Read and write to any database"
6. Click "Add User"

## Step 4: Whitelist Your IP Address

1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note**: For production, use specific IPs only
4. Click "Confirm"

## Step 5: Get Connection String

1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Go" as driver
5. Copy the connection string

It will look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Step 6: Update Connection String

Replace `<username>` and `<password>` with your database user credentials:

```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/philmymeds?retryWrites=true&w=majority
```

**Important**: Add your database name (`philmymeds`) before the `?` in the connection string.

## Step 7: Configure Your Application

### Option A: Use Environment Variable (Recommended)

Create or update `.env` file in `backend-go/`:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/philmymeds?retryWrites=true&w=majority

# Or for local MongoDB
# MONGODB_URI=mongodb://localhost:27017/philmymeds

PORT=8080
```

### Option B: Set Environment Variable Directly

```bash
export MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/philmymeds?retryWrites=true&w=majority"
```

### Option C: Update Docker Compose (for Docker deployment)

Edit `infra/docker/docker-compose.yml`:

```yaml
api:
  environment:
    - MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/philmymeds?retryWrites=true&w=majority
```

## Step 8: Run Your Application

### Local Development
```bash
cd backend-go
go run ./cmd/api
```

### Docker
```bash
cd infra/docker
docker compose up -d
```

## Switching Between Local and Atlas

### Use Local MongoDB
```env
MONGODB_URI=mongodb://localhost:27017/philmymeds
```

### Use MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/philmymeds?retryWrites=true&w=majority
```

Just change the `MONGODB_URI` environment variable - no code changes needed!

## Viewing Data in Atlas

### Option 1: Atlas Web UI
1. Log in to MongoDB Atlas
2. Go to "Database" → "Browse Collections"
3. View your data in the web interface

### Option 2: MongoDB Compass
1. Download MongoDB Compass
2. Connect using your Atlas connection string
3. Browse collections visually

## Benefits of MongoDB Atlas

✅ **No local setup** - No need to run Docker MongoDB  
✅ **Access from anywhere** - Connect from any device  
✅ **Automatic backups** - Built-in backup and restore  
✅ **Scalability** - Easy to scale up when needed  
✅ **Monitoring** - Built-in performance monitoring  
✅ **Free tier** - M0 tier is free forever (512MB storage)

## Security Best Practices

1. **Never commit credentials** - Use `.env` file and add to `.gitignore`
2. **Use specific IPs** - Don't use 0.0.0.0/0 in production
3. **Strong passwords** - Use complex passwords for database users
4. **Rotate credentials** - Change passwords periodically

## Troubleshooting

### Connection Timeout
- Check IP whitelist in Network Access
- Verify connection string format
- Check if cluster is running

### Authentication Failed
- Verify username and password
- Check database user exists
- Ensure password is URL-encoded if it contains special characters

### Can't Find Database
- Make sure database name is in connection string
- Database will be created automatically on first write

## Example .env File

```env
# MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/philmymeds?retryWrites=true&w=majority

# MongoDB Local (Docker)
# MONGODB_URI=mongodb://mongodb:27017/philmymeds

# Server
PORT=8080

# API Keys (optional)
STRIPE_SECRET_KEY=sk_test_...
SHIPPO_API_KEY=shippo_test_...
```

## Quick Test

After setting up Atlas, test the connection:

```bash
# Run the API
cd backend-go
go run ./cmd/api

# You should see:
# ✅ Successfully connected to MongoDB
```

Then create a patient via API and check it in Atlas web UI!
