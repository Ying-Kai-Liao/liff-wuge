'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Country, Plan, SimType } from '../../types';
import { useCart } from '../../hooks/useCart';
import TravelLayout from '../../components/TravelLayout';

// Define a simple carrier type for local use
interface SimpleCarrier {
  id?: string;
  name: string;
  countryId: string;
  logo?: string;
}

type GroupedPlans = {
  esim: Plan[];
  physical: Plan[];
};

export default function CountryDetailPage() {
  const params = useParams();
  console.log(params);
  const countryId = params.id as string;
  
  const [country, setCountry] = useState<Country | null>(null);
  const [groupedPlans, setGroupedPlans] = useState<GroupedPlans>({ esim: [], physical: [] });
  const [selectedSimType, setSelectedSimType] = useState<SimType>('esim');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [durationFilter, setDurationFilter] = useState<number | null>(null);
  const [priceFilter, setPriceFilter] = useState<'asc' | 'desc' | null>(null);
  
  const { cart, addPlanToCart, updatePlanQuantity, removePlanFromCart } = useCart();
  
  // Handle adding a plan to the cart
  const handleAddToCart = async (plan: Plan) => {
    if (!plan.id) return;
    try {
      await addPlanToCart(plan.id, 1);
      console.log('Plan added to cart:', plan.id);
    } catch (err) {
      console.error('Error adding plan to cart:', err);
    }
  };

  // Handle updating the quantity of a plan in the cart
  const handleUpdateQuantity = async (plan: Plan, quantity: number) => {
    if (!plan.id) return;
    
    try {
      if (quantity <= 0) {
        await removePlanFromCart(plan.id);
      } else {
        await updatePlanQuantity(plan.id, quantity);
      }
    } catch (err) {
      console.error('Error updating plan quantity:', err);
    }
  };

  // Get the quantity of a plan in the cart
  const getPlanQuantity = (planId: string): number => {
    const cartItem = cart.find(item => item.planId === planId);
    return cartItem ? cartItem.quantity : 0;
  };
  
  useEffect(() => {
    async function loadCountryData() {
      if (!countryId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Load country data using API
        const countryResponse = await fetch(`/api/countries/${countryId}`);
        if (!countryResponse.ok) {
          if (countryResponse.status === 404) {
            setError(`找不到國家資料。請先執行種子資料填充。`);
            setIsLoading(false);
            return;
          }
          throw new Error('Country not found');
        }
        const countryData = await countryResponse.json();
        setCountry(countryData);
        
        // Load plans for this country
        const plansResponse: Response = await fetch(`/api/plans?country=${countryId}`);
        if (!plansResponse.ok) {
          throw new Error('Failed to load plans');
        }
        const plansData: Plan[] = await plansResponse.json();
        console.log('All plans data:', plansData);
        
        // Group plans by SIM type
        const grouped: GroupedPlans = { esim: [], physical: [] };
        
        plansData.forEach(plan => {
          console.log(`Plan ${plan.id} has sim_type:`, plan.sim_type);
          if (plan.sim_type === 'esim') {
            grouped.esim.push(plan);
          } else if (plan.sim_type === 'physical') {
            grouped.physical.push(plan);
          } else {
            console.log(`Plan ${plan.id} has unknown sim_type:`, plan.sim_type);
          }
        });
        
        console.log('Grouped plans:', grouped);
        setGroupedPlans(grouped);
      } catch (error) {
        console.error('Error loading country data:', error);
        setError(`載入資料時發生錯誤: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCountryData();
  }, [countryId]);

  // Filter plans based on selected filters
  const getFilteredPlans = () => {
    console.log('Selected SIM type:', selectedSimType);
    console.log('Grouped plans before filtering:', groupedPlans);
    
    let filtered = [...groupedPlans[selectedSimType]];
    console.log('Filtered plans by SIM type:', filtered);
    
    // Apply duration filter
    if (durationFilter) {
      filtered = filtered.filter(plan => plan.duration_days === durationFilter);
    }
    
    // Apply price filter
    if (priceFilter) {
      filtered.sort((a, b) => {
        if (priceFilter === 'asc') {
          return a.price - b.price;
        } else {
          return b.price - a.price;
        }
      });
    }
    
    return filtered;
  };
  
  if (isLoading) {
    return (
      <TravelLayout title="載入中...">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </TravelLayout>
    );
  }
  
  if (error) {
    return (
      <TravelLayout title="錯誤">
        <div className="flex flex-col justify-center items-center min-h-[50vh]">
          <div className="text-red-500 mb-4">{error}</div>
          <Link href="/seed" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            前往填充資料
          </Link>
        </div>
      </TravelLayout>
    );
  }
  
  if (!country) {
    return (
      <TravelLayout title="找不到國家">
        <div className="flex flex-col justify-center items-center min-h-[50vh]">
          <div className="text-red-500 mb-4">找不到國家資料</div>
          <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            返回首頁
          </Link>
        </div>
      </TravelLayout>
    );
  }
  
  const filteredPlans = getFilteredPlans();
  
  return (
    <TravelLayout title={`${country.name} eSIM`}>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="text-4xl mr-3">{country.flagIcon}</div>
          <h1 className="text-2xl font-bold">{country.name}</h1>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300">{country.description}</p>
      </div>
      
      {/* SIM Type Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">選擇SIM卡類型</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedSimType('esim')}
            className={`px-4 py-2 rounded-lg ${
              selectedSimType === 'esim'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            eSIM 數位卡
          </button>
          <button
            onClick={() => setSelectedSimType('physical')}
            className={`px-4 py-2 rounded-lg ${
              selectedSimType === 'physical'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            實體SIM卡
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">篩選方案</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">天數</label>
            <select
              value={durationFilter || ''}
              onChange={(e) => setDurationFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">所有天數</option>
              <option value="3">3天</option>
              <option value="5">5天</option>
              <option value="7">7天</option>
              <option value="10">10天</option>
              <option value="15">15天</option>
              <option value="30">30天</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">價格排序</label>
            <select
              value={priceFilter || ''}
              onChange={(e) => setPriceFilter(e.target.value as 'asc' | 'desc' | null || null)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">預設排序</option>
              <option value="asc">價格由低至高</option>
              <option value="desc">價格由高至低</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Plans List */}
      <div>
        <h2 className="text-xl font-semibold mb-3">
          {selectedSimType === 'esim' ? 'eSIM 數位卡方案' : '實體SIM卡方案'}
        </h2>
        
        {filteredPlans.length === 0 ? (
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
            <p>沒有符合條件的方案</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      {plan.carrierLogo ? (
                        <Image 
                          src={plan.carrierLogo} 
                          alt={plan.carrier || 'Carrier'} 
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-gray-500 text-xl">📱</span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold">{plan.carrier}</h3>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-medium">{plan.title || `${plan.duration_days}天方案`}</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {plan.data_per_day ? `每日 ${plan.data_per_day}` : plan.total_data}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {plan.duration_days} 天 · {plan.speed_policy}
                      </div>
                    </div>
                    <div className="text-xl font-bold">
                      {plan.price} {plan.currency || 'TWD'}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <div className="flex items-center mb-1">
                      <span className="mr-2">✓</span>
                      <span>{plan.sharing_supported ? '支援熱點分享' : '不支援熱點分享'}</span>
                    </div>
                    {plan.device_limit && (
                      <div className="flex items-center mb-1">
                        <span className="mr-2">✓</span>
                        <span>最多支援 {plan.device_limit} 台裝置</span>
                      </div>
                    )}
                    {plan.notes && Array.isArray(plan.notes) && (
                      <div className="mt-2 text-xs">
                        <div className="font-medium mb-1">備註：</div>
                        <ul className="list-disc list-inside">
                          {plan.notes.map((note, index) => (
                            <li key={index}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {getPlanQuantity(plan.id) > 0 ? (
                      <div className="flex items-center">
                        <button
                          onClick={() => handleUpdateQuantity(plan, getPlanQuantity(plan.id) - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-l-lg"
                        >
                          -
                        </button>
                        <div className="w-10 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                          {getPlanQuantity(plan.id)}
                        </div>
                        <button
                          onClick={() => handleUpdateQuantity(plan, getPlanQuantity(plan.id) + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-r-lg"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(plan)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        加入購物車
                      </button>
                    )}
                    
                    <div className="text-sm text-gray-500">
                      {plan.sim_type === 'esim' ? '數位卡' : '實體卡'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TravelLayout>
  );
}
