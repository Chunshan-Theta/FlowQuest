import { useCallback, useState } from 'react';
import { ApiResponse, CreateInteractionReportInput, InteractionReport, UnitResult, ObjectId } from '@/types';

export function useReport() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertReport = useCallback(async (input: Partial<CreateInteractionReportInput> & { _id?: ObjectId }) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data: ApiResponse<InteractionReport> = await res.json();
      if (!data.success) throw new Error(data.error || '報告儲存失敗');
      return data.data!;
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const fetchReport = useCallback(async (id: ObjectId) => {
    const res = await fetch(`/api/reports/${id}`);
    const data: ApiResponse<InteractionReport> = await res.json();
    if (!data.success) throw new Error(data.error || '獲取報告失敗');
    return data.data!;
  }, []);

  return { upsertReport, fetchReport, isSaving, error };
} 