import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAv0B6OqJ29ufNDRYkZFWAgGw05utp1oos",
  authDomain: "linkbox-4e68e.firebaseapp.com",
  projectId: "linkbox-4e68e",
  storageBucket: "linkbox-4e68e.firebasestorage.app",
  messagingSenderId: "938571460769",
  appId: "1:938571460769:web:4cc288d3218aa75e5ec0e0",
  measurementId: "G-B46Y1KB729"
}

const app = initializeApp(firebaseConfig);

// Secondary app instance used only for creating new Firebase Auth users
// from the admin panel without signing out the current admin session.
const secondaryApp =
  getApps().find(a => a.name === 'secondary') ??
  initializeApp(firebaseConfig, 'secondary')

export const db             = getFirestore(app);
export const auth           = getAuth(app);
export const secondaryAuth  = getAuth(secondaryApp);