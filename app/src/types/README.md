# FlowQuest 類型系統

## 📁 文件結構

FlowQuest 的類型定義已經按照業務邏輯分成多個檔案，便於維護和擴充：

```
src/types/
├── index.ts              # 主要入口檔案，統一匯出所有類型
├── base.ts               # 基本類型定義（ObjectId、API響應格式等）
├── course-package.ts     # 課程包相關類型
├── unit.ts               # 關卡相關類型
├── agent.ts              # Agent 代理人相關類型
├── activity.ts           # 活動實例相關類型
├── interaction.ts        # 互動記錄相關類型
├── report.ts             # 報告相關類型
├── constants.ts          # 常數定義（枚舉值、錯誤訊息等）
├── utils.ts              # 工具函數（驗證、轉換等）
└── examples.ts           # 範例資料
```

## 🎯 使用方式

### 1. 導入所有類型（推薦）
```typescript
import { CoursePackage, Unit, AgentProfile } from '@/types';
```

### 2. 導入特定模組
```typescript
import { CoursePackage, CreateCoursePackageInput } from '@/types/course-package';
import { Unit, PassCondition } from '@/types/unit';
import { AgentProfile } from '@/types/agent';
import { AgentMemory } from '@/types/memory';
```

### 3. 導入工具函數
```typescript
import { validateCoursePackage, generateObjectId } from '@/types/utils';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/types/constants';
```

## 🏗️ 主要類型

### 基本類型 (`base.ts`)
- `ObjectId` - MongoDB ObjectId 字串表示
- `ApiResponse<T>` - API 響應格式
- `PaginatedResponse<T>` - 分頁資料格式

### 課程包 (`course-package.ts`)
- `CoursePackage` - 課程包主要介面
- `CreateCoursePackageInput` - 創建課程包輸入格式
- `UpdateCoursePackageInput` - 更新課程包輸入格式
- `CoursePackageFilter` - 查詢過濾器

### 關卡 (`unit.ts`)
- `Unit` - 關卡主要介面
- `PassCondition` - 通過條件
- `PassConditionType` - 通過條件類型
- `CreateUnitInput` - 創建關卡輸入格式
- `UpdateUnitInput` - 更新關卡輸入格式
- `UnitFilter` - 查詢過濾器

### Agent 代理人 (`agent.ts`)
- `AgentProfile` - 代理人檔案
- `AgentPersona` - 代理人人格設定
- `AgentMemory` - 代理人記憶
- `MemoryType` - 記憶類型（hot/cold）
- `MemoryConfig` - 記憶配置
- 相關的 Create/Update 輸入格式

### 活動 (`activity.ts`)
- `Activity` - 活動實例
- `ActivityStatus` - 活動狀態
- `CreateActivityInput` - 創建活動輸入格式
- `UpdateActivityInput` - 更新活動輸入格式
- `ActivityFilter` - 查詢過濾器

### 互動 (`interaction.ts`)
- `InteractionLog` - 互動記錄
- `CreateInteractionLogInput` - 創建互動記錄輸入格式
- `InteractionLogFilter` - 查詢過濾器

### 報告 (`report.ts`)
- `InteractionReport` - 互動報告
- `UnitResult` - 關卡結果
- `UnitResultStatus` - 關卡結果狀態
- `CreateInteractionReportInput` - 創建報告輸入格式

## 🛠️ 工具函數 (`utils.ts`)

### 類型守衛
- `isValidObjectId()` - 檢查 ObjectId 格式
- `isValidActivityStatus()` - 檢查活動狀態
- `isValidMemoryType()` - 檢查記憶類型
- `isValidPassConditionType()` - 檢查通過條件類型
- `isValidUnitResultStatus()` - 檢查關卡結果狀態

### 驗證函數
- `validateCoursePackage()` - 驗證課程包資料
- `validateUnit()` - 驗證關卡資料
- `validateAgentProfile()` - 驗證代理人檔案
- `validateAgentMemory()` - 驗證記憶資料
- `validateActivity()` - 驗證活動資料
- `validateInteractionLog()` - 驗證互動記錄

### 工具函數
- `generateObjectId()` - 生成新的 ObjectId
- `sanitizeString()` - 清理字串
- `sanitizeTags()` - 清理標籤陣列
- `formatValidationErrors()` - 格式化錯誤訊息

## 📊 常數定義 (`constants.ts`)

### 狀態常數
- `ACTIVITY_STATUS` - 活動狀態
- `MEMORY_TYPE` - 記憶類型
- `PASS_CONDITION_TYPE` - 通過條件類型
- `UNIT_RESULT_STATUS` - 關卡結果狀態

### 配置常數
- `DEFAULT_CONFIG` - 預設配置
- `VALIDATION_RULES` - 驗證規則
- `API_ROUTES` - API 路徑

### 訊息常數
- `ERROR_MESSAGES` - 錯誤訊息
- `SUCCESS_MESSAGES` - 成功訊息

### 範例資料
- `EXAMPLE_DATA` - 範例資料模板

## 📝 範例資料 (`examples.ts`)

提供完整的範例資料，包括：
- 範例課程包：情境式銷售訓練
- 範例關卡：三個互動關卡
- 範例代理人：保養品銷售專員
- 範例記憶：客戶偏好和行為記錄
- 範例活動：完整的學習流程
- 範例互動記錄：真實對話範例
- 範例報告：學習成果分析

## 🚀 擴充指南

### 添加新的業務類型
1. 在 `src/types/` 目錄下創建新的 `.ts` 檔案
2. 定義相關的介面和類型
3. 在 `index.ts` 中添加 `export * from './new-file'`
4. 在 `utils.ts` 中添加相關的驗證函數
5. 在 `constants.ts` 中添加相關常數
6. 在 `examples.ts` 中添加範例資料

### 修改現有類型
1. 直接修改對應的 `.ts` 檔案
2. 更新相關的驗證函數
3. 更新範例資料
4. 確保所有匯入該類型的檔案都能正常編譯

### 最佳實踐
- 保持每個檔案的職責單一
- 使用有意義的檔案名稱
- 為新類型添加對應的工具函數
- 保持範例資料的更新
- 添加適當的 TypeScript 註解
