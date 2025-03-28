import { UserProfile, CartItem } from '../../types';
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
    // Create new user with empty cart
    await setDoc(userRef, {
      userId,
      cart: [],
      ...profile
    });
  }
}

// Add item to cart
export async function addToCart(
  userId: string, 
  item: Omit<CartItem, 'addedAt'>
): Promise<void> {
  const user = await getUserProfile(userId);
  
  if (user) {
    const cart = [...user.cart];
    
    // Check if item already exists
    const existingIndex = cart.findIndex(i => i.planId === item.planId);
    
    if (existingIndex === -1) {
      // Add new item with timestamp
      cart.push({
        ...item,
        addedAt: new Date()
      });
      
      await updateDocument<UserProfile>(COLLECTION_NAME, userId, { cart });
    }
  }
}

// Update quantity of an item in the cart
export async function updateCartQuantity(
  userId: string, 
  planId: string, 
  quantity: number
): Promise<void> {
  const user = await getUserProfile(userId);
  
  if (user) {
    const cart = [...user.cart];
    
    // Find the item
    const existingIndex = cart.findIndex(i => i.planId === planId);
    
    if (existingIndex !== -1) {
      // Update quantity
      cart[existingIndex] = {
        ...cart[existingIndex],
        quantity
      };
      
      await updateDocument<UserProfile>(COLLECTION_NAME, userId, { cart });
    }
  }
}

// Remove item from cart
export async function removeFromCart(userId: string, planId: string): Promise<void> {
  const user = await getUserProfile(userId);
  
  if (user) {
    const cart = user.cart.filter(item => item.planId !== planId);
    await updateDocument<UserProfile>(COLLECTION_NAME, userId, { cart });
  }
}

// Clear cart
export async function clearCart(userId: string): Promise<void> {
  await updateDocument<UserProfile>(COLLECTION_NAME, userId, { cart: [] });
}
