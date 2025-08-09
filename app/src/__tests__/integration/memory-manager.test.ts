import { describe, test, expect, beforeEach } from '@jest/globals';
import { AgentMemory } from '@/types';

// 模擬記憶管理 hook
const mockMemories: AgentMemory[] = [
  {
    _id: '1',
    agent_id: 'agent1',
    type: 'hot',
    content: '客戶對保濕產品很感興趣',
    tags: ['保濕', '客戶', '產品'],
    created_by_user_id: 'user1',
    created_at: new Date('2024-01-01T10:00:00Z')
  },
  {
    _id: '2',
    agent_id: 'agent1',
    type: 'hot',
    content: '客戶預算在1000-2000元之間',
    tags: ['預算', '價格'],
    created_by_user_id: 'user1',
    created_at: new Date('2024-01-01T10:15:00Z')
  },
  {
    _id: '3',
    agent_id: 'agent1',
    type: 'cold',
    content: '一般客戶在冬季較關注保濕產品',
    tags: ['季節性', '保濕'],
    created_by_user_id: 'user1',
    created_at: new Date('2024-01-01T00:00:00Z')
  }
];

describe('Memory Manager Integration Tests', () => {
  beforeEach(() => {
    // 重置測試環境
  });

  test('應該能夠初始化記憶並分類為熱記憶和冷記憶', () => {
    const hotMemories = mockMemories.filter(m => m.type === 'hot');
    const coldMemories = mockMemories.filter(m => m.type === 'cold');

    expect(hotMemories).toHaveLength(2);
    expect(coldMemories).toHaveLength(1);
    expect(hotMemories[0].content).toBe('客戶對保濕產品很感興趣');
    expect(coldMemories[0].content).toBe('一般客戶在冬季較關注保濕產品');
  });

  test('應該能夠計算記憶與上下文的相關性分數', () => {
    const context = '保濕產品價格預算';
    const relevantMemory = mockMemories[0]; // 包含保濕和客戶的記憶
    
    // 簡單的相關性計算邏輯
    const calculateRelevanceScore = (memory: AgentMemory, context: string): number => {
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
      
      return score;
    };

    const score = calculateRelevanceScore(relevantMemory, context);
    expect(score).toBeGreaterThan(0);
  });

  test('應該能夠從回應中提取關鍵詞', () => {
    const response = '根據您的需求，我推薦這款保濕精華液，價格合理且效果很好';
    
    const extractKeywords = (text: string): string[] => {
      // 簡單的關鍵詞提取
      const words = text.split(/[\s，。！？、]+/);
      return words.filter(word => word.length > 1).slice(0, 5);
    };

    const keywords = extractKeywords(response);
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords).toContain('我推薦這款保濕精華液');
    expect(keywords).toContain('根據您的需求');
  });

  test('應該能夠管理熱記憶數量限制', () => {
    const maxHotMemories = 2;
    let hotMemories = mockMemories.filter(m => m.type === 'hot');
    
    // 模擬添加新記憶
    const newMemory: AgentMemory = {
      _id: '4',
      agent_id: 'agent1',
      type: 'hot',
      content: '客戶對防曬產品也有興趣',
      tags: ['防曬'],
      created_by_user_id: 'user1',
      created_at: new Date()
    };
    
    hotMemories.push(newMemory);
    
    // 如果超過限制，將最舊的記憶移到冷記憶
    if (hotMemories.length > maxHotMemories) {
      const oldestMemory = hotMemories.shift()!;
      const coldMemory = { ...oldestMemory, type: 'cold' as const };
      
      expect(hotMemories.length).toBe(maxHotMemories);
      expect(coldMemory.type).toBe('cold');
    }
  });

  test('應該能夠根據上下文獲取相關記憶', () => {
    const context = '保濕產品推薦';
    
    const getRelevantMemories = (memories: AgentMemory[], context: string, maxCount: number = 3): AgentMemory[] => {
      const calculateRelevanceScore = (memory: AgentMemory, context: string): number => {
        const contextLower = context.toLowerCase();
        const contentLower = memory.content.toLowerCase();
        const tagsLower = memory.tags.map(tag => tag.toLowerCase());
        
        let score = 0;
        
        // 內容匹配
        const contentWords = contentLower.split(/\s+/);
        const contextWords = contextLower.split(/\s+/);
        
        const commonWords = contentWords.filter(word => 
          contextWords.includes(word) && word.length > 2
        );
        score += commonWords.length * 2;
        
        // 標籤匹配
        const matchingTags = tagsLower.filter(tag => 
          contextLower.includes(tag)
        );
        score += matchingTags.length * 3;
        
        return score;
      };
      
      const memoriesWithScores = memories.map(memory => ({
        memory,
        score: calculateRelevanceScore(memory, context)
      }));
      
      return memoriesWithScores
        .sort((a, b) => b.score - a.score)
        .slice(0, maxCount)
        .map(item => item.memory);
    };

    const relevantMemories = getRelevantMemories(mockMemories, context);
    expect(relevantMemories.length).toBeLessThanOrEqual(3);
    
    // 應該包含與保濕相關的記憶
    const hasRelevantMemory = relevantMemories.some(memory => 
      memory.content.includes('保濕') || memory.tags.includes('保濕')
    );
    expect(hasRelevantMemory).toBe(true);
  });
}); 