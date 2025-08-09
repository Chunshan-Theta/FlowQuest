import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AgentMemory, ApiResponse, DEFAULT_CONFIG } from '@/types';
import { ObjectId } from 'mongodb';

// GET /api/memories - 獲取所有記憶
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('memories');
    
    const memories = await collection.find({}).toArray();
    
    const response: ApiResponse<AgentMemory[]> = {
      success: true,
      data: memories as unknown as AgentMemory[],
      message: '記憶獲取成功'
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('獲取記憶失敗:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '獲取記憶失敗',
      message: '內部伺服器錯誤'
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/memories - 創建新記憶
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, activity_id, session_id, type, content, tags, created_by_user_id } = body;
    
    // 驗證必填欄位
    if (!agent_id || !type || !content || !created_by_user_id) {
      const response: ApiResponse<null> = {
        success: false,
        error: '缺少必填欄位',
        message: '請提供 agent_id、type、content 和 created_by_user_id'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 可選：如果提供其一則需同時提供，用於明確會話作用域
    if ((activity_id && !session_id) || (!activity_id && session_id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: '會話作用域參數不完整',
        message: 'activity_id 與 session_id 需同時提供或同時省略'
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    // 驗證記憶類型
    if (!['hot', 'cold'].includes(type)) {
      const response: ApiResponse<null> = {
        success: false,
        error: '無效的記憶類型',
        message: '記憶類型必須是 hot 或 cold'
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    // 驗證標籤數量
    if (tags && tags.length > DEFAULT_CONFIG.MEMORY.MAX_TAGS_PER_MEMORY) {
      const response: ApiResponse<null> = {
        success: false,
        error: '標籤數量超過限制',
        message: `標籤數量不能超過 ${DEFAULT_CONFIG.MEMORY.MAX_TAGS_PER_MEMORY} 個`
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    const db = await getDatabase();
    const collection = db.collection('memories');
    
    const newMemory = {
      _id: new ObjectId(),
      agent_id: agent_id.toString(),
      activity_id: activity_id ? activity_id.toString() : undefined,
      session_id: session_id ? session_id.toString() : undefined,
      type,
      content: content.trim(),
      tags: tags || [],
      created_by_user_id: created_by_user_id.toString(),
      created_at: new Date()
    };
    
    await collection.insertOne(newMemory);
    
    const response: ApiResponse<AgentMemory> = {
      success: true,
      data: {
        ...newMemory,
        _id: newMemory._id.toString()
      } as AgentMemory,
      message: '記憶創建成功'
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('創建記憶失敗:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '創建記憶失敗',
      message: '內部伺服器錯誤'
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/memories - 批量更新記憶
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { memories } = body;
    
    if (!Array.isArray(memories)) {
      const response: ApiResponse<null> = {
        success: false,
        error: '無效的記憶資料格式',
        message: 'memories 必須是陣列'
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    const db = await getDatabase();
    const collection = db.collection('memories');
    
    const updatePromises = memories.map(async (memory: AgentMemory) => {
      const { _id, ...updateData } = memory;
      return collection.updateOne(
        { _id: new ObjectId(_id) },
        { $set: updateData }
      );
    });
    
    await Promise.all(updatePromises);
    
    const response: ApiResponse<null> = {
      success: true,
      message: '記憶更新成功'
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('更新記憶失敗:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '更新記憶失敗',
      message: '內部伺服器錯誤'
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/memories - 刪除記憶
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      const response: ApiResponse<null> = {
        success: false,
        error: '缺少記憶 ID',
        message: '請提供要刪除的記憶 ID'
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    const db = await getDatabase();
    const collection = db.collection('memories');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: '記憶不存在',
        message: '找不到指定的記憶'
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: '記憶刪除成功'
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('刪除記憶失敗:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '刪除記憶失敗',
      message: '內部伺服器錯誤'
    };
    return NextResponse.json(response, { status: 500 });
  }
} 