'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Country } from '../types';
import TravelLayout from '../components/TravelLayout';

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006A71]"></div>
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
        <div className="bg-[#F2EFE7] border border-[#9ACBD0] text-[#006A71] px-4 py-3 rounded">
          <p>目前沒有可用的國家資料</p>
        </div>
      );
    }

    const filteredCountries = countries.filter(country => 
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filteredCountries.length === 0) {
      return (
        <div className="bg-[#F2EFE7] border border-[#9ACBD0] text-[#006A71] px-4 py-3 rounded">
          <p>沒有符合搜尋條件的國家</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredCountries.map((country) => (
          <Link 
            href={`/country/${country.id}`}
            key={country.id}
            className="block transform transition duration-300 hover:scale-105"
          >
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg h-full">
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-auto">
                  <span className="text-4xl" role="img" aria-label={country.name}>
                    {country.flagIcon}
                  </span>
                  <span className="text-lg font-semibold text-[#006A71]">{country.name}</span>
                </div>
                {/* <p className="text-gray-600 line-clamp-2 mb-auto">{country.description}</p>
                <div className="mt-4 flex justify-end">
                  <span className="inline-flex items-center text-[#48A6A7] text-sm font-medium">
                    查看方案 <span className="ml-1">→</span>
                  </span>
                </div> */}
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <TravelLayout title="國家列表">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#006A71] mb-4">選擇您的目的地</h1>
        <p className="text-gray-600">
          選擇您的旅行目的地，查看適合您的SIM卡方案。我們提供全球多個國家的上網方案，讓您隨時保持連線。
        </p>
      </div>
      
      {/* Search and filter */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="搜尋國家..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 border border-[#9ACBD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48A6A7] bg-white"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#48A6A7]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {renderContent()}
    </TravelLayout>
  );
}
