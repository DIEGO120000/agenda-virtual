import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

export const saveData = async (collectionName: string, data: any) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User must be authenticated to save data.");
  }

  const dataWithUser = {
    ...data,
    userId: user.uid,
    createdAt: new Date()
  };

  try {
    const docRef = await addDoc(collection(db, collectionName), dataWithUser);
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getMyData = async (collectionName: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User must be authenticated to fetch data.");
  }

  try {
    const q = query(
      collection(db, collectionName), 
      where("userId", "==", user.uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
};
