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

const sanitizeData = (collectionName: string, data: any, isUpdate = false) => {
  const sanitized = { ...data };
  
  // Limpieza universal contra undefined (regla estricta de Firebase)
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      sanitized[key] = "Pendiente";
    }
  });

  // Solo aplicar valores por defecto si NO es una actualización
  if (collectionName === 'horario' && !isUpdate) {
    return {
      dia: sanitized.dia || "Pendiente",
      hora: sanitized.hora || sanitized.hora_inicio || "Pendiente",
      horaFin: sanitized.horaFin || sanitized.hora_fin || "Pendiente",
      actividad: sanitized.actividad || sanitized.nombre || "Sin Nombre",
      modalidad: sanitized.modalidad || "Pendiente",
      tipo: sanitized.tipo || "clase",
      profesor: sanitized.profesor || "Pendiente",
      semiAnchorWeek: sanitized.semiAnchorWeek || null,
      semiAnchorState: sanitized.semiAnchorState || null,
      ...sanitized
    };
  }

  return sanitized;
};

export const saveData = async (collectionName: string, data: any) => {
  try {
    const colRef = getUserCollectionRef(collectionName);
    const sanitized = sanitizeData(collectionName, data, false);
    const docRef = await addDoc(colRef, {
      ...sanitized,
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
    const sanitized = sanitizeData(collectionName, updates, true);
    await updateDoc(docRef, sanitized);
  } catch (error) {
    throw error;
  }
};
