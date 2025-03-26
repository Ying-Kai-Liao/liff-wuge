'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedRoute from '../../components/ProtectedRoute';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type DataType = 'countries' | 'carriers' | 'plans';

interface DataItem {
  id: string;
  name?: string;
  code?: string;
  flagIcon?: string;
  logo?: string;
  countryId?: string;
  carrierId?: string;
  days?: number;
  dataAmount?: string;
  price?: number;
  currency?: string;
  [key: string]: string | number | boolean | undefined;
}

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState<DataType>('countries');
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ id: string; loading: boolean } | null>(null);

  const fetchData = useCallback(async (type: DataType) => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, type));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DataItem[];
      
      setData(items);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(`無法載入${getTypeLabel(type)}資料，請稍後再試`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm(`確定要刪除此${getTypeLabel(activeTab, true)}嗎？此操作無法復原。`)) {
      return;
    }

    setDeleteStatus({ id, loading: true });
    try {
      await deleteDoc(doc(db, activeTab, id));
      setData(data.filter(item => item.id !== id));
    } catch (err) {
      console.error(`Error deleting ${activeTab} ${id}:`, err);
      alert(`刪除失敗：${err instanceof Error ? err.message : '未知錯誤'}`);
    } finally {
      setDeleteStatus(null);
    }
  };

  const getTypeLabel = (type: DataType, singular = false): string => {
    switch (type) {
      case 'countries':
        return singular ? '國家' : '國家';
      case 'carriers':
        return singular ? '電信商' : '電信商';
      case 'plans':
        return singular ? '方案' : '方案';
      default:
        return '資料';
    }
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

    if (data.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          沒有找到{getTypeLabel(activeTab)}資料
        </div>
      );
    }

    return (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {activeTab === 'countries' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">國旗</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">國家代碼</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名稱</th>
                </>
              )}
              {activeTab === 'carriers' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名稱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">國家ID</th>
                </>
              )}
              {activeTab === 'plans' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">天數</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">數據量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">價格</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電信商ID</th>
                </>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id}>
                {activeTab === 'countries' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-xl">{item.flagIcon}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                  </>
                )}
                {activeTab === 'carriers' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.logo ? (
                        <div className="h-8 w-auto relative">
                          <Image 
                            src={item.logo} 
                            alt={item.name || 'Carrier logo'} 
                            width={32} 
                            height={32} 
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400">無圖片</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.countryId}</td>
                  </>
                )}
                {activeTab === 'plans' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">{item.days} 天</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.dataAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.price} {item.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.carrierId}</td>
                  </>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteStatus?.id === item.id && deleteStatus?.loading}
                    className={`text-red-600 hover:text-red-900 ${
                      deleteStatus?.id === item.id && deleteStatus?.loading
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {deleteStatus?.id === item.id && deleteStatus?.loading ? '刪除中...' : '刪除'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              </div>
              <div className="flex items-center">
                <Link
                  href="/admin"
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  返回控制台
                </Link>
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
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('countries')}
                      className={`${
                        activeTab === 'countries'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      國家
                    </button>
                    <button
                      onClick={() => setActiveTab('carriers')}
                      className={`${
                        activeTab === 'carriers'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      電信商
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

                {renderDataTable()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
