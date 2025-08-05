import { useState, useCallback } from 'react';
import { Unit, CreateUnitInput, UpdateUnitInput, UnitFilter, ApiResponse } from '@/types';

export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 獲取所有 units
  const fetchUnits = useCallback(async (filter?: UnitFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filter?.course_package_id) {
        params.append('course_package_id', filter.course_package_id);
      }
      if (filter?.agent_role) {
        params.append('agent_role', filter.agent_role);
      }
      if (filter?.order_min !== undefined) {
        params.append('order_min', filter.order_min.toString());
      }
      if (filter?.order_max !== undefined) {
        params.append('order_max', filter.order_max.toString());
      }
      
      const url = `/api/units${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Unit[]> = await response.json();
      
      if (result.success && result.data) {
        setUnits(result.data);
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

  // 根據 ID 獲取單一 unit
  const fetchUnit = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/units/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Unit> = await response.json();
      
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

  // 創建新 unit
  const createUnit = useCallback(async (unitData: CreateUnitInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unitData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Unit> = await response.json();
      
      if (result.success && result.data) {
        setUnits(prev => [...prev, result.data!]);
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

  // 更新 unit
  const updateUnit = useCallback(async (id: string, unitData: Partial<UpdateUnitInput>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/units/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unitData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Unit> = await response.json();
      
      if (result.success && result.data) {
        setUnits(prev => prev.map(unit => 
          unit._id === id ? result.data! : unit
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

  // 刪除 unit
  const deleteUnit = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/units/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Unit> = await response.json();
      
      if (result.success) {
        setUnits(prev => prev.filter(unit => unit._id !== id));
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
    units,
    loading,
    error,
    fetchUnits,
    fetchUnit,
    createUnit,
    updateUnit,
    deleteUnit,
    clearError,
  };
}
