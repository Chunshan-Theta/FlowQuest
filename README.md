# FlowQuest - AI 互動式學習平台

## 專案概述

FlowQuest 是一個基於 Next.js 的 AI 通關式對話互動平台。使用者可透過關卡化（通關）對話完成任務與學習；系統內建多層次的資訊與記憶管理（活動/單元/課程包/Agent/會話、長短期記憶），並可彙整與查閱整體結果/報告；同時提供視覺化介面與 API 雙通道操作。

- 通關式對話流程：以活動→→關卡→→Agent為主線，逐步包裹學習內容
- 多層次資訊/記憶：支援活動、單元、課程包、Agent 的長短期記憶
- 總體結果查閱：提供對話紀錄彙整與互動報告
- 介面與 API：可透過 Web 介面操作，或呼叫 API 端點整合到其他系統

## 技術架構

- **前端框架**: Next.js 15 (App Router)
- **程式語言**: TypeScript
- **樣式框架**: Tailwind CSS
- **資料庫**: MongoDB
- **容器化**: Docker Compose

## 專案結構

```
FlowQuest/
├── app/
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── agents/            # Agent 管理頁面
│   │   │   ├── api/               # API 路由
│   │   │   └── globals.css        # 全域樣式
│   │   ├── components/            # React 元件
│   │   └── types/                 # TypeScript 型別定義
│   │       ├── base.ts            # 基礎型別
│   │       ├── agent.ts           # Agent 相關型別
│   │       ├── course-package.ts  # 課程包型別
│   │       ├── unit.ts            # 單元型別
│   │       ├── activity.ts        # 活動型別
│   │       ├── interaction.ts     # 互動記錄型別
│   │       ├── memory.ts          # 記憶體型別
│   ├── package.json
├── docker-compose.yml         # Docker 服務配置
├── mongo-init/               # MongoDB 初始化腳本
└── README.md                 # 專案說明
```

## 功能特色

### 已實現功能

1. **Agent 管理系統**
   - ✅ 建立、編輯、刪除 Agent 檔案
   - ✅ Agent 個性化設定 (語調、背景、聲音)
   - ✅ 記憶體配置管理

2. **型別系統**
   - ✅ 完整的 TypeScript 型別定義
   - ✅ 模組化架構，便於擴展
   - ✅ 資料驗證函數

3. **開發環境**
   - ✅ Docker Compose 設定
   - ✅ MongoDB 資料庫服務
   - ✅ Mongo Express Web UI

### 規劃功能

- 📋 課程包管理 (CoursePackage CRUD)
- 📋 學習單元管理 (Unit CRUD) 
- 📋 活動記錄管理 (Activity CRUD)
- 📋 記憶體管理 (Memory CRUD)
- 📋 互動報告系統
- 📋 用戶認證系統
- 📋 學習進度追蹤

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發環境

```bash
# 啟動 MongoDB 服務
docker-compose up -d

# 啟動 Next.js 開發伺服器
npm run dev
```

### 3. 存取應用程式

- **主應用程式**: http://localhost:3000
- **MongoDB Web UI**: http://localhost:8081
  - 用戶名稱: admin
  - 密碼: admin123

## 資料庫設定

### MongoDB 連接資訊

- **連接字串**: `mongodb://flowquest_user:flowquest_password@localhost:27017/flowquest`
- **資料庫名稱**: flowquest
- **用戶名稱**: flowquest_user
- **密碼**: flowquest_password

### 資料庫集合

- `agents` - Agent 檔案資料
- `course_packages` - 課程包資料
- `units` - 學習單元資料
- `activities` - 活動資料
- `sessions` - 會話資料

## API 端點

### Agent 管理 API

- `GET /api/agents` - 取得所有 Agent
- `POST /api/agents` - 建立新 Agent
- `PUT /api/agents/[id]` - 更新 Agent
- `DELETE /api/agents/[id]` - 刪除 Agent

