# RFID Attendance System — PESCE

Real-time web dashboard for the ESP32 + MFRC522 RFID attendance system, deployed on Vercel.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── attendance/route.js   ← POST (ESP32) + GET (initial load)
│   │   └── unknown/route.js      ← POST for unknown card scans
│   ├── globals.css
│   ├── layout.js
│   └── page.js                   ← Server component (SSR initial data)
├── components/
│   ├── Dashboard.jsx             ← Main client component + Pusher subscription
│   ├── LCDDisplay.jsx            ← Animated LCD simulation
│   ├── StatusCards.jsx           ← Pranav / Chiranth presence cards
│   └── AttendanceLog.jsx         ← Live log table
├── esp32_firmware/
│   └── rfid_attendance.ino       ← Updated ESP32 code (HTTPS to Vercel)
├── .env.local.example
└── .gitignore
```

---

## Deploy to Vercel — Step by Step

### 1. Create accounts (all free)

- **Vercel**: https://vercel.com
- **Pusher**: https://pusher.com (Sandbox plan — 200k messages/day free)

### 2. Set up Pusher

1. Log in → Create App
2. Name it `rfid-attendance`, cluster: `ap2` (or closest to you)
3. Go to **App Keys** — note down:
   - App ID
   - Key
   - Secret
   - Cluster

### 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/rfid-attendance.git
git push -u origin main
```

### 4. Deploy on Vercel

1. Go to https://vercel.com/new → Import your GitHub repo
2. Framework: **Next.js** (auto-detected)
3. Click **Deploy** — it will fail on first deploy because env vars aren't set yet. That's fine.

### 5. Add Vercel KV (database)

1. In Vercel dashboard → your project → **Storage** tab
2. Click **Create Database** → choose **KV**
3. Name it `rfid-kv`, click Create
4. Click **Connect to Project** — this automatically adds the KV env vars

### 6. Add environment variables in Vercel

In your project → **Settings** → **Environment Variables**, add:

| Name | Value |
|------|-------|
| `PUSHER_APP_ID` | from Pusher App Keys |
| `PUSHER_KEY` | from Pusher App Keys |
| `PUSHER_SECRET` | from Pusher App Keys |
| `PUSHER_CLUSTER` | e.g. `ap2` |
| `NEXT_PUBLIC_PUSHER_KEY` | same as PUSHER_KEY |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | same as PUSHER_CLUSTER |

KV vars (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) are added automatically in step 5.

### 7. Redeploy

In Vercel → **Deployments** → click the three dots on latest → **Redeploy**.

Your dashboard will be live at `https://your-project.vercel.app`

---

## Configure the ESP32

Open `esp32_firmware/rfid_attendance.ino` and edit:

```cpp
const char* WIFI_SSID     = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";
const char* SERVER_HOST   = "your-project.vercel.app";  // no https://
```

Upload to the ESP32. It will connect to WiFi and start sending HTTPS POSTs to Vercel on every card tap.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env template
copy .env.local.example .env.local
# Fill in your Pusher + KV values in .env.local

# Run dev server
npm run dev
```

Open http://localhost:3000

### Test without ESP32 (PowerShell)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/attendance" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"Pranav","location":"PESCE","time":"09:15:00","ampm":"AM","uid":"737DC80D"}'
```

---

## How the real-time flow works

```
ESP32 scans card
    → HTTPS POST to Vercel /api/attendance
    → Saved in Vercel KV (Redis)
    → Pusher event triggered
    → All open browser tabs receive event instantly
    → LCD panel animates, status cards update, log row appears
```
