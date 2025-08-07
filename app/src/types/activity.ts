/**
 * FlowQuest - 活動相關類型定義
 */

import { ObjectId } from './base';
import { AgentMemory } from './memory';

// ================================
// Activity 活動實例
// ================================
export type ActivityStatus = "online" | "offline";

export interface Activity {
  _id: ObjectId;
  name: string;
  course_package_id: ObjectId;
  agent_profile_id: ObjectId;
  current_unit_id?: ObjectId;
  status: ActivityStatus;
  memory_ids?: AgentMemory[];
  created_at: Date;
  updated_at: Date;
}

// 創建活動輸入格式
export type CreateActivityInput = Omit<Activity, '_id' | 'created_at' | 'updated_at'>;

// 更新活動輸入格式
export type UpdateActivityInput = Partial<Omit<Activity, '_id' | 'created_at' | 'updated_at'>> & { _id: ObjectId };

// 活動查詢過濾器
export interface ActivityFilter {
  status?: ActivityStatus;
  course_package_id?: ObjectId;
  agent_profile_id?: ObjectId;
  created_after?: Date;
  created_before?: Date;
}
