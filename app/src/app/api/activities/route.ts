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
    
    const response: ApiResponse<Activity[]> = {
      success: true,
      data: activities,
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
    const newActivity: Activity = {
      _id: generateObjectId(),
      ...activityData,
      memory_ids: [], // 確保初始化為空陣列
      start_time: new Date(),
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
