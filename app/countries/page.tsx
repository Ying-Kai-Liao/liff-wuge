'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Country } from '../types';
import TravelLayout from '../components/TravelLayout';

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
    <TravelLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">選擇您的目的地</h2>
        <p className="text-gray-600">瀏覽各國可用的 eSIM 方案，為您的旅程做好準備</p>
      </div>
      {renderContent()}
    </TravelLayout>
  );
}
