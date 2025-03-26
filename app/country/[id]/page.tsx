'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Country, Carrier, Plan } from '../../types';
import { useInquiry } from '../../hooks/useInquiry';
import TravelLayout from '../../components/TravelLayout';

type CarrierWithPlans = Carrier & {
  plans: Plan[];
};

export default function CountryDetailPage() {
  const params = useParams();
  const countryId = params.id as string;
  
  const [country, setCountry] = useState<Country | null>(null);
  const [carriers, setCarriers] = useState<CarrierWithPlans[]>([]);
  const [expandedCarrier, setExpandedCarrier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addPlanToInquiry, inquiryList } = useInquiry();
  
  // Check if a plan is already in the inquiry list
  const isPlanInInquiry = (planId: string) => {
    return inquiryList.some(item => item.planId === planId);
  };

  useEffect(() => {
    async function loadCountryData() {
      if (!countryId) return;
      
      try {
        setIsLoading(true);
        
        // Load country data using API
        const countryResponse = await fetch(`/api/countries/${countryId}`);
        if (!countryResponse.ok) {
          throw new Error('Country not found');
        }
        const countryData = await countryResponse.json();
        setCountry(countryData);
        
        // Load carriers for this country using API
        const carriersResponse = await fetch(`/api/carriers?countryId=${countryId}`);
        if (!carriersResponse.ok) {
          throw new Error('Failed to load carriers');
        }
        const carriersData = await carriersResponse.json();
        
        // Load plans for each carrier using API
        const carriersWithPlans = await Promise.all(
          carriersData.map(async (carrier: Carrier) => {
            const plansResponse = await fetch(`/api/plans?carrierId=${carrier.id}`);
            if (!plansResponse.ok) {
              throw new Error(`Failed to load plans for carrier ${carrier.id}`);
            }
            const plans = await plansResponse.json();
            return {
              ...carrier,
              plans
            };
          })
        );
        
        setCarriers(carriersWithPlans);
        
        // Expand the first carrier by default if any exist
        if (carriersWithPlans.length > 0 && carriersWithPlans[0].id) {
          setExpandedCarrier(carriersWithPlans[0].id);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading country data:', err);
        setError('Failed to load country data');
      } finally {
        setIsLoading(false);
      }
    }

    loadCountryData();
  }, [countryId]);

  const toggleCarrier = (carrierId: string) => {
    if (expandedCarrier === carrierId) {
      setExpandedCarrier(null);
    } else {
      setExpandedCarrier(carrierId);
    }
  };

  const handleAddToInquiry = async (plan: Plan) => {
    if (!plan.id || !plan.carrierId || !countryId) return;
    
    try {
      await addPlanToInquiry(plan.id, plan.carrierId, countryId);
    } catch (err) {
      console.error('Error adding plan to inquiry:', err);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-16 w-16 mb-4 rounded-full bg-blue-200"></div>
            <div className="h-4 w-48 bg-blue-200 rounded"></div>
            <div className="mt-2 h-3 w-32 bg-blue-100 rounded"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      );
    }

    if (!country) {
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
          <p>找不到國家資料</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="text-5xl mr-4">{country.flagIcon}</div>
            <div>
              <h1 className="text-3xl font-bold">{country.name}</h1>
              {country.description && (
                <p className="text-gray-600 mt-1">{country.description}</p>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 flex items-center">
            <div className="text-blue-800 mr-3">💡</div>
            <p className="text-blue-800 text-sm">
              選擇適合您旅行需求的 eSIM 方案，無需實體 SIM 卡即可在{country.name}享受網路服務
            </p>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-6">可用電信商</h2>
        
        {carriers.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <p>此國家目前沒有可用的電信商</p>
          </div>
        ) : (
          <div className="space-y-6">
            {carriers.map((carrier) => (
              <div key={carrier.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div 
                  className="p-4 bg-gradient-to-r from-blue-50 to-white flex justify-between items-center cursor-pointer border-b"
                  onClick={() => toggleCarrier(carrier.id!)}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      {carrier.logo ? (
                        <Image 
                          src={carrier.logo} 
                          alt={carrier.name} 
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-gray-500 text-xl">📱</span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold">{carrier.name}</h3>
                  </div>
                  <div className="text-blue-600">
                    {expandedCarrier === carrier.id ? '▲' : '▼'}
                  </div>
                </div>
                
                {expandedCarrier === carrier.id && (
                  <div className="p-5">
                    <h4 className="font-medium text-gray-700 mb-4">可用方案</h4>
                    
                    {carrier.plans.length === 0 ? (
                      <p className="text-gray-500">此電信商目前沒有可用的方案</p>
                    ) : (
                      <div className="space-y-4">
                        {carrier.plans.map((plan) => (
                          <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                              <div className="mb-3 md:mb-0">
                                <div className="flex items-center">
                                  <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium mr-2">
                                    {plan.days}天
                                  </div>
                                  <div className="font-semibold text-lg">{plan.dataAmount}</div>
                                </div>
                                <div className="text-gray-600 text-sm mt-1">
                                  {plan.dailyLimit && `每日限制: ${plan.dailyLimit}`}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end">
                                <div className="text-xl font-bold text-blue-700">
                                  {plan.price} {plan.currency}
                                </div>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  {plan.throttling ? (
                                    <span className="flex items-center">
                                      <span className="mr-1">⚠️</span> 用量限制後降速
                                    </span>
                                  ) : (
                                    <span className="flex items-center">
                                      <span className="mr-1">✓</span> 不降速
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex flex-wrap gap-2 mb-3">
                                {plan.sharingSupported && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                    支援熱點分享
                                  </span>
                                )}
                                {plan.deviceLimit && (
                                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                                    最多 {plan.deviceLimit} 台裝置
                                  </span>
                                )}
                              </div>
                              
                              {plan.notes && (
                                <div className="text-sm text-gray-600 mb-3">
                                  <span className="font-medium">備註:</span> {plan.notes}
                                </div>
                              )}
                              
                              <button
                                onClick={() => handleAddToInquiry(plan)}
                                disabled={isPlanInInquiry(plan.id!)}
                                className={`w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  isPlanInInquiry(plan.id!)
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                {isPlanInInquiry(plan.id!) ? (
                                  <span className="flex items-center justify-center">
                                    <span className="mr-1">✓</span> 已加入詢問清單
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center">
                                    <span className="mr-1">+</span> 加入詢問清單
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <TravelLayout 
      title={country?.name} 
      showBackButton={true}
      backUrl="/countries"
    >
      {renderContent()}
    </TravelLayout>
  );
}
