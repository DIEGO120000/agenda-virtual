import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAs_example_key", 
  authDomain: "agenda-virtual-itla.firebaseapp.com",
  projectId: "agenda-virtual-itla",
  storageBucket: "agenda-virtual-itla.appspot.com",
  messagingSenderId: "365851499577",
  appId: "1:365851499577:web:8677c724497e283286595a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
