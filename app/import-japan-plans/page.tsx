'use client';

import { useState } from 'react';
import Link from 'next/link';

type ImportResult = {
  success: boolean;
  message: string;
  totalPlansAdded?: number;
} | null;

export default function ImportJapanPlansPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult>(null);
  const [jsonData, setJsonData] = useState<string>('');

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setImportResult(null);
      
      // Parse the JSON data
      let parsedData;
      try {
        parsedData = JSON.parse(jsonData);
      } catch {
        setImportResult({
          success: false,
          message: 'JSON 格式無效，請檢查您的輸入'
        });
        setIsImporting(false);
        return;
      }
      
      // Call the API endpoint
      const response = await fetch('/api/import-japan-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData)
      });
      
      const result = await response.json();
      
      setImportResult({
        success: result.success,
        message: result.message,
        totalPlansAdded: result.totalPlansAdded
      });
    } catch (error) {
      console.error('Error importing plans:', error);
      setImportResult({
        success: false,
        message: '導入計劃時發生錯誤：' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonData(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">導入日本 eSIM 計劃</h1>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">⚠️ 注意</h2>
        <p className="mb-2">
          此功能將導入日本 eSIM 計劃到資料庫。請確保您已經執行了資料庫種子填充，以便系統能夠找到對應的日本電信商。
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">上傳 JSON 文件</label>
        <input 
          type="file" 
          accept=".json"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">或貼上 JSON 數據</label>
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          className="w-full h-64 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="在此貼上 JSON 數據..."
        />
      </div>
      
      <button
        onClick={handleImport}
        disabled={isImporting || !jsonData}
        className={`w-full py-3 rounded-lg font-medium ${
          isImporting || !jsonData
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isImporting ? '導入中...' : '導入計劃'}
      </button>
      
      {importResult && (
        <div className={`mt-6 p-4 rounded-lg ${
          importResult.success 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <p>{importResult.message}</p>
          
          {importResult.success && (
            <div className="mt-4">
              <Link 
                href="/countries"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                瀏覽國家目錄
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
