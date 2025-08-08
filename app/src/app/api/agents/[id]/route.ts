import { NextRequest, NextResponse } from 'next/server';
import { 
  AgentProfile, 
  UpdateAgentProfileInput,
  validateAgentProfile,
  formatValidationErrors,
  isValidObjectId,
  EXAMPLES 
} from '@/types';
import { getAgentsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/agents/[id] - 根據 ID 獲取單一 agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID 格式無效',
        message: '請提供有效的 Agent ID'
      }, { status: 400 });
    }
    
    const collection = await getAgentsCollection();
    const agent = await collection.findOne({ _id: id });
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: '找不到 Agent',
        message: `ID 為 ${id} 的 Agent 不存在`
      }, { status: 404 });
    }
    
    // 輸出僅使用頂層 memories；讀取時支援 legacy memory_config
    const normalizedMemories = (agent as any).memories ?? [];
    const { memory_config, ...rest } = agent as any;
    const resultAgent: AgentProfile = {
      ...rest,
      memories: normalizedMemories,
    } as AgentProfile;
    
    return NextResponse.json({
      success: true,
      data: resultAgent,
      message: '成功獲取 Agent 詳情'
    });
  } catch (error) {
    console.error('獲取 Agent 詳情錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '獲取 Agent 詳情失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// PUT /api/agents/[id] - 更新 agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: any = await request.json();
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID 格式無效',
        message: '請提供有效的 Agent ID'
      }, { status: 400 });
    }
    
    const collection = await getAgentsCollection();
    
    // 檢查 agent 是否存在
    const existingAgent = await collection.findOne({ _id: id });
    if (!existingAgent) {
      return NextResponse.json({
        success: false,
        error: '找不到 Agent',
        message: `ID 為 ${id} 的 Agent 不存在`
      }, { status: 404 });
    }
    
    // 接受 legacy memory_config，但轉為 memories
    const normalizedBody: Partial<UpdateAgentProfileInput> = {
      ...(body || {}),
      memories: body?.memories ?? (existingAgent as any).memories ?? [],
    } as any;

    // 準備更新資料
    const updateData = { ...normalizedBody, _id: id } as Partial<UpdateAgentProfileInput> & { _id: string };
    
    // 驗證更新資料
    const errors = validateAgentProfile(updateData as any);
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: '輸入資料驗證失敗',
        message: formatValidationErrors(errors)
      }, { status: 400 });
    }
    
    // 更新 agent（僅儲存 memories）
    const { memory_config, ...restExisting } = existingAgent as any;
    const updatedAgent: AgentProfile = {
      ...restExisting,
      ...normalizedBody,
      _id: id,
      updated_at: new Date(),
    } as AgentProfile;
    
    const result = await collection.replaceOne(
      { _id: id },
      updatedAgent
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: '找不到 Agent',
        message: `ID 為 ${id} 的 Agent 不存在`
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: updatedAgent,
      message: '成功更新 Agent'
    });
  } catch (error) {
    console.error('更新 Agent 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '更新 Agent 失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// DELETE /api/agents/[id] - 刪除 agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID 格式無效',
        message: '請提供有效的 Agent ID'
      }, { status: 400 });
    }
    
    const collection = await getAgentsCollection();
    
    // 先獲取要刪除的 agent
    const agentToDelete = await collection.findOne({ _id: id });
    
    if (!agentToDelete) {
      return NextResponse.json({
        success: false,
        error: '找不到 Agent',
        message: `ID 為 ${id} 的 Agent 不存在`
      }, { status: 404 });
    }
    
    // 刪除 agent
    const result = await collection.deleteOne({ _id: id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: '刪除失敗',
        message: `無法刪除 ID 為 ${id} 的 Agent`
      }, { status: 500 });
    }
    
    // 回傳僅使用頂層 memories
    const normalizedMemories = (agentToDelete as any).memories ?? [];
    const { memory_config, ...rest } = agentToDelete as any;
    const resultAgent: AgentProfile = {
      ...rest,
      memories: normalizedMemories,
    } as AgentProfile;

    return NextResponse.json({
      success: true,
      data: resultAgent,
      message: '成功刪除 Agent'
    });
  } catch (error) {
    console.error('刪除 Agent 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '刪除 Agent 失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
