# FlowQuest 開發說明

## 啟動專案

### 1. 啟動資料庫服務

```bash
docker-compose up -d
```

這會啟動：
- MongoDB 資料庫 (localhost:27017)
- Mongo Express Web UI (localhost:8081)

### 2. 啟動開發伺服器

```bash
npm run dev
```

應用程式將在 http://localhost:3000 啟動

### 3. 存取管理介面

- **Agent 管理**: http://localhost:3000/agents
- **MongoDB 管理**: http://localhost:8081 (admin/admin123)

## 當前功能狀態

✅ **已完成**
- Next.js 15 框架設定
- 完整的 TypeScript 型別系統
- Agent CRUD 管理介面
- Docker MongoDB 服務

📋 **待開發**
- CoursePackage CRUD 介面
- Unit CRUD 介面  
- Activity CRUD 介面
- Memory CRUD 介面
- 實際 MongoDB 整合

## 下一步開發建議

1. **實際資料庫整合**
   ```bash
   npm install mongodb
   ```
   
2. **建立資料庫連接模組**
   - 替換 API 路由中的模擬資料
   - 實作真正的 CRUD 操作

3. **完善其他業務物件的 CRUD 介面**
   - 參考 `/src/app/agents` 的實作模式
   - 為每個業務物件建立對應介面

4. **加入認證系統**
   - 使用 NextAuth.js 或類似解決方案
