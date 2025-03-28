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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero header for home page */}
      {isHomePage && (
        <div className="relative bg-cover bg-center h-64 mb-6" 
             style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1488085061387-422e29b40080?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80")' }}>
          <div className="absolute inset-0 bg-blue-900/60"></div>
          <div className="relative h-full flex flex-col justify-center items-center text-white p-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">環遊世界，隨時連線</h1>
            <p className="text-lg md:text-xl max-w-2xl">
              選擇您的目的地，探索最適合您旅行需求的 eSIM 方案
            </p>
          </div>
        </div>
      )}
      
      {/* Regular header for other pages */}
      {!isHomePage && (
        <header className="bg-white shadow-sm py-4 px-4 mb-6">
          <div className="container mx-auto max-w-5xl flex justify-between items-center">
            <div className="flex items-center">
              {showBackButton && (
                <Link href={backUrl} className="mr-3 text-blue-600 hover:text-blue-800">
                  <span className="text-xl">←</span>
                </Link>
              )}
              {title && <h1 className="text-xl font-bold">{title}</h1>}
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
      )}
      
      <main className="container mx-auto max-w-5xl px-4 pb-20">
        {children}
      </main>
      
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">環球 eSIM 服務</h3>
              <p className="text-gray-300">為您的旅行提供最佳連線體驗</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/" className="text-gray-300 hover:text-white">
                國家目錄
              </Link>
              <Link href="/cart" className="text-gray-300 hover:text-white">
                購物車
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} 環球 eSIM 服務. 版權所有.
          </div>
        </div>
      </footer>
    </div>
  );
}
