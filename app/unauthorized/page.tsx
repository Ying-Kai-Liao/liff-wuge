'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            未授權訪問
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            您沒有權限訪問此頁面
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <Link
            href="/countries"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            返回首頁
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            登入
          </Link>
        </div>
      </div>
    </div>
  );
}
