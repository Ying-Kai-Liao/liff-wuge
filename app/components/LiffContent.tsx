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
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl" role="img" aria-label={country.name}>
                    {country.flagIcon}
                  </span>
                  <h2 className="text-xl font-semibold">{country.name}</h2>
                </div>
                <p className="text-gray-600">{country.description}</p>
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
      <header className="bg-white shadow-sm py-4 px-4 mb-6">
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">環球 eSIM 服務</h1>
          </div>
          
          {!isLoggedIn ? (
            <button
              onClick={handleLogin}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <span className="mr-2">LINE</span>
              <span>登入</span>
            </button>
          ) : (
            <div className="flex items-center">
              <span className="mr-2 text-gray-700">{profile?.displayName || 'User'}</span>
              {/* Admin button - only shown for admin users */}
              {isAdmin && (
                <Link href="/admin" className="ml-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors text-sm">
                  管理後台
                </Link>
              )}
              <Link href="/cart" className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm">
                購物車
              </Link>
            </div>
          )}
        </div>
      </header>
      
      {/* Hero section */}
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
      
      {/* Main content */}
      <main className="container mx-auto max-w-5xl px-4 pb-20">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">選擇您的目的地</h2>
          <p className="text-gray-600">瀏覽各國可用的 eSIM 方案，為您的旅程做好準備</p>
        </div>
        
        {renderCountries()}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">環球 eSIM 服務</h3>
              <p className="text-gray-300">為您的旅行提供最佳連線體驗</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
            {new Date().getFullYear()} 環球 eSIM 服務. 版權所有.
          </div>
        </div>
      </footer>
    </div>
  );
}
