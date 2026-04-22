import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

// Ruta segmentada: usuarios/{uid}/{coleccion}/{docId}
const getUserCollectionRef = (collectionName: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated.");
  return collection(db, 'usuarios', user.uid, collectionName);
};

export const saveData = async (collectionName: string, data: any) => {
  try {
    const colRef = getUserCollectionRef(collectionName);
    const docRef = await addDoc(colRef, {
      ...data,
      userId: auth.currentUser?.uid, // Redundancia de seguridad
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const subscribeToMyData = (collectionName: string, callback: (data: any[]) => void) => {
  try {
    const colRef = getUserCollectionRef(collectionName);
    return onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    });
  } catch (error) {
    console.error(`Error subscribing to ${collectionName}:`, error);
    return () => {};
  }
};

export const getMyData = async (collectionName: string) => {
  try {
    const colRef = getUserCollectionRef(collectionName);
    const querySnapshot = await getDocs(colRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
};

export const deleteMyData = async (collectionName: string, docId: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const docRef = doc(db, 'usuarios', user.uid, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    throw error;
  }
};

export const updateMyData = async (collectionName: string, docId: string, updates: any) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const docRef = doc(db, 'usuarios', user.uid, collectionName, docId);
    await updateDoc(docRef, updates);
  } catch (error) {
    throw error;
  }
};
