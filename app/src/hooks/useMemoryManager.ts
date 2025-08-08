import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AgentMemory } from '@/types';

export interface MemoryManagerState {
  // 整合記憶（角色記憶 + 活動記憶）
  integratedHotMemories: AgentMemory[];
  integratedColdMemories: AgentMemory[];
  
  // 基礎熱記憶數量（初始化時的熱記憶數量）
  baseHotMemoryCount: number;
}

export interface MemoryManagerActions {
  // 第一階段：初始化記憶
  initializeMemories: (agentMemories: AgentMemory[], activityMemories: AgentMemory[]) => Promise<void>;
  initializeMemoriesFromServer: (params: { agentId?: string; activityId?: string }) => Promise<void>;
  
  // 第二階段：用戶輸入時查找相關記憶
  findRelevantMemoriesForInput: (userInput: string) => Promise<AgentMemory[]>;
  
  // 第三階段：LLM回應後更新記憶
  updateMemoriesFromLLMResponse: (llmResponse: string, userInput: string, agentId: string, userId: string) => Promise<void>;
  
  // 獲取當前所有相關記憶（用於生成系統提示）
  getRelevantMemories: (context: string, maxCount?: number) => AgentMemory[];
  
  // 整理熱記憶（第三階段的核心邏輯）
  consolidateHotMemories: (llmResponse: string) => Promise<void>;
}

