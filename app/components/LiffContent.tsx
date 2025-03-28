'use client';

import { useLiff } from './LiffProvider';
import Image from "next/image";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Country } from '../types';
import { useAdmin } from '../hooks/useAdmin';

export default function LiffContent() {
  const { liff, liffError } = useLiff();
  const { isAdmin } = useAdmin();
  const [profile, setProfile] = useState<{ displayName?: string } | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (liff && liff.isLoggedIn()) {
      // Fetch profile data if user is logged in
      liff.getProfile()
        .then(userProfile => {
          setProfile(userProfile);
        })
        .catch(err => console.error("Error getting profile:", err));
    }
  }, [liff]);

  useEffect(() => {
    async function loadCountries() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/countries');
        
        if (!response.ok) {
          throw new Error('Failed to fetch countries');
        }
        
        const countriesData = await response.json();
        setCountries(countriesData);
        setError(null);
      } catch (err) {
        console.error('Error loading countries:', err);
        setError('Failed to load countries');
      } finally {
        setIsLoading(false);
      }
    }

    loadCountries();
  }, []);

  if (liffError) {
    return <p>LIFF initialization failed: {liffError}</p>;
  }

  if (!liff) {
    return <p>Loading LIFF...</p>;
  }

  const isLoggedIn = liff.isLoggedIn();
  
  const handleLogin = () => {
    if (!isLoggedIn) {
      liff.login();
    }
  };

  const renderCountries = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 mb-4 rounded-full bg-blue-200"></div>
            <div className="h-4 w-48 bg-blue-200 rounded"></div>
            <div className="mt-2 h-3 w-32 bg-blue-100 rounded"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      );
    }

    if (countries.length === 0) {
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>目前沒有可用的國家資料</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {countries.map((country) => (
          <Link 
            href={`/country/${country.id}`}
            key={country.id}
            className="block transform transition duration-300 hover:scale-105"
          >
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg h-full">
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl" role="img" aria-label={country.name}>
                    {country.flagIcon}
                  </span>
                  <span className="text-lg font-semibold">{country.name}</span>
                </div>
                <p className="text-gray-600 line-clamp-2 mb-auto">{country.description}</p>
                <div className="mt-4 flex justify-end">
                  <span className="inline-flex items-center text-blue-600 text-sm font-medium">
                    查看方案 <span className="ml-1">→</span>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-4 mb-6">
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-700">吳哥舖全球上網卡</h1>
          </div>
          
          {!isLoggedIn ? (
            <button
              onClick={handleLogin}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <span className="mr-2">LINE</span>
              <span>登入</span>
            </button>
          ) : (
            <div className="flex items-center">
              <span className="mr-2 text-gray-700 font-medium">{profile?.displayName || 'User'}</span>
              {/* Admin button - only shown for admin users */}
              {isAdmin && (
                <Link href="/admin" className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                  管理後台
                </Link>
              )}
              <Link href="/cart" className="ml-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                購物車
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl px-4 pb-12">
        {/* Hero Section */}
        <section className="mb-12">
          <div 
            className="bg-gradient-to-r from-blue-600/90 to-blue-800/90 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1488085061387-422e29b40080?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '300px'
            }}
          >
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">全球上網卡服務</h1>
              <p className="text-xl mb-6 text-white">為您的旅行提供最佳連線體驗，覆蓋全球各大熱門旅遊國家</p>
              {!isLoggedIn && (
                <button
                  onClick={handleLogin}
                  className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center"
                >
                  <span className="mr-2">使用 LINE 登入</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Countries Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">選擇您的目的地</h2>
            <Link href="/cart" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              <span>查看購物車</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          {renderCountries()}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-10">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">Copyright &copy; 吳哥舖全球上網卡 </h3>
              <p className="text-blue-200">為您的旅行提供最佳連線體驗</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-blue-800 text-center text-blue-300 text-sm">
            {new Date().getFullYear()} . &copy; 版權所有. Developed by <a href="https://github.com/ykliao" className="underline hover:text-white transition-colors">Ying-Kai Liao</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
