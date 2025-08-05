/**
 * FlowQuest - 關卡相關類型定義
 */

import { ObjectId } from './base';
// ================================
// Unit 關卡（每一個對話挑戰）
// ================================
export type PassConditionType = "keyword" | "llm";

export interface PassCondition {
  type: PassConditionType;
  value: string[]; // 關鍵詞列表或其他條件值
}

export interface Unit {
  _id: ObjectId;
  title: string;
  course_package_id: ObjectId;
  agent_role: string;
  user_role: string;
  intro_message: string;
  outro_message: string;
  max_turns: number;
  agent_behavior_prompt: string;
  pass_condition: PassCondition;
  order: number;
  difficulty_level: number; // 難度等級 (1-5)
  created_at: Date;
  updated_at: Date;
}

// 創建關卡輸入格式
export type CreateUnitInput = Omit<Unit, '_id' | 'created_at' | 'updated_at'>;

// 更新關卡輸入格式
export type UpdateUnitInput = Partial<Omit<Unit, '_id'>> & { _id: ObjectId };

// 關卡查詢過濾器
export interface UnitFilter {
  course_package_id?: ObjectId;
  agent_role?: string;
  order_min?: number;
  order_max?: number;
}
