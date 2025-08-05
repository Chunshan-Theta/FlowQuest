'use client';

import React, { useState, useEffect } from 'react';
import { Unit, CreateUnitInput, CoursePackage, ApiResponse, PassConditionType } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

interface UnitFormProps {
  unit?: Unit;
  coursePackage: CoursePackage;
  onSubmit: (data: CreateUnitInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function UnitForm({ unit, coursePackage, onSubmit, onCancel, isSubmitting = false }: UnitFormProps) {
  const [formData, setFormData] = useState<CreateUnitInput>({
    title: unit?.title || '',
    course_package_id: coursePackage._id,
    agent_role: unit?.agent_role || '',
    user_role: unit?.user_role || '',
    intro_message: unit?.intro_message || '',
    outro_message: unit?.outro_message || '',
    max_turns: unit?.max_turns || 10,
    agent_behavior_prompt: unit?.agent_behavior_prompt || '',
    pass_condition: unit?.pass_condition || {
      type: 'keyword',
      value: []
    },
    order: unit?.order || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof CreateUnitInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePassConditionChange = (field: 'type' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      pass_condition: {
        ...prev.pass_condition,
        [field]: value,
      },
    }));
  };

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...formData.pass_condition.value];
    newKeywords[index] = value;
    handlePassConditionChange('value', newKeywords);
  };

  const addKeyword = () => {
    handlePassConditionChange('value', [...formData.pass_condition.value, '']);
  };

  const removeKeyword = (index: number) => {
    const newKeywords = formData.pass_condition.value.filter((_, i) => i !== index);
    handlePassConditionChange('value', newKeywords);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {unit ? '編輯關卡' : '新增關卡'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          課程包：{coursePackage.title}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              關卡標題 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入關卡標題"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              關卡順序
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => handleInputChange('order', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              min="1"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI 角色 *
            </label>
            <input
              type="text"
              value={formData.agent_role}
              onChange={(e) => handleInputChange('agent_role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="例：銷售顧問"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用戶角色 *
            </label>
            <input
              type="text"
              value={formData.user_role}
              onChange={(e) => handleInputChange('user_role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="例：客戶"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最大對話輪數
          </label>
          <input
            type="number"
            value={formData.max_turns}
            onChange={(e) => handleInputChange('max_turns', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            min="1"
            max="50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            開場訊息 *
          </label>
          <textarea
            value={formData.intro_message}
            onChange={(e) => handleInputChange('intro_message', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="AI 開始對話時說的第一句話"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            結束訊息
          </label>
          <textarea
            value={formData.outro_message}
            onChange={(e) => handleInputChange('outro_message', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="關卡完成時顯示的訊息"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI 行為提示詞 *
          </label>
          <textarea
            value={formData.agent_behavior_prompt}
            onChange={(e) => handleInputChange('agent_behavior_prompt', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="描述 AI 在這個關卡中應該如何表現和回應"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            通關條件
          </label>
          <div className="space-y-3">
            <div>
              <select
                value={formData.pass_condition.type}
                onChange={(e) => handlePassConditionChange('type', e.target.value as PassConditionType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="keyword">關鍵詞檢測</option>
                <option value="llm">AI 智能判斷</option>
              </select>
            </div>
            
            {formData.pass_condition.type === 'keyword' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">關鍵詞列表</span>
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="text-sm bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  >
                    ➕ 新增
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.pass_condition.value.map((keyword, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => handleKeywordChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="輸入關鍵詞"
                      />
                      <button
                        type="button"
                        onClick={() => removeKeyword(index)}
                        className="px-2 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {formData.pass_condition.value.length === 0 && (
                    <p className="text-sm text-gray-500">點擊"新增"按鈕來添加關鍵詞</p>
                  )}
                </div>
              </div>
            )}
            
            {formData.pass_condition.type === 'llm' && (
              <div>
                <input
                  type="text"
                  value={formData.pass_condition.value[0] || ''}
                  onChange={(e) => handlePassConditionChange('value', [e.target.value])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="描述通關條件（AI 將根據此描述判斷是否通關）"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '處理中...' : (unit ? '更新' : '創建')}
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

export default function CoursePackageUnitsPage() {
  const params = useParams();
  const router = useRouter();
  const coursePackageId = params.id as string;
  
  const [coursePackage, setCoursePackage] = useState<CoursePackage | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 載入課程包詳情
  const loadCoursePackage = async () => {
    try {
      const response = await fetch(`/api/course-packages/${coursePackageId}?include_units=true`);
      const result: ApiResponse<CoursePackage> = await response.json();
      
      if (result.success && result.data) {
        setCoursePackage(result.data);
        setUnits(result.data.units || []);
      } else {
        setError(result.error || '載入課程包失敗');
      }
    } catch {
      setError('網路錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coursePackageId) {
      loadCoursePackage();
    }
  }, [coursePackageId]);

  // 創建或更新關卡
  const handleSubmit = async (data: CreateUnitInput) => {
    try {
      setIsSubmitting(true);
      
      const url = editingUnit ? `/api/units/${editingUnit._id}` : '/api/units';
      const method = editingUnit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result: ApiResponse<Unit> = await response.json();
      
      if (result.success) {
        await loadCoursePackage(); // 重新載入數據
        setShowForm(false);
        setEditingUnit(null);
      } else {
        setError(result.error || '操作失敗');
      }
    } catch {
      setError('網路錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 刪除關卡
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個關卡嗎？此操作無法復原。')) return;
    
    try {
      const response = await fetch(`/api/units/${id}`, { method: 'DELETE' });
      const result: ApiResponse<Unit> = await response.json();
      
      if (result.success) {
        await loadCoursePackage(); // 重新載入數據
      } else {
        setError(result.error || '刪除失敗');
      }
    } catch {
      setError('網路錯誤');
    }
  };

  // 過濾關卡
  const filteredUnits = units.filter(unit =>
    unit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.agent_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.user_role.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (!coursePackage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">找不到課程包</h3>
          <p className="text-gray-500 mb-4">請檢查課程包 ID 是否正確</p>
          <button
            onClick={() => router.push('/course-packages')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回課程包列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 頁面標題和導航 */}
        <div className="mb-8">
          <Breadcrumb items={[
            { label: '首頁', href: '/' },
            { label: '課程包管理', href: '/course-packages' },
            { label: coursePackage.title }
          ]} />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">關卡管理</h1>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="font-semibold text-blue-800">{coursePackage.title}</h2>
            <p className="text-blue-600 text-sm mt-1">{coursePackage.description}</p>
          </div>
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
          <UnitForm
            unit={editingUnit || undefined}
            coursePackage={coursePackage}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingUnit(null);
            }}
            isSubmitting={isSubmitting}
          />
        ) : (
          <>
            {/* 搜尋和操作列 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="搜尋關卡..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ➕ 新增關卡
                </button>
              </div>
            </div>

            {/* 關卡列表 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUnits.map((unit) => (
                <div key={unit._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{unit.title}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        第 {unit.order} 關
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingUnit(unit);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="編輯"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(unit._id)}
                        className="text-red-600 hover:text-red-800"
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">角色設定：</span>
                      <span className="text-gray-800">{unit.agent_role} vs {unit.user_role}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">對話輪數：</span>
                      <span className="text-gray-800">最多 {unit.max_turns} 輪</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">通關條件：</span>
                      <span className="text-gray-800">
                        {unit.pass_condition.type === 'keyword' ? '關鍵詞檢測' : 'AI 智能判斷'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">開場：</span>
                      <p className="text-gray-700 mt-1 text-xs leading-relaxed">
                        {unit.intro_message.length > 80 
                          ? unit.intro_message.substring(0, 80) + '...' 
                          : unit.intro_message}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    <div>創建：{new Date(unit.created_at).toLocaleDateString('zh-TW')}</div>
                    <div>更新：{new Date(unit.updated_at).toLocaleDateString('zh-TW')}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 空狀態 */}
            {filteredUnits.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {searchTerm ? '找不到符合條件的關卡' : '還沒有任何關卡'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? '請嘗試其他搜尋關鍵字' : '點擊上方按鈕來為此課程包創建第一個關卡'}
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
