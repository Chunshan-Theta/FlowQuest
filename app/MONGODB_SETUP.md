# MongoDB 設置說明

本專案已成功連接到 MongoDB 數據庫。以下是設置和使用說明：

## 🚀 設置步驟

### 1. 安裝 MongoDB

#### 使用 Docker（推薦）
```bash
# 啟動 MongoDB 容器
docker run -d \
  --name flowquest-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=flowquest \
  mongo:latest
```

#### 本地安裝
- macOS: `brew install mongodb-community`
- Windows: 下載 MongoDB Community Server
- Ubuntu: 參考 [MongoDB 官方安裝指南](https://docs.mongodb.com/manual/installation/)

### 2. 配置環境變數

在 `app/.env.local` 文件中設置：

```env
# 本地 MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=flowquest

# 或 MongoDB Atlas（雲端）
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
# MONGODB_DB_NAME=flowquest
```

### 3. 測試連接

啟動開發服務器後，訪問以下端點測試連接：

```bash
# 測試數據庫連接
curl http://localhost:3000/api/db/test

# 測試連接並初始化數據
curl http://localhost:3000/api/db/test?init=true
```

## 📊 API 端點

### Agents API

| 方法 | 端點 | 功能 |
|------|------|------|
| GET | `/api/agents` | 獲取所有 agents |
| GET | `/api/agents?name=xxx` | 按名稱搜尋 agents |
| POST | `/api/agents` | 創建新 agent |
| GET | `/api/agents/[id]` | 獲取單一 agent |
| PUT | `/api/agents/[id]` | 更新 agent |
| DELETE | `/api/agents/[id]` | 刪除 agent |

### 數據庫測試 API

| 方法 | 端點 | 功能 |
|------|------|------|
| GET | `/api/db/test` | 測試數據庫連接 |
| GET | `/api/db/test?init=true` | 測試連接並初始化數據 |

## 🔧 數據結構

### AgentProfile Collection

```javascript
{
  _id: "ObjectId字符串",
  name: "Agent名稱",
  persona: {
    tone: "語調描述",
    background: "背景描述", 
    voice: "聲音描述"
  },
  memory_config: {
    hot_memory_ids: [],
    cold_memory_ids: []
  },
  created_at: "創建時間",
  updated_at: "更新時間"
}
```

## 🛠️ 主要變更

1. **MongoDB 連接配置** (`src/lib/mongodb.ts`)
   - 支持開發和生產環境
   - 連接池管理
   - 錯誤處理

2. **API 路由重構**
   - `/api/agents/route.ts` - 使用 MongoDB 查詢
   - `/api/agents/[id]/route.ts` - 使用 MongoDB 操作

3. **數據庫初始化** (`src/lib/init-db.ts`)
   - 自動創建索引
   - 插入初始數據

4. **類型系統改進**
   - 真正的 MongoDB ObjectId 生成
   - 保持類型安全

## 🔍 使用範例

### 創建新 Agent

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "客服助手",
    "persona": {
      "tone": "友善專業",
      "background": "具備豐富客服經驗", 
      "voice": "溫暖、耐心"
    },
    "memory_config": {
      "hot_memory_ids": [],
      "cold_memory_ids": []
    }
  }'
```

### 獲取所有 Agents

```bash
curl http://localhost:3000/api/agents
```

### 搜尋 Agents

```bash
curl "http://localhost:3000/api/agents?name=客服"
```

## 🚨 故障排除

1. **連接失敗**
   - 確認 MongoDB 服務正在運行
   - 檢查環境變數設置
   - 確認防火牆設置

2. **ObjectId 錯誤**
   - 確保傳入的 ID 是 24 位十六進制字符串

3. **驗證錯誤**
   - 檢查請求數據格式
   - 確保必填字段不為空

現在您的 FlowQuest 應用已成功連接到 MongoDB！🎉
