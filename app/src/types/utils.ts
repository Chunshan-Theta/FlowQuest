/**
 * FlowQuest - 類型工具函數
 * 包含驗證、轉換和工具函數
 */

import { ObjectId } from './base';
import { CoursePackage } from './course-package';
import { Unit, PassConditionType } from './unit';
import { AgentProfile } from './agent';
import { AgentMemory, MemoryType } from './memory';
import { Activity, ActivityStatus } from './activity';
import { InteractionLog } from './interaction';
import { UnitResultStatus } from './report';

import {
  ACTIVITY_STATUS,
  MEMORY_TYPE,
  PASS_CONDITION_TYPE,
  UNIT_RESULT_STATUS,
  VALIDATION_RULES,
} from './constants';

// ================================
// 類型守衛函數 (Type Guards)
// ================================

/**
 * 檢查是否為有效的 ObjectId 格式
 */
export function isValidObjectId(id: string): id is ObjectId {
  // MongoDB ObjectId 是 24 位十六進制字符串
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * 檢查是否為有效的活動狀態
 */
export function isValidActivityStatus(status: string): status is ActivityStatus {
  return Object.values(ACTIVITY_STATUS).includes(status as ActivityStatus);
}

/**
 * 檢查是否為有效的記憶類型
 */
export function isValidMemoryType(type: string): type is MemoryType {
  return Object.values(MEMORY_TYPE).includes(type as MemoryType);
}

/**
 * 檢查是否為有效的通過條件類型
 */
export function isValidPassConditionType(type: string): type is PassConditionType {
  return Object.values(PASS_CONDITION_TYPE).includes(type as PassConditionType);
}

/**
 * 檢查是否為有效的關卡結果狀態
 */
export function isValidUnitResultStatus(status: string): status is UnitResultStatus {
  return Object.values(UNIT_RESULT_STATUS).includes(status as UnitResultStatus);
}

// ================================
// 驗證函數
// ================================

/**
 * 驗證課程包資料
 */
export function validateCoursePackage(data: Partial<CoursePackage>): string[] {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('課程包標題為必填欄位');
  } else if (data.title.length > VALIDATION_RULES.TITLE.MAX_LENGTH) {
    errors.push(`課程包標題長度不能超過 ${VALIDATION_RULES.TITLE.MAX_LENGTH} 個字符`);
  }
  
  if (data.description && data.description.length > VALIDATION_RULES.DESCRIPTION.MAX_LENGTH) {
    errors.push(`課程包描述長度不能超過 ${VALIDATION_RULES.DESCRIPTION.MAX_LENGTH} 個字符`);
  }
  
  if (data.units) {
    if (data.units.length < VALIDATION_RULES.UNITS_PER_PACKAGE.MIN) {
      errors.push(`課程包至少需要 ${VALIDATION_RULES.UNITS_PER_PACKAGE.MIN} 個關卡`);
    } else if (data.units.length > VALIDATION_RULES.UNITS_PER_PACKAGE.MAX) {
      errors.push(`課程包最多只能有 ${VALIDATION_RULES.UNITS_PER_PACKAGE.MAX} 個關卡`);
    }
    
    // 檢查所有 unit 物件的 ID 格式
    data.units.forEach((unit, index) => {
      if (unit._id && !isValidObjectId(unit._id)) {
        errors.push(`第 ${index + 1} 個關卡 ID 格式無效`);
      }
    });
  }
  
  return errors;
}

/**
 * 驗證關卡資料
 */
