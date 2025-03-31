'use client';

import React, { ReactNode } from 'react';
import Image from 'next/image';
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
    <div className="min-h-screen flex flex-col bg-[#F2EFE7]">
      {/* Hero header for home page */}
      {isHomePage && (
        <div className="relative bg-cover bg-center h-64 mb-6" 
             style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1488085061387-422e29b40080?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80")' }}>
          <div className="absolute inset-0 bg-[#006A71]/60"></div>
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
                <Link href={backUrl} className="mr-3 text-[#48A6A7] hover:text-[#006A71]">
                  <span className="text-xl">←</span>
                </Link>
              )}
              {title && <h1 className="text-xl font-bold text-[#006A71]">{title}</h1>}
            </div>
            
            {!isCartPage && (
              <Link 
                href="/cart"
                className="flex items-center bg-[#006A71] hover:bg-[#004a4f] text-white px-3 py-2 rounded-lg transition-colors"
              >
                <span className="mr-2">🛒</span>
                <span>購物車 ({cart.length})</span>
              </Link>
            )}
          </div>
        </header>
      )} */}

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6 pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#006A71] text-white py-10">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 flex flex-col items-center">
              <Image
                src="/wuge_logo.avif"
                alt="吳哥舖全球上網卡"
                width={100}
                height={100}
                className="mb-2"
              />
              <h3 className="text-xl font-bold mb-2">吳哥舖全球上網卡</h3>
              <p className="text-[#9ACBD0]">為您的旅行提供最佳連線<a href="/setup">體驗</a></p>
            </div>
            <div className="flex space-x-6">
              <a href="https://www.wuge.com.tw/pages/about-us" className="text-white hover:text-[#9ACBD0] transition-colors">
                關於我們
              </a>
              <a href="https://www.wuge.com.tw/pages/contact-us" className="text-white hover:text-[#9ACBD0] transition-colors">
                聯絡我們
              </a>
              <a href="https://www.wuge.com.tw/pages/esim-%E5%AE%89%E8%A3%9D%E6%AD%A5%E9%A9%9F" className="text-white hover:text-[#9ACBD0] transition-colors">
                常見問題
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[#48A6A7] text-center text-[#9ACBD0] text-sm">
            &copy; {new Date().getFullYear()} 吳哥舖全球上網卡版權所有. <br /> Developed by <a href="https://github.com/ykliao" className="underline hover:text-white transition-colors">Ying-Kai Liao</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
