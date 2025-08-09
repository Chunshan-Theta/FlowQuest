'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Activity, CreateActivityInput, AgentMemory, CreateAgentMemoryInput } from '@/types';
import { useActivities } from '@/hooks/useActivities';
import { useAgents } from '@/hooks/useAgents';
import { useCoursePackages } from '@/hooks/useCoursePackages';
import { MemoryForm } from '@/components/MemoryForm';

interface ActivityFormProps {
  activity?: Activity;
  onSubmit: (data: CreateActivityInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function ActivityForm({ 
  activity, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  showMemoryForm,
  setShowMemoryForm,
  editingMemory,
  setEditingMemory,
  memories,
  setMemories,
  handleAddMemory,
  handleUpdateMemory,
  handleDeleteMemory
}: ActivityFormProps & {
  showMemoryForm: boolean;
  setShowMemoryForm: (show: boolean) => void;
  editingMemory: AgentMemory | null;
  setEditingMemory: (memory: AgentMemory | null) => void;
  memories: AgentMemory[];
  setMemories: (memories: AgentMemory[]) => void;
  handleAddMemory: (memory: AgentMemory) => Promise<void>;
  handleUpdateMemory: (memory: AgentMemory, updateData: Partial<AgentMemory>) => Promise<void>;
  handleDeleteMemory: (memory: AgentMemory) => Promise<void>;
}) {
  const { agents, fetchAgents } = useAgents();
  const { coursePackages, fetchCoursePackages } = useCoursePackages();
  
  const [formData, setFormData] = useState<CreateActivityInput>({
    name: activity?.name || '',
    course_package_id: activity?.course_package_id || '',
    agent_profile_id: activity?.agent_profile_id || '',
    status: activity?.status || 'online',
    memories: activity?.memories || [],
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
      {showMemoryForm ? (
        <MemoryForm
          onSubmit={handleAddMemory}
          onCancel={() => setShowMemoryForm(false)}
          isSubmitting={isSubmitting}
        />
      ) : (
        <>
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

        {/* 記憶設定 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">記憶設定</h3>
            <button
              type="button"
              onClick={() => setShowMemoryForm(true)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              ➕ 新增記憶
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                熱記憶 (Hot Memories) - {memories.filter(m => m.type === 'hot').length} 個
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                {memories.filter(m => m.type === 'hot').map((memory) => (
                  <div key={memory._id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm text-gray-700 flex-1">{memory.content}</span>
                    <div className="flex space-x-1 ml-2">
                      <button
                        type="button"
                        onClick={() => setEditingMemory(memory)}
                        className="text-blue-600 hover:text-blue-800"
                        title="編輯"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(memory)}
                        className="text-red-600 hover:text-red-800"
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {memories.filter(m => m.type === 'hot').length === 0 && (
                  <p className="text-sm text-gray-500">暫無熱記憶</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                冷記憶 (Cold Memories) - {memories.filter(m => m.type === 'cold').length} 個
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                {memories.filter(m => m.type === 'cold').map((memory) => (
                  <div key={memory._id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm text-gray-700 flex-1">{memory.content}</span>
                    <div className="flex space-x-1 ml-2">
                      <button
                        type="button"
                        onClick={() => setEditingMemory(memory)}
                        className="text-blue-600 hover:text-blue-800"
                        title="編輯"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(memory)}
                        className="text-red-600 hover:text-red-800"
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {memories.filter(m => m.type === 'cold').length === 0 && (
                  <p className="text-sm text-gray-500">暫無冷記憶</p>
                )}
              </div>
            </div>
          </div>
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
        </>
      )}
    </div>
  );
}

export default function EditActivityPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchActivity, updateActivity, createActivityMemory, updateActivityMemory, deleteActivityMemory } = useActivities();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<AgentMemory | null>(null);
  const [memories, setMemories] = useState<AgentMemory[]>([]);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        const activityId = params.id as string;
        const activityData = await fetchActivity(activityId);
        setActivity(activityData);
        setMemories((activityData as any).memories || []);
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

  const handleAddMemory = async (memory: AgentMemory) => {
    if (!activity) return;
    
    try {
      const memoryData: CreateAgentMemoryInput = {
        agent_id: activity.agent_profile_id,
        type: memory.type,
        content: memory.content,
        tags: memory.tags,
        created_by_user_id: '507f1f77bcf86cd799439011',
      };

      const newMemory = await createActivityMemory(activity._id, memoryData);
      setMemories(prev => [...prev, newMemory]);
      setShowMemoryForm(false);
    } catch (err) {
      alert('創建記憶失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
    }
  };

  const handleUpdateMemory = async (memory: AgentMemory, updateData: Partial<AgentMemory>) => {
    if (!activity) return;
    
    try {
      const updatedMemory = await updateActivityMemory(activity._id, memory._id, updateData);
      setMemories(prev => prev.map(m => m._id === memory._id ? updatedMemory : m));
      setEditingMemory(null);
    } catch (err) {
      alert('更新記憶失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
    }
  };

  const handleDeleteMemory = async (memory: AgentMemory) => {
    if (!activity) return;
    
    if (!confirm('確定要刪除此記憶嗎？')) return;
    
    try {
      await deleteActivityMemory(activity._id, memory._id);
      setMemories(prev => prev.filter(m => m._id !== memory._id));
    } catch (err) {
      alert('刪除記憶失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
    }
  };

  const handleSubmit = async (data: CreateActivityInput) => {
    if (!activity) return;
    
    try {
      setIsSubmitting(true);
      const submitData = {
        ...data,
        memories
      };
      await updateActivity(activity._id, submitData);
      router.push(`/activities/${activity._id}`);
    } catch (error) {
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
          showMemoryForm={showMemoryForm}
          setShowMemoryForm={setShowMemoryForm}
          editingMemory={editingMemory}
          setEditingMemory={setEditingMemory}
          memories={memories}
          setMemories={setMemories}
          handleAddMemory={handleAddMemory}
          handleUpdateMemory={handleUpdateMemory}
          handleDeleteMemory={handleDeleteMemory}
        />

        {/* 編輯記憶表單 Modal */}
        {editingMemory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">編輯記憶</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updateData = {
                  type: formData.get('type') as 'hot' | 'cold',
                  content: formData.get('content') as string,
                  tags: (formData.get('tags') as string || '').split(',').map(tag => tag.trim()).filter(Boolean),
                };

                await handleUpdateMemory(editingMemory, updateData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                    <select name="type" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" defaultValue={editingMemory.type}>
                      <option value="hot">熱記憶</option>
                      <option value="cold">冷記憶</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">內容</label>
                    <textarea 
                      name="content" 
                      required 
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      placeholder="輸入記憶內容..."
                      defaultValue={editingMemory.content}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標籤 (以逗號分隔)</label>
                    <input 
                      type="text" 
                      name="tags" 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      placeholder="例如：重要,提醒,學習"
                      defaultValue={editingMemory.tags.join(', ')}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingMemory(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    更新
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
