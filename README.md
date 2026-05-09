# Eventra - Next-Gen Event Management Portal 🚀

Eventra is a premium, high-performance event management platform built with the MERN stack. It features advanced facial recognition for attendance, secure payments via Razorpay, and a sleek, futuristic dark-mode UI.

![Eventra Logo](logo.png)

##  Key Features

###  Advanced Face Recognition
- **Biometric Check-in**: High-accuracy face recognition using `face-api.js` and `canvas`.
- **Anti-Spoofing**: Secure attendance marking with live verification.
- **Auto-Sync**: Attendance records automatically update across User and Admin dashboards.

### Secure Payments & Booking
- **Razorpay Integration**: Seamless and secure payment gateway for ticket bookings.
- **Seat Selection**: Interactive seat selection UI for venue-based events.
- **Digital Tickets**: Secure, non-transferable tickets with diagonal watermarks and QR codes.

###  Admin Powerhouse
- **Dynamic Dashboards**: Real-time analytics on attendance, revenue, and user growth.
- **Export Capabilities**: Generate professional Excel and PDF reports in one click.
- **Event Controls**: Complete lifecycle management from creation to post-event reporting.

###  Intelligent Interaction
- **AI Chatbot**: Responsive assistant with drag-and-drop capability for quick support.
- **WhatsApp Notifications**: Automated booking confirmations and reminders via WhatsApp.
- **Email System**: Transactional emails for registration and password resets.

##  Tech Stack

- **Frontend**: React 18, Framer Motion, Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Socket.io.
- **Services**: Cloudinary (Image Storage), Razorpay (Payments), SendGrid/Nodemailer (Emails).
- **AI/ML**: face-api.js (Local Browser & Server Processing).

---

##  Deployment Guide

For a full step-by-step production deployment guide, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

### Quick Deployment Overview

#### 1. Backend (Render)
- Connect your GitHub repo to Render.
- Choose **Web Service**.
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variables from your `.env` file.

#### 2. Frontend (Vercel)
- Connect your GitHub repo to Vercel.
- Framework Preset: `Create React App`.
- Root Directory: `client`
- Add `REACT_APP_API_URL` pointing to your Render backend URL.

---

##  Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mrsonung/Eventra.git
   cd Eventra
   ```

2. **Install Dependencies**:
   ```bash
   # Root (Backend)
   npm install
   # Client (Frontend)
   cd client && npm install
   ```

3. **Configure Environment**:
   Copy `env.example` to `.env` and fill in your credentials.

4. **Run the App**:
   ```bash
   # From root
   npm run dev
   ```

---

##  Security
- **JWT Authentication**: Secure stateless auth.
- **Input Sanitization**: Protection against XSS and NoSQL injection.
- **Rate Limiting**: API protection against brute force.

##  Contributing
Contributions are welcome! Please fork the repo and submit a PR.

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built by the Eventra Team.
