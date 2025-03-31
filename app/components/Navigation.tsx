'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiff } from './LiffProvider';
import { useCart } from '../hooks/useCart';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const { liff, isLoggedIn } = useLiff();
  const { cart } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const [isCartUpdated, setIsCartUpdated] = useState(false);

  // Update cart count with animation effect
  useEffect(() => {
    if (cart.length > cartCount) {
      // Cart items increased - trigger animation
      setIsCartUpdated(true);
      const timer = setTimeout(() => {
        setIsCartUpdated(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setCartCount(cart.length);
  }, [cart.length, cartCount]);

  // Skip navigation on the main LIFF page
  if (pathname === '/') {
    return null;
  }

  // Calculate total items in cart
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-[#F2EFE7]/70 backdrop-blur-md shadow-md fixed top-0 w-full z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link 
            href="/countries"
            className="font-bold text-xl text-[#006A71] flex items-center space-x-2"
          >
            <Image src="/wuge_logo.avif" alt="吳哥舖" width={32} height={32} />
            {/* <span>吳哥舖全球上網卡</span> */}
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/countries"
              className={`font-medium ${
                pathname === '/countries' || pathname.startsWith('/country/') 
                  ? 'text-[#006A71]' 
                  : 'text-gray-600 hover:text-[#006A71]'
              }`}
            >
              國家
            </Link>
            <Link
              href="/menus"
              className={`font-medium ${
                pathname === '/menus' ? 'text-[#006A71]' : 'text-gray-600 hover:text-[#006A71]'
              }`}
            >
              舊版目錄
            </Link>
            
            <Link
              href="/cart"
              className="relative flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#006A71]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              購物車
              {totalItems > 0 && (
                <span 
                  className={`absolute -top-2 -right-2 bg-[#006A71] text-white rounded-full min-w-5 h-5 flex items-center justify-center text-xs px-1 font-bold ${
                    isCartUpdated ? 'animate-bounce' : ''
                  }`}
                >
                  {totalItems}
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
                className="px-4 py-2 rounded-lg font-medium transition-colors text-[#48A6A7] hover:bg-[#F2EFE7] flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                關閉
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
