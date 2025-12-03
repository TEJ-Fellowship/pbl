# DataStax Astra DB Setup Guide

This guide will help you connect your Node.js application to DataStax Astra DB.

## Prerequisites

1. A DataStax Astra DB account
2. A database created in Astra DB
3. Your Astra DB credentials (Client ID, Secret, Token)


## Quick Start (Easiest Method)

**If you can't find the download button in the UI, use the Astra CLI:**

1. **Install Astra CLI on Linux**:
   ```bash
   # Easiest method - One command install (Linux/Mac/Windows)
   curl -Ls "https://dtsx.io/get-astra-cli" | bash
   ```
   
   **Alternative methods:**
   ```bash
   # Option 2: Using npm (if you have Node.js installed)
   npm install -g @astra/cli
   
   # Option 3: Using Homebrew (if you have Homebrew installed)
   brew install datastax/tap/astra-cli
   ```

2. **Verify Installation**:
   ```bash
   astra --version
   ```
   This should display the installed version.

3. **Login to Astra CLI with your Token**:
   ```bash
   astra setup
   ```
   
   When prompted, you'll need to enter your **Astra Application Token**. 
   
   **Use this token** (from your credentials):
   ```
   AstraCS:your_client_id:your_token_hash
   ```
   
   **Steps:**
   1. Run `astra setup`
   2. When prompted for "Astra Application Token:", paste the token above
   3. Press Enter
   4. Optionally give it a profile name (or press Enter for default)
   
   **Note:** The token starts with `AstraCS:` - make sure to copy the entire token including the prefix.

