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

    // 輸出僅使用頂層 memories；讀取時支援 legacy memory_config
    const normalizedAgents: AgentProfile[] = agents.map((agent: any) => {
      const normalizedMemories = agent?.memories ?? [];
      const { memory_config, ...rest } = agent;
      return {
        ...rest,
        memories: normalizedMemories,
      } as AgentProfile;
    });
    
    return NextResponse.json({
      success: true,
      data: normalizedAgents,
      message: '成功獲取 Agent 列表'
    });
  } catch (error) {
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
    const body: any = await request.json();
    
    // 接受 legacy memory_config，但轉為 memories
    const normalizedBody: CreateAgentProfileInput = {
      ...body,
      memories: body?.memories ?? [],
    };
    
    // 驗證輸入資料
    const errors = validateAgentProfile(normalizedBody);
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: '輸入資料驗證失敗',
        message: formatValidationErrors(errors)
      }, { status: 400 });
    }
    
    const collection = await getAgentsCollection();
    
    // 創建新的 agent（僅儲存 memories）
    const newAgent: AgentProfile = {
      _id: generateObjectId(),
      ...normalizedBody,
      created_at: new Date(),
      updated_at: new Date(),
    } as AgentProfile;
    
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
    return NextResponse.json({
      success: false,
      error: '創建 Agent 失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
