import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

export const db = getFirestore(app);