export function validateUnit(data: Partial<Unit>): string[] {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('關卡標題為必填欄位');
  } else if (data.title.length > VALIDATION_RULES.TITLE.MAX_LENGTH) {
    errors.push(`關卡標題長度不能超過 ${VALIDATION_RULES.TITLE.MAX_LENGTH} 個字符`);
  }
  
  if (data.course_package_id && !isValidObjectId(data.course_package_id)) {
    errors.push('課程包 ID 格式無效');
  }
  
  if (data.max_turns !== undefined) {
    if (data.max_turns < VALIDATION_RULES.TURNS.MIN) {
      errors.push(`最大回合數不能小於 ${VALIDATION_RULES.TURNS.MIN}`);
    } else if (data.max_turns > VALIDATION_RULES.TURNS.MAX) {
      errors.push(`最大回合數不能大於 ${VALIDATION_RULES.TURNS.MAX}`);
    }
  }
  
  if (data.order !== undefined) {
    if (data.order < VALIDATION_RULES.ORDER.MIN) {
      errors.push(`關卡順序不能小於 ${VALIDATION_RULES.ORDER.MIN}`);
    } else if (data.order > VALIDATION_RULES.ORDER.MAX) {
      errors.push(`關卡順序不能大於 ${VALIDATION_RULES.ORDER.MAX}`);
    }
  }
  
  if (data.pass_condition) {
    if (!isValidPassConditionType(data.pass_condition.type)) {
      errors.push('通過條件類型無效');
    }
    
    if (!data.pass_condition.value || data.pass_condition.value.length === 0) {
      errors.push('通過條件值為必填欄位');
    } else if (data.pass_condition.value.length > VALIDATION_RULES.KEYWORDS_PER_CONDITION.MAX) {
      errors.push(`通過條件關鍵詞不能超過 ${VALIDATION_RULES.KEYWORDS_PER_CONDITION.MAX} 個`);
    }
  }
  
  return errors;
}

/**
 * 驗證代理人檔案資料
 */
export function validateAgentProfile(data: Partial<AgentProfile>): string[] {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('代理人名稱為必填欄位');
  } else if (data.name.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
    errors.push(`代理人名稱長度不能超過 ${VALIDATION_RULES.NAME.MAX_LENGTH} 個字符`);
  }
  
  if (data.memory_config) {
    // 驗證記憶配置中的 memory_ids 陣列
    if (data.memory_config.memory_ids) {
      data.memory_config.memory_ids.forEach((memory: any, index: number) => {
        if (memory._id && !isValidObjectId(memory._id)) {
          errors.push(`第 ${index + 1} 個記憶 ID 格式無效`);
        }
        if (memory.agent_id && !isValidObjectId(memory.agent_id)) {
          errors.push(`第 ${index + 1} 個記憶的 agent_id 格式無效`);
        }
        if (memory.created_by_user_id && !isValidObjectId(memory.created_by_user_id)) {
          errors.push(`第 ${index + 1} 個記憶的 created_by_user_id 格式無效`);
        }
      });
    }
    // 驗證記憶配置中的 cold_memory_ids 陣列
    if (data.memory_config.cold_memory_ids) {
      data.memory_config.cold_memory_ids.forEach((memory: any, index: number) => {
        if (memory._id && !isValidObjectId(memory._id)) {
          errors.push(`第 ${index + 1} 個冷記憶 ID 格式無效`);
        }
        if (memory.agent_id && !isValidObjectId(memory.agent_id)) {
          errors.push(`第 ${index + 1} 個冷記憶的 agent_id 格式無效`);
        }
        if (memory.created_by_user_id && !isValidObjectId(memory.created_by_user_id)) {
          errors.push(`第 ${index + 1} 個冷記憶的 created_by_user_id 格式無效`);
        }
      });
    }
  }
  
  return errors;
}

/**
 * 驗證記憶資料
 */
export function validateAgentMemory(data: Partial<AgentMemory>): string[] {
  const errors: string[] = [];
  
  if (data.agent_id && !isValidObjectId(data.agent_id)) {
    errors.push('代理人 ID 格式無效');
  }
  
  if (data.type && !isValidMemoryType(data.type)) {
    errors.push('記憶類型無效');
  }
  
  if (!data.content || data.content.trim().length === 0) {
    errors.push('記憶內容為必填欄位');
  } else if (data.content.length > VALIDATION_RULES.CONTENT.MAX_LENGTH) {
    errors.push(`記憶內容長度不能超過 ${VALIDATION_RULES.CONTENT.MAX_LENGTH} 個字符`);
  }
  
  if (data.tags) {
    if (data.tags.length > VALIDATION_RULES.TAGS_PER_MEMORY.MAX) {
      errors.push(`記憶標籤不能超過 ${VALIDATION_RULES.TAGS_PER_MEMORY.MAX} 個`);
    }
    
    data.tags.forEach((tag, index) => {
      if (!tag || tag.trim().length === 0) {
        errors.push(`第 ${index + 1} 個標籤不能為空`);
      }
    });
  }
  
  if (data.created_by_user_id && !isValidObjectId(data.created_by_user_id)) {
    errors.push('創建者 ID 格式無效');
  }
  
  return errors;
}

