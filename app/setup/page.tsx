'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLiff } from '../components/LiffProvider';
import { app } from '../lib/firebase';
import { getApps } from 'firebase/app';
import TravelLayout from '../components/TravelLayout';

export default function SetupInfoPage() {
  const router = useRouter();
  const { liff, isLoggedIn } = useLiff();
  const [liffLoading, setLiffLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<{
    nodeVersion: string;
    environment: string;
    liffId: string;
    firebaseApps: number;
    firebaseConfig: any;
  }>({
    nodeVersion: process.env.NODE_ENV || 'unknown',
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'unknown',
    liffId: process.env.NEXT_PUBLIC_LIFF_ID || 'unknown',
    firebaseApps: 0,
    firebaseConfig: null
  });

  useEffect(() => {
    async function loadProfile() {
      if (!liff) {
        // If liff is not initialized yet, wait
        return;
      }
      
      // Set liff loading to false since we have the liff object
      setLiffLoading(false);
      
      try {
        setIsLoading(true);
        
        // Get Firebase info
        const firebaseAppsCount = getApps().length;
        const firebaseConfig = app.options;
        
        setSystemInfo(prev => ({
          ...prev,
          firebaseApps: firebaseAppsCount,
          firebaseConfig
        }));
        
        // Get LIFF profile if logged in
        if (liff && isLoggedIn) {
          const profile = await liff.getProfile();
          setProfile(profile);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('無法載入資料，請稍後再試');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProfile();
  }, [liff, isLoggedIn]);

  return (
    <TravelLayout title="系統設定資訊">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#006A71] mb-2">系統設定資訊</h1>
            <div className="flex space-x-4">
              <Link
                href="/"
                className="text-gray-500 hover:text-[#006A71] inline-flex items-center text-sm font-medium"
              >
                返回首頁
              </Link>
            </div>
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006A71]"></div>
                </div>
              ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  <p>{error}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* LINE Profile Information */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-[#006A71] text-white">
                      <h3 className="text-lg leading-6 font-medium">LINE 帳號資訊</h3>
                      <p className="mt-1 max-w-2xl text-sm">您的 LINE 帳號相關資訊</p>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        {profile ? (
                          <>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">用戶 ID (UID)</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                                {profile.userId}
                              </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">顯示名稱</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {profile.displayName}
                              </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">頭像</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                <img 
                                  src={profile.pictureUrl} 
                                  alt={profile.displayName} 
                                  className="h-16 w-16 rounded-full"
                                />
                              </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">狀態訊息</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {profile.statusMessage || '(無狀態訊息)'}
                              </dd>
                            </div>
                          </>
                        ) : (
                          <div className="bg-gray-50 px-4 py-5 sm:px-6">
                            <p className="text-sm text-gray-500">未登入或無法取得 LINE 資料</p>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                  
                  {/* LIFF Information */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-[#48A6A7] text-white">
                      <h3 className="text-lg leading-6 font-medium">LIFF 設定資訊</h3>
                      <p className="mt-1 max-w-2xl text-sm">LINE Front-end Framework 相關設定</p>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">LIFF ID</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                            {systemInfo.liffId}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">LIFF 版本</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {liff ? liff.getVersion() : '未知'}
                          </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">LIFF OS</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {liff ? liff.getOS() : '未知'}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">LIFF 語言</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {liff ? liff.getLanguage() : '未知'}
                          </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">LINE 內部瀏覽器</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {liff ? (liff.isInClient() ? '是' : '否') : '未知'}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">登入狀態</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoggedIn ? '已登入' : '未登入'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  {/* Firebase Information */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-[#9ACBD0] text-[#006A71]">
                      <h3 className="text-lg leading-6 font-medium">Firebase 設定資訊</h3>
                      <p className="mt-1 max-w-2xl text-sm">Firebase 相關設定</p>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Firebase 應用數量</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {systemInfo.firebaseApps}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">專案 ID</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {systemInfo.firebaseConfig?.projectId || '未知'}
                          </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">應用 ID</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {systemInfo.firebaseConfig?.appId || '未知'}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">API Key</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {systemInfo.firebaseConfig?.apiKey ? 
                              `${systemInfo.firebaseConfig.apiKey.substring(0, 5)}...` : 
                              '未知'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  {/* System Information */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-gray-700 text-white">
                      <h3 className="text-lg leading-6 font-medium">系統環境資訊</h3>
                      <p className="mt-1 max-w-2xl text-sm">應用程式執行環境相關資訊</p>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Node 環境</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {systemInfo.nodeVersion}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">環境變數</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {systemInfo.environment}
                          </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">瀏覽器 User Agent</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                            {typeof navigator !== 'undefined' ? navigator.userAgent : '未知'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </TravelLayout>
  );
}