### API 快速啟動與測試

前置條件：已設定環境變數 `OPENAI_API_KEY`、`MONGODB_URI`、`MONGODB_DB_NAME`，並啟動服務。

```bash
# 啟動 MongoDB 與開發伺服器
docker-compose up -d
npm run dev
```

0) 先建立 Agent、課程包、關卡、活動（互動前置）

- 建立 Agent
```bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "客服助理A",
    "persona": {"tone":"friendly","background":"客服專員","voice":"female"},
    "memories": []
  }'
```

- 建立課程包（取得 `course_package_id`）
```bash
curl -s -X POST http://localhost:3000/api/course-packages \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新手上路",
    "description": "導覽與開場"
  }'
```

- 建立關卡（至少一關；`course_package_id` 需替換）
```bash
curl -s -X POST http://localhost:3000/api/units \
  -H "Content-Type: application/json" \
  -d '{
    "title": "開場問候",
    "course_package_id": "YOUR_COURSE_PACKAGE_ID",
    "agent_role": "客服",
    "user_role": "顧客",
    "intro_message": "嗨，很高興為你服務！",
    "outro_message": "本關卡結束，繼續下一步吧。",
    "max_turns": 5,
    "agent_behavior_prompt": "保持友善、簡潔與明確。",
    "pass_condition": {"type": "keyword", "value": ["你好", "開始"]},
    "order": 1,
    "difficulty_level": 1
  }'
```

- 建立活動（綁定 `agent_profile_id` 與 `course_package_id`）
```bash
curl -s -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "導覽活動",
    "course_package_id": "YOUR_COURSE_PACKAGE_ID",
    "agent_profile_id": "YOUR_AGENT_ID"
  }'
```

1) 測試資料庫連線/初始化
```bash
curl -s "http://localhost:3000/api/db/test"
curl -s "http://localhost:3000/api/db/test?init=true"
```

2) 初始化互動 Session（通關流程起點）
```bash
curl -s -X POST http://localhost:3000/api/interactions/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": "YOUR_ACTIVITY_ID",
    "session_id": "test-session-001",
    "user_id": "demo-user",
    "user_name": "Demo"
  }'
```

3) 進行關卡式對話
```bash
curl -s -X POST http://localhost:3000/api/interactions/chat \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": "YOUR_ACTIVITY_ID",
    "session_id": "test-session-001",
    "user_id": "demo-user",
    "message": "嗨，開始吧"
  }'
```

4) 檢視 Session 結果（包含單元進度、對話日誌、判定等）
```bash
curl -s "http://localhost:3000/api/sessions?activity_id=YOUR_ACTIVITY_ID&session_id=test-session-001"
```

5) 簡易聊天 API（非通關流程）
```bash
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role":"user","content":"說個笑話"}
    ],
    "max_tokens": 200,
    "temperature": 0.7
  }'
```

## 開發指南

### 新增型別定義

1. 在 `src/types/` 目錄下建立新的型別檔案
2. 匯出型別定義和驗證函數
3. 在 `src/types/index.ts` 中匯出新型別

### 建立新的 CRUD 介面

1. 在 `src/app/` 下建立新資料夾
2. 實作 React 元件和狀態管理
3. 建立對應的 API 路由

### 資料庫操作

目前使用模擬資料，計劃整合實際 MongoDB 連接：

1. 安裝 MongoDB 驅動程式: `npm install mongodb`
2. 建立資料庫連接模組
3. 更新 API 路由以使用實際資料庫

## 貢獻指南

1. Fork 此專案
2. 建立功能分支: `git checkout -b feature/新功能`
3. 提交變更: `git commit -am '新增某功能'`
4. 推送分支: `git push origin feature/新功能`
5. 建立 Pull Request

## 授權

此專案採用 MIT 授權條款。

## 聯絡資訊

如有任何問題或建議，請開啟 Issue 進行討論。
