import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, SessionRecord, isValidObjectId } from '@/types';
import { getSessionsCollection } from '@/lib/mongodb';

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/sessions/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const collection = await getSessionsCollection();

    let doc: SessionRecord | null = null as any;
    if (isValidObjectId(id)) {
      doc = await collection.findOne({ _id: id } as any) as any;
    } else {
      doc = await collection.find({ session_id: id }).sort({ generated_at: -1 }).limit(1).next() as any;
    }

    if (!doc) {
      return NextResponse.json({ success: false, error: '找不到 Session' } as ApiResponse<SessionRecord>, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doc } as ApiResponse<SessionRecord>);
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ success: false, error: '獲取 Session 失敗' } as ApiResponse<SessionRecord>, { status: 500 });
  }
} 