export function useMemoryManager() {
  const [state, setState] = useState<MemoryManagerState>({
    integratedHotMemories: [],
    integratedColdMemories: [],
    baseHotMemoryCount: 0
  });

  // 使用 ref 來存儲最新的狀態，避免閉包問題
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 第一階段：初始化記憶（整合角色記憶和活動記憶）
  const initializeMemories = useCallback(async (agentMemories: AgentMemory[], activityMemories: AgentMemory[] = []) => {
    console.log('=== 第一階段：初始化記憶 ===');
    console.log('角色記憶:', agentMemories);
    console.log('活動記憶:', activityMemories);
    
    // 分別處理角色記憶和活動記憶
    const agentHotMemories = agentMemories.filter(m => m.type === 'hot');
    const agentColdMemories = agentMemories.filter(m => m.type === 'cold');
    const activityHotMemories = activityMemories.filter(m => m.type === 'hot');
    const activityColdMemories = activityMemories.filter(m => m.type === 'cold');
    
    // 整合所有記憶
    const integratedHotMemories = [...agentHotMemories, ...activityHotMemories];
    const integratedColdMemories = [...agentColdMemories, ...activityColdMemories];
    
    // 記錄基礎熱記憶數量
    const baseCount = integratedHotMemories.length;
    
    console.log(`基礎熱記憶數量: ${baseCount}`);
    console.log('整合熱記憶:', integratedHotMemories);
    console.log('整合冷記憶:', integratedColdMemories);
    
    setState(prev => ({
      ...prev,
      integratedHotMemories,
      integratedColdMemories,
      baseHotMemoryCount: baseCount
    }));
  }, []);

  // 第一階段（可選）：從伺服器載入記憶並初始化
  const initializeMemoriesFromServer = useCallback(async ({ agentId, activityId }: { agentId?: string; activityId?: string }) => {
    const [agentMemories, activityMemories] = await Promise.all([
      (async () => {
        if (!agentId) return [] as AgentMemory[];
        try {
          const res = await fetch(`/api/agents/${agentId}`);
          const json = await res.json();
          if (json?.success && json?.data?.memory_config?.memory_ids) {
            return json.data.memory_config.memory_ids as AgentMemory[];
          }
        } catch {}
        return [] as AgentMemory[];
      })(),
      (async () => {
        if (!activityId) return [] as AgentMemory[];
        try {
          const res = await fetch(`/api/activities/${activityId}/memories`);
          const json = await res.json();
          if (json?.success && Array.isArray(json.data)) {
            return json.data as AgentMemory[];
          }
        } catch {}
        return [] as AgentMemory[];
      })(),
    ]);

    await initializeMemories(agentMemories, activityMemories);
  }, [initializeMemories]);

  // 第二階段：用戶輸入時查找相關記憶
  const findRelevantMemoriesForInput = useCallback(async (userInput: string): Promise<AgentMemory[]> => {
    console.log('=== 第二階段：查找相關記憶 ===');
    console.log('用戶輸入:', userInput);
    
    const currentState = stateRef.current;
    
    if (currentState.integratedColdMemories.length === 0) {
      console.log('沒有冷記憶可查詢');
      return [];
    }
    
    try {
      // 使用 LLM 判斷冷記憶是否相關
      const coldMemoriesText = currentState.integratedColdMemories
        .map((memory, index) => `${index + 1}. ${memory.content}`)
        .join('\n');
      
      const prompt = `請分析以下冷記憶是否與用戶輸入相關。

冷記憶列表：
${coldMemoriesText}

用戶輸入：${userInput}

請只返回相關記憶的編號（用逗號分隔），如果沒有相關的請返回"無"。

例如：1,3,5 或 無`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: '你是一個記憶分析助手，負責判斷記憶與用戶輸入的相關性。' },
            { role: 'user', content: prompt }
          ]
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        console.error('LLM 分析失敗:', result.error);
        return [];
      }

      const llmResponse = result.message.trim();
      console.log('LLM 分析結果:', llmResponse);
      
      let relevantIndices: number[] = [];
      
             if (llmResponse !== '無' && llmResponse !== 'none' && llmResponse !== 'None') {
         // 解析 LLM 返回的編號
         relevantIndices = llmResponse
           .split(/[,，\s]+/)
           .map((s: string) => parseInt(s.trim()))
           .filter((n: number) => !isNaN(n) && n > 0 && n <= currentState.integratedColdMemories.length)
           .map((n: number) => n - 1); // 轉換為陣列索引
       }
      
      const relevantColdMemories = relevantIndices.map(index => 
        currentState.integratedColdMemories[index]
      );
      
      console.log('找到相關冷記憶:', relevantColdMemories);
      
      if (relevantColdMemories.length > 0) {
        setState(prev => {
          // 複製相關冷記憶到熱記憶
          const newHotMemories = [
            ...prev.integratedHotMemories,
            ...relevantColdMemories.map(memory => ({ ...memory, type: 'hot' as const }))
          ];
          console.log('更新前的熱記憶(準備添加冷記憶):', prev.integratedHotMemories);
          console.log('更新後的熱記憶(添加冷記憶):', newHotMemories);
          console.log('更新後的熱記憶數量:', newHotMemories.length);
          
          return {
            ...prev,
            integratedHotMemories: newHotMemories
          };
        });
      }
      
      return relevantColdMemories;
      
    } catch (error) {
      console.error('查找相關記憶失敗:', error);
      return [];
    }
  }, []);

        // 整理熱記憶（第三階段核心邏輯）
   const consolidateHotMemories = useCallback(async (llmResponse: string) => {
     console.log('=== 整理熱記憶 ===');
     
     const currentState = stateRef.current;
     const currentHotCount = currentState.integratedHotMemories.length;
     const targetCount = currentState.baseHotMemoryCount;
     
        console.log(`當前熱記憶數量: ${currentHotCount}, 目標數量: ${targetCount}`);
        console.log('當前熱記憶:', currentState.integratedHotMemories.map(m => ({
         id: m._id,
         content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
         type: m.type
       })));
     if (currentHotCount <= targetCount) {
       console.log('熱記憶數量未超過基礎數量，無需整理');
       return;
     }
     
     try {
       // 使用 LLM 整合熱記憶
       const hotMemoriesText = currentState.integratedHotMemories
         .map((memory, index) => `${index + 1}. ${memory.content}`)
         .join('\n');
       
       const prompt = `請整合以下熱記憶，將 ${currentHotCount} 條記憶整合成 ${targetCount} 條新的記憶。

當前熱記憶（${currentHotCount} 條）：
${hotMemoriesText}

LLM 回應：${llmResponse}

請分析這些記憶，將相關的記憶整合成新的記憶。整合時要：
1. 保留重要的信息
2. 合併相似或相關的內容
3. 生成 ${targetCount} 條新的整合記憶

請返回整合後的新記憶內容，格式如下：
記憶1: [新記憶內容]
記憶2: [新記憶內容]
...
記憶${targetCount}: [新記憶內容]`;

       const response = await fetch('/api/chat', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           messages: [
             { role: 'system', content: '你是一個記憶整合助手，負責選擇最重要的記憶。' },
             { role: 'user', content: prompt }
           ]
         }),
       });

       const result = await response.json();
       
       if (!result.success) {
         console.error('LLM 整合失敗:', result.error);
         return;
       }

       const llmResponse2 = result.message.trim();
       console.log('LLM 整合結果:', llmResponse2);
       
       // 解析 LLM 返回的整合記憶內容
       const consolidatedMemories: AgentMemory[] = [];
       const lines = llmResponse2.split('\n');
       
       for (let i = 0; i < targetCount; i++) {
         const memoryIndex = i + 1;
         const memoryPattern = new RegExp(`記憶${memoryIndex}:\\s*(.+)`, 'i');
         
         // 尋找對應的記憶行
         const memoryLine = lines.find((line: string) => memoryPattern.test(line));
         if (memoryLine) {
           const match = memoryLine.match(memoryPattern);
           if (match && match[1]) {
             const content = match[1].trim();
             
             // 創建新的整合記憶
             const consolidatedMemory: AgentMemory = {
               _id: `consolidated_${Date.now()}_${i}`,
               agent_id: currentState.integratedHotMemories[0]?.agent_id || '',
               content: content,
               type: 'hot',
               tags: extractKeywords(content),
               created_by_user_id: currentState.integratedHotMemories[0]?.created_by_user_id || '',
               created_at: new Date()
             };
             
             consolidatedMemories.push(consolidatedMemory);
           }
         }
       }
       
       console.log(`整合成 ${consolidatedMemories.length} 個新記憶`);
       console.log('整合後的記憶:', consolidatedMemories.map(m => m.content.substring(0, 100)));
       
       if (consolidatedMemories.length > 0) {
         setState(prev => {
           // 將所有原有熱記憶轉為冷記憶
           const newColdMemories = [
             ...prev.integratedColdMemories,
             ...currentState.integratedHotMemories.map(m => ({ ...m, type: 'cold' as const }))
           ];
           
           return {
             ...prev,
             integratedHotMemories: consolidatedMemories,
             integratedColdMemories: newColdMemories
           };
         });
       }
       
     } catch (error) {
       console.error('整合熱記憶失敗:', error);
     }
   }, []);

   // 第三階段：LLM回應後更新記憶
   const updateMemoriesFromLLMResponse = useCallback(async (
     llmResponse: string, 
     userInput: string, 
     agentId: string, 
     userId: string
   ) => {
     console.log('=== 第三階段：更新記憶 ===');
     console.log('LLM回應:', llmResponse);
     console.log('用戶輸入:', userInput);
     
     try {
       // 基於用戶提問和LLM回應生成新記憶
       const keywords = extractKeywords(llmResponse + ' ' + userInput);
       
       const newMemoryContent = `對方說: ${userInput}\n你回應: ${llmResponse}`;
       
       // 創建新記憶（冷熱各一條）
       const baseMemory = {
         agent_id: agentId,
         content: newMemoryContent,
         tags: keywords,
         created_by_user_id: userId,
       };
       
       const hotMemory: AgentMemory = {
         ...baseMemory,
         _id: `temp_hot_${Date.now()}`,
         type: 'hot',
         created_at: new Date()
       };
       
       const coldMemory: AgentMemory = {
         ...baseMemory,
         _id: `temp_cold_${Date.now()}`,
         type: 'cold', 
         created_at: new Date()
       };
       
       // 保存熱記憶到資料庫
       const hotMemoryResponse = await fetch('/api/memories', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(hotMemory),
       });
       
       // 保存冷記憶到資料庫
       const coldMemoryResponse = await fetch('/api/memories', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(coldMemory),
       });
       
       if (hotMemoryResponse.ok && coldMemoryResponse.ok) {
         const hotResult = await hotMemoryResponse.json();
         const coldResult = await coldMemoryResponse.json();
         
         if (hotResult.success && coldResult.success) {
           setState(prev => ({
             ...prev,
             integratedHotMemories: [...prev.integratedHotMemories, { ...hotResult.data, type: 'hot' }],
             integratedColdMemories: [...prev.integratedColdMemories, { ...coldResult.data, type: 'cold' }]
           }));
           
           // 執行熱記憶整理
           setTimeout(async () => {
             await consolidateHotMemories(llmResponse);
           }, 100);
         }
       }
     } catch (error) {
       console.error('保存記憶失敗:', error);
     }
   }, [consolidateHotMemories]);

  // 獲取相關記憶（用於生成系統提示）
  const getRelevantMemories = useCallback((context: string, maxCount: number = 10): AgentMemory[] => {
    const currentState = stateRef.current;
    
    // 第二階段：整合所有的熱記憶給對話使用
    // 直接返回所有熱記憶，不進行過濾，因為第二階段已經通過 LLM 選擇了相關的記憶
    return currentState.integratedHotMemories.slice(0, maxCount);
  }, []);

  // 提取關鍵詞
  const extractKeywords = (text: string): string[] => {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
  };

  const actions = useMemo(() => ({
    initializeMemories,
    initializeMemoriesFromServer,
    findRelevantMemoriesForInput,
    updateMemoriesFromLLMResponse,
    getRelevantMemories,
    consolidateHotMemories
  }), [initializeMemories, initializeMemoriesFromServer, findRelevantMemoriesForInput, updateMemoriesFromLLMResponse, getRelevantMemories, consolidateHotMemories]);

  return {
    state,
    actions
  };
} 