'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import { useLiff } from '../components/LiffProvider';

export default function AdminPage() {
  const router = useRouter();
  const { liff } = useLiff();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSignOut = async () => {
    if (liff && liff.isLoggedIn()) {
      liff.logout();
      router.push('/admin/login');
    }
  };

  const handleDeleteDuplicates = async () => {
    setIsDeleting(true);
    setDeleteResult(null);

    try {
      const response = await fetch('/api/admin/delete-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setDeleteResult({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      console.error('Error deleting duplicates:', error);
      setDeleteResult({
        success: false,
        message: '刪除重複資料時發生錯誤，請稍後再試',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">eSIM 管理後台</h1>
                </div>
              </div>
              <div className="flex items-center">
                {liff && liff.isLoggedIn() && (
                  <div className="ml-3 relative flex items-center space-x-4">
                    <button
                      onClick={handleSignOut}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      登出
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="py-10">
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">管理控制台</h1>
            </div>
          </header>
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="px-4 py-8 sm:px-0">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Data Management Card */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">資料管理</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>管理應用程式中的國家、電信商和方案資料。</p>
                      </div>
                      <div className="mt-5">
                        <Link
                          href="/admin/data"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                          管理資料
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Import Plans Card */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">導入方案</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>從 JSON 檔案導入新的 eSIM 方案資料。</p>
                      </div>
                      <div className="mt-5">
                        <Link
                          href="/import-japan-plans"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                          導入方案
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Delete Duplicates Card */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">刪除重複資料</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>刪除資料庫中的重複方案資料。</p>
                      </div>
                      <div className="mt-5">
                        <button
                          onClick={handleDeleteDuplicates}
                          disabled={isDeleting}
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                            isDeleting
                              ? 'bg-red-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {isDeleting ? '處理中...' : '刪除重複資料'}
                        </button>
                      </div>

                      {deleteResult && (
                        <div
                          className={`mt-3 p-3 rounded-md ${
                            deleteResult.success
                              ? 'bg-green-50 text-green-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {deleteResult.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
