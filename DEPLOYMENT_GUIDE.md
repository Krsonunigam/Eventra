# 🚀 Eventra Production Deployment Guide

This guide will walk you through deploying Eventra for production using **Render** (Backend) and **Vercel** (Frontend).

---

## 🏗️ Phase 1: Backend Deployment (Render)

Render is excellent for Node.js backends. Since Eventra uses `canvas` and `face-api.js`, Render's Linux environment is well-suited.

### 1. Prepare GitHub
Ensure your latest code is pushed to GitHub (already done).

### 2. Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Set the following:
   - **Name**: `eventra-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (needed for `canvas` dependencies often, though `Free` might work).

### 3. Environment Variables
In the **Environment** tab on Render, add these variables:
- `MONGODB_URI`: Your MongoDB Atlas connection string.
- `JWT_SECRET`: A long random string.
- `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`: From your Cloudinary dashboard.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`: From Razorpay dashboard.
- `EMAIL_USER`, `EMAIL_PASS`: Your Gmail/SMTP credentials.
- `NODE_ENV`: `production`
- `CLIENT_URL`: `https://your-eventra-frontend.vercel.app` (You'll get this after Phase 2).

---

## 🌐 Phase 2: Frontend Deployment (Vercel)

Vercel is the best platform for React applications.

### 1. Create Vercel Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.

### 2. Configure Build Settings
- **Framework Preset**: `Create React App`
- **Root Directory**: `client` (Very Important!)
- **Build Command**: `npm run build`
- **Output Directory**: `build`

### 3. Environment Variables
Add this variable in Vercel:
- `REACT_APP_API_URL`: `https://eventra-backend.onrender.com` (Your Render service URL).

---

## 🔗 Phase 3: Connecting Both

Once both are deployed:
1. **Update Backend**: Go back to Render and update `CLIENT_URL` to your Vercel URL.
2. **CORS**: Ensure your backend `server.js` allows requests from your Vercel URL.

---

## 🛠️ Post-Deployment Checklist

### 1. Database Access
In MongoDB Atlas, go to **Network Access** and add `0.0.0.0/0` (allow all) or specifically add Render's IP addresses if you have a static IP.

### 2. Face Recognition Models
The models are stored in the `/models` directory in the root. Ensure they are pushed to Git. Render will serve them correctly.

### 3. WhatsApp Session
Note: `whatsapp-web.js` requires a persistent session. On Render's free/starter tier, the filesystem is ephemeral. 
- **Recommendation**: For production WhatsApp usage, consider using a dedicated VPS or a Render **Disk** to persist the `whatsapp-session` folder.

### 4. Admin Setup
Run the admin creation script once on production (via Render's "Shell" tab):
```bash
node scripts/createAdmin.js
```

---

## 📈 Monitoring
- Use **Render Logs** to check for backend errors.
- Use **Vercel Analytics** for frontend performance.
- Use **Cloudinary Dashboard** to monitor image usage.

---
**Need help?** Contact the development team or check the GitHub issues.
