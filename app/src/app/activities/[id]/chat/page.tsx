'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Activity, AgentProfile, CoursePackage, ChatSession, ChatMessage, OpenAIChatMessage, Unit, AgentMemory } from '@/types';
import { useActivities } from '@/hooks/useActivities';
import { useAgents } from '@/hooks/useAgents';
import { useCoursePackages } from '@/hooks/useCoursePackages';
import { useChat } from '@/hooks/useChat';
import { useUnitProgress } from '@/hooks/useUnitProgress';
import { useMemoryManager } from '@/hooks/useMemoryManager';

export default function ActivityChatPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchActivity } = useActivities();
  const { fetchAgent } = useAgents();
  const { fetchCoursePackage } = useCoursePackages();
  const { loadChatSession, sendChatToOpenAI, restartChat, saveChatSession, isLoading, error } = useChat();
  const { checkUnitProgress, isChecking } = useUnitProgress();
  const { state: memoryState, actions: memoryActions } = useMemoryManager();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [coursePackage, setCoursePackage] = useState<CoursePackage | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 生成系統提示詞，包含 agent、關卡資訊和相關記憶
  const generateSystemPrompt = (agent: AgentProfile | null, currentUnit: Unit | null, coursePackage: CoursePackage | null, context: string = ''): string => {
    if (!agent) return '你是一個學習助手，協助學習者完成學習任務。';

    let prompt = `你是 ${agent.name}，`;

    // 添加 agent 的人格設定
    if (agent.persona) {
      if (agent.persona.background) {
        prompt += `背景：${agent.persona.background} `;
      }
      if (agent.persona.tone) {
        prompt += `語調：${agent.persona.tone} `;
      }
      if (agent.persona.voice) {
        prompt += `說話風格：${agent.persona.voice} `;
      }
    }

    // 添加課程包資訊
    if (coursePackage) {
      prompt += `\n\n當前課程：${coursePackage.title}`;
      if (coursePackage.description) {
        prompt += `\n課程描述：${coursePackage.description}`;
      }
    }

    // 添加當前關卡資訊
    if (currentUnit) {
      // prompt += `\n\n當前關卡：${currentUnit.title}`;
      
      // 添加角色設定
      if (currentUnit.agent_role) {
        prompt += `\n你在這個關卡的角色：${currentUnit.agent_role}`;
      }
      if (currentUnit.user_role) {
        prompt += `\n對方角色：${currentUnit.user_role}`;
      }

      // 添加行為提示
      if (currentUnit.agent_behavior_prompt) {
        prompt += `\n行為指引：${currentUnit.agent_behavior_prompt}`;
      }

      // 添加通過條件
      if (currentUnit.pass_condition) {
        const condition = currentUnit.pass_condition;
        if (condition.type === 'keyword' && condition.value && condition.value.length > 0) {
          prompt += `\n通過條件：學習者需要在對話中提到關鍵詞：${condition.value.join('、')}`;
        } else if (condition.type === 'llm' && condition.value && condition.value.length > 0) {
          prompt += `\n通過條件：${condition.value.join('；')}`;
        }
      }

      // 添加關卡限制
      if (currentUnit.max_turns && currentUnit.max_turns > 0) {
        // prompt += `\n對話回合限制：最多 ${currentUnit.max_turns} 回合`;
      }
    }

    // 添加相關記憶
    if (context) {
      const relevantMemories = memoryActions.getRelevantMemories(context, 5);
      if (relevantMemories.length > 0) {
        prompt += `\n\n你的角色記憶：`;
        relevantMemories.forEach((memory, index) => {
          prompt += `\n${index + 1}. ${memory.content}`;
          if (memory.tags.length > 0) {
            prompt += ` (標籤: ${memory.tags.join(', ')})`;
          }
        });
      }
    }

    // 添加角色指引
    prompt += `\n\n請基於你的角色性格進行對話扮演，確保回應是符合覺色性格，並保持一致的回應立場在進行回應。`;

    return prompt;
  };

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatSession?.messages]);

  // 載入活動資料
  useEffect(() => {
    const loadActivityData = async () => {
      try {
        setInitialLoading(true);
        
        const activityId = params.id as string;
        
        // 載入活動詳情
        const activityData = await fetchActivity(activityId);
        setActivity(activityData);
        
        // 並行載入相關資料
        const [agentData, coursePackageData] = await Promise.all([
          fetchAgent(activityData.agent_profile_id),
          fetchCoursePackage(activityData.course_package_id, true)
        ]);
        
        setAgent(agentData);
        setCoursePackage(coursePackageData);

        // 第一階段：初始化記憶管理系統（整合角色記憶和活動記憶）
        const agentMemories = agentData.memories || [];
        const activityMemories = (activityData as any).memories || [];
        await memoryActions.initializeMemories(agentMemories, activityMemories);

        console.log('活動資料載入成功:', activityData);
        console.log('代理人資料載入成功:', agentData);
        console.log('課程包資料載入成功:', coursePackageData);
        
        // 載入聊天會話
        const session = loadChatSession(activityId);
        setChatSession(session);
        
        // 如果沒有現有會話，初始化對話會話
        if (!session && coursePackageData.units.length > 0) {
          console.log('沒有現有會話，初始化對話會話');
          
          // 找到 order 最小的關卡作為第一個關卡
          const sortedUnits = [...coursePackageData.units].sort((a, b) => a.order - b.order);
          const firstUnit = sortedUnits[0];
          
          // 直接初始化聊天會話，包含第一個關卡的開頭語
          const initialSession: ChatSession = {
            activity_id: activityId,
            current_unit_id: firstUnit._id.toString(),
            messages: [],
            current_turn: 0,
            is_completed: false,
            started_at: new Date(),
            updated_at: new Date()
          };
          
          // 如果第一個關卡有開頭語，添加為第一個訊息
          if (firstUnit.intro_message) {
            initialSession.messages.push({
              id: `intro-${Date.now()}`,
              role: 'assistant',
              content: firstUnit.intro_message,
              timestamp: new Date(),
              unit_id: firstUnit._id.toString()
            });
          }
          
          // 設定會話並保存到 localStorage
          setChatSession(initialSession);
          // 使用 setTimeout 確保狀態更新完成後再保存
          setTimeout(() => {
            saveChatSession(activityId, initialSession);
          }, 100);
        }
        
      } catch (err) {
        console.error('載入活動資料失敗:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    if (params.id) {
      loadActivityData();
    }
  }, [params.id, fetchActivity, fetchAgent, fetchCoursePackage, loadChatSession, saveChatSession, memoryActions.initializeMemories]);

  // 發送訊息
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !activity || isLoading) return;

    const message = currentMessage.trim();
    setCurrentMessage('');

    try {
      // 第二階段：用戶輸入時查找相關記憶
      console.log('=== 開始處理用戶輸入 ===');

      await memoryActions.findRelevantMemoriesForInput(message);

      // 準備發送給 OpenAI 的訊息
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date()
      };

      // 準備 OpenAI 的訊息格式
      const systemPrompt = generateSystemPrompt(agent, currentUnit || null, coursePackage, message);
      
      // 調試：輸出系統提示內容
      console.log('=== 系統提示 ===');
      console.log(systemPrompt);
      console.log('================');
      

      
      const openAIMessages: any[] = [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        ...(chatSession?.messages || []).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: message
        }
      ];

      // 呼叫 OpenAI API
      const response = await sendChatToOpenAI(openAIMessages);

      if (response) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };

        // 更新對話紀錄
        const updatedSession: ChatSession = {
          activity_id: activity._id.toString(),
          current_unit_id: currentUnit?._id.toString() || '',
          messages: [...(chatSession?.messages || []), userMessage, assistantMessage],
          current_turn: (chatSession?.current_turn || 0) + 1,
          is_completed: false,
          started_at: chatSession?.started_at || new Date(),
          updated_at: new Date()
        };
        
        setChatSession(updatedSession);
        saveChatSession(activity._id.toString(), updatedSession);

        // 第三階段：LLM回應後更新記憶
        if (agent && activity) {
          console.log('=== 開始第三階段記憶更新 ===');
          console.log('當前整合記憶狀態:');
          console.log('熱記憶:', memoryState.integratedHotMemories);
          console.log('冷記憶:', memoryState.integratedColdMemories);
          
          await memoryActions.updateMemoriesFromLLMResponse(
            response, 
            message, 
            agent._id.toString(), 
            'default_user' // 暫時使用預設用戶ID
          );
          
          console.log('=== 第三階段記憶更新完成 ===');
        }

        // 檢查單元進度
        if (currentUnit) {
          const progress = await checkUnitProgress(
            currentUnit,
            updatedSession.messages,
            coursePackage || undefined
          );
          
          if (progress.is_passed) {
            console.log('單元完成！', progress);
            
            if (progress.is_course_completed) {
              // 課程全部完成
              console.log('恭喜！課程全部完成！');
              
              // 先發送當前關卡的結尾語（如果有的話）
              let finalMessages = [...updatedSession.messages];
              if (currentUnit.outro_message) {
                const outroMessage: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: currentUnit.outro_message,
                  timestamp: new Date(),
                  unit_id: currentUnit._id.toString()
                };
                finalMessages.push(outroMessage);
              }
              
              // 標記會話為已完成
              const completedSession: ChatSession = {
                ...updatedSession,
                messages: finalMessages,
                is_completed: true
              };
              setChatSession(completedSession);
              saveChatSession(activity._id.toString(), completedSession);
              setShowCompletionModal(true);
              
            } else if (progress.next_unit_id) {
              // 切換到下一個關卡
              console.log('切換到下一個關卡:', progress.next_unit_id);
              
              const nextUnit = getSortedUnits().find(unit => 
                unit._id.toString() === progress.next_unit_id
              );
              
              if (nextUnit && progress.next_unit_id) {
                let transitionMessages = [...updatedSession.messages];
                
                // 1. 先添加當前關卡的結尾語（如果有的話）
                if (currentUnit.outro_message) {
                  const outroMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: currentUnit.outro_message,
                    timestamp: new Date(),
                    unit_id: currentUnit._id.toString()
                  };
                  transitionMessages.push(outroMessage);
                }
                
                // 2. 然後添加下一關的開頭語（如果有的話）
                if (nextUnit.intro_message) {
                  const introMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: nextUnit.intro_message,
                    timestamp: new Date(),
                    unit_id: progress.next_unit_id
                  };
                  transitionMessages.push(introMessage);
                }
                
                // 3. 更新會話到下一關
                const nextUnitSession: ChatSession = {
                  ...updatedSession,
                  current_unit_id: progress.next_unit_id!,
                  messages: transitionMessages
                };
                
                setChatSession(nextUnitSession);
                saveChatSession(activity._id.toString(), nextUnitSession);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('發送訊息失敗:', error);
    }
  };

  // 處理鍵盤事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 重新開始聊天
  const handleRestartChat = () => {
    if (activity && coursePackage) {
      restartChat(activity._id.toString());
      
      // 重新初始化會話
      const sortedUnits = [...coursePackage.units].sort((a, b) => a.order - b.order);
      const firstUnit = sortedUnits[0];
      
      if (firstUnit) {
        const initialSession: ChatSession = {
          activity_id: activity._id.toString(),
          current_unit_id: firstUnit._id.toString(),
          messages: [],
          current_turn: 0,
          is_completed: false,
          started_at: new Date(),
          updated_at: new Date()
        };
        
        // 如果第一個關卡有開頭語，添加為第一個訊息
        if (firstUnit.intro_message) {
          initialSession.messages.push({
            id: `intro-${Date.now()}`,
            role: 'assistant',
            content: firstUnit.intro_message,
            timestamp: new Date(),
            unit_id: firstUnit._id.toString()
          });
        }
        
        setChatSession(initialSession);
        saveChatSession(activity._id.toString(), initialSession);
      } else {
        setChatSession(null);
      }
      
      setShowCompletionModal(false);
    }
  };

  // 獲取當前單元資訊
  const getCurrentUnit = () => {
    if (!coursePackage || !chatSession) return null;
    // 確保使用排序後的單元列表
    const sortedUnits = [...coursePackage.units].sort((a, b) => a.order - b.order);
    return sortedUnits.find(unit => 
      unit._id.toString() === chatSession.current_unit_id
    );
  };

  // 獲取排序後的單元列表
  const getSortedUnits = () => {
    if (!coursePackage) return [];
    return [...coursePackage.units].sort((a, b) => a.order - b.order);
  };

  const currentUnit = getCurrentUnit();
  const sortedUnits = getSortedUnits();

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!activity || !agent || !coursePackage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">找不到指定的活動資料</p>
          <button
            onClick={() => router.push('/activities')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回活動列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 標題欄 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/activities/${activity._id.toString()}`)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← 返回
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">{activity.name}</h1>
              <p className="text-sm text-gray-600">
                與 {agent.name} 對話
                {currentUnit && ` - ${currentUnit.title}`}
              </p>
            </div>
          </div>
          
          {/* 進度指示器和記憶狀態 */}
          <div className="flex items-center space-x-4">
            {/* 進度指示器 */}
            {coursePackage.units.length > 0 && chatSession && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">進度:</span>
                <div className="flex space-x-1">
                  {getSortedUnits().map((unit, index) => {
                    const isCurrent = unit._id.toString() === chatSession.current_unit_id;
                    const isCompleted = getSortedUnits().findIndex(u => 
                      u._id.toString() === chatSession.current_unit_id
                    ) > index;
                    
                    return (
                      <div
                        key={unit._id.toString()}
                        className={`w-3 h-3 rounded-full ${
                          isCompleted 
                            ? 'bg-green-500' 
                            : isCurrent 
                              ? 'bg-blue-500' 
                              : 'bg-gray-300'
                        }`}
                        title={`${unit.order}. ${unit.title}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* 記憶狀態 */}
            <div className="flex items-center space-x-2" style={{ display: 'none' }}>
              <span className="text-sm text-gray-600">記憶:</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  熱: {memoryState.integratedHotMemories.length}
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  冷: {memoryState.integratedColdMemories.length}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  基礎: {memoryState.baseHotMemoryCount}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleRestartChat}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              重新開始
            </button>
          </div>
        </div>
      </div>

      {/* 聊天區域 */}
      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
        {/* 訊息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatSession?.messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg mb-2">歡迎開始與 {agent.name} 的對話！</p>
              <p className="text-sm">輸入訊息開始你的學習之旅</p>
            </div>
          )}
          
          {chatSession?.messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} agentName={agent.name} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 rounded-lg px-4 py-2 max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 輸入區域 */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="輸入您的訊息..."
              disabled={isLoading || chatSession?.is_completed}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading || chatSession?.is_completed}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              發送
            </button>
          </div>
          
          {error && (
            <div className="mt-2 text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 完成課程 Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜通關！</h2>
              <p className="text-gray-600 mb-6">
                您已成功完成 "{coursePackage.title}" 的所有關卡！
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  繼續查看對話
                </button>
                <button
                  onClick={handleRestartChat}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  重新開始
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 聊天訊息組件
function ChatMessageComponent({ message, agentName }: { message: ChatMessage; agentName: string }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-200 text-gray-800'
      }`}>
        {!isUser && (
          <div className="text-xs font-medium mb-1 opacity-75">
            {agentName}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}
