"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { CartItem } from "../types";
import { useLiff } from "../components/LiffProvider";
import {
  getUserProfile,
  addToCart,
  removeFromCart,
  clearCart as clearUserCart,
  updateCartQuantity,
} from "../lib/services/userService";
import { getPlanById } from "../lib/services/planService";

// Create context type
type CartContextType = {
  cart: CartItem[];
  isLoading: boolean;
  error: string | null;
  addPlanToCart: (planId: string, quantity: number) => Promise<void>;
  removePlanFromCart: (planId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  updatePlanQuantity: (planId: string, quantity: number) => Promise<void>;
  sendCartToChat: (
    userDetails?: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      note?: string;
    }
  ) => Promise<boolean>;
  sendTemplateDirectly: () => Promise<boolean>;
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
  sendCartToChat: async () => false,
  sendTemplateDirectly: async () => false,
});

// Implementation of the cart hook
function useCartHook(): CartContextType {
  const { liff } = useLiff();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile and cart when LIFF is initialized
  useEffect(() => {
    async function loadUserData() {
      if (liff && liff.isLoggedIn && liff.isLoggedIn()) {
        try {
          setIsLoading(true);
          const profile = await liff.getProfile();
          setUserId(profile.userId);

          const userProfileData = await getUserProfile(profile.userId);
          setUserProfile(userProfileData);
          if (userProfileData) {
            setCart(userProfileData.cart || []);
          }
          setError(null);
        } catch (err) {
          console.error("Error loading user data:", err);
          setError("Failed to load your cart");
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
      setError("Please log in to add items to your cart");
      return;
    }

    try {
      const newItem: Omit<CartItem, "addedAt"> = {
        planId,
        quantity,
      };

      // Optimistically update UI
      const tempItem: CartItem = {
        ...newItem,
        addedAt: new Date(),
      };

      setCart((prev) => {
        // Check if item already exists
        if (prev.some((item) => item.planId === planId)) {
          return prev;
        }
        return [...prev, tempItem];
      });

      // Update in database
      await addToCart(userId, newItem);
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Failed to add item to cart");

      // Revert optimistic update on error
      setCart((prev) => prev.filter((item) => item.planId !== planId));
    }
  };

  // Remove a plan from the cart
  const removePlanFromCart = async (planId: string) => {
    if (!userId) return;

    try {
      // Optimistically update UI
      setCart((prev) => prev.filter((item) => item.planId !== planId));

      // Update in database
      await removeFromCart(userId, planId);
    } catch (err) {
      console.error("Error removing from cart:", err);
      setError("Failed to remove item from cart");

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
      setCart((prev) =>
        prev.map((item) =>
          item.planId === planId ? { ...item, quantity } : item
        )
      );

      // Update in database
      await updateCartQuantity(userId, planId, quantity);
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("Failed to update quantity");

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
      console.error("Error clearing cart:", err);
      setError("Failed to clear cart");

      // Revert optimistic update on error
      const oldCart = [...cart];
      setCart(oldCart);
    }
  };

  // Send the cart to LINE chat
  const sendCartToChat = async (
    userDetails?: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      note?: string;
    }
  ) => {
    if (!liff || !liff.isInClient || !liff.isInClient() || cart.length === 0) {
      setError(
        "Cannot send cart. Please make sure you have items in your list and are using LINE app."
      );
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

      // Calculate total price
      const totalPrice = detailedItems.reduce((sum, item) => {
        if (item.plan) {
          return sum + item.plan.price * item.quantity;
        }
        return sum;
      }, 0);

      // Get user profile for details
      const profile = await liff.getProfile();

      // Combine stored user profile with form details
      const combinedUserDetails = {
        ...userProfile,
        ...userDetails, // Form details override stored profile
      };

      // Import the Flex Message template
      const orderTemplate = require("../cart/liff-template-order.json");

      // Create a deep copy of the template to avoid modifying the original
      const flexMessage = JSON.parse(JSON.stringify(orderTemplate));

      // Find the order details container (first box in body contents)
      const orderDetailsContainer = flexMessage.body.contents[0];

      // Find the items container within the order details
      const itemsContainer = orderDetailsContainer.contents[2].contents;

      // Clear the sample items, keeping only the total price box at the end
      // The total is the last item after separators
      const totalPriceBox = itemsContainer[itemsContainer.length - 1];
      itemsContainer.length = 0;

      // Add each plan as an item in the flex message
      detailedItems.forEach((item, index) => {
        if (item.plan) {
          // Add the item
          itemsContainer.push({
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: `${item.plan.country} - ${item.plan.carrier} ${item.plan.duration_days}天`,
                size: "sm",
                color: "#333333",
                flex: 5,
              },
              {
                type: "text",
                text: `x${item.quantity}`,
                size: "sm",
                color: "#666666",
                align: "end",
                flex: 1,
              },
            ],
          });

          // Add separator if not the last item
          if (index < detailedItems.length - 1) {
            itemsContainer.push({
              type: "separator",
              margin: "sm",
            });
          }
        }
      });

      // Add separator before total
      itemsContainer.push({
        type: "separator",
        margin: "md",
      });

      // Add the total price box back
      itemsContainer.push(totalPriceBox);

      // Update the total price
      if (totalPriceBox && totalPriceBox.contents && totalPriceBox.contents.length > 1) {
        totalPriceBox.contents[1].text = `NT$${totalPrice}`;
      }

      // Find the shipping details container (third box in body contents)
      const shippingDetailsContainer = flexMessage.body.contents[2].contents;

      // Create a new array to hold only the shipping details that have values
      const filteredShippingDetails = [];

      // Only include address if it's provided
      if (combinedUserDetails?.address) {
        filteredShippingDetails.push({
          type: "box",
          layout: "baseline",
          contents: [
            {
              type: "text",
              text: "地址",
              color: "#aaaaaa",
              size: "sm",
              flex: 1,
            },
            {
              type: "text",
              text: combinedUserDetails.address,
              wrap: true,
              color: "#666666",
              size: "sm",
              flex: 5,
            },
          ],
        });
      }

      // Only include phone if it's provided
      if (combinedUserDetails?.phone) {
        filteredShippingDetails.push({
          type: "box",
          layout: "baseline",
          margin: filteredShippingDetails.length > 0 ? "md" : undefined,
          contents: [
            {
              type: "text",
              text: "電話",
              color: "#aaaaaa",
              size: "sm",
              flex: 1,
            },
            {
              type: "text",
              text: combinedUserDetails.phone,
              wrap: true,
              color: "#666666",
              size: "sm",
              flex: 5,
            },
          ],
        });
      }

      // Only include email if it's provided
      if (combinedUserDetails?.email) {
        filteredShippingDetails.push({
          type: "box",
          layout: "baseline",
          margin: filteredShippingDetails.length > 0 ? "md" : undefined,
          contents: [
            {
              type: "text",
              text: "Email",
              color: "#aaaaaa",
              size: "sm",
              flex: 1,
            },
            {
              type: "text",
              text: combinedUserDetails.email,
              wrap: true,
              color: "#666666",
              size: "sm",
              flex: 5,
            },
          ],
        });
      }

      // Only include note if it's provided
      if (combinedUserDetails?.note) {
        filteredShippingDetails.push({
          type: "box",
          layout: "baseline",
          margin: filteredShippingDetails.length > 0 ? "md" : undefined,
          contents: [
            {
              type: "text",
              text: "備註",
              color: "#aaaaaa",
              size: "sm",
              flex: 1,
            },
            {
              type: "text",
              text: combinedUserDetails.note,
              wrap: true,
              color: "#666666",
              size: "sm",
              flex: 5,
            },
          ],
        });
      }

      // Replace the shipping details with our filtered list
      if (shippingDetailsContainer) {
        // If we have no shipping details, hide the entire shipping section
        if (filteredShippingDetails.length === 0) {
          // Remove the shipping section (both title and container)
          flexMessage.body.contents = flexMessage.body.contents.filter(
            (content: any, index: number) => index !== 1 && index !== 2
          );
        } else {
          // Replace the shipping details with our filtered list
          flexMessage.body.contents[2].contents = filteredShippingDetails;
        }
      }

      // Send flex message to LINE chat
      try {
        await liff.sendMessages([
          {
            type: "flex",
            altText: "您的eSIM訂單明細",
            contents: flexMessage,
          },
        ]);
      } catch (error) {
        console.error("Error sending flex message:", error);
        throw new Error("Failed to send message to LINE chat");
      }

      // Clear the cart after sending
      await clearCart();

      return true;
    } catch (err) {
      console.error("Error sending cart to chat:", err);
      setError("Failed to send cart to chat");
      return false;
    }
  };

  // Send the template directly without modifications
  const sendTemplateDirectly = async () => {
    if (!liff || !liff.isInClient || !liff.isInClient()) {
      setError(
        "Cannot send template. Please make sure you are using LINE app."
      );
      return false;
    }

    try {
      // Import the Flex Message template
      const orderTemplate = require("../cart/liff-template-order.json");

      // Send the template as is without any modifications
      await liff.sendMessages([
        {
          type: "flex",
          altText: "this is a flex message",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "請確認以上訂單內容後，再點選下方按鈕完成訂購。",
                  wrap: true,
                  color: "#666666",
                  size: "sm",
                  margin: "md",
                },
              ],
            },
          },
        },
      ]);

      return true;
    } catch (err) {
      console.error("Error sending template to chat:", err);
      setError("Failed to send template to chat");
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
    sendCartToChat,
    sendTemplateDirectly,
  };
}

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const cartHook = useCartHook();

  return (
    <CartContext.Provider value={cartHook}>{children}</CartContext.Provider>
  );
}

// Hook to use the cart context
export function useCart() {
  return useContext(CartContext);
}
