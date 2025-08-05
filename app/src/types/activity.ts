/**
 * FlowQuest - 活動相關類型定義
 */

import { ObjectId } from './base';
import { MemoryConfig } from './agent';
// ================================
// Activity 活動實例
// ================================
export type ActivityStatus = "online" | "offline";

export interface Activity {
  _id: ObjectId;
  name: string;
  course_package_id: ObjectId;
  agent_profile_id: ObjectId;
  current_unit_id?: ObjectId; // 改為可選
  status: ActivityStatus;
  hot_memory_ids?: MemoryConfig[]; // 改為可選
  start_time: Date;
  end_time?: Date; // nullable
}

// 創建活動輸入格式
export type CreateActivityInput = Omit<Activity, '_id' | 'start_time' | 'end_time'>;

// 更新活動輸入格式
export type UpdateActivityInput = Partial<Omit<Activity, '_id'>> & { _id: ObjectId };

// 活動查詢過濾器
export interface ActivityFilter {
  status?: ActivityStatus;
  start_after?: Date;
  start_before?: Date;
}
