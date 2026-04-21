import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeAuth,
  browserLocalPersistence, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Valores fijos (Hardcoded) para evitar conflictos con variables de entorno de Vite/Gemini
const firebaseConfig = {
  apiKey: "AIzaSyBNfOqPVjxnCwR35fGGWrn36p8HHw-ZePM",
  authDomain: "agenda-virtual-48e4e.firebaseapp.com",
  projectId: "agenda-virtual-48e4e",
  storageBucket: "agenda-virtual-48e4e.firebasestorage.app",
  messagingSenderId: "937291727034",
  appId: "1:937291727034:web:bad8557b864e3de6190283"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Uso de initializeAuth para forzar persistencia y evitar configuration-not-found
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

export const db = getFirestore(app);

export { 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};
