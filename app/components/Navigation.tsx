'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiff } from './LiffProvider';
import { useInquiry } from '../hooks/useInquiry';

export default function Navigation() {
  const pathname = usePathname();
  const { liff, isLoggedIn } = useLiff();
  const { inquiryList } = useInquiry();

  // Skip navigation on the main LIFF page
  if (pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link 
            href="/countries"
            className="font-bold text-xl text-blue-600 dark:text-blue-400"
          >
            eSIM 目錄
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/countries"
              className={`px-3 py-1 rounded-md ${
                pathname === '/countries' || pathname.startsWith('/country/') 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              國家
            </Link>
            
            <Link
              href="/inquiry"
              className={`px-3 py-1 rounded-md relative ${
                pathname === '/inquiry' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              詢問清單
              {inquiryList.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {inquiryList.length}
                </span>
              )}
            </Link>
            
            {isLoggedIn && liff?.isInClient() && (
              <button
                onClick={() => {
                  if (liff) {
                    liff.closeWindow();
                  }
                }}
                className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-800"
              >
                關閉
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
