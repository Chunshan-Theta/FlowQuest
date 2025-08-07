import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/agents/route';
import { GET as GetAgent, PUT as PutAgent, DELETE as DeleteAgent } from '@/app/api/agents/[id]/route';
import { AgentProfile, AgentMemory } from '@/types';

// Mock getAgentsCollection
jest.mock('@/lib/mongodb', () => ({
  getAgentsCollection: jest.fn(),
}));

// Mock MongoDB collection
const mockCollection = {
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn(),
  insertOne: jest.fn(),
  replaceOne: jest.fn(),
  deleteOne: jest.fn(),
  toArray: jest.fn(),
};

describe('Agent Memory CRUD Integration Tests', () => {
  const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
  const AGENT_ID = VALID_OBJECT_ID;

  // 測試記憶數據
  const testMemory1: AgentMemory = {
    _id: 'temp_1234567890_abc123',
    agent_id: AGENT_ID,
    type: 'hot',
    content: '客戶喜歡快速響應',
    tags: ['客戶服務', '快速響應'],
    created_by_user_id: 'temp_user_id',
    created_at: new Date('2024-01-01T00:00:00Z'),
  };

  const testMemory2: AgentMemory = {
    _id: 'temp_1234567891_def456',
    agent_id: AGENT_ID,
    type: 'cold',
    content: '產品規格和價格信息',
    tags: ['產品', '價格'],
    created_by_user_id: 'temp_user_id',
    created_at: new Date('2024-01-01T00:00:00Z'),
  };

  const CREATE_INPUT = {
    name: '測試代理人',
    persona: {
      tone: '專業親切',
      background: '資深客戶服務代表',
      voice: '清晰溫暖的聲音'
    },
    memory_config: {
      memory_ids: []
    }
  };

  const AGENT_WITH_MEMORIES: AgentProfile = {
    _id: AGENT_ID,
    name: '測試代理人',
    persona: {
      tone: '專業親切',
      background: '資深客戶服務代表',
      voice: '清晰溫暖的聲音'
    },
    memory_config: {
      memory_ids: [testMemory1, testMemory2]
    },
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { getAgentsCollection } = require('@/lib/mongodb');
    getAgentsCollection.mockResolvedValue(mockCollection);
  });

  describe('記憶 CRUD 完整流程測試', () => {
    test('應該能夠創建帶有記憶的 Agent', async () => {
      // 準備帶有記憶的 Agent 數據
      const agentWithMemories = {
        ...CREATE_INPUT,
        memory_config: {
          memory_ids: [testMemory1]
        }
      };

      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });
      
      const createRequest = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(agentWithMemories),
        headers: { 'Content-Type': 'application/json' }
      });

      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();

      // 如果失敗，顯示錯誤信息
      if (createResponse.status !== 201) {
        console.log('創建失敗:', createData);
      }

      // 驗證創建結果
      expect(createResponse.status).toBe(201);
      expect(createData.success).toBe(true);
      expect(createData.data).toMatchObject({
        name: agentWithMemories.name,
        persona: agentWithMemories.persona,
        memory_config: {
          memory_ids: expect.arrayContaining([
            expect.objectContaining({
              content: testMemory1.content,
              type: testMemory1.type,
              tags: testMemory1.tags
            })
          ])
        }
      });
    });

    test('應該能夠讀取帶有記憶的 Agent', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(AGENT_WITH_MEMORIES);
      
      const readRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`);
      const readParams = Promise.resolve({ id: AGENT_ID });

      const readResponse = await GetAgent(readRequest, { params: readParams });
      const readData = await readResponse.json();

      // 驗證讀取結果
      expect(readResponse.status).toBe(200);
      expect(readData.success).toBe(true);
      expect(readData.data.memory_config.memory_ids).toHaveLength(2);
      expect(readData.data.memory_config.memory_ids).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            content: testMemory1.content,
            type: testMemory1.type
          }),
          expect.objectContaining({
            content: testMemory2.content,
            type: testMemory2.type
          })
        ])
      );
    });

    test('應該能夠更新 Agent 的記憶', async () => {
      // 準備
      const newMemory: AgentMemory = {
        _id: 'temp_1234567892_ghi789',
        agent_id: AGENT_ID,
        type: 'hot',
        content: '新增的重要記憶',
        tags: ['重要', '新增'],
        created_by_user_id: 'temp_user_id',
        created_at: new Date('2024-01-02T00:00:00Z'),
      };

      const updateInput = {
        memory_config: {
          memory_ids: [testMemory1, testMemory2, newMemory]
        }
      };

      mockCollection.findOne.mockResolvedValue(AGENT_WITH_MEMORIES);
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });
      
      const updateRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(updateInput),
        headers: { 'Content-Type': 'application/json' }
      });
      const updateParams = Promise.resolve({ id: AGENT_ID });

      const updateResponse = await PutAgent(updateRequest, { params: updateParams });
      const updateData = await updateResponse.json();

      // 如果失敗，顯示錯誤信息
      if (updateResponse.status !== 200) {
        console.log('更新記憶失敗:', updateData);
        console.log('發送的數據:', updateInput);
      }

      // 驗證更新結果
      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.memory_config.memory_ids).toHaveLength(3);
      expect(updateData.data.memory_config.memory_ids).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            content: newMemory.content,
            type: newMemory.type
          })
        ])
      );
    });

    test('應該能夠刪除 Agent 中的特定記憶', async () => {
      // 準備 - 刪除第一個記憶
      const updateInput = {
        memory_config: {
          memory_ids: [testMemory2] // 只保留第二個記憶
        }
      };

      mockCollection.findOne.mockResolvedValue(AGENT_WITH_MEMORIES);
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });
      
      const updateRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(updateInput),
        headers: { 'Content-Type': 'application/json' }
      });
      const updateParams = Promise.resolve({ id: AGENT_ID });

      const updateResponse = await PutAgent(updateRequest, { params: updateParams });
      const updateData = await updateResponse.json();

      // 驗證更新結果
      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.memory_config.memory_ids).toHaveLength(1);
      expect(updateData.data.memory_config.memory_ids[0]).toEqual(
        expect.objectContaining({
          content: testMemory2.content,
          type: testMemory2.type
        })
      );
    });

    test('應該能夠按記憶類型過濾記憶', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(AGENT_WITH_MEMORIES);
      
      const readRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`);
      const readParams = Promise.resolve({ id: AGENT_ID });

      const readResponse = await GetAgent(readRequest, { params: readParams });
      const readData = await readResponse.json();

      // 驗證記憶類型分類
      const hotMemories = readData.data.memory_config.memory_ids.filter((m: AgentMemory) => m.type === 'hot');
      const coldMemories = readData.data.memory_config.memory_ids.filter((m: AgentMemory) => m.type === 'cold');

      expect(hotMemories).toHaveLength(1);
      expect(coldMemories).toHaveLength(1);
      expect(hotMemories[0].content).toBe(testMemory1.content);
      expect(coldMemories[0].content).toBe(testMemory2.content);
    });

    test('應該能夠驗證記憶內容的有效性', async () => {
      // 準備無效的記憶數據
      const invalidMemory = {
        _id: 'temp_1234567893_invalid',
        agent_id: AGENT_ID,
        type: 'invalid_type', // 無效的類型
        content: '', // 空的內容
        tags: [],
        created_by_user_id: 'temp_user_id',
        created_at: new Date('2024-01-01T00:00:00Z'),
      };

      const updateInput = {
        memory_config: {
          memory_ids: [invalidMemory]
        }
      };

      mockCollection.findOne.mockResolvedValue(AGENT_WITH_MEMORIES);
      
      const updateRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(updateInput),
        headers: { 'Content-Type': 'application/json' }
      });
      const updateParams = Promise.resolve({ id: AGENT_ID });

      const updateResponse = await PutAgent(updateRequest, { params: updateParams });
      const updateData = await updateResponse.json();

      // 驗證驗證失敗
      expect(updateResponse.status).toBe(400);
      expect(updateData.success).toBe(false);
      expect(updateData.error).toBe('輸入資料驗證失敗');
    });

    test('應該能夠處理記憶標籤', async () => {
      // 準備帶有標籤的記憶
      const memoryWithTags: AgentMemory = {
        _id: 'temp_1234567894_tags',
        agent_id: AGENT_ID,
        type: 'hot',
        content: '帶標籤的記憶',
        tags: ['重要', '客戶', '產品'],
        created_by_user_id: 'temp_user_id',
        created_at: new Date('2024-01-01T00:00:00Z'),
      };

      const updateInput = {
        memory_config: {
          memory_ids: [memoryWithTags]
        }
      };

      mockCollection.findOne.mockResolvedValue(AGENT_WITH_MEMORIES);
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });
      
      const updateRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(updateInput),
        headers: { 'Content-Type': 'application/json' }
      });
      const updateParams = Promise.resolve({ id: AGENT_ID });

      const updateResponse = await PutAgent(updateRequest, { params: updateParams });
      const updateData = await updateResponse.json();

      // 驗證標籤保存
      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.memory_config.memory_ids[0].tags).toEqual(['重要', '客戶', '產品']);
    });
  });

  describe('記憶邊界情況測試', () => {
    test('應該能夠處理空的記憶列表', async () => {
      const updateInput = {
        memory_config: {
          memory_ids: []
        }
      };

      mockCollection.findOne.mockResolvedValue(AGENT_WITH_MEMORIES);
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });
      
      const updateRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(updateInput),
        headers: { 'Content-Type': 'application/json' }
      });
      const updateParams = Promise.resolve({ id: AGENT_ID });

      const updateResponse = await PutAgent(updateRequest, { params: updateParams });
      const updateData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.memory_config.memory_ids).toHaveLength(0);
    });

    test('應該能夠處理大量記憶', async () => {
      // 創建 10 個記憶
      const manyMemories = Array.from({ length: 10 }, (_, i) => ({
        _id: `temp_123456789${i}_many`,
        agent_id: AGENT_ID,
        type: i % 2 === 0 ? 'hot' : 'cold',
        content: `記憶 ${i + 1}`,
        tags: [`標籤${i + 1}`],
        created_by_user_id: 'temp_user_id',
        created_at: new Date('2024-01-01T00:00:00Z'),
      }));

      const updateInput = {
        memory_config: {
          memory_ids: manyMemories
        }
      };

      mockCollection.findOne.mockResolvedValue(AGENT_WITH_MEMORIES);
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });
      
      const updateRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(updateInput),
        headers: { 'Content-Type': 'application/json' }
      });
      const updateParams = Promise.resolve({ id: AGENT_ID });

      const updateResponse = await PutAgent(updateRequest, { params: updateParams });
      const updateData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.memory_config.memory_ids).toHaveLength(10);
    });
  });
}); 