'use client';

import React, { useState, useEffect } from 'react';
import { CoursePackage, ApiResponse } from '@/types';
import { useRouter } from 'next/navigation';

export default function UnitsRedirectPage() {
  const [coursePackages, setCoursePackages] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 載入課程包列表
  const loadCoursePackages = async () => {
    try {
      const response = await fetch('/api/course-packages?include_units=true');
      const result: ApiResponse<CoursePackage[]> = await response.json();
      
      if (result.success && result.data) {
        setCoursePackages(result.data);
      }
    } catch (error) {
      console.error('載入課程包失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoursePackages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-blue-500 text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">關卡管理</h1>
          <p className="text-gray-600">關卡管理現在整合在課程包中，請選擇一個課程包來管理其關卡</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">選擇課程包</h2>
          
          {coursePackages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">還沒有任何課程包</p>
              <button
                onClick={() => router.push('/course-packages')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                創建課程包
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {coursePackages.map((coursePackage) => (
                <div 
                  key={coursePackage._id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/course-packages/${coursePackage._id}/units`)}
                >
                  <h3 className="font-semibold text-gray-800 mb-2">{coursePackage.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{coursePackage.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600">
                      {coursePackage.units?.length || 0} 個關卡
                    </span>
                    <span className="text-blue-600 text-sm">管理關卡 →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/course-packages')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            ← 返回課程包管理
          </button>
        </div>
      </div>
    </div>
  );
}
