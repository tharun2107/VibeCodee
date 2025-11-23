# Netlify Deployment Feature - Setup Guide

## 🚀 Feature Overview

Deploy your generated projects directly to Netlify with one click! Get a live URL instantly.

## 📋 Prerequisites

1. Netlify account (free tier works)
2. Netlify API token

## 🔑 How to Get Netlify API Token

### Step 1: Sign Up/Login to Netlify
- Go to [https://app.netlify.com](https://app.netlify.com)
- Sign up or log in with your account

### Step 2: Get Your API Token
1. Click on your profile picture (top right)
2. Go to **"User settings"** or **"Account settings"**
3. Navigate to **"Applications"** → **"Personal access tokens"**
4. Click **"New access token"**
5. Give it a name (e.g., "VibeCode Deployment")
6. Click **"Generate token"**
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 3: Add Token to Environment
Add to your `server/.env` file:
```env
NETLIFY_API_TOKEN=your_netlify_api_token_here
```

## 🎯 How It Works

1. User clicks "🚀 Deploy to Netlify" button in the sidebar
2. System collects all files from the project structure
3. Creates a new Netlify site (or finds existing one)
4. Creates a new deploy
5. Uploads all files individually to Netlify
6. Publishes the deploy to make it live
7. Returns the live URL to the user (displayed in sidebar)

## 📝 API Endpoints

### POST `/api/deploy/netlify`
Deploy project to Netlify

**Request:**
```json
{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>..."
    },
    {
      "path": "src/App.jsx",
      "content": "function App() {...}"
    }
  ],
  "siteName": "my-awesome-app" // optional
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://my-awesome-app.netlify.app",
  "siteId": "site-id-here",
  "deployId": "deploy-id-here"
}
```

## 🔒 Security Notes

- API token is stored in `.env` file (never commit it!)
- Token should have minimal required permissions
- Consider using environment-specific tokens

## 🎨 UI Features

- **"🚀 Deploy to Netlify" button** - Prominent gradient button in the sidebar
- **Deployment status** - Shows "Deploying..." with spinner during deployment
- **Live URL display** - Shows deployed URL in a styled box with:
  - Copy to clipboard button
  - External link icon to open in new tab
  - Teal/green color scheme for visibility
- **Error handling** - Clear error messages if deployment fails

## 🚀 Usage

1. Generate or edit your code
2. Click "Deploy to Netlify" button
3. Wait for deployment (usually 10-30 seconds)
4. Get your live URL!
5. Share the link with anyone

## 📚 Netlify API Documentation

- [Netlify API Docs](https://docs.netlify.com/api/get-started/)
- [Deploy Sites API](https://docs.netlify.com/api/get-started/#deploy-sites)
- [File Upload API](https://docs.netlify.com/api/get-started/#deploy-sites)

