import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../firebase';

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred during sign in' 
    };
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred during sign out' 
    };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Check if user is admin (you can customize this based on your needs)
export const isAdmin = (user: User | null): boolean => {
  // This is a simple check. In a real app, you might want to check a custom claim
  // or a specific field in the user's document in Firestore
  const adminEmails = ['kevin@email.com', 'admin@email.com']; // Replace with your admin email(s)
  return !!user && adminEmails.includes(user.email || '');
};
