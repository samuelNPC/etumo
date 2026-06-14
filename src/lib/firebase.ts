import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// THE FIX: Only initialize Firebase if we actually have an API key (prevents Vercel build crashes)
let app;
if (getApps().length > 0) {
  app = getApp();
} else if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  app = initializeApp(firebaseConfig);
}

// Safely export the database and auth modules
export const db = app ? getFirestore(app) : ({} as any);
export const auth = app ? getAuth(app) : ({} as any);
export default app;
