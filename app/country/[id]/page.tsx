'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const countryId = params.id as string;
  
  const [country, setCountry] = useState<Country | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSimType, setSelectedSimType] = useState<SimType>('esim');
  const [durationRangeFilter, setDurationRangeFilter] = useState<{min: number, max: number} | null>(null);
  const [durationRanges, setDurationRanges] = useState<{label: string, min: number, max: number}[]>([]);
  const [sortBy, setSortBy] = useState<'duration' | 'price'>('duration');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSimInfo, setShowSimInfo] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<{[key: string]: boolean}>({});

  const { cart, addPlanToCart, updatePlanQuantity, removePlanFromCart } = useCart();

  // Group plans by SIM type
  const groupedPlans = {
    esim: plans.filter(plan => plan.sim_type === 'esim'),
    physical: plans.filter(plan => plan.sim_type === 'physical')
  };

  // Generate duration ranges based on available plans
  useEffect(() => {
    if (plans.length > 0) {
      const durations = Array.from(new Set(plans.map(plan => plan.duration_days))).sort((a, b) => a - b);
      
      // Create predefined ranges
      const ranges = [
        { label: '短期 (1-3天)', min: 1, max: 3 },
        { label: '中短期 (4-7天)', min: 4, max: 7 },
        { label: '中期 (8-14天)', min: 8, max: 14 },
        { label: '長期 (15-30天)', min: 15, max: 30 },
        { label: '超長期 (30天以上)', min: 31, max: 999 }
      ];
      
      // Only keep ranges that have at least one plan
      const filteredRanges = ranges.filter(range => 
        plans.some(plan => plan.duration_days >= range.min && plan.duration_days <= range.max)
      );
      
      setDurationRanges(filteredRanges);
    }
  }, [plans]);

  // Filter plans based on selected criteria
  const getFilteredPlans = () => {
    let filtered = [...groupedPlans[selectedSimType]];
    
    // Apply duration range filter
    if (durationRangeFilter !== null) {
      filtered = filtered.filter(plan => 
        plan.duration_days >= durationRangeFilter.min && 
        plan.duration_days <= durationRangeFilter.max
      );
    }
    
    // Apply sorting
    if (sortBy === 'duration') {
      filtered.sort((a, b) => sortOrder === 'asc' 
        ? a.duration_days - b.duration_days 
        : b.duration_days - a.duration_days);
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => sortOrder === 'asc' 
        ? a.price - b.price 
        : b.price - a.price);
    }
    
    return filtered;
  };

  // Handle adding a plan to the cart
  const handleAddToCart = async (plan: Plan) => {
    if (!plan.id) return;
    setAddingToCart(plan.id);
    setAddSuccess(null);
    setAddError(null);
    
    try {
      await addPlanToCart(plan.id, 1);
      setAddSuccess(plan.id);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setAddSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error adding plan to cart:', err);
      setAddError(plan.id);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setAddError(null);
      }, 3000);
    } finally {
      setAddingToCart(null);
    }
  };
  
  // Handle updating plan quantity
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

  // Handle duration range filter selection
  const handleDurationRangeFilterChange = (range: {min: number, max: number} | null) => {
    setDurationRangeFilter(range);
  };

  // Handle sort change
  const handleSortChange = (newSortBy: 'duration' | 'price') => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking the same sort type
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort type and reset to ascending order
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // Get the quantity of a plan in the cart
  const getPlanQuantity = (planId: string): number => {
    const cartItem = cart.find(item => item.planId === planId);
    return cartItem ? cartItem.quantity : 0;
  };
  
  // Function to toggle plan expansion
  const togglePlanExpansion = (planId: string) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  // Initialize all plans as collapsed
  useEffect(() => {
    if (plans.length > 0) {
      const initialExpandedState = plans.reduce((acc, plan) => {
        // Set popular plans as expanded by default
        acc[plan.id] = plan.is_popular === true;
        return acc;
      }, {} as {[key: string]: boolean});
      
      setExpandedPlans(initialExpandedState);
    }
  }, [plans]);

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
        
        setPlans(plansData);
      } catch (error) {
        console.error('Error loading country data:', error);
        setError(`載入資料時發生錯誤: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCountryData();
  }, [countryId]);

  if (isLoading) {
    return (
      <TravelLayout title="載入中...">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006A71]"></div>
        </div>
      </TravelLayout>
    );
  }
  
  if (error) {
    return (
      <TravelLayout title="錯誤">
        <div className="flex flex-col justify-center items-center min-h-[50vh]">
          <div className="text-red-500 mb-4">{error}</div>
          <span className="text-gray-500 mb-4">請於LINE應用程式打開此頁面</span>
          <Link href="/" className="px-4 py-2 bg-[#006A71] text-white rounded hover:bg-[#004a4f]">
            返回首頁
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
          <Link href="/" className="px-4 py-2 bg-[#006A71] text-white rounded hover:bg-[#004a4f]">
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
        <div className="flex items-center gap-4 mb-2">
          <span className="text-5xl" role="img" aria-label={country.name}>
            {country.flagIcon}
          </span>
          <h1 className="text-2xl font-bold text-[#006A71]">{country.name}</h1>
        </div>
        
        <p className="text-gray-600">{country.description}</p>
      </div>
      
      {/* SIM Type Selection */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-[#006A71]">選擇 SIM 卡類型</h2>
          <button 
            onClick={() => setShowSimInfo(!showSimInfo)}
            className="ml-2 text-[#48A6A7] hover:text-[#006A71] focus:outline-none"
            aria-label="SIM 卡類型說明"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {showSimInfo && (
          <div className="bg-[#fffcf3] p-4 rounded-lg mb-4 text-sm">
            <h3 className="font-medium text-[#006A71] mb-2">SIM 卡類型說明</h3>
            <div className="mb-2">
              <span className="font-medium">eSIM 數位卡：</span> 直接下載到您的手機，無需實體卡片。需要支援 eSIM 的手機。
            </div>
            <div>
              <span className="font-medium">實體 SIM 卡：</span> 傳統 SIM 卡，需要郵寄或自取，適用於所有手機。
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSimType('esim')}
            className={`px-4 py-2 rounded-lg ${
              selectedSimType === 'esim'
                ? 'bg-[#006A71] text-white'
                : 'bg-[#F2EFE7] text-[#48A6A7] hover:bg-[#9ACBD0]'
            }`}
          >
            eSIM 數位卡
          </button>
          <button
            onClick={() => setSelectedSimType('physical')}
            className={`px-4 py-2 rounded-lg ${
              selectedSimType === 'physical'
                ? 'bg-[#006A71] text-white'
                : 'bg-[#F2EFE7] text-[#48A6A7] hover:bg-[#9ACBD0]'
            }`}
          >
            實體 SIM 卡
          </button>
        </div>
      </div>
      
      {/* Duration Filter */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#006A71]">選擇天數</h2>
        
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleDurationRangeFilterChange(null)}
              className={`px-4 py-2 rounded-lg ${
                durationRangeFilter === null
                  ? 'bg-[#006A71] text-white'
                  : 'bg-[#F2EFE7] text-[#48A6A7] hover:bg-[#9ACBD0]'
              }`}
            >
              全部天數
            </button>
            
            {durationRanges.map((range, index) => (
              <button
                key={index}
                onClick={() => handleDurationRangeFilterChange(range)}
                className={`px-4 py-2 rounded-lg ${
                  durationRangeFilter && 
                  durationRangeFilter.min === range.min && 
                  durationRangeFilter.max === range.max
                    ? 'bg-[#006A71] text-white'
                    : 'bg-[#F2EFE7] text-[#48A6A7] hover:bg-[#9ACBD0]'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Sorting */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#006A71]">排序方式</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSortChange('duration')}
            className={`px-4 py-2 rounded-lg ${
              sortBy === 'duration'
                ? 'bg-[#006A71] text-white'
                : 'bg-[#F2EFE7] text-[#48A6A7] hover:bg-[#9ACBD0]'
            }`}
          >
            天數 {sortBy === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSortChange('price')}
            className={`px-4 py-2 rounded-lg ${
              sortBy === 'price'
                ? 'bg-[#006A71] text-white'
                : 'bg-[#F2EFE7] text-[#48A6A7] hover:bg-[#9ACBD0]'
            }`}
          >
            價格 {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>
      
      {/* Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#006A71]">
          可用方案 ({filteredPlans.length})
        </h2>
        
        {filteredPlans.length === 0 ? (
          <div className="bg-[#F2EFE7] p-6 rounded-lg text-center">
            <p>沒有符合條件的方案</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredPlans.map((plan) => (
              <div 
                key={plan.id} 
                className={`bg-white rounded-xl shadow-sm overflow-hidden border ${plan.is_popular ? 'border-[#006A71]' : 'border-gray-200'}`}
              >
                <div 
                  className={`p-4 cursor-pointer ${plan.is_popular ? 'bg-[#F2EFE7]' : 'bg-white'}`}
                  onClick={() => togglePlanExpansion(plan.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <h3 className="text-lg font-bold text-[#006A71]">
                          {plan.duration_days}天 {plan.data_per_day ? `每日${plan.data_per_day}` : plan.total_data}
                        </h3>
                        <div className="text-sm text-[#48A6A7]">{plan.carrier}</div>
                      </div>
                      {plan.is_popular && (
                        <span className="bg-[#006A71] text-white text-xs px-2 py-1 rounded-full">熱門</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className="text-xl font-bold text-[#006A71] mr-3">
                        NT$ {plan.price}
                      </div>
                      <svg 
                        className={`w-5 h-5 text-[#48A6A7] transition-transform ${expandedPlans[plan.id] ? 'transform rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {expandedPlans[plan.id] && (
                  <div className="p-4 border-t border-gray-100">
                    <div className="mb-3">
                      <h4 className="text-lg font-medium text-[#006A71]">{plan.title || `${plan.speed_policy}方案`}</h4>
                      <div className="text-sm text-gray-600">
                        {plan.speed_policy}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <div className="flex items-center mb-2 bg-[#F2EFE7] p-2 rounded-md">
                        <span className="mr-2 text-[#006A71]">⏱️</span>
                        <span className="font-medium text-[#006A71]">使用期限: {plan.duration_days}天</span>
                      </div>
                      {plan.device_limit && (
                        <div className="flex items-center mb-1">
                          <span className="mr-2">✓</span>
                          <span>最多 {plan.device_limit} 台裝置</span>
                        </div>
                      )}
                      {plan.sharing_supported && (
                        <div className="flex items-center mb-1">
                          <span className="mr-2">✓</span>
                          <span>支援熱點分享</span>
                        </div>
                      )}
                      {plan.notes && plan.notes.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="font-medium text-[#006A71]">方案備註：</div>
                          <ul className="list-disc pl-5 space-y-1">
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
                            className="w-8 h-8 flex items-center justify-center bg-[#F2EFE7] rounded-l-lg"
                          >
                            -
                          </button>
                          <div className="w-10 h-8 flex items-center justify-center bg-white border-t border-b border-[#9ACBD0]">
                            {getPlanQuantity(plan.id)}
                          </div>
                          <button
                            onClick={() => handleUpdateQuantity(plan, getPlanQuantity(plan.id) + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-[#F2EFE7] rounded-r-lg"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(plan)}
                          className="px-4 py-2 bg-[#006A71] text-white rounded-lg hover:bg-[#004a4f]"
                        >
                          加入購物車
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </TravelLayout>
  );
}
