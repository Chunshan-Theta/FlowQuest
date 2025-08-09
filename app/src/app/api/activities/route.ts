import { NextRequest, NextResponse } from 'next/server';
import { Activity, CreateActivityInput, ActivityFilter, ApiResponse, isValidObjectId, generateObjectId } from '@/types';
import { getActivitiesCollection } from '@/lib/mongodb';

// GET /api/activities - 獲取活動列表
export async function GET(request: NextRequest) {
  try {
    const collection = await getActivitiesCollection();
    
    const { searchParams } = new URL(request.url);
    const filter: any = {};
    
    // 建構查詢過濾器
    if (searchParams.get('status')) {
      filter.status = searchParams.get('status');
    }
    if (searchParams.get('start_after')) {
      filter.start_time = { ...filter.start_time, $gte: new Date(searchParams.get('start_after')!) };
    }
    if (searchParams.get('start_before')) {
      filter.start_time = { ...filter.start_time, $lte: new Date(searchParams.get('start_before')!) };
    }

    const activities = await collection.find(filter).sort({ start_time: -1 }).toArray();
    
    // Only output the new schema fields
    const normalized: Activity[] = activities.map((a: any) => ({
      _id: a._id,
      name: a.name,
      course_package_id: a.course_package_id,
      agent_profile_id: a.agent_profile_id,
      current_unit_id: a.current_unit_id,
      status: a.status,
      memories: a.memories ?? [],
      created_at: a.created_at,
      updated_at: a.updated_at,
    }));
    
    const response: ApiResponse<Activity[]> = {
      success: true,
      data: normalized,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching activities:', error);
    const response: ApiResponse<Activity[]> = {
      success: false,
      error: '獲取活動列表失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/activities - 創建新活動
export async function POST(request: NextRequest) {
  try {
    const collection = await getActivitiesCollection();
    
    const body = await request.json();
    const activityData: CreateActivityInput = body;
    
    // 驗證必要欄位
    if (!activityData.name || !activityData.course_package_id || !activityData.agent_profile_id) {
      const response: ApiResponse<Activity> = {
        success: false,
        error: '缺少必要欄位',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 驗證 ID 格式
    if (!isValidObjectId(activityData.course_package_id) || 
        !isValidObjectId(activityData.agent_profile_id) || 
        (activityData.current_unit_id && !isValidObjectId(activityData.current_unit_id))) {
      const response: ApiResponse<Activity> = {
        success: false,
        error: 'ID 格式無效',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 準備新活動資料
    const incomingMemories = Array.isArray((activityData as any).memories) ? (activityData as any).memories : [];
    const normalizedMemories = incomingMemories.map((m: any) => ({
      _id: typeof m._id === 'string' && m._id.length === 24 ? m._id : generateObjectId(),
      agent_id: m.agent_id ?? activityData.agent_profile_id,
      type: m.type,
      content: m.content,
      tags: Array.isArray(m.tags) ? m.tags : [],
      created_by_user_id: m.created_by_user_id ?? 'temp_creator',
      created_at: m.created_at ? new Date(m.created_at) : new Date(),
    }));

    const newActivity: Activity = {
      _id: generateObjectId(),
      ...activityData,
      memories: normalizedMemories,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await collection.insertOne(newActivity);
    
    if (!result.acknowledged) {
      throw new Error('插入資料庫失敗');
    }
    
    const response: ApiResponse<Activity> = {
      success: true,
      data: newActivity,
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    const response: ApiResponse<Activity> = {
      success: false,
      error: '創建活動失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
