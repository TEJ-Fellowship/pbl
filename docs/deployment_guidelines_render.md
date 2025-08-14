# Render.com Deployment Guide

## Example Monorepo Structure

```
PBL/
├── docs/
│   ├── presentation_guidelines.md
│   └── project-guidelines.md
├── project-name-1/                    # Frontend-only (in subfolder)
│   └── client/
│       ├── package.json
│       └── src/
├── project-name-2/                    # Frontend-only (in root)
│   ├── index.html
│   ├── package.json
│   ├── src/
│   ├── tailwind.config.js
│   └── vite.config.js
├── project-name-3/                    # Full-stack project
│   ├── frontend/
│   │   ├── package.json
│   │   └── src/
│   └── backend/
│       ├── package.json
│       └── server.js
├── project-name-4/                    # Full-stack project (client/server)
│   ├── client/
│   │   ├── package.json
│   │   └── src/
│   └── server/
│       ├── package.json
│       └── app.js
└── README.md
```

## Prerequisites

- GitHub account with your project pushed to the PBL monorepo
- Render.com account (free tier available)

## Deploying Frontend (Static Site)

### Step 1: Create Static Site

1. Go to [render.com](https://render.com) and log in
2. Click **"+ Add New "** → **"Static Site"**
3. Connect your GitHub repository:
   - **Option 1**: Select from dropdown if you have access to the repo
   - **Option 2**: Use public GitHub repo link: `https://github.com/TEJ-Fellowship/pbl.git`

### Step 2: Configure Build Settings

- **Name**: Choose any name for your app
- **Branch**: `main`
- **Root Directory**: `your-project-name` or `your-project-name/client` (exact folder name where your project is)
- **Build Command**: `npm install && npm run build` (for Vite projects use `npm run build`)
- **Publish Directory**: `build` (React) or `dist` (Vue/Vite)

### Step 3: Add Environment Variables (if needed)

- Go to **Environment** tab
- Add variables like `REACT_APP_API_URL` with your backend URL

### Step 4: Deploy

- Click **"Create Static Site"**
- Wait for deployment to complete

## Deploying Backend (Web Service)

### Step 1: Create Web Service

1. Click **"+ Add New"** → **"Web Service"**
2. Connect your GitHub repository:
   - **Option 1**: Select from dropdown if you have access to the repo
   - **Option 2**: Use public GitHub repo link: `https://github.com/TEJ-Fellowship/pbl.git`

### Step 2: Configure Build Settings

- **Name**: Choose any name for your backend
- **Branch**: `main`
- **Root Directory**: `your-project-folder/backend` (when backend is added later)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 3: Add Environment Variables

- Go to **Environment** tab
- Add required variables:
  ```
  NODE_ENV=production
  PORT=10000
  DATABASE_URL=your-database-connection-string
  ```

### Step 4: Deploy

- Click **"Create Web Service"**
- Wait for deployment to complete

## Important Notes

### Root Directory Selection

**This is crucial for monorepo:** Always specify the correct folder path where your project code lives.

**Examples:**

- `your-project-name` (if project files are directly in the folder)
- `your-project-name/client` (if project files are in a client subfolder)
- `your-project-name/frontend` (if project files are in a frontend subfolder)
- `your-project-name/backend` (for backend deployment)
- `your-project-name/server` (for server deployment)

### Package.json Requirements

Make sure your `package.json` has proper scripts:

**Frontend:**

```json
{
  "scripts": {
    "build": "react-scripts build",
    "start": "react-scripts start"
  }
}
```

**Backend:**

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

### Connecting Frontend to Backend

1. Deploy backend first and copy the URL
2. Add the backend URL as `REACT_APP_API_URL` in frontend environment variables
3. Deploy frontend

## Database Setup (if needed)

1. Create **PostgreSQL** database in Render
2. Copy the connection string
3. Add it as `DATABASE_URL` in your backend environment variables

## Quick Troubleshooting

- **Build fails**: Check your Root Directory path
- **App won't start**: Verify your start command and package.json scripts
- **Can't connect to backend**: Check CORS settings and API URL
