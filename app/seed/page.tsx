'use client';

import { useState } from 'react';
import Link from 'next/link';

type SeedResult = {
  success: boolean;
  message: string;
} | null;

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult>(null);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      setSeedResult(null);
      
      // Call the API endpoint instead of directly calling Firebase
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      setSeedResult({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      setSeedResult({
        success: false,
        message: '填充資料庫時發生錯誤：' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">填充 eSIM 目錄資料</h1>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">⚠️ 警告</h2>
        <p className="mb-2">
          此操作將向資料庫添加示例數據。如果您已經有數據，這可能會導致重複項。
        </p>
        <p>
          建議僅在空數據庫上使用此功能。
        </p>
      </div>
      
      <button
        onClick={handleSeed}
        disabled={isSeeding}
        className={`w-full py-3 rounded-lg font-medium ${
          isSeeding 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isSeeding ? '填充中...' : '填充示例數據'}
      </button>
      
      {seedResult && (
        <div className={`mt-6 p-4 rounded-lg ${
          seedResult.success 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <p>{seedResult.message}</p>
          
          {seedResult.success && (
            <div className="mt-4">
              <Link 
                href="/countries"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mr-2"
              >
                瀏覽國家目錄
              </Link>
              
              <Link 
                href="/seed-japan-plans"
                className="inline-block px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
              >
                添加日本KDDI方案
              </Link>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">其他種子資料選項</h2>
        <div className="grid gap-4">
          <Link 
            href="/seed-japan-plans"
            className="block p-4 bg-white dark:bg-gray-800 border rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-lg">日本KDDI方案</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              添加日本KDDI電信的eSIM和實體SIM卡方案，包含3天、4天和5天的每日500MB選項。
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
