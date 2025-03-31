import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app as firebaseApp } from './firebase';

// Initialize Firebase Storage
const storage = getStorage(firebaseApp);

/**
 * Upload a file to Firebase Storage
 * @param file The file to upload
 * @param path The path to store the file at (e.g., 'menus/esim-menu.pdf')
 * @returns Promise with the download URL
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    // Create a storage reference
    const storageRef = ref(storage, path);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Delete a file from Firebase Storage
 * @param url The URL of the file to delete
 */
export const deleteFile = async (url: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const decodedUrl = decodeURIComponent(url);
    const startIndex = decodedUrl.indexOf('/o/') + 3;
    const endIndex = decodedUrl.indexOf('?');
    const path = decodedUrl.substring(startIndex, endIndex);
    
    // Create a reference to the file
    const fileRef = ref(storage, path);
    
    // Delete the file
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};