4. **Find your database name**:
   ```bash
   astra db list
   ```
   This will show all your databases. Look for the name/id of your database (it's usually something like `my-database` or a UUID-like identifier).

5. **Download the bundle** (replace `your-actual-database-name` with the name from step 4):
   ```bash
   astra db download-scb your-actual-database-name
   ```
   
   **Example:** If your database is named `chat-app`, you would run:
   ```bash
   astra db download-scb chat-app
   ```
   
   **Alternative:** You can also find your database name in the Astra DB dashboard - it's shown on the database overview page.

6. **Create the keyspace** (if it doesn't exist):
   ```bash
   astra db create-keyspace <your-database-name> -k chatapp --if-not-exists
   ```
   
   Replace `<your-database-name>` with your actual database name.
   
   **Example:** If your database is `chat-app`:
   ```bash
   astra db create-keyspace chat-app -k chatapp --if-not-exists
   ```
   
   The `--if-not-exists` flag ensures the command won't fail if the keyspace already exists.

7. **Update your `.env` file**:
   The bundle will be downloaded as `secure-connect-<your-database-name>.zip` in your current directory.
   
   Update your `.env` file with the correct path:
   ```env
   ASTRA_SECURE_CONNECT_BUNDLE=./secure-connect-<your-database-name>.zip
   ```
   
   **Example:** If your database is `chat-app`, it would be:
   ```env
   ASTRA_SECURE_CONNECT_BUNDLE=./secure-connect-chat-app.zip
   ```

8. **Done!** Start your server and it should connect.

**Or use our helper script:**
```bash
node scripts/download-astra-bundle.js your-database-name
```

## Step 1: Create .env File

Create a `.env` file in the `backend` directory with the following content:

```env
# DataStax Astra DB Configuration
ASTRA_CLIENT_ID=key
ASTRA_SECRET=key
ASTRA_TOKEN=key

# Astra DB Keyspace (default: chatapp)
ASTRA_KEYSPACE=key

# Secure Connect Bundle Path (see Step 2)
ASTRA_SECURE_CONNECT_BUNDLE=
```

## Step 2: Download Secure Connect Bundle

The Secure Connect Bundle is required to connect to Astra DB. Here are different ways to find it:

### Method 1: From Database Dashboard
1. Log in to your [DataStax Astra DB dashboard](https://astra.datastax.com/)
2. Click on your database from the list
3. Look for one of these options:
   - **"Connect"** button/tab (usually at the top or in a sidebar)
   - **"Connection Details"** or **"Connection Info"**
   - **"Download Secure Bundle"** button
   - **"Node.js"** tab under Connect section
4. Click **"Download Secure Connect Bundle"** or **"Download Bundle"**
5. Save the ZIP file (e.g., `secure-connect-your-database-name.zip`)

### Method 2: From Database Settings
1. In your database dashboard, look for:
   - **Settings** or **Configuration** tab
   - **Database Settings** section
   - **Connection** section
2. Find the **"Secure Connect Bundle"** download link

### Method 3: Using Astra CLI (Recommended if UI doesn't work)

If you can't find the download button in the UI, use the **Astra CLI**:

1. **Install Astra CLI on Linux** (if not already installed):
   ```bash
   # Easiest method - One command install
   curl -Ls "https://dtsx.io/get-astra-cli" | bash
   ```
   
   **Alternative methods:**
   ```bash
   # Option 2: Using npm (if you have Node.js installed)
   npm install -g @astra/cli
   
   # Option 3: Using Homebrew (if you have Homebrew installed)
   brew install datastax/tap/astra-cli
   
   # Option 4: Manual download from GitHub
   # Visit: https://github.com/datastax/astra-cli/releases
   ```

2. **Verify Installation**:
   ```bash
   astra --version
   ```
   This should display the installed version.

3. **Login to Astra CLI with your Token**:
   ```bash
   astra setup
   ```
   
   When prompted, you'll need to enter your **Astra Application Token**.
   
   **Use this token** (from your credentials):
   ```
   AstraCS:your_client_id:your_token_hash
   ```
   
   **Steps:**
   1. Run `astra setup`
   2. When prompted for "Astra Application Token:", paste the token above
   3. Press Enter
   4. Optionally give it a profile name (or press Enter for default)
   
   **Note:** The token starts with `AstraCS:` - make sure to copy the entire token including the prefix.

4. **Download the Secure Connect Bundle**:
   ```bash
   astra db download-scb <your-database-name>
   ```
   Replace `<your-database-name>` with your actual database name (you can find it in your Astra DB dashboard).

5. **The bundle will be downloaded** to your current directory as `secure-connect-<database-name>.zip`

6. **Move it to your backend directory** (if needed) and update `.env`:
   ```env
   ASTRA_SECURE_CONNECT_BUNDLE=./secure-connect-<database-name>.zip
   ```

### Method 4: Direct Link (if available)
1. In your database overview page, look for connection information
2. Some dashboards show a direct download link for the bundle

### If You Still Can't Find It:
- The bundle might be in the **"API"** or **"Application Token"** section
- Check if there's a **"Generate Bundle"** or **"Create Bundle"** option
- Look for any **"Download"** buttons in the connection/connect section
- The bundle file name typically starts with `secure-connect-` followed by your database name
- **Try using the Astra CLI method above** - it's often easier than finding it in the UI

**Note:** If you're using a newer Astra DB interface, the location might be under:
- **"Connect"** → **"Drivers"** → **"Node.js"** → Download bundle
- Or in the **"Quick Start"** section

## Step 3: Extract and Set Bundle Path

You have two options:

### Option A: Use the ZIP file directly
1. Place the ZIP file in your `backend` directory (or any location)
2. Update `.env` with the path:
   ```env
   ASTRA_SECURE_CONNECT_BUNDLE=./secure-connect-your-database.zip
   ```

### Option B: Extract the ZIP file
1. Extract the ZIP file to a folder (e.g., `secure-connect-bundle/`)
2. Place it in your `backend` directory
3. Update `.env` with the path to the extracted folder:
   ```env
   ASTRA_SECURE_CONNECT_BUNDLE=./secure-connect-bundle
   ```

**Note:** You can also use an absolute path:
```env
ASTRA_SECURE_CONNECT_BUNDLE=/full/path/to/secure-connect-bundle.zip
```

## Step 4: Create Keyspace (if needed)

If the `chatapp` keyspace doesn't exist in your database, create it using the Astra CLI:

### Using Astra CLI

1. **List your databases** (to get the exact database name):
   ```bash
   astra db list
   ```

2. **Create the keyspace**:
   ```bash
   astra db create-keyspace <your-database-name> -k chatapp --if-not-exists
   ```
   
   Replace `<your-database-name>` with your actual database name.
   
   **Example:**
   ```bash
   astra db create-keyspace my-database -k chatapp --if-not-exists
   ```
   
   The `--if-not-exists` flag ensures the command won't fail if the keyspace already exists.

3. **Verify the keyspace was created**:
   ```bash
   astra db list-keyspaces <your-database-name>
   ```
   
   You should see `chatapp` in the list.

### Alternative: Using CQL Console

You can also create the keyspace using the CQL Console in the Astra DB dashboard:
1. Go to your database in the Astra DB dashboard
2. Click on **"CQL Console"** tab
3. Run:
   ```cql
   CREATE KEYSPACE IF NOT EXISTS chatapp WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
   ```

## Step 5: Create Messages Table

After creating the keyspace, you need to create the `messages` table to store chat messages.

### Using CQL Console (Recommended)

1. **Go to your database** in the Astra DB dashboard
2. Click on **"CQL Console"** tab
3. **Copy and paste** the following CQL script:

```cql
USE chatapp;

CREATE TABLE IF NOT EXISTS messages (
    conversation_id UUID,
    message_id TIMEUUID,
    sender_id UUID,
    content TEXT,
    message_type TEXT,
    status TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);

-- Optional: Create an index on sender_id for querying messages by sender
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
```

4. **Execute** the script (click "Run" or press Ctrl+Enter)

### Using Astra CLI

Alternatively, you can use the CQL file we've created:

1. **Navigate to your backend directory**:
   ```bash
   cd /path/to/your/backend
   ```

2. **Execute the CQL script** using Astra CLI:
   ```bash
   astra db cqlsh <your-database-name> -f scripts/create-messages-table.cql
   ```

   Or you can pipe the file:
   ```bash
   cat scripts/create-messages-table.cql | astra db cqlsh <your-database-name>
   ```

### Verify Table Creation

To verify the table was created successfully:

**Using CQL Console:**
```cql
USE chatapp;
DESCRIBE TABLE messages;
```

**Using Astra CLI:**
```bash
astra db describe-table <your-database-name> -k chatapp -t messages
```

You should see the table structure with all columns listed.

## Step 6: Verify Keyspace

Make sure your keyspace name in `.env` matches the keyspace in your Astra DB database. The default is `chatapp`, but you can change it:

```env
ASTRA_KEYSPACE=chatapp
```

## Step 7: Test Connection

Start your server:

```bash
cd backend
npm start
```

You should see:
```
Connecting to DataStax Astra DB...
Using secure connect bundle: /path/to/secure-connect-bundle.zip
Keyspace: chatapp
✅ Successfully connected to Cassandra/Astra DB
```

## Troubleshooting

### Can't Find Secure Connect Bundle in Dashboard

If you cannot locate the secure connect bundle download option:

1. **Check Database Status**: Make sure your database is **Active** (not paused or initializing)
2. **Look for "Connect" Button**: 
   - It might be a large button on the database overview page
   - Or a tab/section in the left sidebar
3. **Check Different Views**:
   - Try switching between "Overview", "CQL Console", "Connect", "Settings" tabs
   - Look for "Connection Details" or "Connection Info" sections
4. **Alternative Locations**:
   - Some interfaces have it under **"Quick Start"** or **"Getting Started"**
   - Check **"API"** or **"Application Token"** sections
   - Look in **"Database Settings"** or **"Configuration"**
5. **Contact Support**: 
   - Use the Astra DB support chat in the dashboard
   - Or check the [Astra DB Documentation](https://docs.datastax.com/en/astra-db-serverless/)

### Error: "ASTRA_SECURE_CONNECT_BUNDLE environment variable is required"
- Make sure you've set `ASTRA_SECURE_CONNECT_BUNDLE` in your `.env` file
- Verify the path is correct (relative or absolute)
- The bundle is **required** for Astra DB cloud connections

### Error: "Cannot find secure connect bundle"
- Check that the file/folder path exists
- Verify the path in `.env` is correct
- Try using an absolute path instead of relative
- Make sure the ZIP file is not corrupted

### Error: "Authentication failed"
- Verify `ASTRA_CLIENT_ID` and `ASTRA_SECRET` are correct
- Make sure there are no extra spaces in your `.env` file
- Regenerate credentials in Astra DB dashboard if needed
- Ensure you're using the **Client ID** and **Secret**, not the Token for authentication

### Error: "Keyspace does not exist"
- Verify the keyspace name in `.env` matches your Astra DB keyspace
- Create the keyspace in Astra DB if it doesn't exist
- You can create it via the CQL Console in the Astra DB dashboard

## Fallback to Local Cassandra

If `ASTRA_CLIENT_ID` and `ASTRA_SECRET` are not set, the application will automatically fall back to local Cassandra on `127.0.0.1:9042`.

## Alternative: Using Astra DB REST API (If Bundle Not Available)

If you absolutely cannot find the secure connect bundle, you might need to:
1. Check if your database type supports direct connection
2. Contact Astra DB support to enable bundle download
3. Verify your database is fully provisioned and active

**Note:** The secure connect bundle is the standard and recommended way to connect to Astra DB. If it's not available, there may be an issue with your database setup.

## Additional Resources

- [DataStax Astra DB Documentation](https://docs.datastax.com/en/astra/)
- [Astra DB Node.js Driver Guide](https://docs.datastax.com/en/astra-db-serverless/databases/nodejs-driver.html)
- [Cassandra Driver Documentation](https://docs.datastax.com/en/developer/nodejs-driver/latest/)
- [Astra DB Support](https://www.datastax.com/support)

