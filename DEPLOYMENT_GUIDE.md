# GitHub and Vercel Deployment Guide

## Step 1: Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Fill in:
   - **Repository name**: `notion-like-app` (or your preferred name)
   - **Description**: "A personal task tracking and notes system with Kanban board"
   - **Visibility**: Public or Private (your choice)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
3. Click "Create repository"

## Step 2: Push to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/notion-like-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**✅ Your code is now on GitHub!**

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in (you can use your GitHub account)
3. Click "Add New..." → "Project"
4. Import your GitHub repository:
   - Click "Import" next to `notion-like-app`
5. Configure the project:
   - **Framework Preset**: Other (or leave as detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: `.` (current directory)
6. Add Environment Variables:
   - Click "Environment Variables"
   - Add these two:
     - Name: `SUPABASE_URL`
     - Value: `https://xxxxxxxxxxxxx.supabase.co` (from Supabase)
     
     - Name: `SUPABASE_ANON_KEY`
     - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (from Supabase)
7. Click "Deploy"

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (choose your account)
# - Link to existing project? N
# - Project name? notion-like-app
# - Directory? ./
# - Override settings? N

# Add environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

## Step 4: Configure Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain or use the Vercel subdomain
   - Default: `notion-like-app.vercel.app`

## Step 5: Test Your Deployment

1. Visit your Vercel URL
2. Toggle "Demo Mode" to OFF on the home page
3. Create a test note
4. Create a test task
5. Verify data persists after refresh (stored in Supabase)

## Troubleshooting

### Environment Variables Not Working?
- Make sure you added them in Vercel dashboard
- Redeploy after adding variables
- Check the format in `js/main.js` (uses `import.meta.env`)

### CORS Errors?
- Supabase should allow all origins by default
- Check your Supabase project settings → API → CORS

### Demo Mode Stuck ON?
- Clear localStorage: Open browser console and run:
  ```javascript
  localStorage.clear()
  location.reload()
  ```

## Automatic Deployments

Once connected to GitHub, Vercel will:
- ✅ Auto-deploy on every push to `main`
- ✅ Create preview deployments for pull requests
- ✅ Show build logs and errors

## Project URLs

After deployment, you'll have:
- **Production**: `https://notion-like-app.vercel.app`
- **GitHub**: `https://github.com/YOUR_USERNAME/notion-like-app`
- **Supabase**: `https://app.supabase.com/project/YOUR_PROJECT`

---

## Quick Reference Commands

```bash
# Push changes to GitHub
git add .
git commit -m "your message"
git push

# Deploy to Vercel (if using CLI)
vercel --prod

# View logs
vercel logs

# Check deployment status
vercel ls
```

🎉 **Your app is now live!**
