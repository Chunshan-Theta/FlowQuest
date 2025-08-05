import { NextRequest, NextResponse } from 'next/server';
import { Activity, UpdateActivityInput, ApiResponse, isValidObjectId } from '@/types';
import { getActivitiesCollection } from '@/lib/mongodb';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/activities/[id] - 獲取單一活動
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const collection = await getActivitiesCollection();
    
    if (!isValidObjectId(params.id)) {
      const response: ApiResponse<Activity> = {
        success: false,
        error: 'ID 格式無效',
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    const activity = await collection.findOne({ _id: params.id });
    
    if (!activity) {
      const response: ApiResponse<Activity> = {
        success: false,
        error: '找不到指定的活動',
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    const response: ApiResponse<Activity> = {
      success: true,
      data: activity,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching activity:', error);
    const response: ApiResponse<Activity> = {
      success: false,
      error: '獲取活動失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/activities/[id] - 更新活動
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const collection = await getActivitiesCollection();
    
    if (!isValidObjectId(params.id)) {
      const response: ApiResponse<Activity> = {
        success: false,
        error: 'ID 格式無效',
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    const body = await request.json();
    const updateData: UpdateActivityInput = body;
    
    // 移除 _id 欄位避免更新衝突
    const { _id, ...dataToUpdate } = updateData;
    
    const result = await collection.updateOne(
      { _id: params.id },
      { $set: dataToUpdate }
    );
    
    if (result.matchedCount === 0) {
      const response: ApiResponse<Activity> = {
        success: false,
        error: '找不到指定的活動',
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    const updatedActivity = await collection.findOne({ _id: params.id });
    
    const response: ApiResponse<Activity> = {
      success: true,
      data: updatedActivity!,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating activity:', error);
    const response: ApiResponse<Activity> = {
      success: false,
      error: '更新活動失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/activities/[id] - 刪除活動
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const collection = await getActivitiesCollection();
    
    if (!isValidObjectId(params.id)) {
      const response: ApiResponse<Activity> = {
        success: false,
        error: 'ID 格式無效',
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    const result = await collection.deleteOne({ _id: params.id });
    
    if (result.deletedCount === 0) {
      const response: ApiResponse<Activity> = {
        success: false,
        error: '找不到指定的活動',
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    const response: ApiResponse<Activity> = {
      success: true,
      message: '活動已成功刪除',
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting activity:', error);
    const response: ApiResponse<Activity> = {
      success: false,
      error: '刪除活動失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