/**
 * 驗證活動資料
 */
export function validateActivity(data: Partial<Activity>): string[] {
  const errors: string[] = [];
  
  if (data.course_package_id && !isValidObjectId(data.course_package_id)) {
    errors.push('課程包 ID 格式無效');
  }
  
  if (data.agent_profile_id && !isValidObjectId(data.agent_profile_id)) {
    errors.push('代理人檔案 ID 格式無效');
  }
  
  if (data.current_unit_id && !isValidObjectId(data.current_unit_id)) {
    errors.push('當前關卡 ID 格式無效');
  }
  
  if (data.status && !isValidActivityStatus(data.status)) {
    errors.push('活動狀態無效');
  }
  
  if (data.memory_ids) {
    data.memory_ids.forEach((memoryId: any, index: number) => {
      if (!isValidObjectId(memoryId)) {
        errors.push(`第 ${index + 1} 個記憶 ID 格式無效`);
      }
    });
  }
  
  return errors;
}

/**
 * 驗證互動記錄資料
 */
export function validateInteractionLog(data: Partial<InteractionLog>): string[] {
  const errors: string[] = [];
  
  if (data.activity_id && !isValidObjectId(data.activity_id)) {
    errors.push('活動 ID 格式無效');
  }
  
  if (data.unit_id && !isValidObjectId(data.unit_id)) {
    errors.push('關卡 ID 格式無效');
  }
  
  if (data.user_id && !isValidObjectId(data.user_id)) {
    errors.push('使用者 ID 格式無效');
  }
  
  if (data.turn_index !== undefined && data.turn_index < 0) {
    errors.push('回合索引不能為負數');
  }
  
  if (!data.user_message || data.user_message.trim().length === 0) {
    errors.push('使用者訊息為必填欄位');
  } else if (data.user_message.length > VALIDATION_RULES.MESSAGE.MAX_LENGTH) {
    errors.push(`使用者訊息長度不能超過 ${VALIDATION_RULES.MESSAGE.MAX_LENGTH} 個字符`);
  }
  
  if (!data.agent_response || data.agent_response.trim().length === 0) {
    errors.push('代理人回應為必填欄位');
  } else if (data.agent_response.length > VALIDATION_RULES.MESSAGE.MAX_LENGTH) {
    errors.push(`代理人回應長度不能超過 ${VALIDATION_RULES.MESSAGE.MAX_LENGTH} 個字符`);
  }
  
  if (data.memory_references) {
    data.memory_references.forEach((memoryId, index) => {
      if (!isValidObjectId(memoryId)) {
        errors.push(`第 ${index + 1} 個記憶引用 ID 格式無效`);
      }
    });
  }
  
  return errors;
}

// ================================
// 工具函數
// ================================

/**
 * 生成新的 ObjectId
 */
export function generateObjectId(): ObjectId {
  // 生成類似 MongoDB ObjectId 的 24 字符十六進制字符串
  // 格式：timestamp(8) + machineId(6) + processId(4) + counter(6)
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.random().toString(16).slice(2, 8).padStart(6, '0');
  const processId = Math.random().toString(16).slice(2, 6).padStart(4, '0');
  const counter = Math.random().toString(16).slice(2, 8).padStart(6, '0');
  
  return timestamp + machineId + processId + counter;
}

/**
 * 清理並標準化字串
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * 清理標籤陣列
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map(tag => sanitizeString(tag))
    .filter(tag => tag.length > 0)
    .filter((tag, index, array) => array.indexOf(tag) === index); // 去重
}

/**
 * 檢查陣列是否包含重複的 ObjectId
 */
export function hasDuplicateIds(ids: ObjectId[]): boolean {
  return new Set(ids).size !== ids.length;
}

/**
 * 移除陣列中的重複 ObjectId
 */
export function removeDuplicateIds(ids: ObjectId[]): ObjectId[] {
  return [...new Set(ids)];
}

/**
 * 將日期轉換為 ISO 字串
 */
export function dateToISOString(date: Date): string {
  return date.toISOString();
}

/**
 * 將 ISO 字串轉換為日期
 */
export function isoStringToDate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * 檢查日期是否有效
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 計算兩個日期之間的分鐘差
 */
export function getMinutesDifference(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * 格式化錯誤訊息
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
}
