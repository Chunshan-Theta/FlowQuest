/**
 * FlowQuest - 課程包相關類型定義
 */

import { ObjectId } from './base';
import { AgentMemory } from './memory';
import { Unit } from './unit';

// ================================
// CoursePackage 課程包
// ================================
export interface CoursePackage {
  _id: ObjectId;
  title: string;
  description: string;
  units: Unit[]; // 連結至 Unit 關卡
  created_at: Date;
  updated_at: Date;
  memories: AgentMemory[]; // 相關記憶的 ID 列表
}

// 創建課程包輸入格式
export type CreateCoursePackageInput = Omit<CoursePackage, '_id' | 'created_at' | 'updated_at'>;

// 更新課程包輸入格式
export type UpdateCoursePackageInput = Partial<Omit<CoursePackage, '_id'>> & { _id: ObjectId };

// 課程包查詢過濾器
export interface CoursePackageFilter {
  title?: string;
  created_after?: Date;
  created_before?: Date;
}
