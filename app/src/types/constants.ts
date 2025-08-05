/**
 * FlowQuest - 常數定義
 * 包含枚舉值、預設配置等
 */

// ================================
// 狀態相關常數
// ================================
export const ACTIVITY_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const MEMORY_TYPE = {
  HOT: 'hot',
  COLD: 'cold',
} as const;

export const PASS_CONDITION_TYPE = {
  KEYWORD: 'keyword',
  LLM: 'llm',
} as const;

export const UNIT_RESULT_STATUS = {
  PASSED: 'passed',
  FAILED: 'failed',
} as const;

// ================================
// 預設配置
// ================================
export const DEFAULT_CONFIG = {
  // 關卡預設設定
  UNIT: {
    MAX_TURNS: 10,
    MIN_TURNS: 3,
  },
  
  // 分頁預設設定
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  
  // 記憶相關設定
  MEMORY: {
    MAX_HOT_MEMORIES: 50,
    MAX_COLD_MEMORIES: 200,
    MAX_TAGS_PER_MEMORY: 10,
  },
  
  // 互動相關設定
  INTERACTION: {
    MAX_MESSAGE_LENGTH: 1000,
    MIN_MESSAGE_LENGTH: 1,
  },
} as const;

// ================================
// 錯誤訊息
// ================================
export const ERROR_MESSAGES = {
  // 通用錯誤
  INVALID_ID: '無效的 ID 格式',
  NOT_FOUND: '找不到指定的資源',
  UNAUTHORIZED: '未授權存取',
  FORBIDDEN: '禁止存取',
  INTERNAL_ERROR: '內部伺服器錯誤',
  
  // CoursePackage 相關
  COURSE_PACKAGE_NOT_FOUND: '找不到指定的課程包',
  COURSE_PACKAGE_TITLE_REQUIRED: '課程包標題為必填欄位',
  
  // Unit 相關
  UNIT_NOT_FOUND: '找不到指定的關卡',
  UNIT_TITLE_REQUIRED: '關卡標題為必填欄位',
  UNIT_MAX_TURNS_INVALID: '關卡最大回合數必須大於 0',
  UNIT_ORDER_INVALID: '關卡順序必須大於 0',
  
  // Agent 相關
  AGENT_PROFILE_NOT_FOUND: '找不到指定的代理人檔案',
  AGENT_NAME_REQUIRED: '代理人名稱為必填欄位',
  
  // Memory 相關
  MEMORY_NOT_FOUND: '找不到指定的記憶',
  MEMORY_CONTENT_REQUIRED: '記憶內容為必填欄位',
  MEMORY_TAGS_INVALID: '記憶標籤格式無效',
  
  // Activity 相關
  ACTIVITY_NOT_FOUND: '找不到指定的活動',
  ACTIVITY_ALREADY_COMPLETED: '活動已完成，無法修改',
  ACTIVITY_USER_REQUIRED: '活動必須指定使用者',
  
  // Interaction 相關
  INTERACTION_LOG_NOT_FOUND: '找不到指定的互動記錄',
  INTERACTION_MESSAGE_TOO_LONG: '訊息長度超過限制',
  INTERACTION_MESSAGE_TOO_SHORT: '訊息長度過短',
  INTERACTION_TURN_INVALID: '回合索引無效',
  
  // Report 相關
  REPORT_NOT_FOUND: '找不到指定的報告',
  REPORT_GENERATION_FAILED: '報告生成失敗',
} as const;

// ================================
// 成功訊息
// ================================
export const SUCCESS_MESSAGES = {
  // 通用成功
  CREATED: '創建成功',
  UPDATED: '更新成功',
  DELETED: '刪除成功',
  RETRIEVED: '獲取成功',
  
  // 特定操作成功
  COURSE_PACKAGE_CREATED: '課程包創建成功',
  UNIT_CREATED: '關卡創建成功',
  AGENT_PROFILE_CREATED: '代理人檔案創建成功',
  MEMORY_CREATED: '記憶創建成功',
  ACTIVITY_STARTED: '活動開始成功',
  ACTIVITY_COMPLETED: '活動完成成功',
  INTERACTION_LOGGED: '互動記錄成功',
  REPORT_GENERATED: '報告生成成功',
} as const;

// ================================
// 驗證規則
// ================================
export const VALIDATION_RULES = {
  // 字串長度限制
  TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  
  DESCRIPTION: {
    MIN_LENGTH: 0,
    MAX_LENGTH: 1000,
  },
  
  MESSAGE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 1000,
  },
  
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  
  CONTENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 2000,
  },
  
  // 數值限制
  TURNS: {
    MIN: 1,
    MAX: 100,
  },
  
  ORDER: {
    MIN: 1,
    MAX: 1000,
  },
  
  // 陣列長度限制
  UNITS_PER_PACKAGE: {
    MIN: 1,
    MAX: 50,
  },
  
  TAGS_PER_MEMORY: {
    MIN: 0,
    MAX: 10,
  },
  
  KEYWORDS_PER_CONDITION: {
    MIN: 1,
    MAX: 20,
  },
} as const;

// ================================
// API 路徑常數
// ================================
export const API_ROUTES = {
  COURSE_PACKAGES: '/api/course-packages',
  UNITS: '/api/units',
  AGENT_PROFILES: '/api/agent-profiles',
  MEMORIES: '/api/memories',
  ACTIVITIES: '/api/activities',
  INTERACTIONS: '/api/interactions',
  REPORTS: '/api/reports',
} as const;

// ================================
// 預設範例資料
// ================================
export const EXAMPLE_DATA = {
  AGENT_PERSONA: {
    SALES_CONSULTANT: {
      tone: '親切健談',
      background: '熟悉保養品知識並善於建立信任感',
      voice: '女性、約28歲、口氣溫柔',
    },
    CUSTOMER_SERVICE: {
      tone: '專業耐心',
      background: '豐富的客戶服務經驗，善於解決問題',
      voice: '中性、約30歲、語調穩重',
    },
  },
  
  PASS_CONDITIONS: {
    SKINCARE_KEYWORDS: ['乾', '沒擦', '穩定', '刺刺的', '保濕', '敏感'],
    SALES_KEYWORDS: ['考慮', '需要', '價格', '效果', '推薦'],
  },
} as const;
