'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, CreateActivityInput, ApiResponse, AgentProfile, CoursePackage, ObjectId } from '@/types';
import { useActivities } from '@/hooks/useActivities';
import { useAgents } from '@/hooks/useAgents';
import { useCoursePackages } from '@/hooks/useCoursePackages';

interface ActivityFormProps {
  activity?: Activity;
  onSubmit: (data: CreateActivityInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function ActivityForm({ activity, onSubmit, onCancel, isSubmitting = false }: ActivityFormProps) {
  const { agents, fetchAgents } = useAgents();
  const { coursePackages, fetchCoursePackages } = useCoursePackages();
  
  const [formData, setFormData] = useState<CreateActivityInput>({
    name: activity?.name || '',
    course_package_id: activity?.course_package_id || '',
    agent_profile_id: activity?.agent_profile_id || '',
    status: activity?.status || 'online',
    hot_memory_ids: activity?.hot_memory_ids || [],
  });

  useEffect(() => {
    fetchAgents();
    fetchCoursePackages();
  }, [fetchAgents, fetchCoursePackages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.course_package_id || !formData.agent_profile_id) {
      alert('請填寫所有必填欄位');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {activity ? '編輯活動' : '新增活動'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 活動名稱 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            活動名稱 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="請輸入活動名稱"
            required
          />
        </div>

        {/* Agent 選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            選擇 Agent *
          </label>
          <select
            value={formData.agent_profile_id}
            onChange={(e) => setFormData(prev => ({ ...prev, agent_profile_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          >
            <option value="">請選擇一個 Agent</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.name} - {agent.persona.tone}
              </option>
            ))}
          </select>
        </div>

        {/* 課程包選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            選擇課程包 *
          </label>
          <select
            value={formData.course_package_id}
            onChange={(e) => setFormData(prev => ({ ...prev, course_package_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          >
            <option value="">請選擇一個課程包</option>
            {coursePackages.map((coursePackage) => (
              <option key={coursePackage._id} value={coursePackage._id}>
                {coursePackage.title}
              </option>
            ))}
          </select>
        </div>

        {/* 活動狀態 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            活動狀態
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'online' | 'offline' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="online">上架中</option>
            <option value="offline">下架中</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '處理中...' : (activity ? '更新' : '創建')}
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

export default function ActivitiesPage() {
  const router = useRouter();
  const { activities, loading, error, fetchActivities, createActivity, updateActivity, deleteActivity, setError } = useActivities();
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // 點擊活動卡片查看詳情
  const handleActivityClick = (activityId: string) => {
    router.push(`/activities/${activityId}`);
  };

  // 創建或更新活動
  const handleSubmit = async (data: CreateActivityInput) => {
    try {
      setIsSubmitting(true);
      
      if (editingActivity) {
        await updateActivity(editingActivity._id, data);
      } else {
        await createActivity(data);
      }
      
      setShowForm(false);
      setEditingActivity(null);
    } catch (error) {
      console.error('活動操作失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 刪除活動
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個活動嗎？')) return;
    
    try {
      await deleteActivity(id);
    } catch (error) {
      console.error('刪除活動失敗:', error);
    }
  };

  // 過濾活動
  const filteredActivities = activities.filter(activity => {
    if (statusFilter && activity.status !== statusFilter) return false;
    return true;
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '上架中';
      case 'offline': return '下架中';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">活動管理</h1>
          <p className="text-gray-600">管理學習活動，組合 Agent 和課程包</p>
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
          <ActivityForm
            activity={editingActivity || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingActivity(null);
            }}
            isSubmitting={isSubmitting}
          />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 items-center">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">所有狀態</option>
                    <option value="online">上架中</option>
                    <option value="offline">下架中</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ➕ 新增活動
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredActivities.map((activity) => (
                <div key={activity._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                  {/* 可點擊的卡片內容區域 */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => handleActivityClick(activity._id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
                          {activity.name}
                        </h3>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {getStatusText(activity.status)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Agent ID：</span>
                        <span className="text-gray-800">{activity.agent_profile_id}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">課程包 ID：</span>
                        <span className="text-gray-800">{activity.course_package_id}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                      <div>開始：{new Date(activity.start_time).toLocaleString('zh-TW')}</div>
                      {activity.end_time && (
                        <div>結束：{new Date(activity.end_time).toLocaleString('zh-TW')}</div>
                      )}
                    </div>
                  </div>

                  {/* 操作按鈕區域 - 不在可點擊區域內 */}
                  <div className="px-6 pb-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 防止觸發卡片點擊
                          setEditingActivity(activity);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="編輯"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 防止觸發卡片點擊
                          handleDelete(activity._id);
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredActivities.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {statusFilter ? '找不到符合條件的活動' : '還沒有任何活動'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {statusFilter ? '請嘗試調整篩選條件' : '點擊上方按鈕來創建您的第一個活動'}
                </p>
                {!statusFilter && (
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
