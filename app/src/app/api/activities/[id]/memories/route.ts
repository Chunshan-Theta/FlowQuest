import { NextRequest, NextResponse } from 'next/server';
import { AgentMemory, CreateAgentMemoryInput, ApiResponse, isValidObjectId, generateObjectId } from '@/types';
import { getActivitiesCollection } from '@/lib/mongodb';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/activities/[id]/memories - 獲取活動的所有記憶
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      const response: ApiResponse<AgentMemory[]> = {
        success: false,
        error: 'ID 格式無效',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const activitiesCollection = await getActivitiesCollection();
    const activity = await activitiesCollection.findOne({ _id: id });
    
    if (!activity) {
      const response: ApiResponse<AgentMemory[]> = {
        success: false,
        error: '找不到指定的活動',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<AgentMemory[]> = {
      success: true,
      data: (activity as any).memories || [],
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching activity memories:', error);
    const response: ApiResponse<AgentMemory[]> = {
      success: false,
      error: '獲取記憶失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/activities/[id]/memories - 為活動新增記憶
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: 'ID 格式無效',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const body = await request.json();
    const memoryData: CreateAgentMemoryInput = body;
    
    // 驗證必要欄位
    if (!memoryData.agent_id || !memoryData.type || !memoryData.content || !memoryData.created_by_user_id) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: '缺少必要欄位',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 驗證 ID 格式
    if (!isValidObjectId(memoryData.agent_id) || !isValidObjectId(memoryData.created_by_user_id)) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: 'ID 格式無效',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const activitiesCollection = await getActivitiesCollection();
    const activity = await activitiesCollection.findOne({ _id: id });
    
    if (!activity) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: '找不到指定的活動',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // 創建新記憶
    const newMemory: AgentMemory = {
      _id: generateObjectId(),
      ...memoryData,
      created_at: new Date(),
    };

    // 將記憶添加到活動的 memories 陣列中
    const updateResult = await activitiesCollection.updateOne(
      { _id: id },
      { 
        $push: { memories: newMemory },
        $set: { updated_at: new Date() }
      }
    );

    if (!updateResult.acknowledged) {
      throw new Error('更新活動失敗');
    }

    const response: ApiResponse<AgentMemory> = {
      success: true,
      data: newMemory,
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating activity memory:', error);
    const response: ApiResponse<AgentMemory> = {
      success: false,
      error: '創建記憶失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
} 