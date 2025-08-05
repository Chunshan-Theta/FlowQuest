/**
 * FlowQuest - 活動相關類型定義
 */

import { ObjectId } from './base';

// ================================
// Activity 活動實例
// ================================
export type ActivityStatus = "in_progress" | "completed";

export interface Activity {
  _id: ObjectId;
  user_id: ObjectId;
  course_package_id: ObjectId;
  agent_profile_id: ObjectId;
  current_unit_id: ObjectId;
  status: ActivityStatus;
  hot_memory_ids: ObjectId[];
  start_time: Date;
  end_time?: Date; // nullable
}

// 創建活動輸入格式
export type CreateActivityInput = Omit<Activity, '_id' | 'start_time' | 'end_time'>;

// 更新活動輸入格式
export type UpdateActivityInput = Partial<Omit<Activity, '_id'>> & { _id: ObjectId };

// 活動查詢過濾器
export interface ActivityFilter {
  user_id?: ObjectId;
  status?: ActivityStatus;
  start_after?: Date;
  start_before?: Date;
}
