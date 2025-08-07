import { useState, useCallback } from 'react';
import { AgentMemory, DEFAULT_CONFIG } from '@/types';

export interface MemoryManagerState {
  hotMemories: AgentMemory[];
  coldMemories: AgentMemory[];
  maxHotMemories: number;
}

export interface MemoryManagerActions {
  initializeMemories: (memories: AgentMemory[]) => void;
  addHotMemory: (memory: AgentMemory) => void;
  addColdMemory: (memory: AgentMemory) => void;
  moveToColdMemory: (memoryId: string) => void;
  moveToHotMemory: (memoryId: string) => void;
  getRelevantMemories: (context: string, maxCount?: number) => AgentMemory[];
  updateMemoriesFromResponse: (response: string, context: string) => void;
  consolidateMemories: () => void;
}

export function useMemoryManager(initialMaxHotMemories: number = DEFAULT_CONFIG.MEMORY.MAX_HOT_MEMORIES) {
  const [state, setState] = useState<MemoryManagerState>({
    hotMemories: [],
    coldMemories: [],
    maxHotMemories: initialMaxHotMemories
  });

  // 初始化記憶
  const initializeMemories = useCallback((memories: AgentMemory[]) => {
    const hotMemories = memories.filter(m => m.type === 'hot');
    const coldMemories = memories.filter(m => m.type === 'cold');
    
    // 確保熱記憶數量不超過限制
    const limitedHotMemories = hotMemories.slice(0, state.maxHotMemories);
    const excessMemories = hotMemories.slice(state.maxHotMemories);
    
    setState(prev => ({
      ...prev,
      hotMemories: limitedHotMemories,
      coldMemories: [...coldMemories, ...excessMemories]
    }));
  }, [state.maxHotMemories]);

  // 添加熱記憶
  const addHotMemory = useCallback((memory: AgentMemory) => {
    setState(prev => {
      const newHotMemories = [...prev.hotMemories, memory];
      
      // 如果超過限制，將最舊的記憶移到冷記憶
      if (newHotMemories.length > prev.maxHotMemories) {
        const [oldestMemory, ...remainingHotMemories] = newHotMemories;
        return {
          ...prev,
          hotMemories: remainingHotMemories,
          coldMemories: [...prev.coldMemories, { ...oldestMemory, type: 'cold' as const }]
        };
      }
      
      return {
        ...prev,
        hotMemories: newHotMemories
      };
    });
  }, []);

  // 添加冷記憶
  const addColdMemory = useCallback((memory: AgentMemory) => {
    setState(prev => ({
      ...prev,
      coldMemories: [...prev.coldMemories, memory]
    }));
  }, []);

  // 將記憶從熱記憶移到冷記憶
  const moveToColdMemory = useCallback((memoryId: string) => {
    setState(prev => {
      const memoryIndex = prev.hotMemories.findIndex(m => m._id === memoryId);
      if (memoryIndex === -1) return prev;
      
      const memory = prev.hotMemories[memoryIndex];
      const newHotMemories = prev.hotMemories.filter(m => m._id !== memoryId);
      
      return {
        ...prev,
        hotMemories: newHotMemories,
        coldMemories: [...prev.coldMemories, { ...memory, type: 'cold' }]
      };
    });
  }, []);

  // 將記憶從冷記憶移到熱記憶
  const moveToHotMemory = useCallback((memoryId: string) => {
    setState(prev => {
      const memoryIndex = prev.coldMemories.findIndex(m => m._id === memoryId);
      if (memoryIndex === -1) return prev;
      
      const memory = prev.coldMemories[memoryIndex];
      const newColdMemories = prev.coldMemories.filter(m => m._id !== memoryId);
      const newHotMemories = [...prev.hotMemories, { ...memory, type: 'hot' as const }];
      
      // 如果超過限制，將最舊的記憶移到冷記憶
      if (newHotMemories.length > prev.maxHotMemories) {
        const [oldestMemory, ...remainingHotMemories] = newHotMemories;
        return {
          ...prev,
          hotMemories: remainingHotMemories,
          coldMemories: [...newColdMemories, { ...oldestMemory, type: 'cold' as const }]
        };
      }
      
      return {
        ...prev,
        hotMemories: newHotMemories,
        coldMemories: newColdMemories
      };
    });
  }, []);

  // 計算記憶與上下文的相關性分數
  const calculateRelevanceScore = useCallback((memory: AgentMemory, context: string): number => {
    const contextLower = context.toLowerCase();
    const contentLower = memory.content.toLowerCase();
    const tagsLower = memory.tags.map(tag => tag.toLowerCase());
    
    let score = 0;
    
    // 內容匹配
    const contentWords = contentLower.split(/\s+/);
    const contextWords = contextLower.split(/\s+/);
    
    // 計算詞彙重疊
    const commonWords = contentWords.filter(word => 
      contextWords.includes(word) && word.length > 2
    );
    score += commonWords.length * 2;
    
    // 標籤匹配
    const matchingTags = tagsLower.filter(tag => 
      contextLower.includes(tag)
    );
    score += matchingTags.length * 3;
    
    // 完全匹配加分
    if (contentLower.includes(contextLower) || contextLower.includes(contentLower)) {
      score += 10;
    }
    
    // 時間因素：較新的記憶稍微加分
    const daysSinceCreation = (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 5 - daysSinceCreation * 0.1);
    
    return score;
  }, []);

  // 獲取相關記憶
  const getRelevantMemories = useCallback((context: string, maxCount: number = 10): AgentMemory[] => {
    const allMemories = [...state.hotMemories, ...state.coldMemories];
    
    // 計算相關性分數
    const memoriesWithScores = allMemories.map(memory => ({
      memory,
      score: calculateRelevanceScore(memory, context)
    }));
    
    // 按分數排序並返回前 N 個
    return memoriesWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCount)
      .map(item => item.memory);
  }, [state.hotMemories, state.coldMemories, calculateRelevanceScore]);

  // 從 LLM 回應更新記憶
  const updateMemoriesFromResponse = useCallback(async (response: string, context: string, agentId: string, userId: string) => {
    try {
      // 從回應中提取關鍵詞作為標籤
      const keywords = extractKeywords(response);
      
      const newMemory: AgentMemory = {
        _id: `temp_${Date.now()}`,
        agent_id: agentId,
        type: 'hot',
        content: response,
        tags: keywords,
        created_by_user_id: userId,
        created_at: new Date()
      };
      
      // 保存到資料庫
      const apiResponse = await fetch('/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMemory),
      });
      
      if (apiResponse.ok) {
        const result = await apiResponse.json();
        if (result.success) {
          addHotMemory(result.data);
        }
      }
    } catch (error) {
      console.error('保存記憶失敗:', error);
    }
  }, [addHotMemory]);

  // 提取關鍵詞的簡單實現
  const extractKeywords = (text: string): string[] => {
    // 簡單的關鍵詞提取邏輯
    const keywords = text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5); // 最多取5個關鍵詞
    
    return keywords;
  };

  // 整合記憶：將無關的熱記憶移到冷記憶
  const consolidateMemories = useCallback(() => {
    setState(prev => {
      if (prev.hotMemories.length <= prev.maxHotMemories) {
        return prev;
      }
      
      // 簡單策略：將最舊的記憶移到冷記憶
      const sortedHotMemories = [...prev.hotMemories].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const keepCount = prev.maxHotMemories;
      const keepMemories = sortedHotMemories.slice(-keepCount);
      const moveMemories = sortedHotMemories.slice(0, -keepCount);
      
              return {
          ...prev,
          hotMemories: keepMemories,
          coldMemories: [
            ...prev.coldMemories,
            ...moveMemories.map(m => ({ ...m, type: 'cold' as const }))
          ]
        };
    });
  }, []);

  return {
    state,
    actions: {
      initializeMemories,
      addHotMemory,
      addColdMemory,
      moveToColdMemory,
      moveToHotMemory,
      getRelevantMemories,
      updateMemoriesFromResponse,
      consolidateMemories
    }
  };
} 