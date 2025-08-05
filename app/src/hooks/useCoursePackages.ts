import { useState, useCallback } from 'react';
import { CoursePackage, CreateCoursePackageInput, UpdateCoursePackageInput, CoursePackageFilter, ApiResponse } from '@/types';

export function useCoursePackages() {
  const [coursePackages, setCoursePackages] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 獲取所有課程包
  const fetchCoursePackages = useCallback(async (filter?: CoursePackageFilter & { include_units?: boolean }) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filter?.title) {
        params.append('title', filter.title);
      }
      if (filter?.created_after) {
        params.append('created_after', filter.created_after.toISOString());
      }
      if (filter?.created_before) {
        params.append('created_before', filter.created_before.toISOString());
      }
      if (filter?.include_units) {
        params.append('include_units', 'true');
      }
      
      const url = `/api/course-packages${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<CoursePackage[]> = await response.json();
      
      if (result.success && result.data) {
        setCoursePackages(result.data);
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

  // 根據 ID 獲取單一課程包
  const fetchCoursePackage = useCallback(async (id: string, includeUnits: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (includeUnits) {
        params.append('include_units', 'true');
      }
      
      const url = `/api/course-packages/${id}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<CoursePackage> = await response.json();
      
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

  // 創建新課程包
  const createCoursePackage = useCallback(async (coursePackageData: CreateCoursePackageInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/course-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coursePackageData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<CoursePackage> = await response.json();
      
      if (result.success && result.data) {
        setCoursePackages(prev => [...prev, result.data!]);
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

  // 更新課程包
  const updateCoursePackage = useCallback(async (id: string, coursePackageData: Partial<UpdateCoursePackageInput>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/course-packages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coursePackageData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<CoursePackage> = await response.json();
      
      if (result.success && result.data) {
        setCoursePackages(prev => prev.map(cp => 
          cp._id === id ? result.data! : cp
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

  // 刪除課程包
  const deleteCoursePackage = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/course-packages/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<CoursePackage> = await response.json();
      
      if (result.success) {
        setCoursePackages(prev => prev.filter(cp => cp._id !== id));
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
    coursePackages,
    loading,
    error,
    fetchCoursePackages,
    fetchCoursePackage,
    createCoursePackage,
    updateCoursePackage,
    deleteCoursePackage,
    clearError,
  };
}
