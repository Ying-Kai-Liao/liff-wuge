'use client';

import { useState, useEffect } from 'react';
import TravelLayout from '../components/TravelLayout';
import Link from 'next/link';
import { useAdmin } from '../hooks/useAdmin';
import Image from 'next/image';

type Menu = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  type: 'esim' | 'physical';
  updatedAt: any;
};

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAdmin();
  
  // Store the latest menu of each type
  const [esimMenu, setEsimMenu] = useState<Menu | null>(null);
  const [physicalMenu, setPhysicalMenu] = useState<Menu | null>(null);

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
        
        // Find the latest menu of each type
        const esimMenus = data.filter((menu: Menu) => menu.type === 'esim');
        const physicalMenus = data.filter((menu: Menu) => menu.type === 'physical');
        
        // Sort by updatedAt in descending order to get the latest
        if (esimMenus.length > 0) {
          esimMenus.sort((a: Menu, b: Menu) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setEsimMenu(esimMenus[0]);
        }
        
        if (physicalMenus.length > 0) {
          physicalMenus.sort((a: Menu, b: Menu) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setPhysicalMenu(physicalMenus[0]);
        }
      } catch (err) {
        console.error('Failed to load menus:', err);
        setError('無法載入目錄，請稍後再試');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMenus();
  }, []);

  return (
    <TravelLayout title="目錄">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#006A71] mb-2">方案目錄</h1>
        <p className="text-gray-600">查看我們的完整方案目錄</p>
      </div>
      
      {/* Admin actions */}
      {isAdmin && (
        <div className="mb-6 p-4 bg-[#F2EFE7] rounded-lg">
          <h2 className="font-semibold text-[#006A71] mb-2">管理員操作</h2>
          <div className="flex gap-2">
            <Link 
              href="/admin/menus" 
              className="px-4 py-2 bg-[#006A71] text-white rounded-lg hover:bg-[#004a4f] transition-colors"
            >
              管理目錄
            </Link>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006A71]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 mb-12">
          {/* eSIM Menu Button */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="relative h-48 bg-gradient-to-r from-[#48A6A7] to-[#006A71]">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image 
                  src="/esim_icon.png" 
                  alt="eSIM" 
                  width={100} 
                  height={100}
                  className="object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="text-white text-3xl font-bold">eSIM 數位卡</div>
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#006A71] mb-2">eSIM 數位卡目錄</h2>
              <p className="text-gray-600 mb-4">查看我們最新的 eSIM 數位卡方案與價格</p>
              
              {esimMenu ? (
                <a 
                  href={esimMenu.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full px-4 py-3 bg-[#006A71] text-white rounded-lg hover:bg-[#004a4f] transition-colors inline-flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  查看 eSIM 菜單
                </a>
              ) : (
                <div className="w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg text-center">
                  暫無 eSIM 菜單
                </div>
              )}
              
              {esimMenu && (
                <div className="mt-3 text-xs text-gray-500 text-right">
                  最後更新: {formatDate(esimMenu.updatedAt)}
                </div>
              )}
            </div>
          </div>
          
          {/* Physical SIM Menu Button */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="relative h-48 bg-gradient-to-r from-[#9ACBD0] to-[#48A6A7]">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image 
                  src="/sim_icon.png" 
                  alt="實體 SIM 卡" 
                  width={100} 
                  height={100}
                  className="object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="text-white text-3xl font-bold">實體 SIM 卡</div>
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#006A71] mb-2">實體 SIM 卡目錄</h2>
              <p className="text-gray-600 mb-4">查看我們最新的實體 SIM 卡方案與價格</p>
              
              {physicalMenu ? (
                <a 
                  href={physicalMenu.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full px-4 py-3 bg-[#006A71] text-white rounded-lg hover:bg-[#004a4f] transition-colors inline-flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  查看實體 SIM 卡目錄
                </a>
              ) : (
                <div className="w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg text-center">
                  暫無實體 SIM 卡目錄
                </div>
              )}
              
              {physicalMenu && (
                <div className="mt-3 text-xs text-gray-500 text-right">
                  最後更新: {formatDate(physicalMenu.updatedAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </TravelLayout>
  );
}
