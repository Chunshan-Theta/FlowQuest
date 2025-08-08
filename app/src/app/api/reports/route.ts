import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, CreateInteractionReportInput, InteractionReport, isValidObjectId } from '@/types';
import { getReportsCollection } from '@/lib/mongodb';

// GET /api/reports - list reports by optional activity_id, user_id, session_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activity_id = searchParams.get('activity_id') || undefined;
    const user_id = searchParams.get('user_id') || undefined;
    const session_id = searchParams.get('session_id') || undefined;

    const collection = await getReportsCollection();

    const query: any = {};
    if (activity_id) query.activity_id = activity_id;
    if (user_id) query.user_id = user_id;
    if (session_id) query.session_id = session_id;

    const items = await collection.find(query).sort({ generated_at: -1 }).toArray();

    const response: ApiResponse<InteractionReport[]> = {
      success: true,
      data: items as any,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('List reports error:', error);
    const response: ApiResponse<InteractionReport[]> = {
      success: false,
      error: '獲取報告列表失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/reports - upsert a report by _id or by (activity_id, user_id, session_id)
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<CreateInteractionReportInput & { _id?: string }> = await request.json();
    const collection = await getReportsCollection();

    // derive key
    let filter: any = {};
    if (body._id && isValidObjectId(body._id)) {
      filter = { _id: body._id };
    } else if (body.activity_id && body.user_id && body.session_id) {
      filter = { activity_id: body.activity_id, user_id: body.user_id, session_id: body.session_id };
    } else {
      return NextResponse.json({ success: false, error: '需要 _id 或 (activity_id, user_id, session_id)' } as ApiResponse<InteractionReport>, { status: 400 });
    }

    const now = new Date();

    const updateDoc: any = {
      $set: {
        activity_id: body.activity_id,
        user_id: body.user_id,
        session_id: body.session_id,
        user_name: body.user_name ?? '',
        summary: body.summary ?? '',
        unit_results: body.unit_results ?? [],
        generated_at: now,
      },
    };

    await collection.updateOne(filter, updateDoc, { upsert: true });

    // fetch doc
    const doc = await collection.findOne(filter);

    const response: ApiResponse<InteractionReport> = {
      success: true,
      data: doc!,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Upsert report error:', error);
    const response: ApiResponse<InteractionReport> = {
      success: false,
      error: '更新報告失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
} 