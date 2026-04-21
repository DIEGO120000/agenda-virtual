import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNfOqPVjxnCwR35fGGWrn36p8HHw-ZePM",
  authDomain: "agenda-virtual-48e4e.firebaseapp.com",
  projectId: "agenda-virtual-48e4e",
  storageBucket: "agenda-virtual-48e4e.firebasestorage.app",
  messagingSenderId: "937291727034",
  appId: "1:937291727034:web:bad8557b864e3de6190283"
};

console.log("--- DEBUG FIREBASE CONFIG ---");
console.log("Config Object:", JSON.stringify({ ...firebaseConfig, apiKey: "REDACTED_BUT_PRESENT" }));
console.log("Vite Env Check:", import.meta.env);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Auth Object Initialized:", !!auth);

setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("--- DEBUG PERSISTENCE ERROR ---", err);
});

export { 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};
