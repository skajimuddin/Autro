# Local Setup Guide

Welcome to the Workshop Garage Management project! This document outlines how to set up your environment variables and start the application locally.

## 1. Prerequisites
- **Node.js** (v18+)
- A **Google Cloud Platform** account (to generate Google OAuth credentials)
- A **Cloudflare** account (for R2 Storage keys)

## 2. Environment Variables Setup

This project uses a monorepo architecture. You must configure environment variables for both the backend and frontend separately. The application is strictly configured and **will crash on purpose** if any of these variables are missing.

### Backend (`apps/api`)
The backend is powered by Cloudflare Workers (Hono). For local development, wrangler uses a `.dev.vars` file.

Create a file named `.dev.vars` at `apps/api/.dev.vars` and add the following:

```ini
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8787/auth/google/callback

# Security (Generate using: openssl rand -base64 64)
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudflare R2 Credentials (for Photo Uploads)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
```

### Frontend (`apps/web`)
The frontend is powered by React + Vite. Vite looks for `.env.local` files.

Create a file named `.env.local` at `apps/web/.env.local` and add the following:

```ini
VITE_API_BASE_URL=http://localhost:8787
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

## 3. Database Initialization (First Run)

The backend uses Cloudflare D1 (SQLite). Before starting the app for the first time, you need to apply the database migrations to your local environment.

Run this command from the root directory:
```bash
npx wrangler d1 migrations apply DB --local --cwd apps/api
```

## 4. Running the Application

To run the application, open two separate terminal windows at the root of the project.

**Terminal 1: Start the Backend API**
```bash
npm run dev --workspace=apps/api
```
*(This will start the Hono server at `http://localhost:8787`)*

**Terminal 2: Start the Frontend Web App**
```bash
npm run dev --workspace=apps/web
```
*(This will start the React app at `http://localhost:5173`)*

## 💡 Troubleshooting
* **App immediately crashes?** Double-check your `.dev.vars` and `.env.local`. There are no fallback or default values in the code — every key is 100% required.
* **Database errors?** Make sure you ran the `wrangler d1 migrations` command to create the tables in your local `.wrangler` folder.
