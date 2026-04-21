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

// Inicialización del Singleton de Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportación del núcleo de servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configuración de persistencia local para mantener la sesión
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Auth Persistence Error:", err);
});

export { 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};
