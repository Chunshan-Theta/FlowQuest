/**
 * FlowQuest - 基本類型定義
 */

// 基本型別
export type ObjectId = string; // MongoDB ObjectId 的字串表示

// API 響應格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分頁資料格式
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
