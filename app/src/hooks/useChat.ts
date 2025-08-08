import { useState, useCallback } from 'react';
import { ChatSession, ChatMessage, OpenAIChatMessage, SimpleChatRequest, SimpleChatResponse } from '@/types';

// LocalStorage 鍵值（改為以 sessionId 為鍵）
const CHAT_SESSION_KEY = 'flowquest_chat_session_by_id_';

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 從 localStorage 載入聊天會話（以 sessionId 為鍵）
  const loadChatSession = useCallback((sessionId: string): ChatSession | null => {
    try {
      const sessionData = localStorage.getItem(`${CHAT_SESSION_KEY}${sessionId}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        // 將日期字串轉換回 Date 物件
        return {
          ...parsed,
          started_at: new Date(parsed.started_at),
          updated_at: new Date(parsed.updated_at),
          messages: parsed.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        };
      }
      return null;
    } catch (error) {
      console.error('載入聊天會話失敗:', error);
      return null;
    }
  }, []);

  // 儲存聊天會話到 localStorage（以 sessionId 為鍵）
  const saveChatSession = useCallback((sessionId: string, session: ChatSession) => {
    try {
      localStorage.setItem(`${CHAT_SESSION_KEY}${sessionId}`, JSON.stringify(session));
    } catch (error) {
      console.error('儲存聊天會話失敗:', error);
    }
  }, []);

  // 清除聊天會話（以 sessionId 為鍵）
  const clearChatSession = useCallback((sessionId: string) => {
    try {
      localStorage.removeItem(`${CHAT_SESSION_KEY}${sessionId}`);
    } catch (error) {
      console.error('清除聊天會話失敗:', error);
    }
  }, []);

  // 發送聊天訊息到 OpenAI
  const sendChatToOpenAI = useCallback(async (
    messages: OpenAIChatMessage[],
    maxTokens?: number,
    temperature?: number
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const requestData: SimpleChatRequest = {
        messages,
        max_tokens: maxTokens,
        temperature
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseData: SimpleChatResponse = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || '發送訊息失敗');
      }

      return responseData.message;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '發送訊息時發生未知錯誤';
      setError(errorMessage);
      console.error('發送聊天訊息錯誤:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 重新開始聊天（清除會話）
  const restartChat = useCallback((sessionId: string) => {
    clearChatSession(sessionId);
  }, [clearChatSession]);

  // 取得所有聊天會話清單（用於管理）
  const getAllChatSessions = useCallback((): { sessionId: string; session: ChatSession }[] => {
    const sessions: { sessionId: string; session: ChatSession }[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CHAT_SESSION_KEY)) {
          const sessionId = key.replace(CHAT_SESSION_KEY, '');
          const session = loadChatSession(sessionId);
          if (session) {
            sessions.push({ sessionId, session });
          }
        }
      }
    } catch (error) {
      console.error('載入聊天會話清單失敗:', error);
    }

    return sessions;
  }, [loadChatSession]);

  return {
    // 狀態
    isLoading,
    error,
    
    // 功能函數
    loadChatSession,
    saveChatSession,
    clearChatSession,
    sendChatToOpenAI,
    restartChat,
    getAllChatSessions,
  };
}
