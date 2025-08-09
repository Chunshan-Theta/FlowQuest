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
  const [isWaiting, setIsWaiting] = useState(false);

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

  // 追蹤前端聊天會話狀態變化
  useEffect(() => {
    if (chatSession) {
      console.log('📱 前端聊天會話狀態已更新:', {
        messageCount: chatSession.messages.length,
        currentUnitId: chatSession.current_unit_id,
        isCompleted: chatSession.is_completed,
        messagesByUnit: chatSession.messages.reduce((acc: any, msg) => {
          const unitId = msg.unit_id || 'unknown';
          acc[unitId] = (acc[unitId] || 0) + 1;
          return acc;
        }, {}),
        recentMessages: chatSession.messages.slice(-3).map(m => `${m.role}(${m.unit_id}): ${m.content.substring(0, 30)}...`)
      });
    }
  }, [chatSession]);

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
            if (serverSession) {
              console.log('📋 載入現有會話:', {
                sessionId: serverSession.session_id,
                unitResults: serverSession.unit_results?.length || 0,
                unitResultsDetail: serverSession.unit_results?.map((ur: any) => ({
                  unit_id: ur.unit_id,
                  status: ur.status,
                  messageCount: ur.conversation_logs?.length || 0
                }))
              });
              const sortedUnits = [...coursePackageData.units].sort((a, b) => a.order - b.order);
              let reconstructed = reconstructChatSessionFromServer(serverSession);

              // 若尚無任何歷史對話且第一個單元有 intro_message，主動發出開始對話並持久化
              if (reconstructed.messages.length === 0 && sortedUnits.length > 0) {
                const firstUnit = sortedUnits[0];
                if (firstUnit.intro_message) {
                  const introMsg: ChatMessage = {
                    id: `intro-${Date.now()}`,
                    role: 'assistant',
                    content: firstUnit.intro_message,
                    timestamp: new Date(),
                    unit_id: firstUnit._id.toString(),
                  };

                  // 將 intro 訊息加入到當前前端對話狀態
                  reconstructed = {
                    ...reconstructed,
                    current_unit_id: firstUnit._id.toString(),
                    messages: [...reconstructed.messages, introMsg],
                    current_turn: 0,
                    started_at: introMsg.timestamp,
                    updated_at: introMsg.timestamp,
                  };

                  // 嘗試持久化到 Session 紀錄
                  try {
                    const systemPrompt = generateSystemPrompt(agent, firstUnit, coursePackage, '');
                    await upsertSession({
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
                  } catch {}
                }
              }

              // 若無 current_unit_id，預設為第一個單元
              if (!reconstructed.current_unit_id && sortedUnits.length > 0) {
                reconstructed = { ...reconstructed, current_unit_id: sortedUnits[0]._id.toString() };
              }

              console.log('✅ 設定前端會話狀態 (載入現有):', {
                messageCount: reconstructed.messages.length,
                currentUnitId: reconstructed.current_unit_id,
                isCompleted: reconstructed.is_completed
              });
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

    // 透過後端 interactions 初始化
    fetch('/api/interactions/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_id: activityId,
        user_id: 'default_user',
        session_id: code,
        user_name: name,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) {
          setReportId(json.data?._id?.toString?.() || null);
                      try {
              console.log('🚀 初始化會話 - 收到後端資料:', {
                sessionData: json.data,
                unitResults: json.data?.unit_results?.length || 0
              });
              const reconstructed = reconstructChatSessionFromServer(json.data);
              console.log('✅ 設定前端會話狀態 (初始化):', {
                messageCount: reconstructed.messages.length,
                currentUnitId: reconstructed.current_unit_id,
                isCompleted: reconstructed.is_completed
              });
              setChatSession(reconstructed);
            } catch (error) {
              console.error('❌ 初始化會話重建失敗:', error);
            }
        }
      })
      .catch(() => {});
  };

  // 發送訊息
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !activity || isWaiting || !sessionId) return;

    const message = currentMessage.trim();
    setCurrentMessage('');
    setIsWaiting(true);

    try {
      // 全交由後端 interactions 處理
      const res = await fetch('/api/interactions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activity._id.toString(),
          user_id: 'default_user',
          session_id: sessionId!,
          user_name: userName || localStorage.getItem(`fq_user_name_${activity._id.toString()}`) || '',
          message,
        }),
      });
      const json = await res.json();
              if (json?.success) {
          try {
            const serverSession = json.data?.session;
            console.log('🔄 收到後端會話資料:', {
              unitResults: serverSession?.unit_results?.length || 0,
              sessionId: serverSession?.session_id,
              activityId: serverSession?.activity_id,
              unitResultsDetail: serverSession?.unit_results?.map((ur: any) => ({
                unit_id: ur.unit_id,
                status: ur.status,
                messageCount: ur.conversation_logs?.length || 0,
                messages: ur.conversation_logs?.map((l: any) => `${l.role}: ${l.content.substring(0, 50)}...`)
              }))
            });
            const reconstructed = reconstructChatSessionFromServer(serverSession);
            console.log('🎯 重建後的前端會話:', {
              messageCount: reconstructed.messages.length,
              currentUnitId: reconstructed.current_unit_id,
              messages: reconstructed.messages.map(m => `${m.role}(${m.unit_id}): ${m.content.substring(0, 50)}...`)
            });
            // 若後端宣告課程完成，標記完成並開啟完成視窗
            const isCompleted = !!json?.data?.courseCompleted;
            const finalSession = { ...reconstructed, is_completed: isCompleted };
            setChatSession(finalSession);
            if (isCompleted) setShowCompletionModal(true);
            if (!reportId) setReportId(serverSession?._id?.toString?.() || null);
          } catch (error) {
            console.error('❌ 重建會話失敗:', error);
          }
        }
    } catch (error) {
      console.error('發送訊息失敗:', error);
    } finally {
      setIsWaiting(false);
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

  // 將後端 SessionRecord 重建為前端 ChatSession（包含所有單元的歷史對話）
  const reconstructChatSessionFromServer = (serverSession: any): ChatSession => {
    const unitResults: any[] = serverSession?.unit_results || [];
    
    // 當前單元：最後一個有對話的單元
    const lastWithLogs = [...unitResults].reverse().find((u: any) => (u.conversation_logs?.length || 0) > 0);
    const currentUnitId = lastWithLogs?.unit_id?.toString?.() || '';
    
    // 將所有單元對話攤平成單一訊息串，依 timestamp 排序（保留完整歷史）
    const allLogs: Array<{ unit_id: string; role: 'user'|'assistant'; content: string; timestamp: Date } > = [];
    for (const ur of unitResults) {
      const uid = String(ur.unit_id);
      const logs = ur.conversation_logs || [];
      for (const l of logs) {
        allLogs.push({ 
          unit_id: uid, 
          role: l.role as any, 
          content: l.content, 
          timestamp: new Date(l.timestamp) 
        });
      }
    }
    
    // 按時間戳排序所有訊息
    allLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // 轉換為前端訊息格式，保留所有歷史對話
    const messages: ChatMessage[] = allLogs.map((l, idx) => ({
      id: `srv-${idx}-${l.timestamp.getTime()}`, // 使用時間戳確保 ID 唯一性
      role: l.role,
      content: l.content,
      timestamp: l.timestamp,
      unit_id: l.unit_id,
    }));

    // 相鄰訊息去重：避免單位切換時重複渲染相同的助理回覆
    const deduped: ChatMessage[] = [];
    for (const m of messages) {
      const last = deduped[deduped.length - 1];
      if (
        last &&
        last.role === m.role &&
        last.content === m.content &&
        Math.abs(new Date(m.timestamp).getTime() - new Date(last.timestamp).getTime()) < 2000
      ) {
        continue;
      }
      deduped.push(m);
    }
    
    // 計算目前回合數（以當前單元為準）
    const currentTurn = (unitResults.find((u: any) => String(u.unit_id) === String(currentUnitId))?.turn_count) || 0;
    
    console.log('重建聊天會話:', {
      unitResults: unitResults.length,
      totalMessages: deduped.length,
      currentUnitId,
      messagesByUnit: unitResults.map(ur => ({ 
        unit_id: ur.unit_id, 
        messageCount: (ur.conversation_logs || []).length 
      }))
    });
    
    return {
      activity_id: (activity?._id || serverSession?.activity_id)?.toString?.() || '',
      current_unit_id: currentUnitId,
      messages: deduped,
      current_turn: currentTurn,
      is_completed: false,
      started_at: deduped[0]?.timestamp || new Date(),
      updated_at: deduped[deduped.length - 1]?.timestamp || new Date(),
    };
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
                  {(isLoading || isWaiting) && (
                    <span className="ml-2 text-xs text-gray-500 animate-pulse">對方正在輸入…</span>
                  )}
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
          
          {chatSession?.messages.map((message, index) => {
            // 檢查是否需要顯示單元分隔線
            const prevMessage = index > 0 ? chatSession.messages[index - 1] : null;
            const showUnitDivider = prevMessage && message.unit_id !== prevMessage.unit_id;
            const currentMessageUnit = getSortedUnits().find(u => u._id.toString() === message.unit_id);
            
            return (
              <div key={message.id}>
                {showUnitDivider && currentMessageUnit && (
                  <div className="flex justify-center my-4">
                    <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                      進入關卡：{currentMessageUnit.title}
                    </div>
                  </div>
                )}
                <ChatMessageComponent message={message} agentName={agent.name} />
              </div>
            );
          })}
          
          {(isLoading || isWaiting) && (
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
              disabled={isLoading || isWaiting || chatSession?.is_completed}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading || isWaiting || chatSession?.is_completed}
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

