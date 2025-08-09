/**
 * Agents Collection API 測試
 * 確保 POST 和 GET 集合操作的輸入輸出一致性
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/agents/route';
import { AgentProfile, CreateAgentProfileInput } from '@/types';

// 模擬 MongoDB 集合操作
const mockToArray = jest.fn();
const mockCollection = {
  find: jest.fn(() => ({
    toArray: mockToArray
  })),
  insertOne: jest.fn(),
};

// 模擬 MongoDB 連接
jest.mock('@/lib/mongodb', () => ({
  getAgentsCollection: jest.fn(() => Promise.resolve(mockCollection)),
}));

// 模擬 ObjectId 生成
jest.mock('@/types', () => ({
  ...jest.requireActual('@/types'),
  generateObjectId: jest.fn(() => '507f1f77bcf86cd799439012')
}));

// 測試數據
const MOCK_CREATE_INPUT: CreateAgentProfileInput = {
  name: '新代理人',
  persona: {
    tone: '友善專業',
    background: '資深銷售顧問',
    voice: '溫暖親切的聲音'
  },
  memories: []
};

const MOCK_AGENTS: AgentProfile[] = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: '代理人A',
    persona: {
      tone: '專業',
      background: '客服專員',
      voice: '清晰'
    },
    memories: [],
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  },
  {
    _id: '507f1f77bcf86cd799439012',
    name: '代理人B',
    persona: {
      tone: '友善',
      background: '銷售顧問',
      voice: '溫暖'
    },
    memories: [],
    created_at: new Date('2024-01-02T00:00:00Z'),
    updated_at: new Date('2024-01-02T00:00:00Z'),
  }
];

// API 返回的格式（日期是字串）
const MOCK_AGENTS_RESPONSE = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: '代理人A',
    persona: {
      tone: '專業',
      background: '客服專員',
      voice: '清晰'
    },
    memories: [],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439012',
    name: '代理人B',
    persona: {
      tone: '友善',
      background: '銷售顧問',
      voice: '溫暖'
    },
    memories: [],
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  }
];

describe('Agents Collection API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 getAgentsCollection mock 为默认行为
    const { getAgentsCollection } = require('@/lib/mongodb');
    getAgentsCollection.mockResolvedValue(mockCollection);
  });

  describe('GET /api/agents', () => {
    test('應該成功獲取所有 agents', async () => {
      // 準備
      mockToArray.mockResolvedValue(MOCK_AGENTS);
      const request = new NextRequest('http://localhost:3000/api/agents');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(MOCK_AGENTS_RESPONSE);
      expect(data.message).toBe('成功獲取 Agent 列表');
      expect(mockCollection.find).toHaveBeenCalledWith({});
    });

    test('應該支援按名稱搜尋 agents', async () => {
      // 準備
      const filteredAgents = [MOCK_AGENTS[0]];
      const filteredAgentsResponse = [MOCK_AGENTS_RESPONSE[0]];
      mockToArray.mockResolvedValue(filteredAgents);
      const request = new NextRequest('http://localhost:3000/api/agents?name=代理人A');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(filteredAgentsResponse);
      expect(mockCollection.find).toHaveBeenCalledWith({
        name: { $regex: '代理人A', $options: 'i' }
      });
    });

    test('應該返回空陣列當沒有找到 agents', async () => {
      // 準備
      mockToArray.mockResolvedValue([]);
      const request = new NextRequest('http://localhost:3000/api/agents');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.message).toBe('成功獲取 Agent 列表');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getAgentsCollection } = require('@/lib/mongodb');
      getAgentsCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest('http://localhost:3000/api/agents');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('獲取 Agent 列表失敗');
      expect(data.message).toBe(errorMessage);
    });
  });

  describe('POST /api/agents', () => {
    test('應該成功創建新的 agent', async () => {
      // 準備
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(MOCK_CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        _id: expect.any(String),
        name: MOCK_CREATE_INPUT.name,
        persona: MOCK_CREATE_INPUT.persona,
        memories: [],
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
      expect(data.message).toBe('成功創建 Agent');
      
      // 驗證資料庫調用
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.any(String),
          name: MOCK_CREATE_INPUT.name,
          persona: MOCK_CREATE_INPUT.persona,
          memories: [],
          created_at: expect.any(Date),
          updated_at: expect.any(Date)
        })
      );
    });

    test('應該返回 400 錯誤當輸入資料無效', async () => {
      // 準備
      const invalidData = { name: '' }; // 空名稱應該導致驗證失敗
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('輸入資料驗證失敗');
      expect(data.message).toContain('代理人名稱為必填欄位');
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    test('應該處理資料庫插入失敗', async () => {
      // 準備
      mockCollection.insertOne.mockResolvedValue({ acknowledged: false });
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(MOCK_CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('創建 Agent 失敗');
      expect(data.message).toBe('插入資料庫失敗');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getAgentsCollection } = require('@/lib/mongodb');
      getAgentsCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(MOCK_CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('創建 Agent 失敗');
      expect(data.message).toBe(errorMessage);
    });
  });

  describe('輸入輸出一致性測試', () => {
    test('GET 操作應該返回 AgentProfile 陣列，每個元素都有完整結構', async () => {
      // 準備
      mockToArray.mockResolvedValue(MOCK_AGENTS);
      const request = new NextRequest('http://localhost:3000/api/agents');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證每個 agent 都有完整的結構
      expect(Array.isArray(data.data)).toBe(true);
      data.data.forEach((agent: any) => {
        expect(agent).toHaveProperty('_id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('persona');
        expect(agent.persona).toHaveProperty('tone');
        expect(agent.persona).toHaveProperty('background');
        expect(agent.persona).toHaveProperty('voice');
        expect(agent).toHaveProperty('memories');
        expect(Array.isArray(agent.memories)).toBe(true);
        expect(agent).toHaveProperty('created_at');
        expect(agent).toHaveProperty('updated_at');
        // 驗證時間戳格式
        expect(typeof agent.created_at).toBe('string');
        expect(typeof agent.updated_at).toBe('string');
        expect(new Date(agent.created_at)).toBeInstanceOf(Date);
        expect(new Date(agent.updated_at)).toBeInstanceOf(Date);
      });
    });

    test('POST 操作應該保持輸入資料結構並添加系統欄位', async () => {
      // 準備
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const complexInput: CreateAgentProfileInput = {
        name: '複雜代理人',
        persona: {
          tone: '專業且友善',
          background: '多領域專家，具有豐富的客戶服務經驗',
          voice: '中性且清晰，帶有親和力的語調'
        },
        memories: []
      };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(complexInput),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證輸出包含所有輸入資料，並添加了系統欄位
      expect(response.status).toBe(201);
      expect(data.data).toMatchObject({
        _id: expect.any(String),
        name: complexInput.name,
        persona: {
          tone: complexInput.persona.tone,
          background: complexInput.persona.background,
          voice: complexInput.persona.voice
        },
        memories: [],
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });

      // 驗證 created_at 和 updated_at 相同（新創建的項目）
      expect(data.data.created_at).toBe(data.data.updated_at);
    });

    test('POST 操作應該自動生成 ObjectId 和時間戳', async () => {
      // 準備
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(MOCK_CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證系統自動生成的欄位
      expect(data.data._id).toBeDefined();
      expect(typeof data.data._id).toBe('string');
      expect(data.data._id).toHaveLength(24); // MongoDB ObjectId 長度

      expect(data.data.created_at).toBeDefined();
      expect(data.data.updated_at).toBeDefined();
      expect(new Date(data.data.created_at)).toBeInstanceOf(Date);
      expect(new Date(data.data.updated_at)).toBeInstanceOf(Date);
    });

    test('響應格式應該保持一致', async () => {
      // 測試 GET 響應格式
      mockToArray.mockResolvedValue(MOCK_AGENTS);
      const getRequest = new NextRequest('http://localhost:3000/api/agents');
      const getResponse = await GET(getRequest);
      const getData = await getResponse.json();

      expect(getData).toHaveProperty('success');
      expect(getData).toHaveProperty('data');
      expect(getData).toHaveProperty('message');

      // 測試 POST 響應格式
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const postRequest = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(MOCK_CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });
      const postResponse = await POST(postRequest);
      const postData = await postResponse.json();

      expect(postData).toHaveProperty('success');
      expect(postData).toHaveProperty('data');
      expect(postData).toHaveProperty('message');

      // 驗證成功響應的格式一致性
      expect(typeof getData.success).toBe('boolean');
      expect(typeof postData.success).toBe('boolean');
      expect(typeof getData.message).toBe('string');
      expect(typeof postData.message).toBe('string');
    });
  });
});
