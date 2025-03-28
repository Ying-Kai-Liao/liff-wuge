'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Country, Plan } from '../../../types';

type FormMode = 'country' | 'plan';

export default function AddDataPage() {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>('country');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [carriers, setCarriers] = useState<{ id: string; name: string; countryId: string }[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  
  // Country form state
  const [countryName, setCountryName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [flagIcon, setFlagIcon] = useState('');
  const [description, setDescription] = useState('');
  
  // Plan form state
  const [planTitle, setPlanTitle] = useState('');
  const [carrier, setCarrier] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [dataAmount, setDataAmount] = useState('');
  const [price, setPrice] = useState('');
  const [simType, setSimType] = useState<'esim' | 'physical'>('esim');
  const [features, setFeatures] = useState('');
  
  useEffect(() => {
    // Fetch countries for dropdown
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/admin/data?type=countries');
        
        if (!response.ok) {
          throw new Error('Failed to fetch countries');
        }
        
        const countriesData = await response.json();
        setCountries(countriesData);
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    };
    
    fetchCountries();
  }, []);
  
  useEffect(() => {
    // Fetch carriers when a country is selected
    const fetchCarriers = async () => {
      if (!selectedCountryId) return;
      
      try {
        const response = await fetch('/api/admin/data?type=carriers');
        
        if (!response.ok) {
          throw new Error('Failed to fetch carriers');
        }
        
        const carriersData = await response.json();
        const filteredCarriers = carriersData.filter(
          (carrier: any) => carrier.countryId === selectedCountryId
        );
        
        setCarriers(filteredCarriers);
      } catch (err) {
        console.error('Error fetching carriers:', err);
      }
    };
    
    fetchCarriers();
  }, [selectedCountryId]);
  
  const resetCountryForm = () => {
    setCountryName('');
    setCountryCode('');
    setFlagIcon('');
    setDescription('');
  };
  
  const resetPlanForm = () => {
    setSelectedCountryId('');
    setPlanTitle('');
    setCarrier('');
    setDurationDays('');
    setDataAmount('');
    setPrice('');
    setSimType('esim');
    setFeatures('');
  };
  
  const handleSubmitCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);
    
    try {
      // Validate required fields
      if (!countryName || !countryCode) {
        throw new Error('國家名稱和代碼為必填欄位');
      }
      
      // Add country to Firestore via API
      const response = await fetch('/api/admin/data/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'countries',
          data: {
            name: countryName,
            code: countryCode,
            flagIcon: flagIcon || '🏳️',
            description: description || `${countryName}的eSIM方案`,
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add country');
      }
      
      const result = await response.json();
      
      setSubmitResult({
        success: true,
        message: `成功新增國家：${countryName} (ID: ${result.id})`
      });
      
      // Reset form
      resetCountryForm();
      
      // Refresh countries list
      const countriesResponse = await fetch('/api/admin/data?type=countries');
      if (countriesResponse.ok) {
        const countriesData = await countriesResponse.json();
        setCountries(countriesData);
      }
    } catch (err) {
      console.error('Error adding country:', err);
      setSubmitResult({
        success: false,
        message: `新增國家失敗：${err instanceof Error ? err.message : '未知錯誤'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);
    
    try {
      // Validate required fields
      if (!selectedCountryId || !planTitle || !carrier || !durationDays || !price) {
        throw new Error('國家、方案名稱、電信商、天數和價格為必填欄位');
      }
      
      // Find country info
      const selectedCountry = countries.find(c => c.id === selectedCountryId);
      if (!selectedCountry) {
        throw new Error('找不到所選國家');
      }
      
      // Parse numeric values
      const durationDaysNum = parseInt(durationDays, 10);
      const priceNum = parseFloat(price);
      
      if (isNaN(durationDaysNum) || durationDaysNum <= 0) {
        throw new Error('天數必須是大於0的數字');
      }
      
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('價格必須是大於0的數字');
      }
      
      // Add plan to Firestore via API
      const response = await fetch('/api/admin/data/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'plans',
          data: {
            title: planTitle,
            country: selectedCountry.name,
            countryId: selectedCountryId,
            carrier: carrier,
            duration_days: durationDaysNum,
            data_amount: dataAmount || '無限制',
            price: priceNum,
            currency: 'TWD',
            sim_type: simType,
            features: features ? features.split('\n') : [],
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add plan');
      }
      
      const result = await response.json();
      
      setSubmitResult({
        success: true,
        message: `成功新增方案：${planTitle} (ID: ${result.id})`
      });
      
      // Reset form
      resetPlanForm();
    } catch (err) {
      console.error('Error adding plan:', err);
      setSubmitResult({
        success: false,
        message: `新增方案失敗：${err instanceof Error ? err.message : '未知錯誤'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gray-50 pt-10">
        <div className="py-10">
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">新增資料</h1>
              <div className="flex space-x-8">
                <Link
                  href="/admin"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  返回控制台
                </Link>
                <Link
                  href="/admin/data"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                返回資料管理
              </Link>
              </div>
            </div>
          </header>
          
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="px-4 py-8 sm:px-0">
                {/* Mode Selector */}
                <div className="mb-8">
                  <div className="sm:hidden">
                    <label htmlFor="tabs" className="sr-only">選擇表單</label>
                    <select
                      id="tabs"
                      name="tabs"
                      className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      value={mode}
                      onChange={(e) => setMode(e.target.value as FormMode)}
                    >
                      <option value="country">新增國家</option>
                      <option value="plan">新增方案</option>
                    </select>
                  </div>
                  <div className="hidden sm:block">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                          onClick={() => setMode('country')}
                          className={`${
                            mode === 'country'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                          新增國家
                        </button>
                        <button
                          onClick={() => setMode('plan')}
                          className={`${
                            mode === 'plan'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                          新增方案
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
                
                {/* Result Message */}
                {submitResult && (
                  <div className={`mb-6 p-4 rounded-md ${submitResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {submitResult.message}
                  </div>
                )}
                
                {/* Country Form */}
                {mode === 'country' && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">新增國家</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>填寫以下表單來新增一個國家。</p>
                      </div>
                      
                      <form onSubmit={handleSubmitCountry} className="mt-5 space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <label htmlFor="country-name" className="block text-sm font-medium text-gray-700">
                              國家名稱 *
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                id="country-name"
                                value={countryName}
                                onChange={(e) => setCountryName(e.target.value)}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="例如：日本"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="country-code" className="block text-sm font-medium text-gray-700">
                              國家代碼 *
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                id="country-code"
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="例如：JP"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="flag-icon" className="block text-sm font-medium text-gray-700">
                              國旗圖示
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                id="flag-icon"
                                value={flagIcon}
                                onChange={(e) => setFlagIcon(e.target.value)}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="例如：🇯🇵"
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-6">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                              描述
                            </label>
                            <div className="mt-1">
                              <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="輸入國家描述..."
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={resetCountryForm}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            重置
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {isSubmitting ? '處理中...' : '新增國家'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                
                {/* Plan Form */}
                {mode === 'plan' && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">新增方案</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>填寫以下表單來新增一個eSIM方案。</p>
                      </div>
                      
                      <form onSubmit={handleSubmitPlan} className="mt-5 space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                              國家 *
                            </label>
                            <div className="mt-1">
                              <select
                                id="country"
                                value={selectedCountryId}
                                onChange={(e) => setSelectedCountryId(e.target.value)}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                required
                              >
                                <option value="">選擇國家</option>
                                {countries.map((country) => (
                                  <option key={country.id} value={country.id}>
                                    {country.flagIcon} {country.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="plan-title" className="block text-sm font-medium text-gray-700">
                              方案名稱 *
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                id="plan-title"
                                value={planTitle}
                                onChange={(e) => setPlanTitle(e.target.value)}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="例如：基本方案"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="carrier" className="block text-sm font-medium text-gray-700">
                              電信商 *
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                id="carrier"
                                value={carrier}
                                onChange={(e) => setCarrier(e.target.value)}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="例如：Docomo"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="sim-type" className="block text-sm font-medium text-gray-700">
                              SIM卡類型 *
                            </label>
                            <div className="mt-1">
                              <select
                                id="sim-type"
                                value={simType}
                                onChange={(e) => setSimType(e.target.value as 'esim' | 'physical')}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                required
                              >
                                <option value="esim">eSIM</option>
                                <option value="physical">實體SIM卡</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="sm:col-span-2">
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                              天數 *
                            </label>
                            <div className="mt-1">
                              <input
                                type="number"
                                id="duration"
                                value={durationDays}
                                onChange={(e) => setDurationDays(e.target.value)}
                                min="1"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="例如：7"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-2">
                            <label htmlFor="data-amount" className="block text-sm font-medium text-gray-700">
                              數據量
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                id="data-amount"
                                value={dataAmount}
                                onChange={(e) => setDataAmount(e.target.value)}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="例如：3GB 或 無限制"
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-2">
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                              價格 (TWD) *
                            </label>
                            <div className="mt-1">
                              <input
                                type="number"
                                id="price"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                min="0"
                                step="0.01"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="例如：499"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-6">
                            <label htmlFor="features" className="block text-sm font-medium text-gray-700">
                              特點（每行一個）
                            </label>
                            <div className="mt-1">
                              <textarea
                                id="features"
                                value={features}
                                onChange={(e) => setFeatures(e.target.value)}
                                rows={3}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="每行輸入一個特點，例如：
高速數據連接
無需實體SIM卡
即時啟用"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={resetPlanForm}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            重置
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {isSubmitting ? '處理中...' : '新增方案'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
