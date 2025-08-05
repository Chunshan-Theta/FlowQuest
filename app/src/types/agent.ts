/**
 * FlowQuest - Agent 相關類型定義
 */

import { ObjectId } from './base';

// ================================
// AgentProfile 代理人設定
// ================================
export interface AgentPersona {
  tone: string;
  background: string;
  voice: string;
}

export interface MemoryConfig {
  hot_memory_ids: AgentMemory[]; // 活動階段注入
  cold_memory_ids: AgentMemory[]; // 可跨活動引用
}

export interface AgentProfile {
  _id: ObjectId;
  name: string;
  persona: AgentPersona;
  memory_config: MemoryConfig;
  created_at: Date;
  updated_at: Date;
}

// ================================
// AgentMemory 記憶模組
// ================================
export type MemoryType = "hot" | "cold";

export interface AgentMemory {
  _id: ObjectId;
  agent_id: ObjectId;
  type: MemoryType;
  content: string;
  tags: string[];
  created_by_user_id: ObjectId; // who injected this memory
  created_at: Date;
}

// 創建 Agent Profile 輸入格式
export type CreateAgentProfileInput = Omit<AgentProfile, '_id' | 'created_at' | 'updated_at'>;

// 更新 Agent Profile 輸入格式
export type UpdateAgentProfileInput = Partial<Omit<AgentProfile, '_id'>> & { _id: ObjectId };

// 創建 Agent Memory 輸入格式
export type CreateAgentMemoryInput = Omit<AgentMemory, '_id' | 'created_at'>;

// 更新 Agent Memory 輸入格式
export type UpdateAgentMemoryInput = Partial<Omit<AgentMemory, '_id'>> & { _id: ObjectId };
