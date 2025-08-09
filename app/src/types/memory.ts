/**
 * FlowQuest - Memory 相關類型定義
 */

import { ObjectId } from './base';

// ================================
// Memory 記憶模組
// ================================
export type MemoryType = "hot" | "cold";

export interface AgentMemory {
  _id: ObjectId;
  agent_id: ObjectId;
  activity_id?: ObjectId;
  session_id?: string;
  type: MemoryType;
  content: string;
  tags: string[];
  created_by_user_id: ObjectId; // who injected this memory
  created_at: Date;
}

// 創建 Agent Memory 輸入格式
export type CreateAgentMemoryInput = Omit<AgentMemory, '_id' | 'created_at'>;

// 更新 Agent Memory 輸入格式
export type UpdateAgentMemoryInput = Partial<Omit<AgentMemory, '_id'>> & { _id: ObjectId };
