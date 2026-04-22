import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBMEIOCeYCV4qI2bJldOqcGawxNCeZtyZo",
  authDomain: "agenda-virtual-v2.firebaseapp.com",
  projectId: "agenda-virtual-v2",
  storageBucket: "agenda-virtual-v2.firebasestorage.app",
  messagingSenderId: "534197561949",
  appId: "1:534197561949:web:5c9ec9c5e48642ea27bbb4",
  measurementId: "G-LM3JB4M9Y3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
