#!/bin/bash

# GitHub and Vercel Deployment Script
# This script will guide you through deploying your app

echo "════════════════════════════════════════════════════════════════"
echo "  📦 Notion-like App - Deployment Helper"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check if gh CLI is available
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI found"
    echo ""
    echo "Would you like to create a GitHub repository? (y/n)"
    read -r response

    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Creating GitHub repository..."
        gh repo create notion-like-app --public --source=. --remote=origin --push
        echo "✅ Repository created and code pushed!"
    fi
else
    echo "❌ GitHub CLI not found"
    echo ""
    echo "Please follow these steps to push to GitHub:"
    echo ""
    echo "1. Go to: https://github.com/new"
    echo "2. Create a repository named: notion-like-app"
    echo "3. Run these commands:"
    echo ""
    echo "   git remote add origin https://github.com/YOUR_USERNAME/notion-like-app.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  🚀 Next: Deploy to Vercel"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Option 1: Via Vercel Dashboard (Recommended)"
echo "  1. Go to: https://vercel.com/new"
echo "  2. Import your GitHub repository"
echo "  3. Add environment variables:"
echo "     - SUPABASE_URL"
echo "     - SUPABASE_ANON_KEY"
echo "  4. Click Deploy"
echo ""
echo "Option 2: Via Vercel CLI"
echo "  npm i -g vercel"
echo "  vercel login"
echo "  vercel --prod"
echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo ""
