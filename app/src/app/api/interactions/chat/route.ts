import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, SessionRecord, AgentProfile, CoursePackage, Unit } from '@/types';
import { getAgentsCollection, getCoursePackagesCollection, getSessionsCollection, getActivitiesCollection, getUnitsCollection, getDatabase } from '@/lib/mongodb';
import { getOpenAIClient } from '@/lib/openai';
import { buildSystemPrompt } from '@/lib/prompt';
import { ObjectId } from 'mongodb';
import { DEFAULT_CONFIG } from '@/types';

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activity_id, user_id = 'default_user', session_id, user_name = '', message } = body || {};

    if (!activity_id || !session_id || !message) {
      return NextResponse.json({ success: false, error: '需要 activity_id、session_id 與 message' } as ApiResponse<{ message: string }>, { status: 400 });
    }

    const activities = await getActivitiesCollection();
    const agentsCol = await getAgentsCollection();
    const cpCol = await getCoursePackagesCollection();
    const unitsCol = await getUnitsCollection();
    const sessions = await getSessionsCollection();
    const db = await getDatabase();
    const memCol = db.collection('memories');

    const activity = await activities.findOne({ _id: activity_id } as any);
    if (!activity) return NextResponse.json({ success: false, error: '找不到活動' } as ApiResponse<any>, { status: 404 });

    const agent = await agentsCol.findOne({ _id: activity.agent_profile_id } as any) as any as AgentProfile;
    const course = await cpCol.findOne({ _id: activity.course_package_id } as any) as any as CoursePackage;
    const units = await unitsCol.find({ course_package_id: String(activity.course_package_id) } as any).sort({ order: 1 }).toArray();

    // Integrated memories baseline: agent + activity + dynamic (persisted)
    const agentMemories = ((agent as any)?.memories || []) as any[];
    const activityMemories = ((activity as any)?.memories || []) as any[];
    const dynamicMemories = await memCol
      .find({
        agent_id: String((agent as any)?._id || ''),
        created_by_user_id: String(user_id),
        activity_id: String(activity_id),
        session_id: String(session_id),
      })
      .sort({ created_at: 1 })
      .toArray();

    let hotMemories = [
      ...agentMemories.filter((m: any) => m.type === 'hot'),
      ...activityMemories.filter((m: any) => m.type === 'hot'),
      ...dynamicMemories.filter((m: any) => m.type === 'hot'),
    ];
    let coldMemories = [
      ...agentMemories.filter((m: any) => m.type === 'cold'),
      ...activityMemories.filter((m: any) => m.type === 'cold'),
      ...dynamicMemories.filter((m: any) => m.type === 'cold'),
    ];
    const baseHotCount = hotMemories.length; // baseline before promotions/additions

    // Determine current unit from latest session
    const filter = { activity_id, user_id, session_id };
    const existing = await sessions.findOne(filter as any) as any as SessionRecord | null;

    let currentUnitId: string | undefined;
    if (existing && existing.unit_results?.length) {
      const lastWithLogs = [...existing.unit_results].reverse().find(u => (u.conversation_logs?.length || 0) > 0);
      currentUnitId = (lastWithLogs?.unit_id as any)?.toString?.() || undefined;
    }

    if (!currentUnitId && units.length) {
      currentUnitId = String(units[0]._id);
    }

    const unitObj = units.find((u: any) => String(u._id) === String(currentUnitId)) as any as Unit | undefined;

    const openai = getOpenAIClient();

    // Prepare prior conversation history for current unit (limit last 10 logs)
    const existingUnitLogs = (existing?.unit_results || [])
      .find((u: any) => String(u.unit_id) === String(currentUnitId))?.conversation_logs || [];
    const historyLogs = existingUnitLogs.slice(-10).map((l: any) => ({
      role: (l.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: String(l.content || ''),
    }));

    // Enforce max turns per unit (before any LLM calls)
    const currentTurnCount = (existing?.unit_results || [])
      .find((u: any) => String(u.unit_id) === String(currentUnitId))?.turn_count || 0;
    const maxTurns = unitObj?.max_turns ?? DEFAULT_CONFIG.UNIT.MAX_TURNS;
    if (unitObj && currentTurnCount >= maxTurns) {
      const now = new Date();
      const unitResults = (existing?.unit_results || []).map((u: any) => ({ ...u }));
      const idxCur = unitResults.findIndex((u: any) => String(u.unit_id) === String(currentUnitId));
      if (idxCur === -1) {
        unitResults.push({
          unit_id: currentUnitId!,
          status: 'failed' as const,
          turn_count: currentTurnCount,
          important_keywords: [] as string[],
          standard_pass_rules: (unitObj?.pass_condition?.value || []) as string[],
          conversation_logs: existingUnitLogs as any[],
        });
      } else {
        unitResults[idxCur].status = 'failed';
      }

      let transitioned = false;
      let courseCompleted = false;
      const idxUnit = units.findIndex((u: any) => String(u._id) === String(currentUnitId));
      const nextUnit = idxUnit >= 0 && idxUnit + 1 < units.length ? units[idxUnit + 1] : undefined;
      const memorySnapshot = [...hotMemories, ...coldMemories];
      if (nextUnit) {
        transitioned = true;
        const nextIntro = nextUnit?.intro_message;
        const nextPrompt = buildSystemPrompt({ agent: agent as any, unit: nextUnit as any, coursePackage: course as any, context: '', hotMemories: hotMemories as any });
        const nextUnitExistingIdx = unitResults.findIndex((u: any) => String(u.unit_id) === String(nextUnit._id));
        const introLog = nextIntro ? [{ role: 'assistant', content: nextIntro, timestamp: now, system_prompt: nextPrompt, memories: memorySnapshot }] as any[] : [];
        if (nextUnitExistingIdx === -1) {
          unitResults.push({
            unit_id: String(nextUnit._id),
            status: 'failed' as const,
            turn_count: 0,
            important_keywords: [] as string[],
            standard_pass_rules: (nextUnit?.pass_condition?.value || []) as string[],
            conversation_logs: introLog,
          });
        } else if (introLog.length > 0 && (unitResults[nextUnitExistingIdx].conversation_logs || []).length === 0) {
          unitResults[nextUnitExistingIdx].conversation_logs = introLog;
          unitResults[nextUnitExistingIdx].standard_pass_rules = (nextUnit?.pass_condition?.value || []) as string[];
        }
      } else {
        courseCompleted = true;
      }

      const updateSet: any = { activity_id, user_id, session_id, user_name, unit_results: unitResults, generated_at: now };
      if (courseCompleted) {
        updateSet.summary = `課程完成於 ${new Date().toLocaleString('zh-TW')}`;
      }
      await sessions.updateOne(filter as any, { $set: updateSet }, { upsert: true });
      const saved = await sessions.findOne(filter as any);

      const limitMsg = '已達本關卡最大輪數，已自動進入下一關（若有）。';
      return NextResponse.json({ success: true, data: { message: limitMsg, session: saved, transitioned, courseCompleted } } as ApiResponse<any>);
    }

    // 2nd stage: from cold memories, pick relevant ones via LLM
    if (coldMemories.length > 0) {
      const coldList = coldMemories.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
      const selectPrompt = `請分析以下冷記憶是否與用戶輸入相關。\n\n冷記憶列表：\n${coldList}\n\n用戶輸入：${message}\n\n請只返回相關記憶的編號（用逗號分隔），如果沒有相關的請返回"無"。例如：1,3,5 或 無`;
      const sel = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '你是一個記憶分析助手，負責判斷記憶與用戶輸入的相關性。' },
          { role: 'user', content: selectPrompt },
        ],
        max_completion_tokens: 1024,
      });
      const selText = (sel.choices[0]?.message?.content || '').trim();
      if (selText && !/^無$/i.test(selText)) {
        const normalized = selText.trim();
        if (!/^(無|无|none)[。.\s]*$/i.test(normalized)) {
          const idxs = normalized
            .split(/[,，\s]+/)
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n) && n > 0 && n <= coldMemories.length)
            .map((n) => n - 1);
          const relevantCold = idxs.map((i) => coldMemories[i]);
          // Promote to hot for this turn
          hotMemories = [
            ...hotMemories,
            ...relevantCold.map((m) => ({ ...m, type: 'hot' as const })),
          ];
        }
      }
    }

    // Build system prompt (persona + unit + course + hot memories incl. promoted)
    const systemPrompt = buildSystemPrompt({
      agent: agent as any,
      unit: unitObj as any,
      coursePackage: course as any,
      context: message,
      hotMemories: hotMemories as any,
    });

    // Call LLM for assistant reply
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyLogs,
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const assistant = completion.choices[0]?.message?.content || '';

    // 3rd stage: create new memories (hot + cold) based on the exchange
    const keywords = extractKeywords(`${assistant} ${message}`);
    const newContent = `對方說: ${message}\n你回應: ${assistant}`;

    const hotDoc = {
      _id: new ObjectId(),
      agent_id: String((agent as any)?._id || ''),
      activity_id: String(activity_id),
      session_id: String(session_id),
      type: 'hot',
      content: newContent,
      tags: keywords,
      created_by_user_id: String(user_id),
      created_at: new Date(),
    };
    const coldDoc = {
      _id: new ObjectId(),
      agent_id: String((agent as any)?._id || ''),
      activity_id: String(activity_id),
      session_id: String(session_id),
      type: 'cold',
      content: newContent,
      tags: keywords,
      created_by_user_id: String(user_id),
      created_at: new Date(),
    };

    await memCol.insertMany([hotDoc, coldDoc]);

    // Update in-memory arrays for snapshot
    hotMemories = [...hotMemories, { ...hotDoc, _id: String(hotDoc._id) } as any];
    coldMemories = [...coldMemories, { ...coldDoc, _id: String(coldDoc._id) } as any];

    // Consolidate hot memories to a target count based on baseline (similar to client)
    const targetCount = Math.max(3, baseHotCount);
    let consolidated: any[] = [];
    if (hotMemories.length > targetCount) {
      const hotText = hotMemories.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
      const consPrompt = `請整合以下熱記憶，將 ${hotMemories.length} 條記憶整合成 ${targetCount} 條新的記憶。\n\n當前熱記憶（${hotMemories.length} 條）：\n${hotText}\n\n對方說：${message}\n\n你回應：${assistant}\n\n請分析這些記憶，將相關的記憶整合成新的記憶。整合時要：\n1. 保留重要的信息\n2. 合併相似或相關的內容\n3. 最終生成 ${targetCount} 條新的整合記憶\n\n請返回整合後的新記憶內容，格式如下：\n記憶1: [新記憶內容]\n記憶2: [新記憶內容]\n...\n記憶${targetCount}: [新記憶內容]`;
      const cons = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '你是一個記憶整合助手，負責選擇最重要的記憶。' },
          { role: 'user', content: consPrompt },
        ],
        max_completion_tokens: 1024,
      });
      const consText = (cons.choices[0]?.message?.content || '').trim();
      const lines = consText.split('\n');
      for (let i = 0; i < targetCount; i++) {
        const idx = i + 1;
        const re = new RegExp(`記憶${idx}:\\s*(.+)`, 'i');
        const line = lines.find((l) => re.test(l));
        if (line) {
          const m = line.match(re);
          if (m && m[1]) {
            consolidated.push({
              _id: new ObjectId(),
              agent_id: String((agent as any)?._id || ''),
              activity_id: String(activity_id),
              session_id: String(session_id),
              type: 'hot',
              content: m[1].trim(),
              tags: extractKeywords(m[1]),
              created_by_user_id: String(user_id),
              created_at: new Date(),
            });
          }
        }
      }
      if (consolidated.length > 0) {
        // Persist consolidation: demote previous dynamic hot to cold, insert consolidated as new hot
        await memCol.updateMany(
          {
            agent_id: String((agent as any)?._id || ''),
            created_by_user_id: String(user_id),
            type: 'hot',
            activity_id: String(activity_id),
            session_id: String(session_id),
          },
          { $set: { type: 'cold' } }
        );
        if (consolidated.length > 0) {
          await memCol.insertMany(consolidated);
        }
        // Update snapshot arrays
        const isCurrentDynamic = (m: any) =>
          m.created_by_user_id === String(user_id) &&
          String(m.activity_id) === String(activity_id) &&
          String(m.session_id) === String(session_id);

        const demotedDynamic = hotMemories.filter(isCurrentDynamic);
        const stillHot = hotMemories.filter((m) => !isCurrentDynamic(m));

        coldMemories = [
          ...coldMemories,
          ...demotedDynamic.map((m: any) => ({ ...m, type: 'cold' })),
        ];
        hotMemories = [
          ...stillHot,
          ...consolidated,
        ];
      }
    }

    // Persist into session (append logs for current unit) with final memory snapshot
    const now = new Date();
    const existingAgain = await sessions.findOne(filter as any) as any as SessionRecord | null;
    const unitResults = (existingAgain?.unit_results || []).map((u: any) => ({ ...u }));
    const idx = unitResults.findIndex((u: any) => String(u.unit_id) === String(currentUnitId));
    const memorySnapshot = [...hotMemories, ...coldMemories];
    const logsAppend = [
      { role: 'user', content: message, timestamp: now, system_prompt: systemPrompt, memories: memorySnapshot },
      { role: 'assistant', content: assistant, timestamp: now, memories: memorySnapshot },
    ];
    if (idx === -1) {
      unitResults.push({
        unit_id: currentUnitId!,
        status: 'failed' as const,
        turn_count: 1,
        important_keywords: [] as string[],
        standard_pass_rules: (unitObj?.pass_condition?.value || []) as string[],
        evaluation_results: [],
        conversation_logs: logsAppend as any,
      });
    } else {
      const target = unitResults[idx];
      target.turn_count = (target.turn_count || 0) + 1;
      target.standard_pass_rules = (unitObj?.pass_condition?.value || target.standard_pass_rules || []) as string[];
      target.conversation_logs = [
        ...(target.conversation_logs || []),
        ...logsAppend,
      ];
      if (!Array.isArray((target as any).evaluation_results)) {
        (target as any).evaluation_results = [];
      }
    }

    // Pass check and unit transition (keyword or LLM)
    let transitioned = false;
    let courseCompleted = false;
    let isPassed = false;
    const currentTurnAfterAppend = (unitResults.find((u: any) => String(u.unit_id) === String(currentUnitId))?.turn_count) || 0;
    const maxTurnsAfterAppend = unitObj?.max_turns ?? DEFAULT_CONFIG.UNIT.MAX_TURNS;
    const reachedLimit = currentTurnAfterAppend >= maxTurnsAfterAppend;

    if (unitObj?.pass_condition?.type === 'keyword') {
      const currentUnitLogs = (unitResults.find((u: any) => String(u.unit_id) === String(currentUnitId))?.conversation_logs || []) as any[];
      const allUserText = currentUnitLogs.filter((l) => l.role === 'user').map((l) => String(l.content).toLowerCase()).join(' ');
      isPassed = (unitObj.pass_condition.value || []).every((k: any) => allUserText.includes(String(k).toLowerCase()));
    } else if (unitObj?.pass_condition?.type === 'llm') {
      const currentUnitLogs = (unitResults.find((u: any) => String(u.unit_id) === String(currentUnitId))?.conversation_logs || []) as any[];
      const convoText = currentUnitLogs.map((l) => `${l.role}: ${l.content}`).join('\n');
      const checkPrompt = `請判斷以下對話是否滿足通過條件：\n\n通過條件：${(unitObj.pass_condition.value || []).join(', ')}\n\n對話內容：\n${convoText}\n\n請只回答 "YES" 或 "NO"，並簡單說明原因。`;
      console.log('=== LLM PASS CHECK START ===');
      console.log('session_id:', session_id, 'unit_id:', currentUnitId);
      console.log('conditions:', unitObj?.pass_condition?.value);
      console.log('prompt:\n', checkPrompt);
      const judge = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: checkPrompt }],
        max_completion_tokens: 1024,
      });
      const result = (judge.choices[0]?.message?.content || '');
      const normalized = result.trim().toLowerCase();
      isPassed = /^yes\b/.test(normalized);
      console.log('judgeResult:', judge.choices[0]?.message);
      console.log('isPassed:', isPassed);
      console.log('=== LLM PASS CHECK END ===');
      // Persist judge evaluation text into evaluation_results for the current unit
      const targetForEval = unitResults.find((u: any) => String(u.unit_id) === String(currentUnitId));
      if (targetForEval) {
        if (!Array.isArray((targetForEval as any).evaluation_results)) {
          (targetForEval as any).evaluation_results = [];
        }
        (targetForEval as any).evaluation_results.push(result.trim());
      }
    }

    if (isPassed) {
      const target = unitResults.find((u: any) => String(u.unit_id) === String(currentUnitId));
      if (unitObj?.outro_message) {
        const outroPrompt = buildSystemPrompt({ agent: agent as any, unit: unitObj as any, coursePackage: course as any, context: '', hotMemories: hotMemories as any });
        target?.conversation_logs?.push({ role: 'assistant', content: String(unitObj.outro_message), timestamp: now, system_prompt: outroPrompt, memories: memorySnapshot } as any);
      }
      if (target) target.status = 'passed';
      const idxUnit = units.findIndex((u: any) => String(u._id) === String(currentUnitId));
      const nextUnit = idxUnit >= 0 && idxUnit + 1 < units.length ? units[idxUnit + 1] : undefined;
      if (nextUnit) {
        transitioned = true;
        const nextIntro = nextUnit?.intro_message;
        const nextPrompt = buildSystemPrompt({ agent: agent as any, unit: nextUnit as any, coursePackage: course as any, context: '', hotMemories: hotMemories as any });
        const nextUnitExistingIdx = unitResults.findIndex((u: any) => String(u.unit_id) === String(nextUnit._id));
        const introLog = nextIntro ? [{ role: 'assistant', content: nextIntro, timestamp: now, system_prompt: nextPrompt, memories: memorySnapshot }] as any[] : [];
        if (nextUnitExistingIdx === -1) {
          unitResults.push({
            unit_id: String(nextUnit._id),
            status: 'failed' as const,
            turn_count: 0,
            important_keywords: [] as string[],
            standard_pass_rules: (nextUnit?.pass_condition?.value || []) as string[],
            conversation_logs: introLog,
          });
        } else if (introLog.length > 0 && (unitResults[nextUnitExistingIdx].conversation_logs || []).length === 0) {
          unitResults[nextUnitExistingIdx].conversation_logs = introLog;
          unitResults[nextUnitExistingIdx].standard_pass_rules = (nextUnit?.pass_condition?.value || []) as string[];
        }
      } else {
        courseCompleted = true;
      }
    } else if (reachedLimit) {
      // 未通關且達到最大輪數：直接換到下一關
      const target = unitResults.find((u: any) => String(u.unit_id) === String(currentUnitId));
      if (target) target.status = 'failed';
      const idxUnit = units.findIndex((u: any) => String(u._id) === String(currentUnitId));
      const nextUnit = idxUnit >= 0 && idxUnit + 1 < units.length ? units[idxUnit + 1] : undefined;
      if (nextUnit) {
        transitioned = true;
        const nextIntro = nextUnit?.intro_message;
        const nextPrompt = buildSystemPrompt({ agent: agent as any, unit: nextUnit as any, coursePackage: course as any, context: '', hotMemories: hotMemories as any });
        const nextUnitExistingIdx = unitResults.findIndex((u: any) => String(u.unit_id) === String(nextUnit._id));
        const introLog = nextIntro ? [{ role: 'assistant', content: nextIntro, timestamp: now, system_prompt: nextPrompt, memories: memorySnapshot }] as any[] : [];
        if (nextUnitExistingIdx === -1) {
          unitResults.push({
            unit_id: String(nextUnit._id),
            status: 'failed' as const,
            turn_count: 0,
            important_keywords: [] as string[],
            standard_pass_rules: (nextUnit?.pass_condition?.value || []) as string[],
            conversation_logs: introLog,
          });
        } else if (introLog.length > 0 && (unitResults[nextUnitExistingIdx].conversation_logs || []).length === 0) {
          unitResults[nextUnitExistingIdx].conversation_logs = introLog;
          unitResults[nextUnitExistingIdx].standard_pass_rules = (nextUnit?.pass_condition?.value || []) as string[];
        }
      } else {
        courseCompleted = true;
      }
    }

    const updateSet: any = { activity_id, user_id, session_id, user_name, unit_results: unitResults, generated_at: now };
    if (courseCompleted) {
      updateSet.summary = `課程完成於 ${new Date().toLocaleString('zh-TW')}`;
    }

    await sessions.updateOne(filter as any, { $set: updateSet }, { upsert: true });
    const saved = await sessions.findOne(filter as any);

    return NextResponse.json({ success: true, data: { message: assistant, session: saved, transitioned, courseCompleted } } as ApiResponse<any>);
  } catch (error) {
    console.error('interaction chat error:', error);
    return NextResponse.json({ success: false, error: '對話失敗' } as ApiResponse<any>, { status: 500 });
  }
} 