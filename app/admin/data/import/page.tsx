'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import Link from 'next/link';
import { Country, Plan, PlanType, SimType } from '@/app/types';

interface CountryData {
  code: string;
  flagIcon?: string;
  description?: string;
  plans: Partial<Plan>[];
}

interface ImportData {
  [country: string]: CountryData;
}

interface CustomPlanFormData {
  countryId: string;
  title: string;
  carrier: string;
  carrierLogo?: string;
  plan_type: PlanType;
  sim_type: SimType;
  duration_days: number;
  data_per_day?: string;
  total_data?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  currency: string;
  speed_policy: string;
  sharing_supported: boolean;
  isCustom: boolean;
  customerId?: string;
  customerName?: string;
  expiryDate?: string;
}

export default function ImportDataPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'import' | 'custom'>('import');
  const [importData, setImportData] = useState<string>('');
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [customPlan, setCustomPlan] = useState<CustomPlanFormData>({
    countryId: '',
    title: '',
    carrier: '',
    plan_type: 'daily',
    sim_type: 'esim',
    duration_days: 7,
    price: 0,
    currency: 'TWD',
    speed_policy: '正常速度',
    sharing_supported: false,
    isCustom: true,
  });
  const [customPlanResult, setCustomPlanResult] = useState<any>(null);
  const [isAddingCustomPlan, setIsAddingCustomPlan] = useState(false);
  const [updateExisting, setUpdateExisting] = useState<boolean>(false);

  useEffect(() => {
    // Fetch countries for the custom plan form
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/admin/data?type=countries');
        if (response.ok) {
          const data = await response.json();
          setCountries(data);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  const handleImportDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setImportData(e.target.value);
    setImportError(null);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsImporting(true);
    setImportResult(null);
    setImportError(null);

    try {
      // Validate JSON
      let parsedData: ImportData;
      try {
        parsedData = JSON.parse(importData);
      } catch (error) {
        throw new Error('無效的 JSON 格式');
      }

      // Validate structure
      if (typeof parsedData !== 'object' || parsedData === null) {
        throw new Error('資料必須是一個物件，以國家名稱為鍵');
      }
      
      // Create API request with the update flag
      const apiRequestData: any = {
        ...parsedData,
        updateExisting
      };

      // Send to API
      const response = await fetch('/api/admin/data/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '匯入失敗');
      }

      const result = await response.json();
      setImportResult(result);
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : '未知錯誤');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCustomPlanChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCustomPlan(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setCustomPlan(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setCustomPlan(prev => ({ ...prev, [name]: value }));
    }
    
    // Calculate discount if both price and originalPrice are set
    if (name === 'price' || name === 'originalPrice') {
      const price = name === 'price' ? parseFloat(value) : customPlan.price;
      const originalPrice = name === 'originalPrice' ? parseFloat(value) : customPlan.originalPrice;
      
      if (price && originalPrice && originalPrice > 0) {
        const discount = Math.round((1 - price / originalPrice) * 100);
        setCustomPlan(prev => ({ ...prev, discount }));
      }
    }
    
    // Calculate price if discount and originalPrice are set
    if (name === 'discount' && customPlan.originalPrice) {
      const discount = parseFloat(value);
      const originalPrice = customPlan.originalPrice;
      
      if (!isNaN(discount) && originalPrice > 0) {
        const price = Math.round(originalPrice * (1 - discount / 100));
        setCustomPlan(prev => ({ ...prev, price }));
      }
    }
  };

  const handleCustomPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCustomPlan(true);
    setCustomPlanResult(null);

    try {
      // Find country name
      const country = countries.find(c => c.id === customPlan.countryId);
      if (!country) {
        throw new Error('請選擇國家');
      }

      // Prepare plan data
      const planData = {
        ...customPlan,
        country: country.name,
        createdAt: new Date()
      };

      // Send to API
      const response = await fetch('/api/admin/data/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'plans',
          data: planData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '新增失敗');
      }

      const result = await response.json();
      setCustomPlanResult({
        success: true,
        message: '客製方案新增成功',
        id: result.id
      });
      
      // Reset form
      setCustomPlan({
        countryId: '',
        title: '',
        carrier: '',
        plan_type: 'daily',
        sim_type: 'esim',
        duration_days: 7,
        price: 0,
        currency: 'TWD',
        speed_policy: '正常速度',
        sharing_supported: false,
        isCustom: true,
      });
    } catch (error) {
      console.error('Add custom plan error:', error);
      setCustomPlanResult({
        success: false,
        message: error instanceof Error ? error.message : '未知錯誤'
      });
    } finally {
      setIsAddingCustomPlan(false);
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">資料匯入與客製方案</h1>
          <Link href="/admin/data" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm">
            返回資料管理
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              批量匯入
            </button>
            {/* <button
              onClick={() => setActiveTab('custom')}
              className={`${
                activeTab === 'custom'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              新增客製方案
            </button> */}
          </nav>
        </div>

        {/* Import Data Tab */}
        {activeTab === 'import' && (
          <div>
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">批量匯入國家與方案</h2>
              <p className="text-sm text-gray-600 mb-4">
                您可以使用 JSON 格式批量匯入國家與方案。格式如下：
              </p>
              
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="updateExisting"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="updateExisting" className="ml-2 block text-sm text-gray-700">
                    更新現有方案（需要提供方案ID）
                  </label>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  啟用此選項時，系統將根據提供的ID更新現有方案，而不是創建新方案。
                  <br />
                  <strong>注意：</strong> 若未啟用此選項，所有提供的ID將被忽略，系統將自動生成新ID。
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">JSON 格式範例</h3>
                <div className="bg-gray-50 p-4 rounded-md overflow-auto">
                  <pre className="text-xs text-gray-700">
{`{
  "countries": [
    {
      "name": "日本",
      "code": "JP",
      "flagIcon": "🇯🇵",
      "description": "日本的eSIM方案"
    }
  ],
  "plans": [
    {
      "id": "existing-plan-id",      // 僅在「更新現有方案」模式下使用，否則會被忽略
      "country": "日本",             // 可以使用國家名稱，無需提供 countryId
      "carrier": "Softbank",
      "carrierLogo": "https://example.com/logo.png",
      "plan_type": "daily",          // daily 或 total
      "sim_type": "esim",            // esim 或 physical
      "title": "每日3GB",
      "duration_days": 5,
      "data_per_day": "3GB",         // 若 plan_type 為 daily
      "total_data": "15GB",          // 若 plan_type 為 total
      "price": 500,
      "currency": "TWD",
      "speed_policy": "4G/LTE",
      "sharing_supported": true,
      "device_limit": 1,
      "notes": ["可分享", "不支援通話"]
    },
    {
      "country": "JP",               // 也可以使用國家代碼
      "carrier": "Docomo",
      "plan_type": "total",
      "sim_type": "esim",
      "title": "總量10GB",
      "duration_days": 10,
      "total_data": "10GB",
      "price": 750,
      "currency": "TWD",
      "speed_policy": "4G/LTE",
      "sharing_supported": false,
      "notes": []
    }
  ],
  "updateExisting": true             // 可選，設為 true 時啟用更新模式
}`}
                  </pre>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  <strong>注意：</strong> 您可以使用國家名稱（例如「日本」）或國家代碼（例如「JP」）來指定方案的國家，無需提供 countryId。
                  系統會自動查找匹配的國家。
                </p>
              </div>
              
              <form onSubmit={handleImportSubmit}>
                <div className="mb-4">
                  <label htmlFor="import-data" className="block text-sm font-medium text-gray-700 mb-1">
                    JSON 資料
                  </label>
                  <textarea
                    id="import-data"
                    rows={10}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={importData}
                    onChange={handleImportDataChange}
                    placeholder="請輸入 JSON 格式的資料"
                  />
                </div>
                
                {importError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                    <p className="text-sm">{importError}</p>
                  </div>
                )}
                
                {importResult && (
                  <div className={`mb-4 p-3 ${importResult.success ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'} rounded-md`}>
                    <h3 className="font-medium text-sm mb-1">匯入結果</h3>
                    <ul className="text-sm list-disc list-inside">
                      <li>新增國家: {importResult.countriesAdded}</li>
                      <li>略過國家: {importResult.countriesSkipped}</li>
                      <li>新增方案: {importResult.plansAdded}</li>
                      <li>更新方案: {importResult.plansUpdated || 0}</li>
                      <li>略過方案: {importResult.plansSkipped}</li>
                    </ul>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-sm">錯誤:</p>
                        <ul className="text-xs list-disc list-inside">
                          {importResult.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isImporting || !importData.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                  >
                    {isImporting ? '匯入中...' : '匯入資料'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Plan Tab */}
        {activeTab === 'custom' && (
          <div>
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">新增客製方案</h2>
              <p className="text-sm text-gray-600 mb-4">
                您可以為特定客戶建立客製方案，包含折扣價格和特殊條件。
              </p>
              
              <form onSubmit={handleCustomPlanSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Country */}
                  <div>
                    <label htmlFor="countryId" className="block text-sm font-medium text-gray-700 mb-1">
                      國家 *
                    </label>
                    <select
                      id="countryId"
                      name="countryId"
                      required
                      value={customPlan.countryId}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">選擇國家</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.flagIcon} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      方案名稱 *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      value={customPlan.title}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="例如: 每日3GB"
                    />
                  </div>
                  
                  {/* Carrier */}
                  <div>
                    <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
                      電信商 *
                    </label>
                    <input
                      type="text"
                      id="carrier"
                      name="carrier"
                      required
                      value={customPlan.carrier}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="例如: Docomo"
                    />
                  </div>
                  
                  {/* Carrier Logo */}
                  <div>
                    <label htmlFor="carrierLogo" className="block text-sm font-medium text-gray-700 mb-1">
                      電信商標誌 URL
                    </label>
                    <input
                      type="url"
                      id="carrierLogo"
                      name="carrierLogo"
                      value={customPlan.carrierLogo || ''}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  
                  {/* Plan Type */}
                  <div>
                    <label htmlFor="plan_type" className="block text-sm font-medium text-gray-700 mb-1">
                      計費方式 *
                    </label>
                    <select
                      id="plan_type"
                      name="plan_type"
                      required
                      value={customPlan.plan_type}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="daily">每日計費</option>
                      <option value="total">總量計費</option>
                    </select>
                  </div>
                  
                  {/* SIM Type */}
                  <div>
                    <label htmlFor="sim_type" className="block text-sm font-medium text-gray-700 mb-1">
                      SIM 卡類型 *
                    </label>
                    <select
                      id="sim_type"
                      name="sim_type"
                      required
                      value={customPlan.sim_type}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="esim">eSIM</option>
                      <option value="physical">實體 SIM</option>
                    </select>
                  </div>
                  
                  {/* Duration */}
                  <div>
                    <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700 mb-1">
                      天數 *
                    </label>
                    <input
                      type="number"
                      id="duration_days"
                      name="duration_days"
                      required
                      min="1"
                      value={customPlan.duration_days}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Data Amount */}
                  {customPlan.plan_type === 'daily' ? (
                    <div>
                      <label htmlFor="data_per_day" className="block text-sm font-medium text-gray-700 mb-1">
                        每日數據量 *
                      </label>
                      <input
                        type="text"
                        id="data_per_day"
                        name="data_per_day"
                        required
                        value={customPlan.data_per_day || ''}
                        onChange={handleCustomPlanChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="例如: 3GB"
                      />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="total_data" className="block text-sm font-medium text-gray-700 mb-1">
                        總數據量 *
                      </label>
                      <input
                        type="text"
                        id="total_data"
                        name="total_data"
                        required
                        value={customPlan.total_data || ''}
                        onChange={handleCustomPlanChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="例如: 10GB"
                      />
                    </div>
                  )}
                  
                  {/* Original Price */}
                  <div>
                    <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      原價
                    </label>
                    <input
                      type="number"
                      id="originalPrice"
                      name="originalPrice"
                      min="0"
                      value={customPlan.originalPrice || ''}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Discount */}
                  <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">
                      折扣 (%)
                    </label>
                    <input
                      type="number"
                      id="discount"
                      name="discount"
                      min="0"
                      max="100"
                      value={customPlan.discount || ''}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Price */}
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      售價 *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      required
                      min="0"
                      value={customPlan.price}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Currency */}
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                      貨幣
                    </label>
                    <input
                      type="text"
                      id="currency"
                      name="currency"
                      value={customPlan.currency}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="例如: TWD"
                    />
                  </div>
                  
                  {/* Speed Policy */}
                  <div>
                    <label htmlFor="speed_policy" className="block text-sm font-medium text-gray-700 mb-1">
                      速度政策
                    </label>
                    <input
                      type="text"
                      id="speed_policy"
                      name="speed_policy"
                      value={customPlan.speed_policy}
                      onChange={handleCustomPlanChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="例如: 正常速度"
                    />
                  </div>
                  
                  {/* Sharing Supported */}
                  <div className="flex items-center h-10 mt-6">
                    <input
                      type="checkbox"
                      id="sharing_supported"
                      name="sharing_supported"
                      checked={customPlan.sharing_supported}
                      onChange={handleCustomPlanChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sharing_supported" className="ml-2 block text-sm text-gray-700">
                      支援分享
                    </label>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">客戶資訊</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer ID */}
                    <div>
                      <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
                        客戶 ID
                      </label>
                      <input
                        type="text"
                        id="customerId"
                        name="customerId"
                        value={customPlan.customerId || ''}
                        onChange={handleCustomPlanChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    {/* Customer Name */}
                    <div>
                      <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                        客戶名稱
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        name="customerName"
                        value={customPlan.customerName || ''}
                        onChange={handleCustomPlanChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    {/* Expiry Date */}
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                        優惠到期日
                      </label>
                      <input
                        type="date"
                        id="expiryDate"
                        name="expiryDate"
                        value={customPlan.expiryDate || ''}
                        onChange={handleCustomPlanChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                {customPlanResult && (
                  <div className={`mt-6 p-3 ${customPlanResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} rounded-md`}>
                    <p className="text-sm">{customPlanResult.message}</p>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isAddingCustomPlan}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                  >
                    {isAddingCustomPlan ? '新增中...' : '新增客製方案'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
