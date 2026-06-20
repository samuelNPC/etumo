import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        // Matches your client configuration exactly to ensure the same database target
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("▲ Firebase Admin Node matched to frontend project workspace.");
  } catch (error) {
    console.error("▼ Firebase Admin Matching Configuration Failed:", error);
  }
}

const db = admin.firestore();
const adminAuth = admin.auth();

export { db, adminAuth };
