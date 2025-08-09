import { useCallback, useState } from 'react';
import { ApiResponse, CreateSessionInput, SessionRecord, ObjectId } from '@/types';

export function useSession() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertSession = useCallback(async (input: Partial<CreateSessionInput> & { _id?: ObjectId }) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data: ApiResponse<SessionRecord> = await res.json();
      if (!data.success) throw new Error(data.error || 'Session 儲存失敗');
      return data.data!;
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const fetchSession = useCallback(async (id: ObjectId) => {
    const res = await fetch(`/api/sessions/${id}`);
    const data: ApiResponse<SessionRecord> = await res.json();
    if (!data.success) throw new Error(data.error || '獲取 Session 失敗');
    return data.data!;
  }, []);

  return { upsertSession, fetchSession, isSaving, error };
} 