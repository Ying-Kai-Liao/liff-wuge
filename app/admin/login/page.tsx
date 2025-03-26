'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/app/components/LiffProvider';
import Image from 'next/image';

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export default function LoginPage() {
  const { liff, liffError } = useLiff();
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // List of authorized LINE user IDs who can access admin
  const adminLineIds = useMemo(() => ['U673c35728bf8bc8da575d191956cb925'], []); // Replace with actual LINE user IDs

  useEffect(() => {
    if (liff && liff.isLoggedIn()) {
      setLoading(true);
      // Fetch profile data if user is logged in
      liff.getProfile()
        .then(userProfile => {
          setProfile(userProfile as LineProfile);
          
          // Check if user is authorized to access admin
          const userId = liff.getDecodedIDToken()?.sub;
          if (userId && adminLineIds.includes(userId)) {
            // Redirect to admin dashboard
            router.push('/admin');
          } else {
            setError('您沒有管理員權限');
          }
        })
        .catch(err => {
          console.error("Error getting profile:", err);
          setError('無法獲取用戶資料');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [liff, router, adminLineIds]);

  if (liffError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <p className="font-bold">LIFF 初始化失敗</p>
            <p>{liffError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!liff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4">載入中...</p>
      </div>
    );
  }

  const handleLogin = () => {
    liff.login();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">管理員登入</h1>
          <p className="mt-2 text-gray-600">請使用 LINE 帳號登入</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {!liff.isLoggedIn() ? (
              <button
                onClick={handleLogin}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full"
              >
                <Image 
                  src="/line-icon.png" 
                  alt="LINE" 
                  width={24} 
                  height={24} 
                  className="mr-2"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                使用 LINE 登入
              </button>
            ) : (
              <div className="text-center">
                {profile ? (
                  <div className="mb-4">
                    <p className="font-medium">已登入為: {profile.displayName}</p>
                    {!adminLineIds.includes(liff.getDecodedIDToken()?.sub || '') && (
                      <p className="text-red-600 mt-2">您沒有管理員權限</p>
                    )}
                  </div>
                ) : (
                  <p>正在獲取用戶資料...</p>
                )}
                
                <button
                  onClick={() => {
                    liff.logout();
                    window.location.reload();
                  }}
                  className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  登出
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
