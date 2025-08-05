/**
 * FlowQuest - 報告相關類型定義
 */

import { ObjectId } from './base';

// ================================
// InteractionReport 報告紀錄
// ================================
export type UnitResultStatus = "passed" | "failed";

export interface UnitResult {
  unit_id: ObjectId;
  status: UnitResultStatus;
  turn_count: number;
  important_keywords: string[];
}

export interface InteractionReport {
  _id: ObjectId;
  activity_id: ObjectId;
  user_id: ObjectId;
  summary: string;
  unit_results: UnitResult[];
  generated_at: Date;
}

// 創建報告輸入格式
export type CreateInteractionReportInput = Omit<InteractionReport, '_id' | 'generated_at'>;
