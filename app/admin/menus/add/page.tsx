'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { uploadFile } from '../../../lib/firebase-storage';

export default function AddMenuPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pdfUrl: '',
    type: 'esim' as 'esim' | 'physical'
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Check if the file is a PDF
      if (file.type !== 'application/pdf') {
        setError('請上傳 PDF 檔案');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.title) {
      setError('標題為必填項');
      return;
    }

    if (uploadMethod === 'url' && !formData.pdfUrl) {
      setError('PDF 連結為必填項');
      return;
    }

    if (uploadMethod === 'file' && !pdfFile) {
      setError('請上傳 PDF 檔案');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      let pdfUrl = formData.pdfUrl;
      
      // If using file upload, upload the file to Firebase Storage
      if (uploadMethod === 'file' && pdfFile) {
        setUploadProgress(0);
        // Create a unique file path using timestamp and original filename
        const timestamp = Date.now();
        const filename = pdfFile.name.replace(/\s+/g, '_').toLowerCase();
        const filePath = `menus/${formData.type}/${timestamp}_${filename}`;
        
        // Upload the file and get the download URL
        pdfUrl = await uploadFile(pdfFile, filePath);
        setUploadProgress(100);
      }
      
      // Create the menu in the database
      const response = await fetch('/api/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pdfUrl,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      router.push('/admin/menus');
    } catch (err) {
      console.error('Failed to add menu:', err);
      setError('新增菜單失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gray-50 pt-10">
        <div className="py-10">
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">新增菜單</h1>
              <div className="flex space-x-4">
                <Link
                  href="/admin/menus"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  返回菜單列表
                </Link>
              </div>
            </div>
          </header>
          
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                <div className="bg-white shadow rounded-lg p-6">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                      <p>{error}</p>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        標題 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#006A71] focus:border-[#006A71]"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        描述
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#006A71] focus:border-[#006A71]"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PDF 檔案 <span className="text-red-500">*</span>
                      </label>
                      
                      <div className="flex space-x-4 mb-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="uploadMethod"
                            value="file"
                            checked={uploadMethod === 'file'}
                            onChange={() => setUploadMethod('file')}
                            className="mr-2 text-[#006A71]"
                          />
                          <span>上傳檔案</span>
                        </label>
                        
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="uploadMethod"
                            value="url"
                            checked={uploadMethod === 'url'}
                            onChange={() => setUploadMethod('url')}
                            className="mr-2 text-[#006A71]"
                          />
                          <span>使用連結</span>
                        </label>
                      </div>
                      
                      {uploadMethod === 'file' ? (
                        <div>
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">點擊上傳</span> 或拖放檔案
                                </p>
                                <p className="text-xs text-gray-500">PDF 檔案 (最大 10MB)</p>
                              </div>
                              <input 
                                id="dropzone-file" 
                                type="file" 
                                className="hidden" 
                                accept="application/pdf"
                                onChange={handleFileChange}
                              />
                            </label>
                          </div>
                          
                          {pdfFile && (
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                              <span>{pdfFile.name} ({Math.round(pdfFile.size / 1024)} KB)</span>
                            </div>
                          )}
                          
                          {uploadProgress !== null && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-[#006A71] h-2.5 rounded-full" 
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">上傳進度: {uploadProgress}%</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <input
                            type="url"
                            id="pdfUrl"
                            name="pdfUrl"
                            value={formData.pdfUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/menu.pdf"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#006A71] focus:border-[#006A71]"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            請提供 PDF 檔案的直接連結，建議先上傳至 Google Drive 或其他雲端儲存服務
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                        菜單類型 <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#006A71] focus:border-[#006A71]"
                      >
                        <option value="esim">eSIM 數位卡菜單</option>
                        <option value="physical">實體 SIM 卡菜單</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <Link
                        href="/admin/menus"
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006A71]"
                      >
                        取消
                      </Link>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-[#006A71] hover:bg-[#004a4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006A71] ${
                          isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSubmitting ? '處理中...' : '新增菜單'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
