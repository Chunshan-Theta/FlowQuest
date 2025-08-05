'use client';

import React, { useState, useEffect } from 'react';
import { AgentProfile, CreateAgentProfileInput, ApiResponse } from '@/types';

interface AgentFormProps {
  agent?: AgentProfile;
  onSubmit: (data: CreateAgentProfileInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function AgentForm({ agent, onSubmit, onCancel, isSubmitting = false }: AgentFormProps) {
  const [formData, setFormData] = useState<CreateAgentProfileInput>({
    name: agent?.name || '',
    persona: {
      tone: agent?.persona.tone || '',
      background: agent?.persona.background || '',
      voice: agent?.persona.voice || '',
    },
    memory_config: {
      hot_memory_ids: [],
      cold_memory_ids: [],
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('persona.')) {
      const personaField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        persona: {
          ...prev.persona,
          [personaField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {agent ? '編輯 Agent' : '新增 Agent'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agent 名稱 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="請輸入 Agent 名稱"
            required
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              語調風格 *
            </label>
            <input
              type="text"
              value={formData.persona.tone}
              onChange={(e) => handleInputChange('persona.tone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：親切健談"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              背景設定 *
            </label>
            <input
              type="text"
              value={formData.persona.background}
              onChange={(e) => handleInputChange('persona.background', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：5年銷售經驗"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              聲音特徵 *
            </label>
            <input
              type="text"
              value={formData.persona.voice}
              onChange={(e) => handleInputChange('persona.voice', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：女性、28歲、溫柔"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '處理中...' : (agent ? '更新' : '創建')}
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 載入 agents
  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents');
      const result: ApiResponse<AgentProfile[]> = await response.json();
      
      if (result.success && result.data) {
        setAgents(result.data);
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
    loadAgents();
  }, []);

  // 創建或更新 agent
  const handleSubmit = async (data: CreateAgentProfileInput) => {
    try {
      setIsSubmitting(true);
      
      const url = editingAgent ? `/api/agents/${editingAgent._id}` : '/api/agents';
      const method = editingAgent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result: ApiResponse<AgentProfile> = await response.json();
      
      if (result.success) {
        await loadAgents();
        setShowForm(false);
        setEditingAgent(null);
      } else {
        setError(result.error || '操作失敗');
      }
    } catch {
      setError('網路錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 刪除 agent
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個 Agent 嗎？')) return;
    
    try {
      const response = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      const result: ApiResponse<AgentProfile> = await response.json();
      
      if (result.success) {
        await loadAgents();
      } else {
        setError(result.error || '刪除失敗');
      }
    } catch {
      setError('網路錯誤');
    }
  };

  // 過濾 agents
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Agent 管理</h1>
          <p className="text-gray-600">管理您的 AI 代理人檔案</p>
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
          <AgentForm
            agent={editingAgent || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingAgent(null);
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
                    placeholder="搜尋 Agent..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ➕ 新增 Agent
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAgents.map((agent) => (
                <div key={agent._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{agent.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingAgent(agent);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="編輯"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(agent._id)}
                        className="text-red-600 hover:text-red-800"
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">語調：</span>
                      <span className="text-gray-800">{agent.persona.tone}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">背景：</span>
                      <span className="text-gray-800">{agent.persona.background}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">聲音：</span>
                      <span className="text-gray-800">{agent.persona.voice}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    <div>創建：{new Date(agent.created_at).toLocaleDateString('zh-TW')}</div>
                    <div>更新：{new Date(agent.updated_at).toLocaleDateString('zh-TW')}</div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAgents.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🤖</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {searchTerm ? '找不到符合條件的 Agent' : '還沒有任何 Agent'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? '請嘗試其他搜尋關鍵字' : '點擊上方按鈕來創建您的第一個 Agent'}
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
