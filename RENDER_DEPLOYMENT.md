# Deploy to Render

## Quick Setup

### 1. **Sign up for Render**
- Go to: https://render.com
- Sign up for free account
- Connect your email

### 2. **Deploy Your App**

#### Option A: Upload Code Directly (Easiest for now)

1. Go to: https://dashboard.render.com/new/web
2. Select **"Build and deploy from source code"**
3. Choose **"Public Git repository"**
4. Paste your repository URL: `https://github.com/poonampurohit-510/sp-pickles-backend`
   - *If you want to add GitHub later, you can reconnect at any time*
5. Click **"Continue"**

#### Option B: Manual Code Upload
1. Go to: https://dashboard.render.com/new/web
2. Select **"Build from Docker file"** or upload files directly
3. Follow prompts

### 3. **Configure Environment Variables**

In Render dashboard, set these in **Environment** section:

```
DATABASE_URL=postgresql://user:password@localhost/sp_pickles
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key-here
```

### 4. **Deploy Database**

1. Create PostgreSQL instance:
   - Go to: https://dashboard.render.com/new/database
   - Name: `sp-pickles-db`
   - PostgreSQL version: Latest
   - Region: Oregon (or nearest)
   - Plan: Free

2. Get the connection string and update DATABASE_URL in web service

### 5. **Deploy Frontend**

1. Create new Web Service for frontend
2. Build Command: `npm install && npm run build:frontend`
3. Start Command: `npm run serve:frontend`
4. Set environment variable: `VITE_API_BASE_URL=https://your-backend-url/api`

## Production Environment Variables

**Backend (.env):**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-secret-key
```

**Frontend (.env):**
```
VITE_API_BASE_URL=https://sp-pickles-backend.onrender.com/api
VITE_NODE_ENV=production
```

## Deployment Links

Once deployed, your app will be available at:
- **Backend**: `https://sp-pickles-backend.onrender.com`
- **Frontend**: `https://sp-pickles-frontend.onrender.com`

## Further Steps

- Set up custom domain
- Configure SSL certificates
- Set up automated backups for database
- Monitor application performance

For more details: https://docs.render.com
