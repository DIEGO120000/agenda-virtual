import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from "firebase/firestore";
import { db, auth } from "../src/lib/firebase";

export const dbService = {
  // Asegurar que el usuario esté autenticado
  async ensureUser() {
    if (!auth.currentUser) throw new Error("Acceso denegado: Usuario no autenticado");
    return auth.currentUser.uid;
  },

  async addData(collectionName: string, data: any) {
    const uid = await this.ensureUser();
    return addDoc(collection(db, collectionName), {
      ...data,
      ownerUid: uid,
      createdAt: Timestamp.now()
    });
  },

  async getPrivateData(collectionName: string) {
    const uid = await this.ensureUser();
    const q = query(collection(db, collectionName), where("ownerUid", "==", uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateData(collectionName: string, id: string, data: any) {
    await this.ensureUser();
    const docRef = doc(db, collectionName, id);
    return updateDoc(docRef, data);
  },

  async deleteData(collectionName: string, id: string) {
    await this.ensureUser();
    const docRef = doc(db, collectionName, id);
    return deleteDoc(docRef);
  }
};
