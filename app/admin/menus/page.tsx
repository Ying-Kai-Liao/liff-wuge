'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';

type Menu = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  type: 'esim' | 'physical';
  updatedAt: any; // Update type to any to accommodate different date formats
};

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper function to format dates from Firestore
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '未知';
    
    // Handle Firestore timestamp objects
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('zh-TW');
    }
    
    // Handle ISO string dates
    if (typeof timestamp === 'string') {
      try {
        return new Date(timestamp).toLocaleDateString('zh-TW');
      } catch (e) {
        return '未知';
      }
    }
    
    // Handle seconds and nanoseconds format
    if (timestamp && timestamp.seconds) {
      try {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('zh-TW');
      } catch (e) {
        return '未知';
      }
    }
    
    return '未知';
  };

  useEffect(() => {
    async function loadMenus() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/menus');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setMenus(data);
      } catch (err) {
        console.error('Failed to load menus:', err);
        setError('無法載入目錄，請稍後再試');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMenus();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此目錄嗎？此操作無法復原。')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/menus/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Remove from state
      setMenus(menus.filter(menu => menu.id !== id));
    } catch (err) {
      console.error('Failed to delete menu:', err);
      alert('刪除失敗，請稍後再試');
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gray-50 pt-10">
        <div className="py-10">
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">目錄管理</h1>
              <div className="flex space-x-4">
                <Link
                  href="/admin"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  返回控制台
                </Link>
              </div>
            </div>
          </header>
          
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">所有目錄</h2>
                  <Link
                    href="/admin/menus/add"
                    className="px-4 py-2 bg-[#006A71] text-white rounded-md hover:bg-[#004a4f] transition-colors"
                  >
                    新增目錄
                  </Link>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006A71]"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    <p>{error}</p>
                  </div>
                ) : menus.length === 0 ? (
                  <div className="text-center py-12 bg-gray-100 rounded-lg">
                    <p className="text-gray-600">目前沒有目錄</p>
                    <Link
                      href="/admin/menus/add"
                      className="mt-4 inline-block px-4 py-2 bg-[#006A71] text-white rounded-md hover:bg-[#004a4f] transition-colors"
                    >
                      新增第一個目錄
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {menus.map(menu => (
                        <li key={menu.id}>
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    menu.type === 'esim' 
                                      ? 'bg-[#9ACBD0] text-[#006A71]' 
                                      : 'bg-[#48A6A7] text-white'
                                  }`}>
                                    {menu.type === 'esim' ? 'eSIM' : '實體 SIM'}
                                  </span>
                                </div>
                                <p className="ml-4 text-lg font-medium text-[#006A71] truncate">
                                  {menu.title}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <a 
                                  href={menu.pdfUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                >
                                  查看
                                </a>
                                <Link
                                  href={`/admin/menus/edit/${menu.id}`}
                                  className="px-3 py-1 bg-[#9ACBD0] text-[#006A71] rounded hover:bg-[#48A6A7] transition-colors"
                                >
                                  編輯
                                </Link>
                                <button
                                  onClick={() => handleDelete(menu.id)}
                                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                >
                                  刪除
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  {menu.description}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <p>
                                  最後更新: {formatDate(menu.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
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
