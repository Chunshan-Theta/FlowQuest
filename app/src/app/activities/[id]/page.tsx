'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Activity, AgentProfile, CoursePackage, AgentMemory, CreateAgentMemoryInput } from '@/types';
import { useActivities } from '@/hooks/useActivities';
import { useAgents } from '@/hooks/useAgents';
import { useCoursePackages } from '@/hooks/useCoursePackages';
import { MemoryForm } from '@/components/MemoryForm';

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchActivity, fetchActivityMemories, createActivityMemory, updateActivityMemory, deleteActivityMemory } = useActivities();
  const { fetchAgent } = useAgents();
  const { fetchCoursePackage } = useCoursePackages();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [coursePackage, setCoursePackage] = useState<CoursePackage | null>(null);
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<AgentMemory | null>(null);

  useEffect(() => {
    const loadActivityDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const activityId = params.id as string;
        
        // 獲取活動詳情
        const activityData = await fetchActivity(activityId);
        setActivity(activityData);
        
        // 並行獲取相關的 Agent 和課程包資訊
        const [agentData, coursePackageData] = await Promise.all([
          fetchAgent(activityData.agent_profile_id),
          fetchCoursePackage(activityData.course_package_id, true) // 包含單元資訊
        ]);
        
        setAgent(agentData);
        setCoursePackage(coursePackageData);
        
        // 載入活動記憶
        try {
          const memoriesData = await fetchActivityMemories(activityId);
          setMemories(memoriesData);
        } catch (err) {
          console.warn('載入記憶失敗:', err);
          setMemories([]);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入活動詳情失敗');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadActivityDetails();
    }
  }, [params.id, fetchActivity, fetchAgent, fetchCoursePackage, fetchActivityMemories]);

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
      <div className="max-w-4xl mx-auto">
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
            <span className="text-gray-800">{activity.name}</span>
          </nav>
        </div>

        {/* 活動標題和狀態 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{activity.name}</h1>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activity.status)}`}>
                {getStatusText(activity.status)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/activities/${activity._id}/chat`)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                💬 開始對話
              </button>
              <button
                onClick={() => router.push(`/activities/${activity._id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                編輯活動
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">活動 ID：</span>
              <span className="text-gray-800">{activity._id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">建立時間：</span>
              <span className="text-gray-800">{new Date(activity.created_at).toLocaleString('zh-TW')}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">更新時間：</span>
              <span className="text-gray-800">{new Date(activity.updated_at).toLocaleString('zh-TW')}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Agent 資訊 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🤖 Agent 資訊</h2>
            {agent ? (
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-600">名稱：</span>
                  <span className="text-gray-800">{agent.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">語調風格：</span>
                  <span className="text-gray-800">{agent.persona.tone}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">背景設定：</span>
                  <span className="text-gray-800">{agent.persona.background}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">聲音特徵：</span>
                  <span className="text-gray-800">{agent.persona.voice}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Agent ID：</span>
                  <span className="text-gray-800 text-xs">{agent._id}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">載入 Agent 資訊中...</div>
            )}
          </div>

          {/* 課程包資訊 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📚 課程包資訊</h2>
            {coursePackage ? (
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-600">標題：</span>
                  <span className="text-gray-800">{coursePackage.title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">描述：</span>
                  <span className="text-gray-800">{coursePackage.description}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">單元數量：</span>
                  <span className="text-gray-800">{coursePackage.units.length} 個單元</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">課程包 ID：</span>
                  <span className="text-gray-800 text-xs">{coursePackage._id}</span>
                </div>
                
                {/* 單元列表 */}
                {coursePackage.units.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-600 mb-2">包含單元：</h3>
                    <div className="space-y-2">
                      {coursePackage.units.map((unit, index) => (
                        <div key={unit._id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium text-gray-800">{index + 1}. {unit.title}</div>
                          <div className="text-gray-700">角色：{unit.agent_role}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">載入課程包資訊中...</div>
            )}
          </div>
        </div>

                {/* 記憶配置 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">🧠 活動記憶配置</h2>
            <button
              onClick={() => setShowMemoryForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              ➕ 新增記憶
            </button>
          </div>
          
          {memories.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm mb-4">
                <span className="font-medium text-gray-600">總記憶數量：</span>
                <span className="text-gray-800">{memories.length} 個</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    熱記憶 (Hot Memories)
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {memories.filter(m => m.type === 'hot').map((memory) => (
                      <div key={memory._id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm text-gray-700 mb-1">{memory.content}</div>
                          {memory.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {memory.tags.map((tag, index) => (
                                <span key={index} className="px-1 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(memory.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => setEditingMemory(memory)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="編輯"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('確定要刪除此記憶嗎？')) {
                                try {
                                  await deleteActivityMemory(activity!._id, memory._id);
                                  setMemories(prev => prev.filter(m => m._id !== memory._id));
                                } catch (err) {
                                  console.error('刪除記憶失敗:', err);
                                  alert('刪除記憶失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
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
                    冷記憶 (Cold Memories)
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {memories.filter(m => m.type === 'cold').map((memory) => (
                      <div key={memory._id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm text-gray-700 mb-1">{memory.content}</div>
                          {memory.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {memory.tags.map((tag, index) => (
                                <span key={index} className="px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(memory.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => setEditingMemory(memory)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="編輯"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('確定要刪除此記憶嗎？')) {
                                try {
                                  await deleteActivityMemory(activity!._id, memory._id);
                                  setMemories(prev => prev.filter(m => m._id !== memory._id));
                                } catch (err) {
                                  console.error('刪除記憶失敗:', err);
                                  alert('刪除記憶失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
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
          ) : (
            <div className="text-gray-500 text-center py-8">
              暫無記憶資料，點擊「新增記憶」開始添加
            </div>
          )}
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => router.push('/activities')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            返回列表
          </button>
          <button
            onClick={() => router.push(`/activities/${activity._id}/chat`)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            開始對話
          </button>
          <button
            onClick={() => router.push(`/activities/${activity._id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            編輯活動
          </button>
        </div>
      </div>

      {/* 新增記憶表單 Modal */}
      {showMemoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-md mx-4">
            <MemoryForm
              onSubmit={async (memory) => {
                if (!activity) return;
                
                try {
                  const memoryData: CreateAgentMemoryInput = {
                    agent_id: activity.agent_profile_id,
                    type: memory.type,
                    content: memory.content,
                    tags: memory.tags,
                    created_by_user_id: '507f1f77bcf86cd799439011', // 假設的用戶 ID，實際應從認證系統獲取
                  };

                  const newMemory = await createActivityMemory(activity._id, memoryData);
                  setMemories(prev => [...prev, newMemory]);
                  setShowMemoryForm(false);
                } catch (err) {
                  console.error('創建記憶失敗:', err);
                  alert('創建記憶失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
                }
              }}
              onCancel={() => setShowMemoryForm(false)}
              isSubmitting={false}
            />
          </div>
        </div>
      )}

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

              try {
                const updatedMemory = await updateActivityMemory(activity!._id, editingMemory._id, updateData);
                setMemories(prev => prev.map(m => m._id === editingMemory._id ? updatedMemory : m));
                setEditingMemory(null);
              } catch (err) {
                console.error('更新記憶失敗:', err);
                alert('更新記憶失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
              }
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
  );
}
