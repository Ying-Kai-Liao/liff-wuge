'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { InquiryItem } from '../types';
import { useLiff } from '../components/LiffProvider';
import { 
  getUserProfile, 
  addToInquiry, 
  removeFromInquiry, 
  clearInquiry 
} from '../lib/services/userService';
import { getPlanById } from '../lib/services/planService';
import { getCarrierById } from '../lib/services/carrierService';
import { getCountryById } from '../lib/services/countryService';

// Create context type
type InquiryContextType = {
  inquiryList: InquiryItem[];
  isLoading: boolean;
  error: string | null;
  addPlanToInquiry: (planId: string, carrierId: string, countryId: string) => Promise<void>;
  removePlanFromInquiry: (planId: string) => Promise<void>;
  clearInquiryList: () => Promise<void>;
  sendInquiryToChat: () => Promise<boolean>;
};

// Create context with default values
const InquiryContext = createContext<InquiryContextType>({
  inquiryList: [],
  isLoading: false,
  error: null,
  addPlanToInquiry: async () => {},
  removePlanFromInquiry: async () => {},
  clearInquiryList: async () => {},
  sendInquiryToChat: async () => false
});

// Provider component
export function InquiryProvider({ children }: { children: ReactNode }) {
  const inquiryHook = useInquiryHook();
  
  return (
    <InquiryContext.Provider value={inquiryHook}>
      {children}
    </InquiryContext.Provider>
  );
}

// Hook to use the inquiry context
export function useInquiry() {
  return useContext(InquiryContext);
}

// Implementation of the inquiry hook
function useInquiryHook(): InquiryContextType {
  const { liff } = useLiff();
  const [inquiryList, setInquiryList] = useState<InquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user profile and inquiry list when LIFF is initialized
  useEffect(() => {
    async function loadUserData() {
      if (liff && liff.isLoggedIn && liff.isLoggedIn()) {
        try {
          setIsLoading(true);
          const profile = await liff.getProfile();
          setUserId(profile.userId);
          
          const userProfile = await getUserProfile(profile.userId);
          if (userProfile) {
            setInquiryList(userProfile.inquiryList || []);
          }
          setError(null);
        } catch (err) {
          console.error('Error loading user data:', err);
          setError('Failed to load your inquiry list');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [liff]);

  // Add a plan to the inquiry list
  const addPlanToInquiry = async (planId: string, carrierId: string, countryId: string) => {
    if (!userId) {
      setError('Please log in to add items to your inquiry list');
      return;
    }

    try {
      const newItem: Omit<InquiryItem, 'addedAt'> = {
        planId,
        carrierId,
        countryId
      };

      // Optimistically update UI
      const tempItem: InquiryItem = {
        ...newItem,
        addedAt: Date.now()
      };
      
      setInquiryList(prev => {
        // Check if item already exists
        if (prev.some(item => item.planId === planId)) {
          return prev;
        }
        return [...prev, tempItem];
      });

      // Update in database
      await addToInquiry(userId, newItem);
    } catch (err) {
      console.error('Error adding to inquiry:', err);
      setError('Failed to add item to inquiry list');
      
      // Revert optimistic update on error
      setInquiryList(prev => prev.filter(item => item.planId !== planId));
    }
  };

  // Remove a plan from the inquiry list
  const removePlanFromInquiry = async (planId: string) => {
    if (!userId) return;

    try {
      // Optimistically update UI
      setInquiryList(prev => prev.filter(item => item.planId !== planId));

      // Update in database
      await removeFromInquiry(userId, planId);
    } catch (err) {
      console.error('Error removing from inquiry:', err);
      setError('Failed to remove item from inquiry list');
      
      // Revert optimistic update on error
      setInquiryList([...inquiryList]);
    }
  };

  // Clear the inquiry list
  const clearInquiryList = async () => {
    if (!userId) return;

    try {
      setInquiryList([]);

      // Update in database
      await clearInquiry(userId);
    } catch (err) {
      console.error('Error clearing inquiry:', err);
      setError('Failed to clear inquiry list');
      
      // Revert optimistic update on error
      setInquiryList([...inquiryList]);
    }
  };

  // Send the inquiry to LINE chat
  const sendInquiryToChat = async () => {
    if (!liff || !liff.isInClient || !liff.isInClient() || inquiryList.length === 0) {
      setError('Cannot send inquiry. Please make sure you have items in your list and are using LINE app.');
      return false;
    }

    try {
      // Fetch full details for each inquiry item
      const detailedItems = await Promise.all(
        inquiryList.map(async (item) => {
          const plan = await getPlanById(item.planId);
          const carrier = await getCarrierById(item.carrierId);
          const country = await getCountryById(item.countryId);
          
          return { plan, carrier, country };
        })
      );

      // Format the message
      let message = "📱 eSIM 詢問清單：\n\n";
      
      detailedItems.forEach((item, index) => {
        if (item.plan && item.carrier && item.country) {
          message += `${index + 1}. ${item.country.name} - ${item.carrier.name}\n`;
          message += `   ${item.plan.days}天 / ${item.plan.dataAmount} / ${item.plan.price}${item.plan.currency}\n`;
          if (item.plan.notes) {
            message += `   備註: ${item.plan.notes}\n`;
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

      // Clear the inquiry list after sending
      await clearInquiryList();
      
      return true;
    } catch (err) {
      console.error('Error sending inquiry to chat:', err);
      setError('Failed to send inquiry to chat');
      return false;
    }
  };

  return {
    inquiryList,
    isLoading,
    error,
    addPlanToInquiry,
    removePlanFromInquiry,
    clearInquiryList,
    sendInquiryToChat
  };
}
