# Quick Deployment Steps

## 1️⃣ Add VAPID Keys to .env.local

Add these lines to your `.env.local` file:

```env
VAPID_PUBLIC_KEY=BPrMSDOKq3t_C4EAp6c-NwQA_ZMoodPJ5lHnhyID7itr0Md0OP
VAPID_PRIVATE_KEY=vMiuo31IHxmTol6KheRdhui918D97h5SXwBhWQ-qNps
VAPID_SUBJECT=mailto:admin@kingservicetech.com
```

## 2️⃣ Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 3️⃣ Add Environment Variables on Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add all variables from `.env.local` including the VAPID keys.

## 4️⃣ Install on Phone

### Android (Chrome):
1. Open `https://your-app.vercel.app` in Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Done! App icon appears on home screen

### iOS (Safari):
1. Open `https://your-app.vercel.app` in Safari
2. Tap Share button → "Add to Home Screen"
3. Done! App icon appears on home screen

## ✅ That's It!

Your app is now:
- ✅ Deployed on Vercel
- ✅ Installable on any phone
- ✅ Works offline
- ✅ Push notifications ready

**Share URL**: `https://your-app.vercel.app`  
**Login**: `admin@kingservicetech.com` / `admin123`
