'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiff } from './LiffProvider';
import { useCart } from '../hooks/useCart';
import Image from 'next/image';

export default function Navigation() {
  const pathname = usePathname();
  const { liff, isLoggedIn } = useLiff();
  const { cart } = useCart();

  // Skip navigation on the main LIFF page
  if (pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link 
            href="/countries"
            className="font-bold text-xl text-slate-700 flex items-center space-x-2"
          >
            <Image src="/wuge_logo.avif" alt="吳哥舖" width={32} height={32} />
            <span>吳哥舖全球上網卡</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/countries"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                pathname === '/countries' || pathname.startsWith('/country/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              國家
            </Link>
            
            <Link
              href="/cart"
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                pathname === '/cart' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              購物車
              {cart.length > 0 && (
                <span className="ml-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cart.length}
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
                className="px-4 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:bg-gray-100 flex items-center"
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
