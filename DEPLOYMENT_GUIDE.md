# 🚀 Deployment Guide: GitHub + Vercel

This guide will walk you through deploying TenexAI to GitHub and Vercel.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier available)
- Railway account for PostgreSQL database
- OpenAI API key

## 🔗 Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface (Recommended)

1. **Go to GitHub.com** and sign in to your account
2. **Click "New repository"** or the "+" icon in the top right
3. **Repository settings:**
   - **Repository name**: `tenexai` (or your preferred name)
   - **Description**: `AI-powered cybersecurity platform for SOC analysts`
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. **Click "Create repository"**

### Option B: Using GitHub CLI (if installed)

```bash
# Install GitHub CLI first
brew install gh

# Login to GitHub
gh auth login

# Create repository
gh repo create tenexai --public --description "AI-powered cybersecurity platform for SOC analysts"
```

## 🔄 Step 2: Push Code to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/tenexai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🌐 Step 3: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import Git Repository:**
   - Select your GitHub account
   - Find and select your `tenexai` repository
   - Click "Import"

4. **Configure Project:**
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `.next` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

5. **Environment Variables:**
   Add these environment variables in Vercel:
   ```
   DATABASE_PUBLIC_URL=your_railway_postgres_url
   OPENAI_API_KEY=your_openai_api_key
   NEXTAUTH_SECRET=your_random_secret_key
   NEXTAUTH_URL=https://your-vercel-domain.vercel.app
   ```

6. **Click "Deploy"**

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## 🗄️ Step 4: Database Setup

### Railway Database Configuration

1. **Go to [railway.app](https://railway.app)** and sign in
2. **Create a new project**
3. **Add PostgreSQL database**
4. **Get connection details:**
   - Copy the `DATABASE_URL` from Railway
   - Use this as your `DATABASE_PUBLIC_URL` in Vercel

### Database Initialization

After deployment, your database will be automatically initialized on first access. For role-based system setup:

```bash
# Run this locally or via Vercel Functions
node scripts/init-roles.js
```

## 🔧 Step 5: Environment Variables

### Required Environment Variables

Set these in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_PUBLIC_URL` | Railway PostgreSQL URL | `postgresql://user:pass@host:port/db?sslmode=require` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `NEXTAUTH_SECRET` | Random secret for sessions | `your-random-secret-key` |
| `NEXTAUTH_URL` | Your Vercel domain | `https://tenexai.vercel.app` |

### Generate NEXTAUTH_SECRET

```bash
# Generate a random secret
openssl rand -base64 32
```

## 🧪 Step 6: Testing Deployment

1. **Visit your Vercel URL** (e.g., `https://tenexai.vercel.app`)
2. **Test the application:**
   - Register a new account
   - Upload a log file
   - Check AI analysis
   - Test role-based access

3. **Test API endpoints:**
   - `https://your-domain.vercel.app/api/test-db`
   - Should return database connection status

## 🔄 Step 7: Continuous Deployment

Vercel will automatically deploy when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Vercel will automatically deploy
```

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Check `DATABASE_PUBLIC_URL` format
   - Ensure Railway database is running
   - Verify SSL settings

2. **OpenAI API Error:**
   - Check API key is correct
   - Verify billing is set up on OpenAI
   - Check API quota limits

3. **Build Errors:**
   - Check Node.js version (should be 18+)
   - Verify all dependencies are in package.json
   - Check for TypeScript errors

4. **Environment Variables:**
   - Ensure all variables are set in Vercel
   - Check variable names match exactly
   - Redeploy after adding variables

### Debug Commands

```bash
# Check build locally
npm run build

# Test database connection
node scripts/test-db.js

# Check environment variables
echo $DATABASE_PUBLIC_URL
```

## 📊 Monitoring

### Vercel Analytics
- View deployment status in Vercel dashboard
- Monitor function execution times
- Check for errors in function logs

### Database Monitoring
- Monitor Railway database usage
- Check connection pool status
- Review query performance

## 🔒 Security Checklist

- [ ] Environment variables are set in Vercel
- [ ] Database uses SSL connections
- [ ] OpenAI API key is secure
- [ ] NEXTAUTH_SECRET is random and secure
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Database access is restricted

## 🎉 Success!

Your TenexAI application is now deployed and accessible at your Vercel URL!

### Next Steps:
1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up backup strategies
4. Implement CI/CD pipelines
5. Add performance monitoring

---

**Need help?** Check the main README.md for detailed documentation or create an issue in your GitHub repository. 