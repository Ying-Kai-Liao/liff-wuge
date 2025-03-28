'use client';

import { useState } from 'react';
import Link from 'next/link';
import TravelLayout from '../components/TravelLayout';

type SeedResult = {
  success: boolean;
  message: string;
  count?: number;
} | null;

export default function SeedJapanPlansPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult>(null);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      setSeedResult(null);
      
      // Call the API endpoint to seed Japan KDDI plans
      const response = await fetch('/api/seed-japan-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      setSeedResult({
        success: result.success,
        message: result.message,
        count: result.count
      });
    } catch (error) {
      console.error('Error seeding Japan KDDI plans:', error);
      setSeedResult({
        success: false,
        message: '填充資料庫時發生錯誤：' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <TravelLayout title="填充日本KDDI方案">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">填充日本KDDI eSIM方案</h1>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">⚠️ 注意</h2>
          <p className="mb-2">
            此操作將向資料庫添加日本KDDI的eSIM方案。請確保您已經執行過一般的種子資料填充。
          </p>
          <p>
            這將添加3天、4天和5天的每日500MB方案，包含eSIM和實體SIM卡選項。
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
          {isSeeding ? '填充中...' : '填充日本KDDI方案'}
        </button>
        
        {seedResult && (
          <div className={`mt-6 p-4 rounded-lg ${
            seedResult.success 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <p>{seedResult.message}</p>
            {seedResult.count && (
              <p className="mt-2">成功添加了 {seedResult.count} 個方案</p>
            )}
            
            {seedResult.success && (
              <div className="mt-4">
                <Link 
                  href="/country/jp-1"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  查看日本方案
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </TravelLayout>
  );
}
