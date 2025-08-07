import { useState, useCallback } from 'react';
import { Activity, CreateActivityInput, UpdateActivityInput, ActivityFilter, ApiResponse, AgentMemory, CreateAgentMemoryInput } from '@/types';

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 獲取所有活動
  const fetchActivities = useCallback(async (filter?: ActivityFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filter?.status) {
        params.append('status', filter.status);
      }
      if (filter?.created_after) {
        params.append('created_after', filter.created_after.toISOString());
      }
      if (filter?.created_before) {
        params.append('created_before', filter.created_before.toISOString());
      }
      
      const url = `/api/activities${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Activity[]> = await response.json();
      
      if (result.success && result.data) {
        setActivities(result.data);
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

  // 根據 ID 獲取單一活動
  const fetchActivity = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/activities/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Activity> = await response.json();
      
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

  // 創建新活動
  const createActivity = useCallback(async (activityData: CreateActivityInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Activity> = await response.json();
      
      if (result.success && result.data) {
        // 將新活動添加到本地狀態
        setActivities(prev => [result.data!, ...prev]);
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

  // 更新活動
  const updateActivity = useCallback(async (id: string, updateData: Partial<UpdateActivityInput>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/activities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...updateData, _id: id }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Activity> = await response.json();
      
      if (result.success && result.data) {
        // 更新本地狀態中的活動
        setActivities(prev => prev.map(activity => 
          activity._id === id ? result.data! : activity
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

  // 刪除活動
  const deleteActivity = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Activity> = await response.json();
      
      if (result.success) {
        // 從本地狀態中移除活動
        setActivities(prev => prev.filter(activity => activity._id !== id));
        return true;
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

  // 獲取活動的所有記憶
  const fetchActivityMemories = useCallback(async (activityId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/activities/${activityId}/memories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<AgentMemory[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || '獲取記憶失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '網路錯誤';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 為活動新增記憶
  const createActivityMemory = useCallback(async (activityId: string, memoryData: CreateAgentMemoryInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/activities/${activityId}/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<AgentMemory> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || '創建記憶失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '網路錯誤';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新活動記憶
  const updateActivityMemory = useCallback(async (activityId: string, memoryId: string, updateData: Partial<AgentMemory>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/activities/${activityId}/memories/${memoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<AgentMemory> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || '更新記憶失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '網路錯誤';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 刪除活動記憶
  const deleteActivityMemory = useCallback(async (activityId: string, memoryId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/activities/${activityId}/memories/${memoryId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<AgentMemory> = await response.json();
      
      if (result.success) {
        return true;
      } else {
        throw new Error(result.error || '刪除記憶失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '網路錯誤';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    activities,
    loading,
    error,
    fetchActivities,
    fetchActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    // 記憶管理功能
    fetchActivityMemories,
    createActivityMemory,
    updateActivityMemory,
    deleteActivityMemory,
    setError, // 允許手動清除錯誤
  };
}
