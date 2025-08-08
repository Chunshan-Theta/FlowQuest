import { NextRequest, NextResponse } from 'next/server';
import { AgentMemory, UpdateAgentMemoryInput, ApiResponse, isValidObjectId } from '@/types';
import { getActivitiesCollection } from '@/lib/mongodb';

interface RouteParams {
  params: Promise<{
    id: string;
    memoryId: string;
  }>;
}

// GET /api/activities/[id]/memories/[memoryId] - 獲取特定記憶
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, memoryId } = await params;
    
    if (!isValidObjectId(id) || !isValidObjectId(memoryId)) {
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

    const memory = ((activity as any).memories || []).find((mem: AgentMemory) => mem._id === memoryId);
    
    if (!memory) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: '找不到指定的記憶',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<AgentMemory> = {
      success: true,
      data: memory,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching activity memory:', error);
    const response: ApiResponse<AgentMemory> = {
      success: false,
      error: '獲取記憶失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/activities/[id]/memories/[memoryId] - 更新記憶
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, memoryId } = await params;
    
    if (!isValidObjectId(id) || !isValidObjectId(memoryId)) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: 'ID 格式無效',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const body = await request.json();
    const updateData: Partial<UpdateAgentMemoryInput> = body;

    const activitiesCollection = await getActivitiesCollection();
    const activity = await activitiesCollection.findOne({ _id: id });
    
    if (!activity) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: '找不到指定的活動',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const activityMemories: AgentMemory[] = (activity as any).memories || [];

    if (!activityMemories) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: '活動沒有記憶資料',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const memoryIndex = activityMemories.findIndex((mem: AgentMemory) => mem._id === memoryId);
    
    if (memoryIndex === -1) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: '找不到指定的記憶',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // 準備更新的記憶資料
    const updatedMemory = {
      ...activityMemories[memoryIndex],
      ...updateData,
      _id: memoryId, // 確保 ID 不變
    };

    // 更新陣列中的記憶（寫回 memories）
    const updateFields: any = {};
    updateFields[`memories.${memoryIndex}`] = updatedMemory;
    updateFields['updated_at'] = new Date();

    const updateResult = await activitiesCollection.updateOne(
      { _id: id },
      { $set: updateFields }
    );

    if (!updateResult.acknowledged) {
      throw new Error('更新記憶失敗');
    }

    const response: ApiResponse<AgentMemory> = {
      success: true,
      data: updatedMemory,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating activity memory:', error);
    const response: ApiResponse<AgentMemory> = {
      success: false,
      error: '更新記憶失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/activities/[id]/memories/[memoryId] - 刪除記憶
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, memoryId } = await params;
    
    if (!isValidObjectId(id) || !isValidObjectId(memoryId)) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: 'ID 格式無效',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const activitiesCollection = await getActivitiesCollection();
    
    // 從活動的 memories 陣列中移除記憶
    const updateResult = await activitiesCollection.updateOne(
      { _id: id },
      { 
        $pull: { memories: { _id: memoryId } },
        $set: { updated_at: new Date() }
      }
    );

    if (updateResult.matchedCount === 0) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: '找不到指定的活動',
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (updateResult.modifiedCount === 0) {
      const response: ApiResponse<AgentMemory> = {
        success: false,
        error: '找不到指定的記憶',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<AgentMemory> = {
      success: true,
      message: '記憶已成功刪除',
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting activity memory:', error);
    const response: ApiResponse<AgentMemory> = {
      success: false,
      error: '刪除記憶失敗',
    };
    return NextResponse.json(response, { status: 500 });
  }
} 