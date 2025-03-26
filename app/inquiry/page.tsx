'use client';

import { useState, useEffect } from 'react';
import { useInquiry } from '../hooks/useInquiry';
import { Country, Carrier, Plan } from '../types';
import { useLiff } from '../components/LiffProvider';
import TravelLayout from '../components/TravelLayout';

type DetailedInquiry = {
  planId: string;
  carrierId: string;
  countryId: string;
  addedAt: number;
  plan: Plan | null;
  carrier: Carrier | null;
  country: Country | null;
};

export default function InquiryPage() {
  const { liff } = useLiff();
  const { inquiryList, removePlanFromInquiry, clearInquiryList, sendInquiryToChat } = useInquiry();
  const [detailedInquiries, setDetailedInquiries] = useState<DetailedInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    async function loadDetailedInquiries() {
      if (inquiryList.length === 0) {
        setDetailedInquiries([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const detailed = await Promise.all(
          inquiryList.map(async (item) => {
            // Use API endpoints instead of direct Firebase calls
            const planResponse = await fetch(`/api/plans/${item.planId}`);
            const plan = planResponse.ok ? await planResponse.json() : null;
            
            const carrierResponse = await fetch(`/api/carriers/${item.carrierId}`);
            const carrier = carrierResponse.ok ? await carrierResponse.json() : null;
            
            const countryResponse = await fetch(`/api/countries/${item.countryId}`);
            const country = countryResponse.ok ? await countryResponse.json() : null;
            
            return {
              ...item,
              plan,
              carrier,
              country
            };
          })
        );
        
        // Sort by added time (newest first)
        const sorted = detailed.sort((a, b) => b.addedAt - a.addedAt);
        setDetailedInquiries(sorted);
        setError(null);
      } catch (err) {
        console.error('Error loading inquiry details:', err);
        setError('Failed to load inquiry details');
      } finally {
        setIsLoading(false);
      }
    }

    loadDetailedInquiries();
  }, [inquiryList]);

  const handleSendToChat = async () => {
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
      const success = await sendInquiryToChat();
      if (success) {
        setSendSuccess(true);
        setTimeout(() => {
          setSendSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error sending to chat:', err);
      setError('傳送失敗，請稍後再試');
    } finally {
      setIsSending(false);
    }
  };

  const renderContent = () => {
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

    if (detailedInquiries.length === 0) {
      return (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-lg mb-4 text-center">
          <div className="text-4xl mb-3">🧳</div>
          <h3 className="text-xl font-semibold mb-2">您的詢問清單目前是空的</h3>
          <p className="mb-4">瀏覽國家方案並將您感興趣的選項加入詢問清單</p>
          <a 
            href="/countries"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            探索 eSIM 方案
          </a>
        </div>
      );
    }

    return (
      <>
        <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center">
          <div className="text-blue-700 text-xl mr-3">💡</div>
          <p className="text-blue-700 text-sm">
            您可以將詢問清單傳送至 LINE 對話，以便與客服人員討論最適合您的 eSIM 方案
          </p>
        </div>
        
        <div className="space-y-4 mb-8">
          {detailedInquiries.map((item) => (
            <div key={item.planId} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
              {item.plan && item.carrier && item.country ? (
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-3xl">{item.country.flagIcon}</div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {item.country.name}
                          </h3>
                          <div className="text-gray-600 text-sm">
                            {item.carrier.name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium mr-2">
                              {item.plan.days}天
                            </div>
                            <div className="font-medium">{item.plan.dataAmount}</div>
                          </div>
                          <div className="text-xl font-bold text-blue-700">
                            {item.plan.price} {item.plan.currency}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.plan.dailyLimit && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              每日限制: {item.plan.dailyLimit}
                            </span>
                          )}
                          {item.plan.throttling ? (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                              用量限制後降速
                            </span>
                          ) : (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              不降速
                            </span>
                          )}
                          {item.plan.sharingSupported && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              支援熱點分享
                            </span>
                          )}
                          {item.plan.deviceLimit && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              最多 {item.plan.deviceLimit} 台裝置
                            </span>
                          )}
                        </div>
                        
                        {item.plan.notes && (
                          <div className="mt-2 text-sm text-gray-600 border-t border-gray-100 pt-2">
                            <span className="font-medium">備註:</span> {item.plan.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removePlanFromInquiry(item.planId)}
                      className="ml-2 flex-shrink-0 h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                      aria-label="移除"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <a
                      href={`/country/${item.countryId}`}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      查看更多方案 <span className="ml-1">→</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-gray-500">方案資料載入失敗</div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <button
            onClick={clearInquiryList}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <span className="mr-2">🗑️</span> 清空詢問清單
          </button>
          
          <button
            onClick={handleSendToChat}
            disabled={isSending || !liff?.isInClient()}
            className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
              !liff?.isInClient()
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
                <span className="mr-2">✓</span> 已傳送至 LINE 對話
              </>
            ) : (
              <>
                <span className="mr-2">💬</span> 傳送至 LINE 對話
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
      title="eSIM 詢問清單" 
      showBackButton={true}
      backUrl="/countries"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">您的 eSIM 詢問清單</h2>
        <p className="text-gray-600">
          查看您感興趣的 eSIM 方案，並傳送至 LINE 對話以獲取更多資訊
        </p>
      </div>
      
      {renderContent()}
    </TravelLayout>
  );
}
