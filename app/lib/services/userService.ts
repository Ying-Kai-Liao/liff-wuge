import { UserProfile, InquiryItem } from '../../types';
import { 
  getDocument, 
  updateDocument 
} from './firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'users';

// Get user profile by ID
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return getDocument<UserProfile>(COLLECTION_NAME, userId);
}

// Create or update user profile
export async function saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, COLLECTION_NAME, userId);
  
  // Check if user exists
  const userDoc = await getDocument<UserProfile>(COLLECTION_NAME, userId);
  
  if (userDoc) {
    // Update existing user
    await updateDocument<UserProfile>(COLLECTION_NAME, userId, profile);
  } else {
    // Create new user with empty inquiry list
    await setDoc(userRef, {
      userId,
      inquiryList: [],
      ...profile
    });
  }
}

// Add item to inquiry list
export async function addToInquiry(
  userId: string, 
  item: Omit<InquiryItem, 'addedAt'>
): Promise<void> {
  const user = await getUserProfile(userId);
  
  if (user) {
    const inquiryList = [...user.inquiryList];
    
    // Check if item already exists
    const existingIndex = inquiryList.findIndex(i => i.planId === item.planId);
    
    if (existingIndex === -1) {
      // Add new item with timestamp
      inquiryList.push({
        ...item,
        addedAt: Date.now()
      });
      
      await updateDocument<UserProfile>(COLLECTION_NAME, userId, { inquiryList });
    }
  }
}

// Remove item from inquiry list
export async function removeFromInquiry(userId: string, planId: string): Promise<void> {
  const user = await getUserProfile(userId);
  
  if (user) {
    const inquiryList = user.inquiryList.filter(item => item.planId !== planId);
    await updateDocument<UserProfile>(COLLECTION_NAME, userId, { inquiryList });
  }
}

// Clear inquiry list
export async function clearInquiry(userId: string): Promise<void> {
  await updateDocument<UserProfile>(COLLECTION_NAME, userId, { inquiryList: [] });
}
