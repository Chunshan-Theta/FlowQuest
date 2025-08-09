import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, CreateSessionInput, SessionRecord, isValidObjectId } from '@/types';
import { getSessionsCollection } from '@/lib/mongodb';

// GET /api/sessions - list by optional activity_id, user_id, session_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activity_id = searchParams.get('activity_id') || undefined;
    const user_id = searchParams.get('user_id') || undefined;
    const session_id = searchParams.get('session_id') || undefined;

    const collection = await getSessionsCollection();

    const query: any = {};
    if (activity_id) query.activity_id = activity_id;
    if (user_id) query.user_id = user_id;
    if (session_id) query.session_id = session_id;

    const items = await collection.find(query).sort({ generated_at: -1 }).toArray();

    const response: ApiResponse<SessionRecord[]> = {
      success: true,
      data: items as any,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('List sessions error:', error);
    const response: ApiResponse<SessionRecord[]> = {
      success: false,
      error: '獲取 Session 列表失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/sessions - upsert by _id or by (activity_id, user_id, session_id)
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<CreateSessionInput & { _id?: string }> = await request.json();
    const collection = await getSessionsCollection();

    // derive key
    let filter: any = {};
    if (body._id && isValidObjectId(body._id)) {
      filter = { _id: body._id };
    } else if (body.activity_id && body.user_id && body.session_id) {
      filter = { activity_id: body.activity_id, user_id: body.user_id, session_id: body.session_id };
    } else {
      return NextResponse.json({ success: false, error: '需要 _id 或 (activity_id, user_id, session_id)' } as ApiResponse<SessionRecord>, { status: 400 });
    }

    const now = new Date();

    // Load existing to merge unit_results
    const existing = (await collection.findOne(filter)) as any as SessionRecord | null;
    const existingUnitResults = existing?.unit_results || [];

    const incomingUnitResults = (body.unit_results || []) as any[];

    // Build a map by unit_id for merging
    const unitIdToResult: Record<string, any> = {};
    for (const ur of existingUnitResults) {
      unitIdToResult[String(ur.unit_id)] = {
        ...ur,
        conversation_logs: [...(ur.conversation_logs || [])],
        important_keywords: [...(ur.important_keywords || [])],
        standard_pass_rules: [...(ur.standard_pass_rules || [])],
      };
    }

    for (const incoming of incomingUnitResults) {
      const key = String(incoming.unit_id);
      if (!unitIdToResult[key]) {
        unitIdToResult[key] = {
          ...incoming,
          conversation_logs: [...(incoming.conversation_logs || [])],
          important_keywords: [...(incoming.important_keywords || [])],
          standard_pass_rules: [...(incoming.standard_pass_rules || [])],
          evaluation_results: [...(incoming.evaluation_results || [])],
        };
        continue;
      }
      // Merge fields
      const target = unitIdToResult[key];
      // Append logs with dedupe by role|content|timestamp
      const mergedLogs = [...(target.conversation_logs || []), ...((incoming.conversation_logs || []))];
      const seen = new Set<string>();
      const uniqueLogs: any[] = [];
      for (const log of mergedLogs) {
        const ts = typeof log.timestamp === 'string' ? log.timestamp : new Date(log.timestamp).toISOString();
        const k = `${log.role}|${log.content}|${ts}`;
        if (!seen.has(k)) {
          seen.add(k);
          uniqueLogs.push(log);
        }
      }
      target.conversation_logs = uniqueLogs;
      // Merge keywords/rules (union)
      const kwSet = new Set([...(target.important_keywords || []), ...((incoming.important_keywords || []))]);
      target.important_keywords = Array.from(kwSet);
      const rulesSet = new Set([...(target.standard_pass_rules || []), ...((incoming.standard_pass_rules || []))]);
      target.standard_pass_rules = Array.from(rulesSet);
      // Merge evaluation results (append all)
      const evals = [...(target.evaluation_results || []), ...((incoming.evaluation_results || []))];
      target.evaluation_results = evals;
      // Update status/turn_count from incoming if present
      if (incoming.status) target.status = incoming.status;
      if (typeof incoming.turn_count === 'number') target.turn_count = incoming.turn_count;
    }

    const mergedUnitResults = Object.values(unitIdToResult);

    const updateDoc: any = {
      $set: {
        activity_id: body.activity_id ?? existing?.activity_id,
        user_id: body.user_id ?? existing?.user_id,
        session_id: body.session_id ?? existing?.session_id,
        user_name: body.user_name ?? existing?.user_name ?? '',
        summary: body.summary ?? existing?.summary ?? '',
        unit_results: mergedUnitResults,
        generated_at: now,
      },
    };

    // If no existing and also no incoming unit_results, ensure unit_results is []
    if (!existing && incomingUnitResults.length === 0) {
      updateDoc.$set.unit_results = [];
    }

    await collection.updateOne(filter, updateDoc, { upsert: true });

    // fetch doc
    const doc = await collection.findOne(filter);

    const response: ApiResponse<SessionRecord> = {
      success: true,
      data: doc!,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Upsert session error:', error);
    const response: ApiResponse<SessionRecord> = {
      success: false,
      error: '更新 Session 失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
} 