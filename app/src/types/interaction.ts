/**
 * FlowQuest - 互動相關類型定義
 */

import { ObjectId } from './base';

// ================================
// InteractionLog 使用者與Agent的互動紀錄（回合制）
// ================================
export interface InteractionLog {
  _id: ObjectId;
  activity_id: ObjectId;
  unit_id: ObjectId;
  user_id: ObjectId;
  turn_index: number;
  user_message: string;
  agent_response: string;
  memory_references: ObjectId[]; // 被引用的記憶
  timestamp: Date;
}

// 創建互動記錄輸入格式
export type CreateInteractionLogInput = Omit<InteractionLog, '_id' | 'timestamp'>;

// 互動記錄查詢過濾器
export interface InteractionLogFilter {
  activity_id?: ObjectId;
  user_id?: ObjectId;
  unit_id?: ObjectId;
  from_turn?: number;
  to_turn?: number;
}
