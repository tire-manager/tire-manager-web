// import "server-only";

// import { cookies } from "next/headers";
// import { initializeServerApp, FirebaseServerApp } from "firebase/app";
// import { getAuth, Auth, User } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// interface AuthenticatedApp {
//   firebaseServerApp: FirebaseServerApp;
//   currentUser: User | null;
// }

// export async function getAuthenticatedAppForUser(): Promise<AuthenticatedApp> {
//   const cookieStore = await cookies();
//   const authIdToken = cookieStore.get("__session")?.value;

//   const firebaseServerApp = initializeServerApp(firebaseConfig, {
//     authIdToken,
//   });

//   const auth: Auth = getAuth(firebaseServerApp);
//   await auth.authStateReady();

//   return {
//     firebaseServerApp,
//     currentUser: auth.currentUser,
//   };
// }

// src/lib/firebase/serverApp.ts
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Reemplazamos los saltos de línea escapados para que funcione en Vercel/Next.js
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
