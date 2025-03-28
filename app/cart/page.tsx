'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { Plan, SimType } from '../types';
import { useLiff } from '../components/LiffProvider';
import TravelLayout from '../components/TravelLayout';
import Link from 'next/link';
import { useAdmin } from '../hooks/useAdmin';

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
  const { isAdmin } = useAdmin();
  const { 
    cart, 
    removePlanFromCart, 
    clearCart, 
    updatePlanQuantity, 
    sendCartToChat, 
    sendTemplateDirectly 
  } = useCart();
  const [detailedCart, setDetailedCart] = useState<DetailedCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<'cart' | 'details'>('cart');
  const [messageType, setMessageType] = useState<'flex' | 'text'>('flex');
  
  // Admin discount
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountCode, setDiscountCode] = useState<string>('');

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

  // Get required fields based on cart contents
  const getRequiredFields = () => {
    const required = ['name']; // Name is always required
    
    if (hasEsim) {
      required.push('email');
    }
    
    if (hasPhysical) {
      required.push('phone');
      required.push('address');
    }
    
    return required;
  };

  // Check if form is valid
  const isFormValid = () => {
    const requiredFields = getRequiredFields();
    return requiredFields.every(field => !!userDetails[field as keyof UserDetails]);
  };

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

  const fillTestData = () => {
    setUserDetails({
      name: '測試用戶',
      email: 'test@example.com',
      phone: '0912345678',
      address: '台北市信義區信義路五段7號',
      note: '這是測試訂單，請勿處理'
    });
  };

  const handleProceedToDetails = () => {
    setCurrentStep('details');
  };

  const handleBackToCart = () => {
    setCurrentStep('cart');
  };

  // Send cart as text message (old method)
  const sendCartAsText = async () => {
    if (!liff) {
      setError('LIFF not initialized');
      return false;
    }
    
    if (!liff.isInClient()) {
      setError('此功能僅在 LINE App 內可用');
      return false;
    }

    try {
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
      
      // Add discount if applied
      if (isAdmin && discountPercentage > 0) {
        const discountedTotal = Math.round(total * (1 - discountPercentage / 100));
        message += `折扣: ${discountPercentage}%\n`;
        if (discountCode) {
          message += `折扣代碼: ${discountCode}\n`;
        }
        message += `折扣後總計: ${discountedTotal} TWD\n\n`;
      }
      
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
      
      return true;
    } catch (err) {
      console.error('Error sending order to chat:', err);
      return false;
    }
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
      
      let success = false;
      
      // Use the selected message type
      if (messageType === 'flex') {
        // Use the enhanced sendCartToChat function that utilizes the Flex Message template
        success = await sendCartToChat({
          name: userDetails.name || undefined,
          phone: userDetails.phone || undefined,
          email: userDetails.email || undefined,
          address: userDetails.address || undefined,
          note: userDetails.note || undefined
        });
      } else {
        // Use the text message format
        success = await sendCartAsText();
      }
      
      if (success) {
        setSendSuccess(true);
        setTimeout(() => {
          setSendSuccess(false);
        }, 3000);
      } else {
        setError('傳送失敗，請稍後再試');
      }
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

  const calculateDiscountedTotal = () => {
    const total = calculateTotal();
    if (discountPercentage > 0) {
      return Math.round(total * (1 - discountPercentage / 100));
    }
    return total;
  };

  const renderCartContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006A71]"></div>
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
        <div className="bg-[#F2EFE7] border border-[#9ACBD0] text-[#006A71] p-6 rounded-lg mb-4 text-center">
          <div className="text-4xl mb-3">🛒</div>
          <h3 className="text-xl font-semibold mb-2">您的購物車目前是空的</h3>
          <p className="mb-4">瀏覽國家方案並將您感興趣的選項加入購物車</p>
          <Link 
            href="/"
            className="inline-block px-4 py-2 bg-[#006A71] text-white rounded-lg hover:bg-[#004a4f] transition-colors"
          >
            探索 eSIM 方案
          </Link>
        </div>
      );
    }

    return (
      <>
        <div className="bg-[#F2EFE7] p-4 rounded-lg mb-6 flex items-center">
          <div className="text-[#006A71] text-xl mr-3">💡</div>
          <p className="text-[#006A71] text-sm">
            請確認您的購物車內容，然後填寫您的聯絡資訊以完成訂單
          </p>
        </div>
        
        <div className="space-y-4 mb-8">
          {detailedCart.map((item) => (
            <div key={item.planId} className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#9ACBD0]/30 hover:shadow-md transition-shadow">
              {item.plan ? (
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-3xl">{item.plan.country.substring(0, 2)}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#006A71]">
                            {item.plan.country}
                          </h3>
                          <div className="text-[#48A6A7] text-sm">
                            {item.plan.carrier}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-[#F2EFE7] rounded-lg p-3 mt-3">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <div className="bg-[#9ACBD0] text-[#006A71] rounded-full px-3 py-1 text-sm font-medium mr-2">
                              {item.plan.duration_days}天
                            </div>
                            <div className="font-medium text-[#006A71]">
                              {item.plan.plan_type === 'daily' ? `每日${item.plan.data_per_day}` : `總共${item.plan.total_data}`}
                            </div>
                          </div>
                          <div className="text-xl font-bold text-[#006A71]">
                            {item.plan.price} {item.plan.currency || 'TWD'}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`${
                            item.plan.sim_type === 'esim' ? 'bg-[#9ACBD0]/50 text-[#006A71]' : 'bg-[#48A6A7]/50 text-[#006A71]'
                          } text-xs px-2 py-1 rounded`}>
                            {item.plan.sim_type === 'esim' ? 'eSIM' : '實體 SIM'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleUpdateQuantity(item.planId, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 rounded-full bg-[#F2EFE7] text-[#006A71] hover:bg-[#F2EFE7] border border-[#9ACBD0]"
                          >
                            -
                          </button>
                          <span className="mx-3 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.planId, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-[#F2EFE7] text-[#006A71] hover:bg-[#F2EFE7] border border-[#9ACBD0]"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="ml-auto text-lg font-bold text-[#006A71]">
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
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-[#9ACBD0]/30">
          <div className="flex justify-between mb-2">
            <div className="font-medium">小計</div>
            <div>{calculateTotal()} TWD</div>
          </div>
          
          {isAdmin && (
            <div className="mb-4 pt-2 border-t border-gray-100">
              <div className="flex items-center mb-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  className="w-16 p-1 border border-[#9ACBD0] rounded mr-2 text-center"
                />
                <span className="mr-2">% 折扣</span>
                <input
                  type="text"
                  placeholder="折扣代碼"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1 p-1 border border-[#9ACBD0] rounded"
                />
              </div>
              
              {discountPercentage > 0 && (
                <div className="flex justify-between text-[#006A71] font-medium">
                  <div>折扣後金額</div>
                  <div>{calculateDiscountedTotal()} TWD</div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between text-lg font-bold text-[#006A71] pt-2 border-t border-gray-100">
            <div>總計</div>
            <div>{isAdmin && discountPercentage > 0 ? calculateDiscountedTotal() : calculateTotal()} TWD</div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={handleClearCart}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            清空購物車
          </button>
          
          <button
            onClick={handleProceedToDetails}
            className="px-6 py-2 bg-[#006A71] text-white rounded-lg hover:bg-[#004a4f] transition-colors"
          >
            填寫資料
          </button>
        </div>
      </>
    );
  };

  const renderUserDetailsForm = () => {
    const requiredFields = getRequiredFields();
    
    return (
      <>
        <div className="bg-[#F2EFE7] p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-[#006A71] mb-2">填寫您的聯絡資訊</h3>
          <p className="text-sm text-gray-600">我們將使用這些資訊處理您的訂單</p>
          
          {hasEsim && hasPhysical && (
            <div className="mt-3 p-3 bg-[#fffcf3] rounded-md">
              <div className="flex items-start">
                <div className="text-amber-600 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="font-medium">您的購物車包含 eSIM 和實體 SIM 卡</p>
                  <p>請提供所有必填資訊以完成訂單</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-[#9ACBD0]/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={userDetails.name}
                onChange={handleInputChange}
                className={`w-full p-2 border ${!userDetails.name && 'border-red-300'} rounded-lg focus:ring-2 focus:ring-[#48A6A7] focus:border-transparent`}
                required
              />
              {!userDetails.name && (
                <p className="mt-1 text-sm text-red-500">請輸入姓名</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話 {requiredFields.includes('phone') && <span className="text-red-500">*</span>}
                {hasPhysical && <span className="text-xs text-[#006A71] ml-1">（實體 SIM 卡需要）</span>}
              </label>
              <input
                type="tel"
                name="phone"
                value={userDetails.phone}
                onChange={handleInputChange}
                className={`w-full p-2 border ${requiredFields.includes('phone') && !userDetails.phone && 'border-red-300'} rounded-lg focus:ring-2 focus:ring-[#48A6A7] focus:border-transparent`}
                required={requiredFields.includes('phone')}
              />
              {requiredFields.includes('phone') && !userDetails.phone && (
                <p className="mt-1 text-sm text-red-500">請輸入電話號碼</p>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email {requiredFields.includes('email') && <span className="text-red-500">*</span>}
              {hasEsim && <span className="text-xs text-[#006A71] ml-1">（eSIM 需要）</span>}
            </label>
            <input
              type="email"
              name="email"
              value={userDetails.email}
              onChange={handleInputChange}
              className={`w-full p-2 border ${requiredFields.includes('email') && !userDetails.email && 'border-red-300'} rounded-lg focus:ring-2 focus:ring-[#48A6A7] focus:border-transparent`}
              required={requiredFields.includes('email')}
            />
            {requiredFields.includes('email') && !userDetails.email && (
              <p className="mt-1 text-sm text-red-500">請輸入電子郵件地址</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              地址 {requiredFields.includes('address') && <span className="text-red-500">*</span>}
              {hasPhysical && <span className="text-xs text-[#006A71] ml-1">（實體 SIM 卡需要）</span>}
            </label>
            <input
              type="text"
              name="address"
              value={userDetails.address}
              onChange={handleInputChange}
              className={`w-full p-2 border ${requiredFields.includes('address') && !userDetails.address && 'border-red-300'} rounded-lg focus:ring-2 focus:ring-[#48A6A7] focus:border-transparent`}
              required={requiredFields.includes('address')}
            />
            {requiredFields.includes('address') && !userDetails.address && (
              <p className="mt-1 text-sm text-red-500">請輸入地址</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
            <textarea
              name="note"
              value={userDetails.note}
              onChange={handleInputChange}
              className="w-full p-2 border border-[#9ACBD0] rounded-lg focus:ring-2 focus:ring-[#48A6A7] focus:border-transparent"
              rows={3}
            ></textarea>
          </div>
          
          {isAdmin && (
            <div className="mb-4">
              <button
                onClick={fillTestData}
                className="text-[#48A6A7] hover:text-[#006A71] text-sm"
              >
                填入測試資料
              </button>
            </div>
          )}
          
          {/* <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">訊息格式</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="flex"
                  checked={messageType === 'flex'}
                  onChange={() => setMessageType('flex')}
                  className="mr-2 text-[#006A71]"
                />
                <span>精美訊息</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="text"
                  checked={messageType === 'text'}
                  onChange={() => setMessageType('text')}
                  className="mr-2 text-[#006A71]"
                />
                <span>純文字</span>
              </label>
            </div>
          </div> */}
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={handleBackToCart}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            返回購物車
          </button>
          
          <button
            onClick={handleSubmitOrder}
            disabled={isSending || !isFormValid()}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isSending || !isFormValid()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#006A71] text-white hover:bg-[#004a4f]'
            }`}
          >
            {isSending ? '處理中...' : '送出訂單'}
          </button>
        </div>
      </>
    );
  };

  return (
    <TravelLayout title="購物車">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#006A71] mb-2">購物車</h1>
        <p className="text-gray-600">查看您選擇的 eSIM 方案並完成訂單</p>
      </div>
      
      {sendSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p>訂單已成功發送到您的 LINE 聊天室！</p>
        </div>
      )}
      
      {currentStep === 'cart' ? renderCartContent() : renderUserDetailsForm()}
    </TravelLayout>
  );
}
