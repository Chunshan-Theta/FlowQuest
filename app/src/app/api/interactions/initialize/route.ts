import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, SessionRecord } from '@/types';
import { getCoursePackagesCollection, getSessionsCollection, getActivitiesCollection, getAgentsCollection, getUnitsCollection } from '@/lib/mongodb';
import { buildSystemPrompt } from '@/lib/prompt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activity_id, user_id = 'default_user', session_id, user_name = '' } = body || {};

    if (!activity_id || !session_id) {
      return NextResponse.json({ success: false, error: '需要 activity_id 與 session_id' } as ApiResponse<SessionRecord>, { status: 400 });
    }

    const activities = await getActivitiesCollection();
    const agents = await getAgentsCollection();
    const coursePackages = await getCoursePackagesCollection();
    const unitsCol = await getUnitsCollection();
    const sessions = await getSessionsCollection();

    const activity = await activities.findOne({ _id: activity_id } as any);
    if (!activity) return NextResponse.json({ success: false, error: '找不到活動' } as ApiResponse<SessionRecord>, { status: 404 });

    const agent = await agents.findOne({ _id: activity.agent_profile_id } as any);
    const course = await coursePackages.findOne({ _id: activity.course_package_id } as any);

    // Load units sorted by order
    const units = await unitsCol.find({ course_package_id: String(activity.course_package_id) } as any).sort({ order: 1 }).toArray();

    // Integrate memories from agent + activity
    const agentMemories = ((agent as any)?.memories || []) as any[];
    const activityMemories = ((activity as any)?.memories || []) as any[];
    const integratedHotMemories = [
      ...agentMemories.filter((m: any) => m.type === 'hot'),
      ...activityMemories.filter((m: any) => m.type === 'hot'),
    ];
    const integratedColdMemories = [
      ...agentMemories.filter((m: any) => m.type === 'cold'),
      ...activityMemories.filter((m: any) => m.type === 'cold'),
    ];

    // Ensure skeleton
    const filter = { activity_id, user_id, session_id };
    const now = new Date();

    // Compute current unit and intro
    const firstUnit = units[0];
    const currentUnitId: string | undefined = firstUnit ? String(firstUnit._id) : undefined;
    const introMessage: string | undefined = firstUnit?.intro_message;

    // Merge with existing
    const existing = await sessions.findOne(filter as any);
    const unit_results = (existing?.unit_results || []).map((u: any) => ({ ...u }));

    // If no logs yet for current unit and intro exists, seed one with system prompt and rules
    if (currentUnitId && introMessage) {
      const idx = unit_results.findIndex((u: any) => String(u.unit_id) === currentUnitId);
      const systemPrompt = buildSystemPrompt({
        agent: agent as any,
        unit: firstUnit as any,
        coursePackage: course as any,
        context: '',
        hotMemories: integratedHotMemories,
      });
      const seedLog = {
        role: 'assistant',
        content: introMessage,
        timestamp: now,
        system_prompt: systemPrompt,
        memories: [...integratedHotMemories, ...integratedColdMemories],
      } as any;
      if (idx === -1) {
        unit_results.push({
          unit_id: currentUnitId,
          status: 'failed' as const,
          turn_count: 0,
          important_keywords: [] as string[],
          standard_pass_rules: (firstUnit?.pass_condition?.value || []) as string[],
          conversation_logs: [seedLog],
        });
      } else if ((unit_results[idx].conversation_logs || []).length === 0) {
        unit_results[idx].conversation_logs = [seedLog];
        unit_results[idx].standard_pass_rules = (firstUnit?.pass_condition?.value || []) as string[];
      }
    }

    await sessions.updateOne(filter as any, { $set: { activity_id, user_id, session_id, user_name, unit_results, generated_at: now } }, { upsert: true });
    const doc = await sessions.findOne(filter as any);

    return NextResponse.json({ success: true, data: doc! } as ApiResponse<SessionRecord>);
  } catch (error) {
    console.error('initialize interaction error:', error);
    return NextResponse.json({ success: false, error: '初始化失敗' } as ApiResponse<SessionRecord>, { status: 500 });
  }
} 