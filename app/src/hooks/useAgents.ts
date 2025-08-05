import { useState, useCallback } from 'react';
import { AgentProfile, CreateAgentProfileInput, UpdateAgentProfileInput, ApiResponse } from '@/types';

export function useAgents() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 獲取所有 agents
  const fetchAgents = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('name', searchTerm);
      }
      
      const url = `/api/agents${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<AgentProfile[]> = await response.json();
      
      if (result.success && result.data) {
        setAgents(result.data);
        return result.data;
      } else {
        throw new Error(result.error || '獲取資料失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '網路錯誤';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 根據 ID 獲取單一 agent
  const fetchAgent = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/agents/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<AgentProfile> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || '獲取資料失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '網路錯誤';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 創建新 agent
  const createAgent = useCallback(async (data: CreateAgentProfileInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<AgentProfile> = await response.json();
      
      if (result.success && result.data) {
        // 更新本地狀態
        setAgents(prev => [...prev, result.data!]);
        return result.data;
      } else {
        throw new Error(result.error || '創建失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '網路錯誤';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新 agent
  const updateAgent = useCallback(async (id: string, data: Partial<UpdateAgentProfileInput>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<AgentProfile> = await response.json();
      
      if (result.success && result.data) {
        // 更新本地狀態
        setAgents(prev => prev.map(agent => 
          agent._id === id ? result.data! : agent
        ));
        return result.data;
      } else {
        throw new Error(result.error || '更新失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '網路錯誤';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 刪除 agent
  const deleteAgent = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<AgentProfile> = await response.json();
      
      if (result.success) {
        // 更新本地狀態
        setAgents(prev => prev.filter(agent => agent._id !== id));
        return result.data;
      } else {
        throw new Error(result.error || '刪除失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '網路錯誤';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    agents,
    loading,
    error,
    fetchAgents,
    fetchAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    clearError,
  };
}
