'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Activity, CreateActivityInput } from '@/types';
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

export default function EditActivityPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchActivity, updateActivity } = useActivities();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        const activityId = params.id as string;
        const activityData = await fetchActivity(activityId);
        setActivity(activityData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入活動失敗');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadActivity();
    }
  }, [params.id, fetchActivity]);

  const handleSubmit = async (data: CreateActivityInput) => {
    if (!activity) return;
    
    try {
      setIsSubmitting(true);
      await updateActivity(activity._id, data);
      router.push(`/activities/${activity._id}`);
    } catch (error) {
      console.error('更新活動失敗:', error);
      setError('更新活動失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/activities/${activity?._id}`);
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

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">{error || '找不到指定的活動'}</p>
          <button
            onClick={() => router.push('/activities')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回活動列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 麵包屑導航 */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => router.push('/activities')}
              className="hover:text-blue-600"
            >
              活動管理
            </button>
            <span>/</span>
            <button
              onClick={() => router.push(`/activities/${activity._id}`)}
              className="hover:text-blue-600"
            >
              {activity.name}
            </button>
            <span>/</span>
            <span className="text-gray-800">編輯</span>
          </nav>
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

        <ActivityForm
          activity={activity}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
