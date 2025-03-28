'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedRoute from '../../components/ProtectedRoute';

type DataType = 'countries' | 'plans';

interface DataItem {
  id: string;
  name?: string;
  code?: string;
  flagIcon?: string;
  logo?: string;
  countryId?: string;
  country?: string;
  title?: string;
  carrier?: string;
  duration_days?: number;
  data_amount?: string;
  data_per_day?: string;
  total_data?: string;
  plan_type?: 'daily' | 'total';
  price?: number;
  currency?: string;
  sim_type?: 'esim' | 'physical';
  features?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState<DataType>('countries');
  const [data, setData] = useState<DataItem[]>([]);
  const [filteredData, setFilteredData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ id: string; loading: boolean } | null>(null);
  const [countries, setCountries] = useState<DataItem[]>([]);
  const [plans, setPlans] = useState<DataItem[]>([]);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('');
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [planToMigrate, setPlanToMigrate] = useState<DataItem | null>(null);
  const [targetCountryId, setTargetCountryId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<DataItem | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  
  // Batch operations state
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchMigrateModal, setShowBatchMigrateModal] = useState(false);
  const [batchTargetCountryId, setBatchTargetCountryId] = useState<string>('');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);
  
  // Fetch all data at once
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch countries
      const countriesResponse = await fetch(`/api/admin/data?type=countries`);
      if (!countriesResponse.ok) {
        throw new Error('Failed to fetch countries');
      }
      const countriesData = await countriesResponse.json() as DataItem[];
      setCountries(countriesData);
      
      // Fetch plans
      const plansResponse = await fetch(`/api/admin/data?type=plans`);
      if (!plansResponse.ok) {
        throw new Error('Failed to fetch plans');
      }
      const plansData = await plansResponse.json() as DataItem[];
      setPlans(plansData);
      
      // Set initial data based on active tab
      if (activeTab === 'countries') {
        setData(countriesData);
        setFilteredData(countriesData);
      } else {
        setData(plansData);
        setFilteredData(plansData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`無法載入資料，請稍後再試`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch specific data type
  const fetchData = useCallback(async (type: DataType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/data?type=${type}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch ${type}`);
      }
      
      const items = await response.json() as DataItem[];
      
      if (type === 'countries') {
        setCountries(items);
      } else if (type === 'plans') {
        setPlans(items);
      }
      
      setData(items);
      setFilteredData(items);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(`無法載入${getTypeLabel(type)}資料，請稍後再試`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle tab change
  useEffect(() => {
    if (activeTab === 'countries') {
      setData(countries);
      setFilteredData(countries);
    } else {
      setData(plans);
      
      // Apply country filter if one is selected
      if (selectedCountryFilter) {
        setFilteredData(plans.filter(plan => plan.countryId === selectedCountryFilter));
      } else {
        setFilteredData(plans);
      }
    }
    
    // Reset action result when changing tabs
    setActionResult(null);
  }, [activeTab, countries, plans, selectedCountryFilter]);
  
  // Handle sorting
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
    
    // Apply sorting to filtered data
    const sortedData = [...filteredData].sort((a, b) => {
      // Handle special cases for different data types
      if (a[key] === undefined || a[key] === null) return 1;
      if (b[key] === undefined || b[key] === null) return -1;
      
      // Handle numeric values
      if (typeof a[key] === 'number' && typeof b[key] === 'number') {
        return direction === 'ascending' 
          ? a[key] - b[key]
          : b[key] - a[key];
      }
      
      // Handle string values
      if (typeof a[key] === 'string' && typeof b[key] === 'string') {
        return direction === 'ascending'
          ? a[key].localeCompare(b[key])
          : b[key].localeCompare(a[key]);
      }
      
      // Handle boolean values
      if (typeof a[key] === 'boolean' && typeof b[key] === 'boolean') {
        return direction === 'ascending'
          ? (a[key] === b[key] ? 0 : a[key] ? 1 : -1)
          : (a[key] === b[key] ? 0 : a[key] ? -1 : 1);
      }
      
      return 0;
    });
    
    setFilteredData(sortedData);
  };
  
  // Get sort direction indicator
  const getSortDirectionIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    
    return sortConfig.direction === 'ascending' 
      ? <span className="ml-1">▲</span> 
      : <span className="ml-1">▼</span>;
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm(`確定要刪除此${getTypeLabel(activeTab, true)}嗎？此操作無法復原。`)) {
      return;
    }

    setDeleteStatus({ id, loading: true });
    try {
      const response = await fetch(`/api/admin/data?type=${activeTab}&id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete item');
      }
      
      if (activeTab === 'countries') {
        setData(data.filter(item => item.id !== id));
        setFilteredData(filteredData.filter(item => item.id !== id));
        setCountries(data.filter(item => item.id !== id));
      } else {
        setData(data.filter(item => item.id !== id));
        setFilteredData(filteredData.filter(item => item.id !== id));
        setPlans(data.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error(`Error deleting ${activeTab} ${id}:`, err);
      alert(`刪除失敗：${err instanceof Error ? err.message : '未知錯誤'}`);
    } finally {
      setDeleteStatus(null);
    }
  };
  
  // Handle duplicate plan
  const handleDuplicatePlan = async (plan: DataItem) => {
    setIsProcessing(true);
    setActionResult(null);
    
    try {
      const response = await fetch('/api/admin/data/plan/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          changes: {
            title: `${plan.title} (複製)`
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate plan');
      }
      
      const result = await response.json();
      
      setActionResult({
        success: true,
        message: `成功複製方案 (ID: ${result.id})`
      });
      
      // Refresh plans list
      fetchData('plans');
    } catch (err) {
      console.error('Error duplicating plan:', err);
      setActionResult({
        success: false,
        message: `複製方案失敗：${err instanceof Error ? err.message : '未知錯誤'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle migrate plan
  const handleMigratePlan = async () => {
    if (!planToMigrate || !targetCountryId) {
      return;
    }
    
    setIsProcessing(true);
    setActionResult(null);
    
    try {
      const targetCountry = countries.find(c => c.id === targetCountryId);
      
      if (!targetCountry) {
        throw new Error('找不到目標國家');
      }
      
      const response = await fetch('/api/admin/data/plan/migrate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planToMigrate.id,
          newCountryId: targetCountryId,
          newCountryName: targetCountry.name
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to migrate plan');
      }
      
      const result = await response.json();
      
      setActionResult({
        success: true,
        message: `成功將方案移至 ${targetCountry.name} (ID: ${result.id})`
      });
      
      // Refresh plans list
      fetchData('plans');
      
      // Close modal
      setShowMigrateModal(false);
      setPlanToMigrate(null);
      setTargetCountryId('');
    } catch (err) {
      console.error('Error migrating plan:', err);
      setActionResult({
        success: false,
        message: `移動方案失敗：${err instanceof Error ? err.message : '未知錯誤'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      // Unselect all
      setSelectedPlans([]);
    } else {
      // Select all filtered plans
      setSelectedPlans(filteredData.map(plan => plan.id));
    }
    setSelectAll(!selectAll);
  };
  
  // Handle individual plan selection
  const handleSelectPlan = (planId: string) => {
    if (selectedPlans.includes(planId)) {
      // Remove from selection
      setSelectedPlans(selectedPlans.filter(id => id !== planId));
      setSelectAll(false);
    } else {
      // Add to selection
      setSelectedPlans([...selectedPlans, planId]);
      // Check if all plans are now selected
      if (selectedPlans.length + 1 === filteredData.length) {
        setSelectAll(true);
      }
    }
  };
  
  // Handle batch operations
  const handleBatchOperation = async (action: 'delete' | 'duplicate' | 'migrate') => {
    if (selectedPlans.length === 0) {
      setActionResult({
        success: false,
        message: '請先選擇要操作的方案'
      });
      return;
    }
    
    setIsProcessing(true);
    setActionResult(null);
    
    try {
      let requestData: any = {
        action,
        planIds: selectedPlans
      };
      
      // For migrate action, add target country info
      if (action === 'migrate') {
        const targetCountry = countries.find(c => c.id === batchTargetCountryId);
        
        if (!targetCountry) {
          throw new Error('找不到目標國家');
        }
        
        requestData.targetCountryId = batchTargetCountryId;
        requestData.targetCountryName = targetCountry.name;
      }
      
      // Call batch API
      const response = await fetch('/api/admin/data/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `批次操作失敗`);
      }
      
      const result = await response.json();
      
      // Show result message
      let message = '';
      switch (action) {
        case 'delete':
          message = `成功刪除 ${result.processed} 個方案`;
          break;
        case 'duplicate':
          message = `成功複製 ${result.processed} 個方案`;
          break;
        case 'migrate':
          message = `成功移動 ${result.processed} 個方案`;
          break;
      }
      
      if (result.failed > 0) {
        message += `，${result.failed} 個方案處理失敗`;
      }
      
      setActionResult({
        success: result.success,
        message
      });
      
      // Reset selection
      setSelectedPlans([]);
      setSelectAll(false);
      
      // Close modal if open
      setShowBatchMigrateModal(false);
      setBatchTargetCountryId('');
      
      // Refresh plans list
      fetchData('plans');
    } catch (err) {
      console.error(`Error in batch operation:`, err);
      setActionResult({
        success: false,
        message: `批次操作失敗：${err instanceof Error ? err.message : '未知錯誤'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeLabel = (type: DataType, singular = false): string => {
    switch (type) {
      case 'countries':
        return singular ? '國家' : '國家';
      case 'plans':
        return singular ? '方案' : '方案';
      default:
        return '資料';
    }
  };
  
  const getCountryName = (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : '未知國家';
  };
  
  const getSimTypeLabel = (simType?: string) => {
    switch (simType) {
      case 'esim':
        return 'eSIM';
      case 'physical':
        return '實體SIM卡';
      default:
        return '未知';
    }
  };

  // Get the appropriate data amount display based on plan type
  const getDataDisplay = (plan: DataItem) => {
    if (plan.plan_type === 'daily' && plan.data_per_day) {
      return `${plan.data_per_day}/天`;
    } else if (plan.plan_type === 'total' && plan.total_data) {
      return `${plan.total_data} 總量`;
    } else if (plan.data_amount) {
      // Fallback to data_amount for backward compatibility
      return plan.data_amount;
    }
    return '未指定';
  };

  // Handle edit mode toggle
  const handleEditClick = (item: DataItem) => {
    setItemToEdit(item);
    setEditFormData({...item});
    setEditMode(true);
  };
  
  // Handle edit form input changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData((prev: Record<string, any>) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setEditFormData((prev: Record<string, any>) => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setEditFormData((prev: Record<string, any>) => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemToEdit) return;
    
    setIsProcessing(true);
    setActionResult(null);
    
    try {
      const response = await fetch('/api/admin/data/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: activeTab,
          id: itemToEdit.id,
          data: editFormData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失敗');
      }
      
      const result = await response.json();
      
      // Update local data
      if (activeTab === 'countries') {
        const updatedCountries = countries.map(country => 
          country.id === itemToEdit.id ? {...country, ...editFormData} : country
        );
        setCountries(updatedCountries);
        setData(updatedCountries);
        setFilteredData(updatedCountries);
      } else {
        const updatedPlans = plans.map(plan => 
          plan.id === itemToEdit.id ? {...plan, ...editFormData} : plan
        );
        setPlans(updatedPlans);
        setData(updatedPlans);
        
        // Apply country filter if one is selected
        if (selectedCountryFilter) {
          setFilteredData(updatedPlans.filter(plan => plan.countryId === selectedCountryFilter));
        } else {
          setFilteredData(updatedPlans);
        }
      }
      
      setActionResult({
        success: true,
        message: `${getTypeLabel(activeTab, true)}更新成功`
      });
      
      // Exit edit mode
      setEditMode(false);
      setItemToEdit(null);
    } catch (err) {
      console.error(`Error updating ${activeTab}:`, err);
      setActionResult({
        success: false,
        message: `更新失敗：${err instanceof Error ? err.message : '未知錯誤'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setItemToEdit(null);
    setActionResult(null);
  };

  const renderDataTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4">
          {error}
        </div>
      );
    }

    if (filteredData.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative my-4">
          {selectedCountryFilter && activeTab === 'plans' 
            ? `此國家下沒有${getTypeLabel(activeTab)}` 
            : `沒有${getTypeLabel(activeTab)}資料`}
        </div>
      );
    }

    if (activeTab === 'countries') {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => requestSort('flagIcon')} 
                    className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    國旗
                    {getSortDirectionIndicator('flagIcon')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => requestSort('name')} 
                    className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    國家名稱
                    {getSortDirectionIndicator('name')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => requestSort('code')} 
                    className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    國家代碼
                    {getSortDirectionIndicator('code')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => requestSort('planCount')} 
                    className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    方案數量
                    {getSortDirectionIndicator('planCount')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((country) => (
                <tr key={country.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-2xl">
                    {country.flagIcon || '🏳️'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{country.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{country.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => {
                        setActiveTab('plans');
                        setSelectedCountryFilter(country.id);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      查看方案 ({plans.filter(plan => plan.countryId === country.id).length})
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEditClick(country)}
                        className="group relative text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 flex items-center justify-center"
                        title="編輯"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                          編輯
                        </span>
                      </button>
                      <button
                        onClick={() => handleDelete(country.id)}
                        disabled={deleteStatus?.id === country.id && deleteStatus.loading}
                        className="group relative text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 flex items-center justify-center"
                        title="刪除"
                      >
                        {deleteStatus?.id === country.id && deleteStatus.loading ? (
                          <span className="text-xs">處理中...</span>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                              刪除
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'plans') {
      return (
        <div>
          {/* Country filter for plans */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="w-full sm:w-1/2 mb-3 sm:mb-0">
                <label htmlFor="country-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  按國家篩選
                </label>
                <div className="flex">
                  <select
                    id="country-filter"
                    value={selectedCountryFilter}
                    onChange={(e) => setSelectedCountryFilter(e.target.value)}
                    className="mr-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">所有國家</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.flagIcon} {country.name} ({plans.filter(plan => plan.countryId === country.id).length})
                      </option>
                    ))}
                  </select>
                  {selectedCountryFilter && (
                    <button
                      onClick={() => setSelectedCountryFilter('')}
                      className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md text-sm"
                    >
                      清除篩選
                    </button>
                  )}
                </div>
              </div>
              
              <div className="w-full sm:w-auto">
                <div className="flex items-center justify-end">
                  <span className="text-sm text-gray-500 mr-2">
                    {filteredData.length} 個方案
                    {selectedCountryFilter && ` (${countries.find(c => c.id === selectedCountryFilter)?.name || '未知國家'})`}
                  </span>
                  <button
                    onClick={() => fetchAllData()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    刷新
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Batch operations toolbar */}
          {filteredData.length > 0 && (
            <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-700">
                  已選擇 {selectedPlans.length} / {filteredData.length} 個方案
                </span>
                {selectedPlans.length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBatchOperation('duplicate')}
                      disabled={isProcessing}
                      className="group relative bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-md disabled:opacity-50 flex items-center justify-center"
                      title="批次複製"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        批次複製
                      </span>
                    </button>
                    <button
                      onClick={() => setShowBatchMigrateModal(true)}
                      disabled={isProcessing}
                      className="group relative bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-md disabled:opacity-50 flex items-center justify-center"
                      title="批次移動"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        批次移動
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`確定要刪除選中的 ${selectedPlans.length} 個方案嗎？此操作無法復原。`)) {
                          handleBatchOperation('delete');
                        }
                      }}
                      disabled={isProcessing}
                      className="group relative bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-md disabled:opacity-50 flex items-center justify-center"
                      title="批次刪除"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        批次刪除
                      </span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedPlans([])}
                disabled={selectedPlans.length === 0 || isProcessing}
                className="text-gray-600 hover:text-gray-800 text-sm disabled:opacity-50"
              >
                清除選擇
              </button>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('title')} 
                      className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      方案名稱
                      {getSortDirectionIndicator('title')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('country')} 
                      className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      國家
                      {getSortDirectionIndicator('country')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('carrier')} 
                      className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      電信商
                      {getSortDirectionIndicator('carrier')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('sim_type')} 
                      className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      類型
                      {getSortDirectionIndicator('sim_type')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('plan_type')} 
                      className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      計費方式
                      {getSortDirectionIndicator('plan_type')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('duration_days')} 
                      className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      天數
                      {getSortDirectionIndicator('duration_days')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('total_amount')} 
                      className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      數據量
                      {getSortDirectionIndicator('total_amount')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('price')} 
                      className="flex items-center font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      價格
                      {getSortDirectionIndicator('price')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-2 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedPlans.includes(plan.id)}
                        onChange={() => handleSelectPlan(plan.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plan.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xl mr-1">
                          {countries.find(c => c.id === plan.countryId)?.flagIcon || '🏳️'}
                        </span>
                        <div className="text-sm font-medium text-gray-900">
                          {plan.country || getCountryName(plan.countryId || '')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{plan.carrier}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        plan.sim_type === 'esim' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getSimTypeLabel(plan.sim_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        plan.plan_type === 'daily' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {plan.plan_type === 'daily' ? '每日計費' : '總量計費'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.duration_days} 天
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDataDisplay(plan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      NT$ {plan.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditClick(plan)}
                          className="group relative text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 flex items-center justify-center"
                          title="編輯"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                            編輯
                          </span>
                        </button>
                        <button
                          onClick={() => handleDuplicatePlan(plan)}
                          disabled={deleteStatus?.id === plan.id && deleteStatus.loading}
                          className="group relative text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 flex items-center justify-center"
                          title="複製"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                            複製
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setPlanToMigrate(plan);
                            setShowMigrateModal(true);
                          }}
                          disabled={deleteStatus?.id === plan.id && deleteStatus.loading}
                          className="group relative text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 flex items-center justify-center"
                          title="移動"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                            移動
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          disabled={deleteStatus?.id === plan.id && deleteStatus.loading}
                          className="group relative text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 flex items-center justify-center"
                          title="刪除"
                        >
                          {deleteStatus?.id === plan.id && deleteStatus.loading ? (
                            <span className="text-xs">處理中...</span>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                刪除
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  const handleExportData = () => {
    // Prepare data for export based on current tab and filters
    let dataToExport;
    let filename;
    
    if (activeTab === 'countries') {
      dataToExport = filteredData;
      filename = 'countries-export.json';
    } else {
      // For plans, include country information
      dataToExport = filteredData.map(plan => {
        const country = countries.find(c => c.id === plan.countryId);
        return {
          ...plan,
          countryName: country?.name || '',
          countryCode: country?.code || '',
          countryFlagIcon: country?.flagIcon || ''
        };
      });
      filename = 'plans-export.json';
    }
    
    // Create a Blob with the data
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    
    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };
  
  const handleExportAllData = () => {
    // Prepare data in the format expected by the import API
    const exportData = {
      countries: countries,
      plans: plans
    };
    
    // Create a Blob with the data
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    
    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all-data-export.json';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  const renderCountryEditForm = () => {
    if (!itemToEdit) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">編輯國家</h3>
            
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    國家名稱
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editFormData.name || ''}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    國家代碼
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={editFormData.code || ''}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="flagIcon" className="block text-sm font-medium text-gray-700 mb-1">
                    國旗圖示
                  </label>
                  <input
                    type="text"
                    id="flagIcon"
                    name="flagIcon"
                    value={editFormData.flagIcon || ''}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="例如: 🇯🇵"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={editFormData.description || ''}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              {actionResult && (
                <div className={`mt-4 p-3 ${actionResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} rounded-md`}>
                  <p className="text-sm">{actionResult.message}</p>
                </div>
              )}
              
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isProcessing ? '處理中...' : '儲存變更'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };
  
  const renderPlanEditForm = () => {
    if (!itemToEdit) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">編輯方案</h3>
            
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    方案名稱
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={editFormData.title || ''}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="countryId" className="block text-sm font-medium text-gray-700 mb-1">
                    國家
                  </label>
                  <select
                    id="countryId"
                    name="countryId"
                    value={editFormData.countryId || ''}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="">選擇國家</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.flagIcon} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
                    電信商
                  </label>
                  <input
                    type="text"
                    id="carrier"
                    name="carrier"
                    value={editFormData.carrier || ''}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="carrierLogo" className="block text-sm font-medium text-gray-700 mb-1">
                    電信商標誌 URL
                  </label>
                  <input
                    type="text"
                    id="carrierLogo"
                    name="carrierLogo"
                    value={editFormData.carrierLogo || ''}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="plan_type" className="block text-sm font-medium text-gray-700 mb-1">
                    計費方式
                  </label>
                  <select
                    id="plan_type"
                    name="plan_type"
                    value={editFormData.plan_type || 'daily'}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="daily">每日計費</option>
                    <option value="total">總量計費</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="sim_type" className="block text-sm font-medium text-gray-700 mb-1">
                    SIM 卡類型
                  </label>
                  <select
                    id="sim_type"
                    name="sim_type"
                    value={editFormData.sim_type || 'esim'}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="esim">eSIM</option>
                    <option value="physical">實體 SIM</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700 mb-1">
                    天數
                  </label>
                  <input
                    type="number"
                    id="duration_days"
                    name="duration_days"
                    value={editFormData.duration_days || 0}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                    min="1"
                  />
                </div>
                
                {editFormData.plan_type === 'daily' ? (
                  <div>
                    <label htmlFor="data_per_day" className="block text-sm font-medium text-gray-700 mb-1">
                      每日數據量
                    </label>
                    <input
                      type="text"
                      id="data_per_day"
                      name="data_per_day"
                      value={editFormData.data_per_day || ''}
                      onChange={handleEditInputChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="total_data" className="block text-sm font-medium text-gray-700 mb-1">
                      總數據量
                    </label>
                    <input
                      type="text"
                      id="total_data"
                      name="total_data"
                      value={editFormData.total_data || ''}
                      onChange={handleEditInputChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    價格
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={editFormData.price || 0}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                    min="0"
                  />
                </div>
                
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    貨幣
                  </label>
                  <input
                    type="text"
                    id="currency"
                    name="currency"
                    value={editFormData.currency || 'TWD'}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="speed_policy" className="block text-sm font-medium text-gray-700 mb-1">
                    速度政策
                  </label>
                  <input
                    type="text"
                    id="speed_policy"
                    name="speed_policy"
                    value={editFormData.speed_policy || ''}
                    onChange={handleEditInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="flex items-center h-10 mt-6">
                  <input
                    type="checkbox"
                    id="sharing_supported"
                    name="sharing_supported"
                    checked={editFormData.sharing_supported || false}
                    onChange={handleEditInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sharing_supported" className="ml-2 block text-sm text-gray-700">
                    支援分享
                  </label>
                </div>
              </div>
              
              {actionResult && (
                <div className={`mt-4 p-3 ${actionResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} rounded-md`}>
                  <p className="text-sm">{actionResult.message}</p>
                </div>
              )}
              
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isProcessing ? '處理中...' : '儲存變更'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">eSIM 管理後台</h1>
                </div>
                <div className="ml-6 flex space-x-8">
                  <Link
                    href="/admin"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    返回控制台
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="py-10">
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">資料管理</h1>
            </div>
          </header>
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="px-4 py-8 sm:px-0">
                <div className="flex justify-between mb-6">
                  <div>
                    <nav className="flex space-x-4" aria-label="Tabs">
                      <button
                        onClick={() => {
                          setActiveTab('countries');
                          setSelectedCountryFilter('');
                        }}
                        className={`${
                          activeTab === 'countries'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        國家
                      </button>
                      <button
                        onClick={() => setActiveTab('plans')}
                        className={`${
                          activeTab === 'plans'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        方案
                      </button>
                    </nav>
                  </div>
                  <div>
                    <Link
                      href="/admin/data/add"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      新增{getTypeLabel(activeTab, true)}
                    </Link>
                  </div>
                </div>
                
                {/* Action result message */}
                {actionResult && (
                  <div className={`mb-6 p-4 rounded-md ${actionResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {actionResult.message}
                  </div>
                )}

                {renderDataTable()}
              </div>
            </div>
          </main>
        </div>
        
        {/* Migrate Plan Modal */}
        {showMigrateModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        移動方案至其他國家
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4">
                          您正在移動方案：<span className="font-semibold">{planToMigrate?.title}</span>
                        </p>
                        <div className="mb-4">
                          <label htmlFor="target-country" className="block text-sm font-medium text-gray-700 mb-1">
                            選擇目標國家
                          </label>
                          <select
                            id="target-country"
                            value={targetCountryId}
                            onChange={(e) => setTargetCountryId(e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          >
                            <option value="">選擇國家</option>
                            {countries
                              .filter(country => country.id !== planToMigrate?.countryId)
                              .map((country) => (
                                <option key={country.id} value={country.id}>
                                  {country.flagIcon} {country.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <p className="text-sm text-gray-500">
                          注意：這將創建一個新的方案，並保留原始方案。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="button" 
                    onClick={handleMigratePlan}
                    disabled={!targetCountryId || isProcessing}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isProcessing ? '處理中...' : '確認移動'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowMigrateModal(false);
                      setPlanToMigrate(null);
                      setTargetCountryId('');
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Batch Migrate Modal */}
        {showBatchMigrateModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        批次移動方案至其他國家
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4">
                          您正在移動 {selectedPlans.length} 個方案
                        </p>
                        <div className="mb-4">
                          <label htmlFor="batch-target-country" className="block text-sm font-medium text-gray-700 mb-1">
                            選擇目標國家
                          </label>
                          <select
                            id="batch-target-country"
                            value={batchTargetCountryId}
                            onChange={(e) => setBatchTargetCountryId(e.target.value)}
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
                        <p className="text-sm text-gray-500">
                          注意：這將為每個方案創建一個新的副本，並保留原始方案。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="button" 
                    onClick={() => handleBatchOperation('migrate')}
                    disabled={!batchTargetCountryId || isProcessing}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isProcessing ? '處理中...' : '確認移動'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowBatchMigrateModal(false);
                      setBatchTargetCountryId('');
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit modals */}
        {editMode && activeTab === 'countries' && renderCountryEditForm()}
        {editMode && activeTab === 'plans' && renderPlanEditForm()}
        
        {/* Export buttons */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab === 'countries' ? '國家管理' : '方案管理'}
            </h2>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0">
              {activeTab === 'plans' && (
                <div className="relative">
                  <select
                    value={selectedCountryFilter}
                    onChange={(e) => setSelectedCountryFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">所有國家</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.flagIcon} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={handleExportData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  匯出{activeTab === 'countries' ? '國家' : '方案'}
                </button>
                
                <button
                  onClick={handleExportAllData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  匯出全部資料
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
