/**
 * FlowQuest - Agent 相關類型定義
 */

import { ObjectId } from './base';
import { AgentMemory, CreateAgentMemoryInput, UpdateAgentMemoryInput } from './memory';

// ================================
// AgentProfile 代理人設定
// ================================
export interface AgentPersona {
  tone: string;
  background: string;
  voice: string;
}


export interface AgentProfile {
  _id: ObjectId;
  name: string;
  persona: AgentPersona;
  memory_config?: {
    memory_ids: AgentMemory[];
  };
  created_at: Date;
  updated_at: Date;
}

// 創建 Agent Profile 輸入格式
export type CreateAgentProfileInput = Omit<AgentProfile, '_id' | 'created_at' | 'updated_at'>;

// 更新 Agent Profile 輸入格式
export type UpdateAgentProfileInput = Partial<Omit<AgentProfile, '_id' | 'created_at' | 'updated_at'>> & { _id: ObjectId };
