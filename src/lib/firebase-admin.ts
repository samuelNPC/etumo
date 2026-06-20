import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("▲ Firebase Admin Initialize Node Awake.");
  } catch (error) {
    console.error("▼ Firebase Admin Config Failed:", error);
  }
}

const db = admin.firestore();
const adminAuth = admin.auth();

export { db, adminAuth };
