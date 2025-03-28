'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../hooks/useCart';

interface TravelLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export default function TravelLayout({ 
  children, 
  title, 
  showBackButton = false,
  backUrl = '/'
}: TravelLayoutProps) {
  const pathname = usePathname();
  const { cart } = useCart();
  
  // Determine if we're on the home page to show a special header
  const isHomePage = pathname === '/';
  const isCartPage = pathname === '/cart';
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Hero header for home page */}
      {isHomePage && (
        <div className="relative bg-cover bg-center h-64 mb-6" 
             style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1488085061387-422e29b40080?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80")' }}>
          <div className="absolute inset-0 bg-blue-700/60"></div>
          <div className="relative h-full flex flex-col justify-center items-center text-white p-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">環遊世界，隨時連線</h1>
            <p className="text-lg md:text-xl max-w-2xl">
              選擇您的目的地，探索最適合您旅行需求的 eSIM 方案
            </p>
          </div>
        </div>
      )}
      
      {/* Regular header for other pages */}
      {/* {!isHomePage && (
        <header className="bg-white shadow-sm py-4 px-4 mb-6">
          <div className="container mx-auto max-w-5xl flex justify-between items-center">
            <div className="flex items-center">
              {showBackButton && (
                <Link href={backUrl} className="mr-3 text-blue-600 hover:text-blue-800">
                  <span className="text-xl">←</span>
                </Link>
              )}
              {title && <h1 className="text-xl font-bold text-gray-800">{title}</h1>}
            </div>
            
            {!isCartPage && (
              <Link 
                href="/cart"
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <span className="mr-2">🛒</span>
                <span>購物車 ({cart.length})</span>
              </Link>
            )}
          </div>
        </header>
      )} */}

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-blue-700 text-white py-10">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">吳哥舖全球上網卡</h3>
              <p className="text-blue-100">為您的旅行提供最佳連線體驗</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-white hover:text-blue-100 transition-colors">
                關於我們
              </a>
              <a href="#" className="text-white hover:text-blue-100 transition-colors">
                聯絡我們
              </a>
              <a href="#" className="text-white hover:text-blue-100 transition-colors">
                常見問題
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-blue-600 text-center text-blue-100 text-sm">
            &copy; {new Date().getFullYear()} 吳哥舖全球上網卡. 版權所有. Developed by <a href="https://github.com/ykliao" className="underline hover:text-white transition-colors">Ying-Kai Liao</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
