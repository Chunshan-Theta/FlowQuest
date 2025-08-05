# Agent CRUD API 測試

這個測試套件確保 Agent CRUD API 的輸入輸出保持一致性。

## 測試結構

```
src/__tests__/
├── setup.ts                           # Jest 全局設置
├── jest.d.ts                         # Jest 類型定義
├── validation.test.ts                # 數據驗證功能測試
├── api/
│   └── agents/
│       ├── route.test.ts             # Agent 集合 API 測試 (GET, POST)
│       └── [id]/
│           └── route.test.ts         # Agent 單項 API 測試 (GET, PUT, DELETE)
└── integration/
    └── agents-crud.test.ts           # 完整 CRUD 流程整合測試
```

## 測試範圍

### 1. 單項操作測試 (`api/agents/[id]/route.test.ts`)
- **GET /api/agents/[id]**: 獲取單個 agent
- **PUT /api/agents/[id]**: 更新 agent
- **DELETE /api/agents/[id]**: 刪除 agent

測試要點：
- ✅ 成功案例的響應格式
- ✅ 錯誤處理 (400, 404, 500)
- ✅ 輸入驗證
- ✅ 資料結構一致性

### 2. 集合操作測試 (`api/agents/route.test.ts`)
- **GET /api/agents**: 獲取 agent 列表
- **POST /api/agents**: 創建新 agent

測試要點：
- ✅ 列表獲取與搜尋功能
- ✅ 創建操作的輸入輸出一致性
- ✅ 自動生成欄位 (_id, created_at, updated_at)
- ✅ 響應格式統一性

### 3. 數據驗證測試 (`validation.test.ts`)
- **validateAgentProfile**: 代理人資料驗證
- **isValidObjectId**: ObjectId 格式驗證
- **formatValidationErrors**: 錯誤訊息格式化

測試要點：
- ✅ 必填欄位驗證
- ✅ 資料格式驗證
- ✅ 嵌套物件驗證
- ✅ 錯誤訊息一致性

### 4. 整合測試 (`integration/agents-crud.test.ts`)
- **完整 CRUD 流程**: CREATE → READ → UPDATE → DELETE
- **錯誤處理一致性**
- **資料類型一致性**

測試要點：
- ✅ 端到端資料流一致性
- ✅ 時間戳格式統一
- ✅ ObjectId 格式統一
- ✅ 錯誤響應格式統一

## 輸入輸出一致性驗證

### 1. 資料結構一致性
```typescript
// 輸入格式 (CreateAgentProfileInput)
{
  name: string;
  persona: {
    tone: string;
    background: string;
    voice: string;
  };
  memory_config: {
    memory_ids: AgentMemory[];
    cold_memory_ids: AgentMemory[];
  };
}

// 輸出格式 (AgentProfile)
{
  _id: ObjectId;           // 系統自動生成
  name: string;            // 保持輸入值
  persona: {...};          // 保持輸入結構
  memory_config: {...};    // 保持輸入結構
  created_at: Date;        // 系統自動生成
  updated_at: Date;        // 系統自動生成
}
```

### 2. 響應格式一致性
所有 API 響應都遵循統一格式：
```typescript
// 成功響應
{
  success: true;
  data: T;               // 實際資料
  message: string;       // 成功訊息
}

// 錯誤響應
{
  success: false;
  error: string;         // 錯誤類型
  message: string;       // 詳細錯誤訊息
}
```

### 3. 時間戳一致性
- `created_at`: 創建時設定，之後不變
- `updated_at`: 每次更新時自動更新
- 格式：ISO 8601 日期字串

### 4. ObjectId 一致性
- 格式：24 位十六進制字串
- 在所有操作中保持格式統一
- 自動驗證格式有效性

## 運行測試

```bash
# 運行所有測試
npm test

# 運行特定測試文件
npm test -- validation.test.ts
npm test -- api/agents/route.test.ts
npm test -- api/agents/[id]/route.test.ts
npm test -- integration/agents-crud.test.ts

# 運行測試並監視變化
npm run test:watch

# 運行測試並生成覆蓋率報告
npm test -- --coverage
```

## 測試覆蓋範圍

- ✅ **路由處理**: 所有 CRUD 操作
- ✅ **輸入驗證**: 所有必填欄位和格式驗證
- ✅ **錯誤處理**: 400, 404, 500 錯誤情況
- ✅ **資料庫操作**: 模擬 MongoDB 操作
- ✅ **邊界情況**: 空值、無效格式、過長輸入
- ✅ **一致性檢查**: 輸入輸出格式、時間戳、ObjectId

## 注意事項

1. **模擬環境**: 測試使用 Jest mock 模擬 MongoDB 連接
2. **類型安全**: 所有測試都有完整的 TypeScript 類型檢查
3. **隔離性**: 每個測試之間完全隔離，避免相互影響
4. **真實性**: 測試案例盡可能模擬真實使用場景
