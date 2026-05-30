import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
};

export function firebaseConfigOk() {
  const { apiKey, authDomain, projectId, appId } = firebaseConfig;
  return Boolean(
    apiKey &&
      apiKey.length > 20 &&
      !apiKey.includes("undefined") &&
      authDomain &&
      projectId &&
      appId
  );
}

let firebaseAuth = null;
let firestoreDb = null;

if (firebaseConfigOk()) {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
  firestoreDb = getFirestore(app);
}

export { firebaseAuth, firestoreDb };
