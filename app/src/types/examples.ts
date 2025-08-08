/**
 * FlowQuest - 範例資料
 * 展示如何使用定義的類型創建實例資料
 */

import {
  CoursePackage,
  CreateCoursePackageInput,
} from './course-package';

import {
  Unit,
  CreateUnitInput,
} from './unit';

import {
  AgentProfile,
  CreateAgentProfileInput,
} from './agent';

import {
  AgentMemory,
  CreateAgentMemoryInput,
} from './memory';

import {
  Activity,
  CreateActivityInput,
} from './activity';

import {
  InteractionLog,
  CreateInteractionLogInput,
} from './interaction';

import {
  InteractionReport,
} from './report';

import { generateObjectId } from './utils';

// ================================
// 範例 ObjectId
// ================================
const EXAMPLE_IDS = {
  COURSE_PACKAGE_1: generateObjectId(),
  UNIT_1: generateObjectId(),
  UNIT_2: generateObjectId(),
  UNIT_3: generateObjectId(),
  AGENT_PROFILE_1: generateObjectId(),
  MEMORY_1: generateObjectId(),
  MEMORY_2: generateObjectId(),
  MEMORY_3: generateObjectId(),
  USER_1: generateObjectId(),
  ACTIVITY_1: generateObjectId(),
  INTERACTION_1: generateObjectId(),
  REPORT_1: generateObjectId(),
} as const;

// ================================
// 範例課程包
// ================================
export const EXAMPLE_COURSE_PACKAGE: CoursePackage = {
  _id: EXAMPLE_IDS.COURSE_PACKAGE_1,
  title: "情境式銷售訓練",
  description: "透過三個關卡模擬保養品顧問的實際工作場景，提升銷售技巧與客戶互動能力",
  units: [], // 將在運行時填充實際的 Unit 物件
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
  memories: [],
};

// ================================
// 範例關卡
// ================================
export const EXAMPLE_UNITS: Unit[] = [
  {
    _id: EXAMPLE_IDS.UNIT_1,
    title: "關卡1：親切問候與膚況寒暄",
    course_package_id: EXAMPLE_IDS.COURSE_PACKAGE_1,
    agent_role: "保養品銷售諮詢專員",
    user_role: "顧客",
    intro_message: "最近天氣忽冷忽熱，妳上次買的亮白化妝水有繼續用嗎？",
    outro_message: "那妳最近感覺皮膚有比較穩定一點嗎？",
    max_turns: 5,
    agent_behavior_prompt: "請根據客戶膚況與產品使用狀況進行寒暄，保持親切溫暖的語調，關心客戶的肌膚狀況",
    pass_condition: {
      type: "keyword",
      value: ["乾", "沒擦", "穩定", "刺刺的", "保濕"]
    },
    order: 1,
    difficulty_level: 2,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  },
  {
    _id: EXAMPLE_IDS.UNIT_2,
    title: "關卡2：產品推薦與需求探詢",
    course_package_id: EXAMPLE_IDS.COURSE_PACKAGE_1,
    agent_role: "保養品銷售諮詢專員",
    user_role: "顧客",
    intro_message: "聽起來妳的肌膚需要加強保濕呢，我們最近有一款很受歡迎的保濕精華",
    outro_message: "這款產品很適合妳的膚況，要不要先試用看看？",
    max_turns: 8,
    agent_behavior_prompt: "根據客戶提到的肌膚問題，推薦合適的產品，探詢客戶的具體需求和預算",
    pass_condition: {
      type: "keyword",
      value: ["試用", "價格", "效果", "考慮", "需要"]
    },
    order: 2,
    difficulty_level: 3,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  },
  {
    _id: EXAMPLE_IDS.UNIT_3,
    title: "關卡3：促成交易與後續服務",
    course_package_id: EXAMPLE_IDS.COURSE_PACKAGE_1,
    agent_role: "保養品銷售諮詢專員",
    user_role: "顧客",
    intro_message: "太好了！我幫妳準備試用包，同時也介紹一下我們的會員優惠",
    outro_message: "歡迎隨時聯絡我，我會持續關心妳的肌膚狀況",
    max_turns: 6,
    agent_behavior_prompt: "協助客戶完成購買決定，介紹會員制度和後續服務，建立長期關係",
    pass_condition: {
      type: "keyword",
      value: ["購買", "會員", "聯絡", "服務", "滿意"]
    },
    order: 3,
    difficulty_level: 2,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  }
];

