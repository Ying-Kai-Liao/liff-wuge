'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { Plan, SimType } from '../types';
import { useLiff } from '../components/LiffProvider';
import TravelLayout from '../components/TravelLayout';
import Link from 'next/link';

type DetailedCartItem = {
  planId: string;
  quantity: number;
  addedAt: Date;
  plan: Plan | null;
};

type UserDetails = {
  name: string;
  email: string;
  phone: string;
  address?: string;
  note: string;
};

export default function CartPage() {
  const { liff } = useLiff();
  const { cart, removePlanFromCart, clearCart, updatePlanQuantity, sendCartToChat } = useCart();
  const [detailedCart, setDetailedCart] = useState<DetailedCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<'cart' | 'details'>('cart');
  
  // User details form
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    email: '',
    phone: '',
    address: '',
    note: ''
  });
  
  // Track which types of SIMs are in the cart
  const [hasEsim, setHasEsim] = useState(false);
  const [hasPhysical, setHasPhysical] = useState(false);

  useEffect(() => {
    async function loadDetailedCart() {
      if (cart.length === 0) {
        setDetailedCart([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const detailed = await Promise.all(
          cart.map(async (item) => {
            // Fetch plan details
            const planResponse = await fetch(`/api/plans/${item.planId}`);
            const plan = planResponse.ok ? await planResponse.json() : null;
            
            return {
              ...item,
              plan
            };
          })
        );
        
        // Sort by added time (newest first)
        const sorted = detailed.sort((a, b) => 
          b.addedAt.getTime() - a.addedAt.getTime()
        );
        
        // Check if there are eSIMs or physical SIMs
        const hasEsimPlans = sorted.some(item => item.plan?.sim_type === 'esim');
        const hasPhysicalPlans = sorted.some(item => item.plan?.sim_type === 'physical');
        
        setHasEsim(hasEsimPlans);
        setHasPhysical(hasPhysicalPlans);
        setDetailedCart(sorted);
        setError(null);
      } catch (err) {
        console.error('Error loading cart details:', err);
        setError('Failed to load cart details');
      } finally {
        setIsLoading(false);
      }
    }

    loadDetailedCart();
  }, [cart]);

  const handleRemoveFromCart = async (planId: string) => {
    try {
      await removePlanFromCart(planId);
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart');
    }
  };

  const handleUpdateQuantity = async (planId: string, quantity: number) => {
    try {
      await updatePlanQuantity(planId, quantity);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProceedToDetails = () => {
    setCurrentStep('details');
  };

  const handleBackToCart = () => {
    setCurrentStep('cart');
  };

  const handleSubmitOrder = async () => {
    if (!liff) {
      setError('LIFF not initialized');
      return;
    }
    
    if (!liff.isInClient()) {
      setError('此功能僅在 LINE App 內可用');
      return;
    }

    try {
      setIsSending(true);
      
      // Format the message with cart items and user details
      const cartItems = detailedCart.map(item => {
        if (!item.plan) return null;
        
        return {
          plan: item.plan,
          quantity: item.quantity
        };
      }).filter(Boolean);
      
      let message = "📱 eSIM 訂單：\n\n";
      
      // Add cart items
      cartItems.forEach((item, index) => {
        if (item && item.plan) {
          message += `${index + 1}. ${item.plan.country} - ${item.plan.carrier}\n`;
          message += `   ${item.plan.duration_days}天 / ${item.plan.plan_type === 'daily' ? `每日${item.plan.data_per_day}` : `總共${item.plan.total_data}`}\n`;
          message += `   ${item.plan.price}${item.plan.currency || 'TWD'} x ${item.quantity} = ${item.plan.price * item.quantity}${item.plan.currency || 'TWD'}\n`;
          message += `   類型: ${item.plan.sim_type === 'esim' ? 'eSIM' : '實體 SIM'}\n\n`;
        }
      });
      
      // Calculate total
      const total = cartItems.reduce((sum, item) => {
        if (item && item.plan) {
          return sum + (item.plan.price * item.quantity);
        }
        return sum;
      }, 0);
      
      message += `總計: ${total} TWD\n\n`;
      
      // Add user details
      message += "客戶資料:\n";
      message += `姓名: ${userDetails.name}\n`;
      message += `電話: ${userDetails.phone}\n`;
      message += `Email: ${userDetails.email}\n`;
      
      if (hasPhysical && userDetails.address) {
        message += `地址: ${userDetails.address}\n`;
      }
      
      if (userDetails.note) {
        message += `\n備註: ${userDetails.note}\n`;
      }
      
      // Send message back to LINE chat
      await liff.sendMessages([
        {
          type: 'text',
          text: message
        }
      ]);
      
      // Clear the cart after sending
      await clearCart();
      
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error sending order to chat:', err);
      setError('傳送失敗，請稍後再試');
    } finally {
      setIsSending(false);
    }
  };

  const calculateTotal = () => {
    return detailedCart.reduce((total, item) => {
      if (item.plan) {
        return total + (item.plan.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const renderCartContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 mb-4 rounded-full bg-blue-200"></div>
            <div className="h-4 w-48 bg-blue-200 rounded"></div>
            <div className="mt-2 h-3 w-32 bg-blue-100 rounded"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p>{error}</p>
        </div>
      );
    }

    if (detailedCart.length === 0) {
      return (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-lg mb-4 text-center">
          <div className="text-4xl mb-3">🛒</div>
          <h3 className="text-xl font-semibold mb-2">您的購物車目前是空的</h3>
          <p className="mb-4">瀏覽國家方案並將您感興趣的選項加入購物車</p>
          <Link 
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            探索 eSIM 方案
          </Link>
        </div>
      );
    }

    return (
      <>
        <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center">
          <div className="text-blue-700 text-xl mr-3">💡</div>
          <p className="text-blue-700 text-sm">
            請確認您的購物車內容，然後填寫您的聯絡資訊以完成訂單
          </p>
        </div>
        
        <div className="space-y-4 mb-8">
          {detailedCart.map((item) => (
            <div key={item.planId} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
              {item.plan ? (
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-3xl">{item.plan.country.substring(0, 2)}</div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {item.plan.country}
                          </h3>
                          <div className="text-gray-600 text-sm">
                            {item.plan.carrier}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium mr-2">
                              {item.plan.duration_days}天
                            </div>
                            <div className="font-medium">
                              {item.plan.plan_type === 'daily' ? `每日${item.plan.data_per_day}` : `總共${item.plan.total_data}`}
                            </div>
                          </div>
                          <div className="text-xl font-bold text-blue-700">
                            {item.plan.price} {item.plan.currency || 'TWD'}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`${
                            item.plan.sim_type === 'esim' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          } text-xs px-2 py-1 rounded`}>
                            {item.plan.sim_type === 'esim' ? 'eSIM' : '實體 SIM'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleUpdateQuantity(item.planId, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200"
                          >
                            -
                          </button>
                          <span className="mx-3 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.planId, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 hover:bg-blue-200"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="ml-auto text-lg font-bold text-blue-700">
                          小計: {item.plan.price * item.quantity} {item.plan.currency || 'TWD'}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveFromCart(item.planId)}
                      className="ml-2 flex-shrink-0 h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                      aria-label="移除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-gray-500">方案資料載入失敗</div>
              )}
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>總計</span>
            <span className="text-blue-700">{calculateTotal()} TWD</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <button
            onClick={handleClearCart}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <span className="mr-2">🗑️</span> 清空購物車
          </button>
          
          <button
            onClick={handleProceedToDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <span className="mr-2">👤</span> 填寫聯絡資料
          </button>
        </div>
      </>
    );
  };

  const renderDetailsForm = () => {
    return (
      <>
        <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center">
          <div className="text-blue-700 text-xl mr-3">💡</div>
          <p className="text-blue-700 text-sm">
            請填寫您的聯絡資料，以便我們處理您的訂單
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">聯絡資料</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
              <input
                type="text"
                name="name"
                value={userDetails.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件 *</label>
              <input
                type="email"
                name="email"
                value={userDetails.email}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電話 *</label>
              <input
                type="tel"
                name="phone"
                value={userDetails.phone}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            {hasPhysical && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  地址 {hasPhysical ? '*' : '(選填)'}
                </label>
                <input
                  type="text"
                  name="address"
                  value={userDetails.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required={hasPhysical}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">備註 (選填)</label>
              <textarea
                name="note"
                value={userDetails.note}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold mb-3">訂單摘要</h3>
          
          <div className="space-y-2">
            {detailedCart.map((item) => (
              item.plan && (
                <div key={item.planId} className="flex justify-between">
                  <span>
                    {item.plan.country} {item.plan.sim_type === 'esim' ? '(eSIM)' : '(實體SIM)'} x {item.quantity}
                  </span>
                  <span>{item.plan.price * item.quantity} {item.plan.currency || 'TWD'}</span>
                </div>
              )
            ))}
            
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
              <span>總計</span>
              <span className="text-blue-700">{calculateTotal()} TWD</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <button
            onClick={handleBackToCart}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <span className="mr-2">←</span> 返回購物車
          </button>
          
          <button
            onClick={handleSubmitOrder}
            disabled={isSending || !liff?.isInClient() || !userDetails.name || !userDetails.email || !userDetails.phone || (hasPhysical && !userDetails.address)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
              !userDetails.name || !userDetails.email || !userDetails.phone || (hasPhysical && !userDetails.address)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : !liff?.isInClient()
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : isSending
                    ? 'bg-blue-400 text-white cursor-wait'
                    : sendSuccess
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {sendSuccess ? (
              <>
                <span className="mr-2">✓</span> 已傳送訂單
              </>
            ) : (
              <>
                <span className="mr-2">💬</span> 傳送訂單至 LINE
              </>
            )}
          </button>
        </div>
        
        {!liff?.isInClient() && (
          <div className="mt-4 text-center text-sm text-gray-500">
            傳送至 LINE 對話功能僅在 LINE App 內可用
          </div>
        )}
      </>
    );
  };

  return (
    <TravelLayout 
      title="購物車" 
      showBackButton={true}
      backUrl="/"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {currentStep === 'cart' ? '您的購物車' : '填寫聯絡資料'}
        </h2>
        <p className="text-gray-600">
          {currentStep === 'cart' 
            ? '查看您選擇的 eSIM 方案，並進行結帳'
            : '請填寫您的聯絡資料，以便我們處理您的訂單'
          }
        </p>
      </div>
      
      {currentStep === 'cart' ? renderCartContent() : renderDetailsForm()}
    </TravelLayout>
  );
}
