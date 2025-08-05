import { NextRequest, NextResponse } from 'next/server';
import { 
  AgentProfile, 
  CreateAgentProfileInput,
  validateAgentProfile,
  formatValidationErrors,
  generateObjectId,
  EXAMPLES 
} from '@/types';
import { getAgentsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/agents - 獲取所有 agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    const collection = await getAgentsCollection();
    
    // 構建查詢條件
    const query: any = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' }; // 不區分大小寫的模糊搜尋
    }
    
    const agents = await collection.find(query).toArray();
    
    return NextResponse.json({
      success: true,
      data: agents,
      message: '成功獲取 Agent 列表'
    });
  } catch (error) {
    // console.error('獲取 Agent 列表錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '獲取 Agent 列表失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// POST /api/agents - 創建新的 agent
export async function POST(request: NextRequest) {
  try {
    const body: CreateAgentProfileInput = await request.json();
    
    // 驗證輸入資料
    const errors = validateAgentProfile(body);
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: '輸入資料驗證失敗',
        message: formatValidationErrors(errors)
      }, { status: 400 });
    }
    
    const collection = await getAgentsCollection();
    
    // 創建新的 agent
    const newAgent: AgentProfile = {
      _id: generateObjectId(),
      ...body,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const result = await collection.insertOne(newAgent);
    
    if (!result.acknowledged) {
      throw new Error('插入資料庫失敗');
    }
    
    return NextResponse.json({
      success: true,
      data: newAgent,
      message: '成功創建 Agent'
    }, { status: 201 });
  } catch (error) {
    // console.error('創建 Agent 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '創建 Agent 失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
