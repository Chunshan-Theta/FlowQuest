# FlowQuest 聊天功能

## 概述

FlowQuest 現在支援與 AI Agent 進行互動式對話，讓用戶可以透過對話方式完成學習關卡。

## 功能特色

### 🤖 AI Agent 對話
- 使用可設定的 OpenAI 模型（預設：gpt-4o / gpt-4o-mini）
- 根據 Agent 設定的人格特質進行對話
- 結合活動記憶內容提供個性化體驗

### 📚 關卡式學習
- 按照課程包中的單元順序進行
- 自動檢測關卡完成條件
- 支援關鍵詞和 LLM 判斷兩種通過條件

### 💾 對話記錄保存
- 所有對話歷程自動保存在 localStorage
- 支援繼續之前的對話
- 可重新開始聊天

### 🎯 進度追蹤
- 視覺化顯示學習進度
- 自動引導到下一個關卡
- 完成所有關卡時顯示通關祝賀

## 使用方式

### 1. 環境設定

確保在 `.env.local` 文件中設定以下環境變數：

```bash
# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=flowquest

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. 開始對話

1. 進入活動詳情頁面
2. 點擊「💬 開始對話」按鈕
3. 在聊天介面中輸入訊息與 Agent 對話
4. 根據關卡要求完成對話任務

### 3. 關卡通過條件

系統支援兩種通過條件：

#### 關鍵詞檢查 (keyword)
- 用戶訊息中必須包含指定的所有關鍵詞
- 不區分大小寫

#### LLM 判斷 (llm)
- 使用 AI 模型判斷對話是否滿足通過條件
- 更靈活的判斷邏輯

## 技術架構

### API 端點

#### POST /api/chat
處理聊天請求，返回 AI 回應和進度狀態。

**請求格式：**
```typescript
{
  activity_id: string;
  message: string;
  session_data?: ChatSession;
}
```

**回應格式：**
```typescript
{
  message: string;
  is_unit_completed: boolean;
  next_unit_id?: string;
  is_course_completed: boolean;
  session_data: ChatSession;
}
```

### 資料結構

#### ChatSession
```typescript
{
  activity_id: string;
  current_unit_id: string;
  messages: ChatMessage[];
  current_turn: number;
  is_completed: boolean;
  started_at: Date;
  updated_at: Date;
}
```

#### ChatMessage
```typescript
{
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  unit_id?: string;
}
```

### React Hook

#### useChat()
提供聊天功能的核心邏輯：

- `sendMessage()` - 發送訊息
- `loadChatSession()` - 載入聊天會話
- `saveChatSession()` - 儲存聊天會話
- `restartChat()` - 重新開始聊天
- `getAllChatSessions()` - 取得所有聊天會話

## 頁面結構

- `/activities/[id]/chat` - 聊天頁面
- 在活動詳情頁面新增「開始對話」按鈕

## 注意事項

1. **OpenAI API 配額**：請確保有足夠的 API 配額
2. **網路連線**：聊天功能需要穩定的網路連線
3. **瀏覽器支援**：使用 localStorage，需要現代瀏覽器支援
4. **對話記錄**：清除瀏覽器資料會遺失對話記錄

## 未來改進

- [ ] 支援語音輸入和輸出
- [ ] 增加對話摘要功能
- [ ] 支援多媒體訊息
- [ ] 增加對話分析和學習報告
- [ ] 支援離線模式