// ================================
// 範例記憶
// ================================
export const EXAMPLE_MEMORIES: AgentMemory[] = [
  {
    _id: EXAMPLE_IDS.MEMORY_1,
    agent_id: EXAMPLE_IDS.AGENT_PROFILE_1,
    type: "hot",
    content: "客戶提到最近熬夜工作導致皮膚狀況不穩定，容易出現乾燥和小痘痘",
    tags: ["膚況", "生活作息", "工作壓力", "乾燥", "痘痘"],
    created_by_user_id: EXAMPLE_IDS.USER_1,
    created_at: new Date('2024-01-01T10:00:00Z'),
  },
  {
    _id: EXAMPLE_IDS.MEMORY_2,
    agent_id: EXAMPLE_IDS.AGENT_PROFILE_1,
    type: "hot",
    content: "客戶對價格較為敏感，偏好CP值高的產品，預算約在1000-2000元",
    tags: ["預算", "價格敏感", "CP值"],
    created_by_user_id: EXAMPLE_IDS.USER_1,
    created_at: new Date('2024-01-01T10:15:00Z'),
  },
  {
    _id: EXAMPLE_IDS.MEMORY_3,
    agent_id: EXAMPLE_IDS.AGENT_PROFILE_1,
    type: "cold",
    content: "一般客戶在冬季較關注保濕產品，夏季則偏好控油和防曬",
    tags: ["季節性", "產品偏好", "保濕", "控油", "防曬"],
    created_by_user_id: EXAMPLE_IDS.USER_1,
    created_at: new Date('2024-01-01T00:00:00Z'),
  }
];

