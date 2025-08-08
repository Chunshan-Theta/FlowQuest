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
import { useSession } from '@/hooks/useSession';
import { buildSystemPrompt } from '@/lib/prompt';

export default function ActivityChatPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchActivity } = useActivities();
  const { fetchAgent } = useAgents();
  const { fetchCoursePackage } = useCoursePackages();
  const { sendChatToOpenAI, isLoading, error } = useChat();
  const { checkUnitProgress, isChecking } = useUnitProgress();
  const { state: memoryState, actions: memoryActions } = useMemoryManager();
  const { upsertSession, fetchSession } = useSession();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [coursePackage, setCoursePackage] = useState<CoursePackage | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionInput, setSessionInput] = useState('');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userNameError, setUserNameError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 隨機產生預設 Session 代號
  const generateRandomSessionId = (length: number = 8): string => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字元
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += alphabet[randomValues[i] % alphabet.length];
    }
    return result;
  };

  // 使用共用的系統提示構建器（整合 agent、單元、課程與熱記憶）
  const generateSystemPrompt = (
    agent: AgentProfile | null,
    currentUnit: Unit | null,
    coursePackage: CoursePackage | null,
    context: string = ''
  ): string =>
    buildSystemPrompt({
      agent,
      unit: currentUnit,
      coursePackage,
      context,
      hotMemories: memoryState.integratedHotMemories,
    });

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatSession?.messages]);

  // 嘗試載入保存的 session_id
  useEffect(() => {
    const activityId = params.id as string | undefined;
    if (!activityId) return;
    try {
      const saved = localStorage.getItem(`fq_session_${activityId}`);
      if (saved) {
        setSessionId(saved);
      } else {
        setSessionInput((prev) => prev || generateRandomSessionId());
      }
      const savedName = localStorage.getItem(`fq_user_name_${activityId}`);
      if (savedName) setUserName(savedName);
    } catch {}
  }, [params.id]);

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
        
        // 僅在已經有 sessionId 的情況下處理聊天會話（改為透過 Session API）
        if (sessionId) {
          try {
            const serverSession = await fetchSession(sessionId as any);
            if (serverSession && coursePackageData.units.length > 0) {
              const sortedUnits = [...coursePackageData.units].sort((a, b) => a.order - b.order);
              // 取最近一個有對話紀錄的單元，否則第一個
              const lastWithLogs = [...serverSession.unit_results].reverse().find(u => (u.conversation_logs?.length || 0) > 0);
              const currentUnit = lastWithLogs?.unit_id?.toString() || sortedUnits[0]._id.toString();
              const logs = lastWithLogs?.conversation_logs || [];
              const currentUnitObj = sortedUnits.find(u => u._id.toString() === currentUnit);
              const messages: ChatMessage[] = logs.map((l, idx) => ({
                id: `srv-${idx}-${Date.now()}`,
                role: (l.role as 'user' | 'assistant'),
                content: l.content,
                timestamp: new Date(l.timestamp),
                unit_id: currentUnit,
              }));
              // 若該單元沒有歷史對話且有 intro_message，主動發出開始對話並持久化
              if (messages.length === 0 && currentUnitObj?.intro_message) {
                const introMsg: ChatMessage = {
                  id: `intro-${Date.now()}`,
                  role: 'assistant',
                  content: currentUnitObj.intro_message,
                  timestamp: new Date(),
                  unit_id: currentUnit,
                };
                messages.push(introMsg);
                try {
                  const systemPrompt = generateSystemPrompt(agent, currentUnitObj, coursePackage, '');
                  const upsertRes1 = await upsertSession({
                    activity_id: activityId,
                    user_id: 'default_user',
                    session_id: sessionId!,
                    user_name: localStorage.getItem(`fq_user_name_${activityId}`) || '',
                    summary: '',
                    unit_results: [
                      {
                        unit_id: currentUnit,
                        status: 'failed',
                        turn_count: 0,
                        important_keywords: [],
                        standard_pass_rules: [],
                        conversation_logs: [
                          {
                            role: 'assistant',
                            content: currentUnitObj.intro_message,
                            timestamp: new Date(),
                            system_prompt: systemPrompt,
                            memories: [...memoryState.integratedHotMemories, ...memoryState.integratedColdMemories],
                          },
                        ],
                      },
                    ],
                  });
                  console.log('Session upserted (reconstruct-intro):', upsertRes1);
                } catch {}
              }
              const reconstructed: ChatSession = {
                activity_id: activityId,
                current_unit_id: currentUnit,
                messages,
                current_turn: lastWithLogs?.turn_count || Math.floor(messages.filter(m => m.role === 'assistant').length),
                is_completed: false,
                started_at: messages[0]?.timestamp || new Date(),
                updated_at: messages[messages.length - 1]?.timestamp || new Date(),
              };
              setChatSession(reconstructed);
            } else if (coursePackageData.units.length > 0) {
              // 初始化一個空的對話會話（僅供前端渲染）
              const sortedUnits = [...coursePackageData.units].sort((a, b) => a.order - b.order);
              const firstUnit = sortedUnits[0];
              const initialSession: ChatSession = {
                activity_id: activityId,
                current_unit_id: firstUnit._id.toString(),
                messages: [],
                current_turn: 0,
                is_completed: false,
                started_at: new Date(),
                updated_at: new Date(),
              };
              if (firstUnit.intro_message) {
                initialSession.messages.push({
                  id: `intro-${Date.now()}`,
                  role: 'assistant',
                  content: firstUnit.intro_message,
                  timestamp: new Date(),
                  unit_id: firstUnit._id.toString(),
                });
                // 持久化首條 intro 訊息到 Session
                try {
                  const systemPrompt = generateSystemPrompt(agent, firstUnit, coursePackage, '');
                  const upsertRes2 = await upsertSession({
                    activity_id: activityId,
                    user_id: 'default_user',
                    session_id: sessionId!,
                    user_name: localStorage.getItem(`fq_user_name_${activityId}`) || '',
                    summary: '',
                    unit_results: [
                      {
                        unit_id: firstUnit._id.toString(),
                        status: 'failed',
                        turn_count: 0,
                        important_keywords: [],
                        standard_pass_rules: [],
                        conversation_logs: [
                          {
                            role: 'assistant',
                            content: firstUnit.intro_message,
                            timestamp: new Date(),
                            system_prompt: systemPrompt,
                            memories: [...memoryState.integratedHotMemories, ...memoryState.integratedColdMemories],
                          },
                        ],
                      },
                    ],
                  });
                  console.log('Session upserted (init-intro):', upsertRes2);
                } catch {}
              }
              setChatSession(initialSession);
            }
          } catch {}
        }
        
        // 初始化或同步 Session 骨架（新蓋舊） - 需要 sessionId
        try {
          const saved = localStorage.getItem(`fq_session_${activityId}`);
          if (saved) {
            const r = await upsertSession({
              activity_id: activityId,
              user_id: 'default_user',
              session_id: saved,
              user_name: localStorage.getItem(`fq_user_name_${activityId}`) || '',
              summary: '',
              unit_results: [],
            });
            setReportId(r._id.toString());
            setSessionId(saved);
          }
        } catch (e) {
          console.warn('初始化 Session 失敗，但不阻斷聊天流程');
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
  }, [params.id, fetchActivity, fetchAgent, fetchCoursePackage, memoryActions.initializeMemories, upsertSession, fetchSession, sessionId]);

  // 設置 session id
  const handleConfirmSession = () => {
    const code = sessionInput.trim();
    if (!code) {
      setSessionError('請輸入代號');
    } else if (!/^[A-Za-z0-9]+$/.test(code)) {
      setSessionError('僅允許英數字');
    } else {
      setSessionError(null);
    }

    const name = userName.trim();
    if (!name) {
      setUserNameError('請輸入使用者名稱');
    } else {
      setUserNameError(null);
    }

    if (!code || !/^[A-Za-z0-9]+$/.test(code) || !name) return;

    const activityId = params.id as string;
    localStorage.setItem(`fq_session_${activityId}`, code);
    localStorage.setItem(`fq_user_name_${activityId}`, name);
    setSessionId(code);

    // 建立報告骨架
    upsertSession({
      activity_id: activityId,
      user_id: 'default_user',
      session_id: code,
      user_name: name,
      summary: '',
      unit_results: [],
    }).then((r) => setReportId(r._id.toString())).catch(() => {});
  };

  // 發送訊息
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !activity || isLoading || !sessionId) return;

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
        timestamp: new Date(),
        unit_id: currentUnit?._id.toString()
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
          timestamp: new Date(),
          unit_id: currentUnit?._id.toString()
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
        // 改為僅透過 API 持久化

        // 持續更新 Session（追加對話紀錄到當前單元）
        try {
          if (currentUnit) {
            const existingUnit = {
              unit_id: currentUnit._id.toString(),
              status: 'failed' as const,
              turn_count: updatedSession.current_turn,
              important_keywords: [],
              standard_pass_rules: currentUnit.pass_condition?.value || [],
              conversation_logs: [
                ...(chatSession?.messages || []).map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
                { role: 'user', content: message, timestamp: new Date(), system_prompt: systemPrompt, memories: [...memoryState.integratedHotMemories, ...memoryState.integratedColdMemories] },
                { role: 'assistant', content: response, timestamp: new Date(), system_prompt: undefined, memories: [...memoryState.integratedHotMemories, ...memoryState.integratedColdMemories] }
              ]
            };

            const r = await upsertSession({
              activity_id: activity._id.toString(),
              user_id: 'default_user',
              session_id: sessionId!,
              user_name: userName || localStorage.getItem(`fq_user_name_${activity._id.toString()}`) || '',
              summary: '',
              unit_results: [existingUnit],
            });
            console.log('Session upserted (chat-append):', r);
            if (!reportId) setReportId(r._id.toString());
          }
        } catch (e) {
          console.warn('更新 Session 失敗（對話階段）');
        }

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
            updatedSession.messages.filter((m) => m.unit_id === currentUnit._id.toString()),
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
              // 改為僅透過 API 持久化
              upsertSession({
                activity_id: activity._id.toString(),
                user_id: 'default_user',
                session_id: sessionId!,
                user_name: userName || localStorage.getItem(`fq_user_name_${activity._id.toString()}`) || '',
                summary: `課程完成於 ${new Date().toLocaleString('zh-TW')}`,
                unit_results: [
                  {
                    unit_id: currentUnit._id.toString(),
                    status: 'passed',
                    turn_count: updatedSession.current_turn,
                    important_keywords: currentUnit.pass_condition?.type === 'keyword' ? (currentUnit.pass_condition.value || []) : [],
                    standard_pass_rules: currentUnit.pass_condition?.value || [],
                    conversation_logs: updatedSession.messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp, system_prompt: systemPrompt, memories: [...memoryState.integratedHotMemories, ...memoryState.integratedColdMemories] }))
                  }
                ],
              }).then((r) => setReportId(r._id.toString())).catch(() => {});
              
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
                // 改為僅透過 API 持久化

                // 標記當前單元通過 + 準備下一單元骨架
                try {
                  const r = await upsertSession({
                    activity_id: activity._id.toString(),
                    user_id: 'default_user',
                    session_id: sessionId!,
                    user_name: userName || localStorage.getItem(`fq_user_name_${activity._id.toString()}`) || '',
                    summary: '',
                    unit_results: [
                      {
                        unit_id: currentUnit._id.toString(),
                        status: 'passed',
                        turn_count: nextUnitSession.current_turn,
                        important_keywords: currentUnit.pass_condition?.type === 'keyword' ? (currentUnit.pass_condition.value || []) : [],
                        standard_pass_rules: currentUnit.pass_condition?.value || [],
                        conversation_logs: nextUnitSession.messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp, system_prompt: systemPrompt, memories: [...memoryState.integratedHotMemories, ...memoryState.integratedColdMemories] }))
                      },
                      {
                        unit_id: progress.next_unit_id,
                        status: 'failed',
                        turn_count: 0,
                        important_keywords: [],
                        standard_pass_rules: [],
                        conversation_logs: nextUnit.intro_message
                          ? [
                              {
                                role: 'assistant',
                                content: nextUnit.intro_message,
                                timestamp: new Date(),
                                system_prompt: generateSystemPrompt(agent, nextUnit, coursePackage, ''),
                                memories: [...memoryState.integratedHotMemories, ...memoryState.integratedColdMemories],
                              },
                            ]
                          : []
                      }
                    ],
                  });
                  if (!reportId) setReportId(r._id.toString());
                } catch {}
              }
            }
          }
        }
      }
      else {
        // 備援：即使無助理回覆，也要記錄使用者訊息並更新報告
        const fallbackSession: ChatSession = {
          activity_id: activity._id.toString(),
          current_unit_id: currentUnit?._id.toString() || '',
          messages: [...(chatSession?.messages || []), userMessage],
          current_turn: chatSession?.current_turn || 0,
          is_completed: false,
          started_at: chatSession?.started_at || new Date(),
          updated_at: new Date()
        };

        setChatSession(fallbackSession);
        // 改為僅透過 API 持久化

        // 更新報告（不增加回合數，僅追加用戶訊息）
        try {
          if (currentUnit) {
            const existingUnit = {
              unit_id: currentUnit._id.toString(),
              status: 'failed' as const,
              turn_count: fallbackSession.current_turn,
              important_keywords: [],
              standard_pass_rules: currentUnit.pass_condition?.value || [],
              conversation_logs: [
                ...(chatSession?.messages || []).map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
                { role: 'user', content: message, timestamp: new Date(), system_prompt: systemPrompt, memories: [...memoryState.integratedHotMemories, ...memoryState.integratedColdMemories] }
              ]
            };

            const r = await upsertSession({
              activity_id: activity._id.toString(),
              user_id: 'default_user',
              session_id: sessionId!,
              user_name: userName || localStorage.getItem(`fq_user_name_${activity._id.toString()}`) || '',
              summary: '',
              unit_results: [existingUnit],
            });
            console.log('Session upserted (fallback-append):', r);
            if (!reportId) setReportId(r._id.toString());
          }
        } catch (e) {
          console.warn('更新 Session 失敗（回覆失敗備援）');
        }

        return;
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
    if (activity) {
      // 移除已保存的 session 與使用者名稱，回到設定畫面
      try {
        const activityKey = activity._id.toString();
        localStorage.removeItem(`fq_session_${activityKey}`);
        localStorage.removeItem(`fq_user_name_${activityKey}`);
      } catch {}

      // 重置狀態，顯示輸入 Session/Username 的畫面
      setSessionId(null);
      setSessionInput(generateRandomSessionId());
      setUserName('');
      setChatSession(null);
      setShowCompletionModal(false);
      setReportId(null);
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

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border rounded shadow-sm p-6 w-full max-w-md">
          <h1 className="text-lg font-semibold mb-2" style={{ color: '#333' }}>輸入會話代號</h1>
          <p className="text-sm text-gray-800 mb-4">請輸入一組僅含英數字的代號作為本次對話的 Session ID。</p>
          <div className="space-y-2">
            <label className="text-sm text-gray-800">使用者名稱</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="你的名字"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            {userNameError && <div className="text-sm text-red-700">{userNameError}</div>}

            <label className="text-sm text-gray-800">Session 代號</label>
            <input
              type="text"
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              placeholder="e.g. ABC123"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            {sessionError && <div className="text-sm text-red-700">{sessionError}</div>}
            <button
              onClick={handleConfirmSession}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              確認開始
            </button>
          </div>
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
               <div className="text-xs text-gray-700">Session: {sessionId}</div>
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
            
            {(sessionId) && (
              <button
                onClick={() => router.push(`/sessions/${sessionId}`)}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
              >
                查看報告
              </button>
            )}
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
