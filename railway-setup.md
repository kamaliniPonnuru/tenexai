# Railway Database Setup Guide

## Your Railway API Token
```
7cdbe0ce-168d-4aab-8658-25e8b0a93415
```

## Setup Steps

### 1. Create a Railway Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Choose "Deploy from GitHub" or "Start from scratch"

### 2. Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Wait for the database to be provisioned

### 3. Get Database Connection Details
1. Click on your PostgreSQL database
2. Go to "Connect" tab
3. Copy the connection details:
   - Host - postgres.railway.internal
   - Port - 5432
   - Database name - railway
   - Username - postgres
   - Password - wNCqKNBFyKdtRBuIybQLYSdpVDuHcXBk

### 4. Set Environment Variables
Create a `.env.local` file in your project root with the Railway database details:

```env

```

### 5. Alternative: Use Railway CLI
If you prefer using the CLI:

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link your project
railway link

# Get environment variables
railway variables
```

### 6. Test Connection
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit the database status page:
   ```
   http://localhost:3000/db-status
   ```

3. Check if the connection is successful

## Railway API Usage

You can also use the Railway API directly to get your database information:

```bash
# Get your projects
curl -H "Authorization: Bearer 7cdbe0ce-168d-4aab-8658-25e8b0a93415" \
  https://backboard.railway.app/graphql/v2 \
  -H "Content-Type: application/json" \
  -d '{"query":"query { me { projects { nodes { id name } } } }"}'
```

## Troubleshooting

### Common Issues:
1. **Connection Refused**: Check if the database is running in Railway
2. **Authentication Failed**: Verify username/password in Railway dashboard
3. **Database Not Found**: Ensure the database name is correct
4. **SSL Issues**: Railway requires SSL connections

### SSL Configuration
Railway PostgreSQL requires SSL. The connection should work automatically, but if you have issues, add:

```env
DB_SSL=true
```

## Next Steps

1. Set up your environment variables
2. Test the connection using the DB Status page
3. Try creating a user account to verify the database works
4. Deploy your application to Railway

## Security Note

⚠️ **Important**: Never commit your `.env.local` file to version control. Add it to your `.gitignore` file.

```bash
echo ".env.local" >> .gitignore
``` 