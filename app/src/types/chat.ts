/**
 * FlowQuest - 聊天相關類型定義
 */

import { ObjectId } from './base';

// ================================
// Chat Message 聊天訊息
// ================================
export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  unit_id?: string;
}

// ================================
// Chat Session 聊天會話
// ================================
export interface ChatSession {
  activity_id: string;
  current_unit_id: string;
  messages: ChatMessage[];
  current_turn: number;
  is_completed: boolean;
  started_at: Date;
  updated_at: Date;
}

// ================================
// OpenAI Chat API 相關
// ================================
export interface OpenAIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SimpleChatRequest {
  messages: OpenAIChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface SimpleChatResponse {
  message: string;
  success: boolean;
  error?: string;
}

// ================================
// Unit Progress Check 關卡通過檢查
// ================================
export interface UnitProgressCheck {
  unit_id: string;
  messages: ChatMessage[];
  pass_condition: {
    type: "keyword" | "llm";
    value: string[];
  };
}

export interface UnitProgressResult {
  is_passed: boolean;
  reason?: string;
}
