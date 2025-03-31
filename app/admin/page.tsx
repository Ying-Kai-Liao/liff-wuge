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
      <div className="min-h-screen bg-gray-50 pt-10">

        <div className="py-10">
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">管理控制台</h1>
            </div>
          </header>
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="px-4 py-8 sm:px-0">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">國家與方案管理</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>管理國家、SIM 卡類型與方案</p>
                      </div>
                      <div className="mt-3">
                        <Link
                          href="/admin/data"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#006A71] hover:bg-[#004a4f]"
                        >
                          進入管理
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">目錄管理</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>管理 eSIM 與實體 SIM 卡的 PDF 目錄</p>
                      </div>
                      <div className="mt-3">
                        <Link
                          href="/admin/menus"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#006A71] hover:bg-[#004a4f]"
                        >
                          進入管理
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">系統設定資訊</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>查看 LINE 帳號、LIFF 與 Firebase 設定資訊</p>
                      </div>
                      <div className="mt-3">
                        <Link
                          href="/admin/setup"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#006A71] hover:bg-[#004a4f]"
                        >
                          查看資訊
                        </Link>
                      </div>
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