// ================================
// 範例代理人檔案
// ================================
export const EXAMPLE_AGENT_PROFILE: AgentProfile = {
  _id: EXAMPLE_IDS.AGENT_PROFILE_1,
  name: "保養品銷售專員小美",
  persona: {
    tone: "親切健談、專業溫暖",
    background: "擁有5年保養品銷售經驗，熟悉各種肌膚類型和產品特性，善於建立客戶信任感",
    voice: "女性、約28歲、語調溫柔但充滿自信"
  },
  memories: [EXAMPLE_MEMORIES[0], EXAMPLE_MEMORIES[1]],
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

// ================================
// 範例活動
// ================================
export const EXAMPLE_ACTIVITY: Activity = {
  _id: EXAMPLE_IDS.ACTIVITY_1,
  name: "化妝技巧學習活動",
  course_package_id: EXAMPLE_IDS.COURSE_PACKAGE_1,
  agent_profile_id: EXAMPLE_IDS.AGENT_PROFILE_1,
  current_unit_id: EXAMPLE_IDS.UNIT_1,
  status: "online",
  memories: [EXAMPLE_MEMORIES[0], EXAMPLE_MEMORIES[1]],
  created_at: new Date('2024-01-01T10:00:00Z'),
  updated_at: new Date('2024-01-01T10:00:00Z'),
};

// ================================
// 範例互動記錄
// ================================
export const EXAMPLE_INTERACTION_LOGS: InteractionLog[] = [
  {
    _id: EXAMPLE_IDS.INTERACTION_1,
    activity_id: EXAMPLE_IDS.ACTIVITY_1,
    unit_id: EXAMPLE_IDS.UNIT_1,
    user_id: EXAMPLE_IDS.USER_1,
    turn_index: 0,
    user_message: "最近工作比較忙，有時候會忘記保養",
    agent_response: "了解～工作忙碌確實容易忽略保養呢！不過妳上次買的亮白化妝水還有在用嗎？",
    memory_references: [EXAMPLE_IDS.MEMORY_1],
    timestamp: new Date('2024-01-01T10:00:00Z'),
  }
];

// ================================
// 範例報告
// ================================
export const EXAMPLE_INTERACTION_REPORT: InteractionReport = {
  _id: EXAMPLE_IDS.REPORT_1,
  activity_id: EXAMPLE_IDS.ACTIVITY_1,
  user_id: EXAMPLE_IDS.USER_1,
  summary: "該使用者在與保養諮詢agent互動過程中，展現出對產品品質的重視以及價格敏感度。透過三個關卡的對話，成功建立信任關係並完成產品推薦。使用者主要關注保濕需求，對試用體驗表示興趣。",
  unit_results: [
    {
      unit_id: EXAMPLE_IDS.UNIT_1,
      status: "passed",
      turn_count: 3,
      important_keywords: ["忙", "保養", "乾"]
    },
    {
      unit_id: EXAMPLE_IDS.UNIT_2,
      status: "passed",
      turn_count: 5,
      important_keywords: ["保濕", "試用", "價格"]
    },
    {
      unit_id: EXAMPLE_IDS.UNIT_3,
      status: "passed",
      turn_count: 4,
      important_keywords: ["會員", "服務", "滿意"]
    }
  ],
  generated_at: new Date('2024-01-01T11:00:00Z'),
};

// ================================
// 創建資料的範例輸入
// ================================
export const EXAMPLE_CREATE_INPUTS = {
  COURSE_PACKAGE: {
    title: "新手化妝技巧訓練",
    description: "專為化妝新手設計的互動式學習課程",
    units: [],
    memories: [],
  } as CreateCoursePackageInput,

  UNIT: {
    title: "基礎底妝技巧",
    course_package_id: EXAMPLE_IDS.COURSE_PACKAGE_1,
    agent_role: "化妝師",
    user_role: "學員",
    intro_message: "今天我們來學習如何打造自然透亮的底妝",
    outro_message: "恭喜你完成了底妝技巧的學習！",
    max_turns: 10,
    agent_behavior_prompt: "以專業但友善的方式指導學員學習化妝技巧",
    pass_condition: {
      type: "keyword",
      value: ["粉底", "遮瑕", "定妝"]
    },
    order: 1,
  } as CreateUnitInput,

  AGENT_PROFILE: {
    name: "專業化妝師",
    persona: {
      tone: "專業友善",
      background: "擁有多年化妝教學經驗",
      voice: "溫和耐心的指導者"
    },
    memories: [],
  } as CreateAgentProfileInput,

  AGENT_MEMORY: {
    agent_id: EXAMPLE_IDS.AGENT_PROFILE_1,
    type: "hot" as const,
    content: "學員是化妝新手，需要從基礎開始教學",
    tags: ["新手", "基礎教學"],
    created_by_user_id: EXAMPLE_IDS.USER_1,
  } as CreateAgentMemoryInput,

  ACTIVITY: {
    name: "化妝技巧學習活動",
    course_package_id: EXAMPLE_IDS.COURSE_PACKAGE_1,
    agent_profile_id: EXAMPLE_IDS.AGENT_PROFILE_1,
    current_unit_id: EXAMPLE_IDS.UNIT_1,
    status: "online" as const,
    memories: [],
  } as CreateActivityInput,

  INTERACTION_LOG: {
    activity_id: EXAMPLE_IDS.ACTIVITY_1,
    unit_id: EXAMPLE_IDS.UNIT_1,
    user_id: EXAMPLE_IDS.USER_1,
    turn_index: 0,
    user_message: "我是化妝新手，請問該從哪裡開始？",
    agent_response: "歡迎！我們先從最基礎的底妝開始學習吧～",
    memory_references: [],
  } as CreateInteractionLogInput,
} as const;

// ================================
// 匯出所有範例資料
// ================================

// 完整的課程包（包含所有 units）
export const EXAMPLE_COMPLETE_COURSE_PACKAGE: CoursePackage = {
  ...EXAMPLE_COURSE_PACKAGE,
  units: EXAMPLE_UNITS,
};

export const EXAMPLES = {
  IDS: EXAMPLE_IDS,
  COURSE_PACKAGE: EXAMPLE_COURSE_PACKAGE,
  COMPLETE_COURSE_PACKAGE: EXAMPLE_COMPLETE_COURSE_PACKAGE,
  UNITS: EXAMPLE_UNITS,
  AGENT_PROFILE: EXAMPLE_AGENT_PROFILE,
  MEMORIES: EXAMPLE_MEMORIES,
  ACTIVITY: EXAMPLE_ACTIVITY,
  INTERACTION_LOGS: EXAMPLE_INTERACTION_LOGS,
  INTERACTION_REPORT: EXAMPLE_INTERACTION_REPORT,
  CREATE_INPUTS: EXAMPLE_CREATE_INPUTS,
} as const;
