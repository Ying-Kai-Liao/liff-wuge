import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';

// Generic function to get all documents from a collection
export async function getCollection<T>(collectionName: string): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
}

// Get a document by ID
export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  } else {
    return null;
  }
}

// Get documents by field value
export async function getDocumentsByField<T>(
  collectionName: string, 
  field: string, 
  value: any
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, where(field, '==', value));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
}

// Add a new document
export async function addDocument<T extends DocumentData>(
  collectionName: string, 
  data: T
): Promise<string> {
  const collectionRef = collection(db, collectionName);
  const docRef = await addDoc(collectionRef, data);
  return docRef.id;
}

// Update a document
export async function updateDocument<T extends DocumentData>(
  collectionName: string, 
  docId: string, 
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data as DocumentData);
}

// Delete a document
export async function deleteDocument(
  collectionName: string, 
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}
