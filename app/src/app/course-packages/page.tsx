'use client';

import React, { useState, useEffect } from 'react';
import { CoursePackage, CreateCoursePackageInput, ApiResponse } from '@/types';

interface CoursePackageFormProps {
  coursePackage?: CoursePackage;
  onSubmit: (data: CreateCoursePackageInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function CoursePackageForm({ coursePackage, onSubmit, onCancel, isSubmitting = false }: CoursePackageFormProps) {
  const [formData, setFormData] = useState<CreateCoursePackageInput>({
    title: coursePackage?.title || '',
    description: coursePackage?.description || '',
    units: coursePackage?.units || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof CreateCoursePackageInput, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {coursePackage ? '編輯課程包' : '新增課程包'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            課程包標題 *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="請輸入課程包標題"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            課程包描述 *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="請描述這個課程包的內容和目標"
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '處理中...' : (coursePackage ? '更新' : '創建')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CoursePackagesPage() {
  const [coursePackages, setCoursePackages] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCoursePackage, setEditingCoursePackage] = useState<CoursePackage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 載入課程包
  const loadCoursePackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/course-packages?include_units=true');
      const result: ApiResponse<CoursePackage[]> = await response.json();
      
      if (result.success && result.data) {
        setCoursePackages(result.data);
      } else {
        setError(result.error || '載入失敗');
      }
    } catch {
      setError('網路錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoursePackages();
  }, []);

  // 創建或更新課程包
  const handleSubmit = async (data: CreateCoursePackageInput) => {
    try {
      setIsSubmitting(true);
      
      const url = editingCoursePackage ? `/api/course-packages/${editingCoursePackage._id}` : '/api/course-packages';
      const method = editingCoursePackage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result: ApiResponse<CoursePackage> = await response.json();
      
      if (result.success) {
        await loadCoursePackages();
        setShowForm(false);
        setEditingCoursePackage(null);
      } else {
        setError(result.error || '操作失敗');
      }
    } catch {
      setError('網路錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 刪除課程包
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個課程包嗎？此操作無法復原。')) return;
    
    try {
      const response = await fetch(`/api/course-packages/${id}`, { method: 'DELETE' });
      const result: ApiResponse<CoursePackage> = await response.json();
      
      if (result.success) {
        await loadCoursePackages();
      } else {
        setError(result.error || '刪除失敗');
      }
    } catch {
      setError('網路錯誤');
    }
  };

  // 過濾課程包
  const filteredCoursePackages = coursePackages.filter(coursePackage =>
    coursePackage.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coursePackage.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">課程包管理</h1>
          <p className="text-gray-600">管理您的課程包和相關關卡</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {showForm ? (
          <CoursePackageForm
            coursePackage={editingCoursePackage || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingCoursePackage(null);
            }}
            isSubmitting={isSubmitting}
          />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="搜尋課程包..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ➕ 新增課程包
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCoursePackages.map((coursePackage) => (
                <div key={coursePackage._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{coursePackage.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCoursePackage(coursePackage);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="編輯"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(coursePackage._id)}
                        className="text-red-600 hover:text-red-800"
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {coursePackage.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {coursePackage.units?.length || 0} 個關卡
                      </span>
                      <a
                        href={`/course-packages/${coursePackage._id}/units`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        管理關卡 →
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    <div>創建：{new Date(coursePackage.created_at).toLocaleDateString('zh-TW')}</div>
                    <div>更新：{new Date(coursePackage.updated_at).toLocaleDateString('zh-TW')}</div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCoursePackages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {searchTerm ? '找不到符合條件的課程包' : '還沒有任何課程包'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? '請嘗試其他搜尋關鍵字' : '點擊上方按鈕來創建您的第一個課程包'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    立即創建
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
