# Roammate 🧭❤️

**Date, connect, travel.** Roammate matches people by their dating preferences and travel style, lets matches chat, and then plan trips together. People who prefer travelling in a crowd get a separate **Group travel** space to host or join group trips.

Plain HTML/CSS/JavaScript (no build step) + **Firebase** (Authentication + Cloud Firestore).

## Features

| Area | What it does |
|---|---|
| **Sign in** | Email/password and Google sign-in, password reset |
| **Profile** | Name, age, gender, city, bio, travel style, interests |
| **Discover** | Shows only people who fit *both* sides' preferences (gender + age range), ranked by a % match on shared interests, travel style and city. Like / pass. |
| **Matches & chat** | Mutual likes become a match → real-time 1:1 chat. Unread badges. |
| **Trips** | Day-by-day itinerary with timed activities; invite a match and plan together. |
| **Group travel** | Host or join group trips (with capacity), see who's going, post to the group. |

## Project structure

```
index.html          App shell
styles.css          Styles (light + dark mode)
app.js              All app logic and screens
db.js               Small path-based wrapper over Firestore
firebase-config.js  ← put your Firebase web config here
firestore.rules     Security rules (private chats, own-profile-only edits, etc.)
firebase.json       Firebase Hosting + rules config
scripts/seed.mjs    Optional: adds demo profiles and sample group trips
```

## Setup (about 10 minutes)

1. **Create a Firebase project** at https://console.firebase.google.com (the free Spark plan is enough).
2. **Add a Web app** (Project settings → General → *Add app* → Web). Copy the `firebaseConfig` object into `firebase-config.js`.
3. **Enable sign-in**: Build → Authentication → Sign-in method → enable **Email/Password** and **Google**.
4. **Create the database**: Build → Firestore Database → *Create database* (production mode).
5. **Publish the security rules**: paste the contents of `firestore.rules` into Firestore → Rules → *Publish*
   (or with the CLI: `npm i -g firebase-tools && firebase login && firebase use --add && firebase deploy --only firestore:rules`).

### Run locally
Any static server works (ES modules don't load from `file://`):
```bash
npx serve .            # or: python3 -m http.server 8080
```
Open the printed URL, then create an account.

### (Optional) Add demo profiles so you can test matching alone
```bash
# Project settings → Service accounts → Generate new private key → save as scripts/service-account.json
cd scripts && npm install && npm run seed
```
Demo profiles are marked "Demo profile" in the app; most of them like everyone back, so you'll match instantly.

## Deploy

- **Firebase Hosting:** `firebase deploy` (uses `firebase.json`).
- **GitHub Pages / Vercel / Netlify:** deploy the repo root as a static site.

Whichever host you use, add its domain under **Authentication → Settings → Authorized domains**, or Google sign-in will be blocked.

## Push to GitHub

```bash
git remote add origin https://github.com/<your-username>/roammate.git
git branch -M main
git push -u origin main
```

## Security notes

- `firebase-config.js` values are **not secrets** — access is enforced by `firestore.rules`.
- **Never commit** `scripts/service-account.json` (it's in `.gitignore`).
- Chats and trips are readable only by their members. Likes are readable by signed-in users so mutual matches can be detected; move matching to a Cloud Function if you want likes fully private.

## Roadmap ideas

Profile photos (Firebase Storage) · location-based "near you" · blocking & reporting · push notifications · Cloud Function for private matching · trip budgets & bookings.
