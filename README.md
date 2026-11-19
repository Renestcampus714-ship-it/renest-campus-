# ReNest Campus

**Buy Smart. Sell Easy. Reuse Together.**

ReNest Campus is a full-stack, Firebase-powered student circular marketplace built as an Entrepreneurship & Innovation Software Capstone for **DBS Global University** (Dehradun, Uttarakhand). It helps students living in hostels, PGs, and rented accommodations buy, sell, and transfer useful second-hand essentials during semester move-in and move-out cycles.

---

## Key Features

- **Firebase Authentication**: Google sign-in (`GoogleAuthProvider` / `signInWithPopup`) plus open email/password registration (`createUserWithEmailAndPassword`), login, session persistence, forgot/reset password, email verification, and logout. Honest account status tracking (`Registered User` vs. `Email Verified`).
- **Cloud Firestore Marketplace**: Real-time active listings, multi-facet search & filtering (category, price range, condition, Dehradun/campus cluster, availability), and sorting.
- **Seller Workflow**: Create, edit, and delete listings with photo uploads (Firebase Storage with progress indicator and optional clearly labelled compressed fallback), status controls (`Available`, `Reserved`, `Sold`, `Transferred`), and enquiry management.
- **Buyer & Seller Dashboards**: Live metrics calculated directly from Firestore records, saved favourites, recently viewed items, notifications, and inventory management.
- **Atomic Handover Transactions**: Firestore `runTransaction` prevents conflicting double-reservations on the same listing and displays the ₹40 MVP service fee planning assumption transparently without processing online payments.
- **Hardened Security Rules**: Restrictive `firestore.rules` and `storage.rules` enforcing owner-only mutations, PII isolation, strict key/type/size validation, and terminal transaction locking.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, React Hook Form, Zod, Lucide React
- **Backend**: Firebase Authentication, Cloud Firestore, Firebase Storage, Firestore Security Rules

---

## Local Development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:3000`.

### Production Build

```bash
npm run build
```

Output is emitted to `dist/`.

### Unit & Security Validation Tests

```bash
npx --yes tsx --test src/utils/marketplaceLogic.test.ts
npx --yes tsx --test firestore.rules.test.ts
npx eslint firestore.rules
npm run lint
```

---

## Firebase Project Setup

1. **Firebase Project (`renest-campus`)**: Provisioned in `firebase-applet-config.json` and wired in `src/firebase/config.ts` using Cloud Firestore (`ai-studio-5de3bebc-d12e-4935-9593-0a51d0e39ee9`), Firebase Authentication (with Google Sign-In OAuth client configured), and Firebase Storage (`renest-campus.firebasestorage.app`).
2. **Deploy Security Rules & Indexes**:
   ```bash
   firebase use renest-campus
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
3. **Authentication Providers**:
   - **Google Sign-In**: Provisioned with the OAuth client in `firebase-applet-config.json`.
   - **Email/Password**: If not yet enabled, open [Firebase Console](https://console.firebase.google.com/project/renest-campus/authentication/providers) for `renest-campus` → **Authentication → Sign-in method → Email/Password** and enable it.
   - Add any custom or Vercel domains under **Authentication → Settings → Authorized domains**.
4. **Firebase Storage**:
   - Open **Storage** in Firebase Console and initialize the bucket if not already active.
   - Until Storage rules are deployed, the Sell an Item form includes an explicit compressed-JPEG fallback toggle so listings can still be tested safely.

---

## Environment Variables

Copy `.env.example` to `.env` if overriding configuration outside Google AI Studio:

```env
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
VITE_FIREBASE_FIRESTORE_DATABASE_ID="..."
```

Do not commit `.env` or private service-account credentials to GitHub.

---

## Vercel Deployment

`vercel.json` is pre-configured with Vite SPA rewrites (`/(.*) -> /index.html`).

1. Push this repository to GitHub.
2. Import the repository in **Vercel**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add any `VITE_FIREBASE_*` environment variables if deploying to a separate Firebase project.
4. Add your `*.vercel.app` domain to **Firebase Console → Authentication → Settings → Authorized domains**.
