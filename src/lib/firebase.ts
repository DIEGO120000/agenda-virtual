import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBvNceB2K1Nzva6HZQcWRlcjoXLoddqYw",
  authDomain: "agenda-virtual-48e4e.firebaseapp.com",
  projectId: "agenda-virtual-48e4e",
  storageBucket: "agenda-virtual-48e4e.firebasestorage.app",
  messagingSenderId: "937291727034",
  appId: "1:937291727034:web:bad8557b864e3de6190283"
};

// Singleton para evitar errores de re-inicialización y XrayWrapper
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Persistencia robusta
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Persistence error:", err);
});

export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
