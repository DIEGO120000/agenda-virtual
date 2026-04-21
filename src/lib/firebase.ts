import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBvNceB2K1Nzva6HZQcWRlcjoXLoddqYw",
  authDomain: "agenda-virtual-48e4e.firebaseapp.com",
  projectId: "agenda-virtual-48e4e",
  storageBucket: "agenda-virtual-48e4e.firebasestorage.app",
  messagingSenderId: "937291727034",
  appId: "1:937291727034:web:bad8557b864e3de6190283"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
