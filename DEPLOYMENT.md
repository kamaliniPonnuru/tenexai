# 🚀 TenexAI Deployment Guide

This guide provides step-by-step instructions for deploying TenexAI to various platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **PostgreSQL Database** - Railway, Supabase, or any PostgreSQL provider
3. **Git Repository** - Your code should be in a Git repository

## 🎯 Quick Deployment Options

### **Option 1: Vercel (Recommended - 5 minutes)**

Vercel is the easiest way to deploy Next.js applications.

#### Step 1: Prepare Your Repository
```bash
# Ensure your code is pushed to GitHub/GitLab/Bitbucket
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your Git repository
4. Configure environment variables:
   ```
   DATABASE_PUBLIC_URL=your_postgres_connection_string
   OPENAI_API_KEY=your_openai_api_key
   NEXTAUTH_SECRET=your_random_secret_key
   NEXTAUTH_URL=https://your-app.vercel.app
   ```
5. Click "Deploy"

#### Step 3: Verify Deployment
- Your app will be available at `https://your-app.vercel.app`
- Test the application by registering a user and uploading a log file

### **Option 2: Railway (Full Stack - 10 minutes)**

Railway can host both your app and database.

#### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app) and sign up
2. Connect your GitHub account

#### Step 2: Deploy Database
1. Click "New Project" → "Provision PostgreSQL"
2. Note the connection string from the "Connect" tab

#### Step 3: Deploy Application
1. Click "New Service" → "GitHub Repo"
2. Select your repository
3. Add environment variables:
   ```
   DATABASE_PUBLIC_URL=your_railway_postgres_url
   OPENAI_API_KEY=your_openai_api_key
   NEXTAUTH_SECRET=your_random_secret_key
   NEXTAUTH_URL=https://your-app.railway.app
   ```
4. Deploy

### **Option 3: Docker (Local/Server - 15 minutes)**

#### Step 1: Build and Run with Docker Compose
```bash
# Clone your repository
git clone <your-repo-url>
cd my-app

# Create .env file
cat > .env << EOF
OPENAI_API_KEY=your_openai_api_key
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
EOF

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f app
```

#### Step 2: Access Application
- Open http://localhost:3000
- Register a new user and test the application

#### Step 3: Production Deployment
```bash
# Build production image
docker build -t tenexai .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_PUBLIC_URL=your_postgres_url \
  -e OPENAI_API_KEY=your_openai_api_key \
  -e NEXTAUTH_SECRET=your_secret \
  -e NEXTAUTH_URL=https://your-domain.com \
  --name tenexai-app \
  tenexai
```

## 🔧 Environment Variables

### **Required Variables**
```env
# Database (Choose one)
DATABASE_PUBLIC_URL=postgresql://user:pass@host:port/db
# OR individual variables:
DB_USER=postgres
DB_HOST=localhost
DB_NAME=tenexai
DB_PASSWORD=password
DB_PORT=5432
DB_SSL=true

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# NextAuth
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=https://your-domain.com
```

### **Optional Variables**
```env
# Development
NODE_ENV=production
PORT=3000

# Custom configurations
CUSTOM_KEY=value
```

## 🗄️ Database Setup

### **Railway PostgreSQL**
1. Create new PostgreSQL database in Railway
2. Copy connection string from "Connect" tab
3. Use as `DATABASE_PUBLIC_URL`

### **Supabase**
1. Create new project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy connection string
4. Use as `DATABASE_PUBLIC_URL`

### **Local PostgreSQL**
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE tenexai;
CREATE USER tenexai_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tenexai TO tenexai_user;
\q
```

## 🔒 Security Checklist

### **Before Production**
- [ ] Use HTTPS in production
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure proper CORS settings
- [ ] Set up rate limiting
- [ ] Use environment variables for all secrets
- [ ] Enable database SSL connections
- [ ] Set up monitoring and logging

### **Environment Variables Security**
```bash
# Generate secure secret
openssl rand -base64 32

# Use in production
NEXTAUTH_SECRET=generated-secret-here
```

## 📊 Monitoring & Maintenance

### **Health Checks**
```bash
# Check application health
curl https://your-app.com/api/test-db

# Check database connection
curl https://your-app.com/api/logs/files?userId=1
```

### **Logs**
```bash
# Vercel
vercel logs

# Railway
railway logs

# Docker
docker-compose logs -f
```

### **Updates**
```bash
# Update dependencies
npm update

# Rebuild Docker image
docker-compose build --no-cache
docker-compose up -d
```

## 🚨 Troubleshooting

### **Common Issues**

#### Database Connection Failed
```bash
# Check connection string
echo $DATABASE_PUBLIC_URL

# Test connection
psql $DATABASE_PUBLIC_URL -c "SELECT 1;"
```

#### OpenAI API Errors
```bash
# Verify API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### Build Failures
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### **Performance Issues**
- Enable database connection pooling
- Implement caching for AI responses
- Use CDN for static assets
- Monitor API rate limits

## 📈 Scaling

### **Horizontal Scaling**
- Use load balancers
- Implement session storage (Redis)
- Use managed databases
- Set up auto-scaling

### **Vertical Scaling**
- Increase server resources
- Optimize database queries
- Implement caching layers
- Use CDN for static content

## 🔄 CI/CD Pipeline

### **GitHub Actions Example**
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Support

### **Getting Help**
1. Check the [README.md](./README.md) for detailed documentation
2. Review the troubleshooting section above
3. Create an issue in the GitHub repository
4. Check deployment platform documentation

### **Useful Commands**
```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Docker
docker-compose up -d
docker-compose logs -f

# Database
npm run db:setup
npm run db:migrate
```

---

**🎉 Congratulations!** Your TenexAI application is now deployed and ready to help SOC analysts with AI-powered cybersecurity insights. 