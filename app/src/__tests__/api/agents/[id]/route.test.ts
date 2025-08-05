/**
 * Agent API CRUD 測試
 * 確保輸入輸出保持一致性
 */

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/agents/[id]/route';
import { AgentProfile } from '@/types';

// 模擬 MongoDB 集合操作
const mockCollection = {
  findOne: jest.fn(),
  replaceOne: jest.fn(),
  deleteOne: jest.fn(),
};

// 模擬 MongoDB 連接
jest.mock('@/lib/mongodb', () => ({
  getAgentsCollection: jest.fn(() => Promise.resolve(mockCollection)),
}));

// 測試數據
const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
const INVALID_OBJECT_ID = 'invalid-id';

const MOCK_AGENT: AgentProfile = {
  _id: VALID_OBJECT_ID,
  name: '測試代理人',
  persona: {
    tone: '友善親切',
    background: '專業銷售顧問',
    voice: '溫暖的女性聲音'
  },
  memory_config: {
    hot_memory_ids: [],
    cold_memory_ids: []
  },
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

// API 返回的數據格式（日期是字串）
const MOCK_AGENT_RESPONSE = {
  _id: VALID_OBJECT_ID,
  name: '測試代理人',
  persona: {
    tone: '友善親切',
    background: '專業銷售顧問',
    voice: '溫暖的女性聲音'
  },
  memory_config: {
    hot_memory_ids: [],
    cold_memory_ids: []
  },
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const UPDATED_AGENT_DATA = {
  name: '更新後的代理人',
  persona: {
    tone: '專業嚴謹',
    background: '資深客服專員',
    voice: '穩重的男性聲音'
  }
};

describe('Agent API CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/agents/[id]', () => {
    test('應該成功獲取存在的 agent', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(MOCK_AGENT);
      const request = new NextRequest('http://localhost:3000/api/agents/' + VALID_OBJECT_ID);
      const params = Promise.resolve({ id: VALID_OBJECT_ID });

      // 執行
      const response = await GET(request, { params });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(MOCK_AGENT_RESPONSE);
      expect(data.message).toBe('成功獲取 Agent 詳情');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
    });

    test('應該返回 400 錯誤當 ID 格式無效', async () => {
      // 準備
      const request = new NextRequest('http://localhost:3000/api/agents/' + INVALID_OBJECT_ID);
      const params = Promise.resolve({ id: INVALID_OBJECT_ID });

      // 執行
      const response = await GET(request, { params });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('ID 格式無效');
      expect(data.message).toBe('請提供有效的 Agent ID');
      expect(mockCollection.findOne).not.toHaveBeenCalled();
    });

    test('應該返回 404 錯誤當 agent 不存在', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/agents/' + VALID_OBJECT_ID);
      const params = Promise.resolve({ id: VALID_OBJECT_ID });

      // 執行
      const response = await GET(request, { params });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到 Agent');
      expect(data.message).toBe(`ID 為 ${VALID_OBJECT_ID} 的 Agent 不存在`);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
    });
  });

  describe('PUT /api/agents/[id]', () => {
    test('應該成功更新存在的 agent', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(MOCK_AGENT);
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });
      
      const request = new NextRequest('http://localhost:3000/api/agents/' + VALID_OBJECT_ID, {
        method: 'PUT',
        body: JSON.stringify(UPDATED_AGENT_DATA),
        headers: { 'Content-Type': 'application/json' }
      });
      const params = Promise.resolve({ id: VALID_OBJECT_ID });

      // 執行
      const response = await PUT(request, { params });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data._id).toBe(VALID_OBJECT_ID);
      expect(data.data.name).toBe(UPDATED_AGENT_DATA.name);
      expect(data.data.persona).toEqual(UPDATED_AGENT_DATA.persona);
      expect(typeof data.data.updated_at).toBe('string');
      expect(new Date(data.data.updated_at)).toBeInstanceOf(Date);
      expect(data.message).toBe('成功更新 Agent');
      
      // 驗證資料庫調用
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
      expect(mockCollection.replaceOne).toHaveBeenCalledWith(
        { _id: VALID_OBJECT_ID },
        expect.objectContaining({
          _id: VALID_OBJECT_ID,
          name: UPDATED_AGENT_DATA.name,
          persona: UPDATED_AGENT_DATA.persona,
          updated_at: expect.any(Date)
        })
      );
    });

    test('應該返回 400 錯誤當輸入資料無效', async () => {
      // 準備
      const invalidData = { name: '' }; // 空名稱應該導致驗證失敗
      mockCollection.findOne.mockResolvedValue(MOCK_AGENT);
      
      const request = new NextRequest('http://localhost:3000/api/agents/' + VALID_OBJECT_ID, {
        method: 'PUT',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });
      const params = Promise.resolve({ id: VALID_OBJECT_ID });

      // 執行
      const response = await PUT(request, { params });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('輸入資料驗證失敗');
      expect(data.message).toContain('代理人名稱為必填欄位');
      expect(mockCollection.replaceOne).not.toHaveBeenCalled();
    });

    test('應該保持輸入資料的結構一致性', async () => {
      // 準備
      const complexUpdateData = {
        name: '複雜測試代理人',
        persona: {
          tone: '專業但友善',
          background: '多年經驗的客戶服務專家',
          voice: '中性且清晰的聲音'
        },
        memory_config: {
          hot_memory_ids: [],
          cold_memory_ids: []
        }
      };

      mockCollection.findOne.mockResolvedValue(MOCK_AGENT);
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });
      
      const request = new NextRequest('http://localhost:3000/api/agents/' + VALID_OBJECT_ID, {
        method: 'PUT',
        body: JSON.stringify(complexUpdateData),
        headers: { 'Content-Type': 'application/json' }
      });
      const params = Promise.resolve({ id: VALID_OBJECT_ID });

      // 執行
      const response = await PUT(request, { params });
      const data = await response.json();

      // 驗證輸出結構與輸入結構一致
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        _id: VALID_OBJECT_ID,
        name: complexUpdateData.name,
        persona: complexUpdateData.persona,
        memory_config: complexUpdateData.memory_config,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: expect.any(String)
      });
      expect(new Date(data.data.updated_at)).toBeInstanceOf(Date);
    });
  });

  describe('DELETE /api/agents/[id]', () => {
    test('應該成功刪除存在的 agent', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(MOCK_AGENT);
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      
      const request = new NextRequest('http://localhost:3000/api/agents/' + VALID_OBJECT_ID, {
        method: 'DELETE'
      });
      const params = Promise.resolve({ id: VALID_OBJECT_ID });

      // 執行
      const response = await DELETE(request, { params });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(MOCK_AGENT_RESPONSE);
      expect(data.message).toBe('成功刪除 Agent');
      
      // 驗證資料庫調用
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
    });

    test('應該返回 404 錯誤當 agent 不存在', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/agents/' + VALID_OBJECT_ID, {
        method: 'DELETE'
      });
      const params = Promise.resolve({ id: VALID_OBJECT_ID });

      // 執行
      const response = await DELETE(request, { params });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到 Agent');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe('輸入輸出一致性測試', () => {
    test('GET 操作應該返回完整的 AgentProfile 結構', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(MOCK_AGENT);
      const request = new NextRequest('http://localhost:3000/api/agents/' + VALID_OBJECT_ID);
      const params = Promise.resolve({ id: VALID_OBJECT_ID });

      // 執行
      const response = await GET(request, { params });
      const data = await response.json();

      // 驗證完整的 AgentProfile 結構
      expect(data.data).toHaveProperty('_id');
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('persona');
      expect(data.data.persona).toHaveProperty('tone');
      expect(data.data.persona).toHaveProperty('background');
      expect(data.data.persona).toHaveProperty('voice');
      expect(data.data).toHaveProperty('memory_config');
      expect(data.data.memory_config).toHaveProperty('hot_memory_ids');
      expect(data.data.memory_config).toHaveProperty('cold_memory_ids');
      expect(data.data).toHaveProperty('created_at');
      expect(data.data).toHaveProperty('updated_at');
    });

    test('PUT 操作應該保留原有資料並只更新提供的欄位', async () => {
      // 準備
      const partialUpdate = { name: '部分更新的名稱' };
      mockCollection.findOne.mockResolvedValue(MOCK_AGENT);
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });
      
      const request = new NextRequest('http://localhost:3000/api/agents/' + VALID_OBJECT_ID, {
        method: 'PUT',
        body: JSON.stringify(partialUpdate),
        headers: { 'Content-Type': 'application/json' }
      });
      const params = Promise.resolve({ id: VALID_OBJECT_ID });

      // 執行
      const response = await PUT(request, { params });
      const data = await response.json();

      // 驗證只更新了提供的欄位，其他欄位保持不變
      expect(data.data.name).toBe(partialUpdate.name);
      expect(data.data.persona).toEqual(MOCK_AGENT.persona); // 應該保持原有的 persona
      expect(data.data.memory_config).toEqual(MOCK_AGENT.memory_config); // 應該保持原有的 memory_config
      expect(data.data.created_at).toBe('2024-01-01T00:00:00.000Z'); // 創建時間不變
      expect(data.data.updated_at).not.toBe('2024-01-01T00:00:00.000Z'); // 更新時間應該改變
    });

    test('DELETE 操作應該返回被刪除的完整 agent 資料', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(MOCK_AGENT);
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      
      const request = new NextRequest('http://localhost:3000/api/agents/' + VALID_OBJECT_ID, {
        method: 'DELETE'
      });
      const params = Promise.resolve({ id: VALID_OBJECT_ID });

      // 執行
      const response = await DELETE(request, { params });
      const data = await response.json();

      // 驗證返回的資料與原始資料完全一致
      expect(data.data).toEqual(MOCK_AGENT_RESPONSE);
    });
  });
});
