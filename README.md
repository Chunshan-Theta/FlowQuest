# FlowQuest - AI 互動式學習平台

## 專案概述

FlowQuest 是一個基於 Next.js 的 AI 互動式學習平台，提供個性化的學習體驗和智能代理互動功能。

## 技術架構

- **前端框架**: Next.js 15 (App Router)
- **程式語言**: TypeScript
- **樣式框架**: Tailwind CSS
- **資料庫**: MongoDB
- **容器化**: Docker Compose

## 專案結構

```
FlowQuest/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── agents/            # Agent 管理頁面
│   │   ├── api/               # API 路由
│   │   └── globals.css        # 全域樣式
│   ├── components/            # React 元件
│   └── types/                 # TypeScript 型別定義
│       ├── base.ts            # 基礎型別
│       ├── agent.ts           # Agent 相關型別
│       ├── course-package.ts  # 課程包型別
│       ├── unit.ts            # 單元型別
│       ├── activity.ts        # 活動型別
│       ├── interaction.ts     # 互動記錄型別
│       ├── memory.ts          # 記憶體型別
│       └── report.ts          # 報告型別
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

- `agentProfiles` - Agent 檔案資料
- `coursePackages` - 課程包資料
- `units` - 學習單元資料
- `activities` - 學習活動記錄
- `agentMemories` - Agent 記憶體資料
- `interactionLogs` - 互動記錄
- `interactionReports` - 互動報告

## API 端點

### Agent 管理 API

- `GET /api/agents` - 取得所有 Agent
- `POST /api/agents` - 建立新 Agent
- `PUT /api/agents/[id]` - 更新 Agent
- `DELETE /api/agents/[id]` - 刪除 Agent

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

您好，現在來為您服務
很抱歉貴賓，耽誤到您寶貴的時間
沒問題感謝您的建議，尊貴的客人
是的沒問題，感謝您指導我們
沒問題現在為您點餐
沒問題那我這邊幫您取消您的漢堡 換成雞塊餐

好了～這邊是您的餐點～
，為了保持最好的品質我們都是現場處理的～ 很抱歉讓您久後了
