import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { app } from "../firebase/config";

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const loginWithEmail = async (email: any, password: any) => {
  console.log("Iniciando sesión para:", email);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Error detallado en login:", error.code, error.message);
    throw error;
  }
};

export const registerUser = async (email: any, password: any) => {
  console.log("Iniciando registro para:", email);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Error detallado en registro:", error.code, error.message);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error en Google Sign-In:", error.code, error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};
