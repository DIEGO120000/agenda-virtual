import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  EmailAuthProvider,
  browserLocalPersistence, 
  setPersistence, 
  signInWithRedirect, 
  getRedirectResult,
  signInWithPopup,
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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

setPersistence(auth, browserLocalPersistence).catch(() => {});

export { 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};
