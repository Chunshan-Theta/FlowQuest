import { ObjectId } from './base';
import type { AgentMemory } from './memory';

export type UnitResultStatus = 'passed' | 'failed';

export type ConversationLog = {
  role: string;
  content: string;
  timestamp: Date;
  system_prompt?: string;
  memories?: AgentMemory[];
  
};

export interface UnitResult {
  unit_id: ObjectId;
  status: UnitResultStatus;
  turn_count: number;
  important_keywords: string[];
  standard_pass_rules: string[];
  conversation_logs: ConversationLog[];
}

// SessionRecord: 以 session 為主體，承載整個對話與統計
export interface SessionRecord {
  _id: ObjectId;
  activity_id: ObjectId;
  user_id: ObjectId;
  session_id: ObjectId; // 人類可讀的代號，但仍以字串存
  user_name: string;
  summary: string;
  unit_results: UnitResult[];
  generated_at: Date;
}

export type CreateSessionInput = Omit<SessionRecord, '_id' | 'generated_at'>; 