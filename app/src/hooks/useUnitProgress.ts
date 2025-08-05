import { useState, useCallback } from 'react';
import { Unit, ChatMessage, OpenAIChatMessage, SimpleChatRequest, SimpleChatResponse } from '@/types';

export interface UnitProgressResult {
  is_passed: boolean;
  reason?: string;
}

export function useUnitProgress() {
  const [isChecking, setIsChecking] = useState(false);

  // 檢查關卡通過條件
  const checkUnitProgress = useCallback(async (
    unit: Unit,
    messages: ChatMessage[]
  ): Promise<UnitProgressResult> => {
    setIsChecking(true);

    try {
      const { pass_condition } = unit;

      if (pass_condition.type === 'keyword') {
        // 關鍵詞檢查
        const userMessages = messages.filter(msg => msg.role === 'user');
        const allUserContent = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
        
        const hasAllKeywords = pass_condition.value.every(keyword => 
          allUserContent.includes(keyword.toLowerCase())
        );
        
        return {
          is_passed: hasAllKeywords,
          reason: hasAllKeywords ? '包含所有必要關鍵詞' : '尚未包含所有必要關鍵詞'
        };

      } else if (pass_condition.type === 'llm') {
        // LLM 判斷檢查
        const checkPrompt = `請判斷以下對話是否滿足通過條件：

通過條件：${pass_condition.value.join(', ')}

對話內容：
${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

請只回答 "YES" 或 "NO"，並簡單說明原因。`;

        const requestData: SimpleChatRequest = {
          messages: [{ role: 'user', content: checkPrompt }],
          max_tokens: 100,
          temperature: 0
        };

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        const responseData: SimpleChatResponse = await response.json();

        if (responseData.success) {
          const result = responseData.message;
          const isPassed = result.toLowerCase().includes('yes');
          
          return {
            is_passed: isPassed,
            reason: result
          };
        } else {
          throw new Error(responseData.error || 'LLM 檢查失敗');
        }

      } else {
        return {
          is_passed: false,
          reason: '未知的通過條件類型'
        };
      }

    } catch (error) {
      console.error('檢查關卡進度錯誤:', error);
      return {
        is_passed: false,
        reason: '檢查過程中發生錯誤'
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    checkUnitProgress,
    isChecking
  };
}
