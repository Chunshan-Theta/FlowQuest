import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, InteractionReport, isValidObjectId } from '@/types';
import { getReportsCollection } from '@/lib/mongodb';

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/reports/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'ID 格式無效' } as ApiResponse<InteractionReport>, { status: 400 });
    }

    const collection = await getReportsCollection();
    const doc = await collection.findOne({ _id: id });
    if (!doc) {
      return NextResponse.json({ success: false, error: '找不到報告' } as ApiResponse<InteractionReport>, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doc } as ApiResponse<InteractionReport>);
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json({ success: false, error: '獲取報告失敗' } as ApiResponse<InteractionReport>, { status: 500 });
  }
}

// PATCH /api/reports/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'ID 格式無效' } as ApiResponse<InteractionReport>, { status: 400 });
    }

    const body = await request.json();

    const collection = await getReportsCollection();

    const result = await collection.updateOne({ _id: id }, { $set: { ...body, generated_at: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: '找不到報告' } as ApiResponse<InteractionReport>, { status: 404 });
    }

    const updated = await collection.findOne({ _id: id });

    return NextResponse.json({ success: true, data: updated! } as ApiResponse<InteractionReport>);
  } catch (error) {
    console.error('Patch report error:', error);
    return NextResponse.json({ success: false, error: '更新報告失敗' } as ApiResponse<InteractionReport>, { status: 500 });
  }
} 