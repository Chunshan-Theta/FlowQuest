import { useState, useEffect } from 'react';
import { AgentMemory, ApiResponse } from '@/types';

export function useMemories() {
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/memories');
      const result: ApiResponse<AgentMemory[]> = await response.json();
      
      if (result.success && result.data) {
        setMemories(result.data);
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
    loadMemories();
  }, []);

  return { memories, loading, error, refetch: loadMemories };
} 