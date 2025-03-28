'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CartItem } from '../types';
import { useLiff } from '../components/LiffProvider';
import { 
  getUserProfile, 
  addToCart, 
  removeFromCart, 
  clearCart as clearUserCart, 
  updateCartQuantity
} from '../lib/services/userService';
import { getPlanById } from '../lib/services/planService';

// Create context type
type CartContextType = {
  cart: CartItem[];
  isLoading: boolean;
  error: string | null;
  addPlanToCart: (planId: string, quantity: number) => Promise<void>;
  removePlanFromCart: (planId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  updatePlanQuantity: (planId: string, quantity: number) => Promise<void>;
  sendCartToChat: () => Promise<boolean>;
};

// Create context with default values
const CartContext = createContext<CartContextType>({
  cart: [],
  isLoading: false,
  error: null,
  addPlanToCart: async () => {},
  removePlanFromCart: async () => {},
  clearCart: async () => {},
  updatePlanQuantity: async () => {},
  sendCartToChat: async () => false
});

// Implementation of the cart hook
function useCartHook(): CartContextType {
  const { liff } = useLiff();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user profile and cart when LIFF is initialized
  useEffect(() => {
    async function loadUserData() {
      if (liff && liff.isLoggedIn && liff.isLoggedIn()) {
        try {
          setIsLoading(true);
          const profile = await liff.getProfile();
          setUserId(profile.userId);
          
          const userProfile = await getUserProfile(profile.userId);
          if (userProfile) {
            setCart(userProfile.cart || []);
          }
          setError(null);
        } catch (err) {
          console.error('Error loading user data:', err);
          setError('Failed to load your cart');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [liff]);

  // Add a plan to the cart
  const addPlanToCart = async (planId: string, quantity: number) => {
    if (!userId) {
      setError('Please log in to add items to your cart');
      return;
    }

    try {
      const newItem: Omit<CartItem, 'addedAt'> = {
        planId,
        quantity
      };

      // Optimistically update UI
      const tempItem: CartItem = {
        ...newItem,
        addedAt: new Date()
      };
      
      setCart(prev => {
        // Check if item already exists
        if (prev.some(item => item.planId === planId)) {
          return prev;
        }
        return [...prev, tempItem];
      });

      // Update in database
      await addToCart(userId, newItem);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart');
      
      // Revert optimistic update on error
      setCart(prev => prev.filter(item => item.planId !== planId));
    }
  };

  // Remove a plan from the cart
  const removePlanFromCart = async (planId: string) => {
    if (!userId) return;

    try {
      // Optimistically update UI
      setCart(prev => prev.filter(item => item.planId !== planId));

      // Update in database
      await removeFromCart(userId, planId);
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart');
      
      // Revert optimistic update on error
      const oldCart = [...cart];
      setCart(oldCart);
    }
  };

  // Update quantity of a plan in the cart
  const updatePlanQuantity = async (planId: string, quantity: number) => {
    if (!userId) return;

    try {
      // Optimistically update UI
      setCart(prev =>
        prev.map(item =>
          item.planId === planId ? { ...item, quantity } : item
        )
      );

      // Update in database
      await updateCartQuantity(userId, planId, quantity);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity');
      
      // Revert optimistic update on error
      const oldCart = [...cart];
      setCart(oldCart);
    }
  };

  // Clear the cart
  const clearCart = async () => {
    if (!userId) return;

    try {
      const oldCart = [...cart];
      setCart([]);

      // Update in database
      await clearUserCart(userId);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart');
      
      // Revert optimistic update on error
      const oldCart = [...cart];
      setCart(oldCart);
    }
  };

  // Send the cart to LINE chat
  const sendCartToChat = async () => {
    if (!liff || !liff.isInClient || !liff.isInClient() || cart.length === 0) {
      setError('Cannot send cart. Please make sure you have items in your list and are using LINE app.');
      return false;
    }

    try {
      // Fetch full details for each cart item
      const detailedItems = await Promise.all(
        cart.map(async (item) => {
          const plan = await getPlanById(item.planId);
          
          return { plan, quantity: item.quantity };
        })
      );

      // Format the message
      let message = "📱 eSIM 詢問清單：\n\n";
      
      detailedItems.forEach((item, index) => {
        if (item.plan) {
          message += `${index + 1}. ${item.plan.country} - ${item.plan.carrier}\n`;
          message += `   ${item.plan.duration_days}天 / ${item.plan.data_per_day || item.plan.total_data} / ${item.plan.price}${item.plan.currency || 'TWD'}\n`;
          if (item.plan.notes && item.plan.notes.length > 0) {
            message += `   備註: ${item.plan.notes.join(', ')}\n`;
          }
          message += '\n';
        }
      });
      
      message += "請問以上方案有什麼問題想詢問的嗎？";

      // Send message back to LINE chat
      await liff.sendMessages([
        {
          type: 'text',
          text: message
        }
      ]);

      // Clear the cart after sending
      await clearCart();
      
      return true;
    } catch (err) {
      console.error('Error sending cart to chat:', err);
      setError('Failed to send cart to chat');
      return false;
    }
  };

  return {
    cart,
    isLoading,
    error,
    addPlanToCart,
    removePlanFromCart,
    clearCart,
    updatePlanQuantity,
    sendCartToChat
  };
}

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const cartHook = useCartHook();
  
  return (
    <CartContext.Provider value={cartHook}>
      {children}
    </CartContext.Provider>
  );
}

// Hook to use the cart context
export function useCart() {
  return useContext(CartContext);
}
