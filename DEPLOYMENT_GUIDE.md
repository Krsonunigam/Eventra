# Eventra Production Deployment Guide

Eventra is deployed with Firebase Hosting for the React frontend and Render for the Node/Express backend.

## Backend: Render

Use `render.yaml` or create a Render Web Service manually:

- Build command: `npm ci --omit=dev`
- Start command: `npm start`
- Health check path: `/api/health`
- Node version: `20`

Required environment variables:

- `NODE_ENV=production`
- `CLIENT_URL=https://eventraindiaai.web.app`
- `JWT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`
- `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Email provider variables, either SMTP/Gmail or SendGrid

Do not set MongoDB variables in production. Firestore is initialized through Firebase Admin SDK.

## Frontend: Firebase Hosting

From `client/`:

```bash
npm ci
npm run build
firebase deploy --only hosting,firestore:indexes,firestore:rules
```

Required frontend build variables:

- `REACT_APP_API_URL=https://eventraindbackend.onrender.com`
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_RAZORPAY_KEY_ID`

## Firestore

Deploy indexes and locked-down rules:

```bash
firebase deploy --only firestore:indexes,firestore:rules
```

The frontend does not directly read/write Firestore. The backend uses Firebase Admin SDK, so Firestore rules deny direct client access by default.

## One-Time Migration

Use `FIRESTORE_MIGRATION.md` for the MongoDB Atlas to Firestore migration steps.

## Verification

- `GET https://eventraindbackend.onrender.com/api/health` returns `db: "firestore"`
- Frontend build completes without warnings
- Signup/login works and returns JWT
- Booking, attendance, QR/face verification, certificates, admin dashboard, analytics, and chatbot routes load through the Render API
