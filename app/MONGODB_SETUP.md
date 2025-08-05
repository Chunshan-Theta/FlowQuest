# MongoDB 設置說明

本專案已成功連接到 MongoDB 數據庫。以下是設置和使用說明：

## 🚀 設置步驟

### 1. 啟動 MongoDB

#### 使用 Docker Compose（推薦）
```bash
# 在專案根目錄執行
make run local
# 或
docker compose up -d mongo
```

這會啟動一個帶有身份驗證的 MongoDB 實例：
- 用戶名：`admin`
- 密碼：`password123`
- 數據庫：`flowquest`

#### 使用 Docker 手動啟動
```bash
# 啟動帶身份驗證的 MongoDB 容器
docker run -d \
  --name flowquest-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  -e MONGO_INITDB_DATABASE=flowquest \
  mongo:7.0
```

#### 無身份驗證的本地 MongoDB
```bash
# 簡單的無身份驗證 MongoDB
docker run -d \
  --name flowquest-mongo-simple \
  -p 27017:27017 \
  mongo:7.0
```

#### 本地安裝
- macOS: `brew install mongodb-community`
- Windows: 下載 MongoDB Community Server
- Ubuntu: 參考 [MongoDB 官方安裝指南](https://docs.mongodb.com/manual/installation/)

### 2. 配置環境變數

在 `app/.env.local` 文件中設置：

```env
# 使用 Docker Compose 的 MongoDB（帶身份驗證）
MONGODB_URI=mongodb://admin:password123@localhost:27017/flowquest?authSource=admin
MONGODB_DB_NAME=flowquest

# 無身份驗證的本地 MongoDB
# MONGODB_URI=mongodb://localhost:27017
# MONGODB_DB_NAME=flowquest

# MongoDB Atlas（雲端）
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
# MONGODB_DB_NAME=flowquest
```

**重要提示**：
- 如果使用 `docker compose up -d mongo`，請使用帶身份驗證的連接字符串
- 如果使用無身份驗證的 MongoDB，請使用簡單的連接字符串
- `authSource=admin` 表示在 admin 數據庫中進行身份驗證

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
    memory_ids: [],
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
      "memory_ids": [],
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

1. **身份驗證錯誤 (Unauthorized)**
   ```
   MongoServerError: Command find requires authentication
   ```
   - 確認 `.env.local` 中的連接字符串包含用戶名和密碼
   - 使用：`mongodb://admin:password123@localhost:27017/flowquest?authSource=admin`
   - 確保 MongoDB 容器正在運行：`docker ps`

2. **連接失敗**
   - 確認 MongoDB 服務正在運行：`docker compose ps`
   - 檢查端口是否被占用：`lsof -i :27017`
   - 重啟 MongoDB 容器：`docker compose restart mongo`

3. **環境變數未加載**
   - 重啟 Next.js 開發服務器
   - 確認 `.env.local` 文件在 `app/` 目錄中
   - 檢查環境變數名稱拼寫

4. **ObjectId 錯誤**
   - 確保傳入的 ID 是 24 位十六進制字符串

5. **驗證錯誤**
   - 檢查請求數據格式
   - 確保必填字段不為空

### 💡 實用命令

```bash
# 檢查 MongoDB 容器狀態
docker compose ps

# 查看 MongoDB 日誌
docker compose logs mongo

# 重啟 MongoDB
docker compose restart mongo

# 進入 MongoDB 容器
docker exec -it flowquest-mongo mongosh -u admin -p password123

# 使用 MongoDB Express Web UI
open http://localhost:8081
# 用戶名：admin，密碼：admin123
```

現在您的 FlowQuest 應用已成功連接到 MongoDB！🎉
