/**
 * Agent CRUD 整合測試
 * 測試完整的創建、讀取、更新、刪除流程，確保資料一致性
 */

import { NextRequest } from 'next/server';
import { GET as GetAgent, PUT, DELETE } from '@/app/api/agents/[id]/route';
import { GET as GetAgents, POST } from '@/app/api/agents/route';
import { AgentProfile, CreateAgentProfileInput } from '@/types';

// 模擬 MongoDB 集合操作
const mockToArray = jest.fn();
const mockCollection = {
  find: jest.fn(() => ({
    toArray: mockToArray
  })),
  findOne: jest.fn(),
  insertOne: jest.fn(),
  replaceOne: jest.fn(),
  deleteOne: jest.fn(),
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

describe('Agent CRUD 整合測試', () => {
  const AGENT_ID = '507f1f77bcf86cd799439012';
  
  const CREATE_INPUT: CreateAgentProfileInput = {
    name: '整合測試代理人',
    persona: {
      tone: '專業親切',
      background: '資深客戶服務代表',
      voice: '清晰溫暖的聲音'
    },
    memories: []
  };

  const CREATED_AGENT: AgentProfile = {
    _id: AGENT_ID,
    ...CREATE_INPUT,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 getAgentsCollection mock 为默认行为
    const { getAgentsCollection } = require('@/lib/mongodb');
    getAgentsCollection.mockResolvedValue(mockCollection);
  });

  describe('完整的 CRUD 流程測試', () => {
    test('應該能夠完成 CREATE → READ → UPDATE → DELETE 的完整流程', async () => {
      // ========== CREATE (POST /api/agents) ==========
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });
      
      const createRequest = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();

      // 驗證創建結果
      expect(createResponse.status).toBe(201);
      expect(createData.success).toBe(true);
      expect(createData.data).toMatchObject({
        _id: AGENT_ID,
        name: CREATE_INPUT.name,
        persona: CREATE_INPUT.persona,
        memories: CREATE_INPUT.memories
      });

      // ========== READ (GET /api/agents/[id]) ==========
      mockCollection.findOne.mockResolvedValue(CREATED_AGENT);
      
      const readRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`);
      const readParams = Promise.resolve({ id: AGENT_ID });

      const readResponse = await GetAgent(readRequest, { params: readParams });
      const readData = await readResponse.json();

      // 驗證讀取結果與創建的資料一致
      expect(readResponse.status).toBe(200);
      expect(readData.success).toBe(true);
      // 注意：JSON 序列化會將 Date 對象轉換為字符串
      expect(readData.data._id).toBe(CREATED_AGENT._id);
      expect(readData.data.name).toBe(CREATED_AGENT.name);
      expect(readData.data.persona).toEqual(CREATED_AGENT.persona);
      expect(readData.data.memories).toEqual(CREATED_AGENT.memories);
      expect(readData.data.created_at).toBe(CREATED_AGENT.created_at.toISOString());
      expect(readData.data.updated_at).toBe(CREATED_AGENT.updated_at.toISOString());

      // ========== UPDATE (PUT /api/agents/[id]) ==========
      const updateInput = {
        name: '更新後的代理人',
        persona: {
          ...CREATE_INPUT.persona,
          tone: '更加專業'
        }
      };

      const updatedAgent: AgentProfile = {
        ...CREATED_AGENT,
        ...updateInput,
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      mockCollection.findOne.mockResolvedValue(CREATED_AGENT);
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });
      
      const updateRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(updateInput),
        headers: { 'Content-Type': 'application/json' }
      });
      const updateParams = Promise.resolve({ id: AGENT_ID });

      const updateResponse = await PUT(updateRequest, { params: updateParams });
      const updateData = await updateResponse.json();

      // 驗證更新結果
      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.name).toBe(updateInput.name);
      expect(updateData.data.persona.tone).toBe(updateInput.persona.tone);
      expect(updateData.data.persona.background).toBe(CREATE_INPUT.persona.background); // 應該保持原有值
      expect(updateData.data.created_at).toBe(CREATED_AGENT.created_at.toISOString()); // 創建時間不變
      expect(updateData.data.updated_at).not.toBe(CREATED_AGENT.updated_at.toISOString()); // 更新時間改變

      // ========== DELETE (DELETE /api/agents/[id]) ==========
      mockCollection.findOne.mockResolvedValue(updatedAgent);
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      
      const deleteRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`, {
        method: 'DELETE'
      });
      const deleteParams = Promise.resolve({ id: AGENT_ID });

      const deleteResponse = await DELETE(deleteRequest, { params: deleteParams });
      const deleteData = await deleteResponse.json();

      // 驗證刪除結果
      expect(deleteResponse.status).toBe(200);
      expect(deleteData.success).toBe(true);
      expect(deleteData.data._id).toBe(updatedAgent._id);
      expect(deleteData.data.name).toBe(updatedAgent.name);
      expect(deleteData.data.persona).toEqual(updatedAgent.persona);
      expect(deleteData.data.memories).toEqual(updatedAgent.memories);
      expect(deleteData.data.created_at).toBe(updatedAgent.created_at.toISOString());
      expect(deleteData.data.updated_at).toBe(updatedAgent.updated_at.toISOString());
      expect(deleteData.message).toBe('成功刪除 Agent');
    });

    test('應該維持列表操作與單項操作的資料一致性', async () => {
      const agents = [CREATED_AGENT];

      // 測試獲取列表
      mockToArray.mockResolvedValue(agents);
      const listRequest = new NextRequest('http://localhost:3000/api/agents');
      const listResponse = await GetAgents(listRequest);
      const listData = await listResponse.json();

      // 測試獲取單項
      mockCollection.findOne.mockResolvedValue(CREATED_AGENT);
      const singleRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`);
      const singleParams = Promise.resolve({ id: AGENT_ID });
      const singleResponse = await GetAgent(singleRequest, { params: singleParams });
      const singleData = await singleResponse.json();

      // 驗證列表中的項目與單項獲取的結果一致
      expect(listData.data).toBeDefined();
      expect(Array.isArray(listData.data)).toBe(true);
      expect(listData.data.length).toBe(1);
      expect(listData.data[0]).toMatchObject(singleData.data);
    });
  });

  describe('錯誤處理的一致性測試', () => {
    test('所有操作都應該返回一致的錯誤格式', async () => {
      const INVALID_ID = 'invalid-id';

      // 測試 GET 錯誤
      const getRequest = new NextRequest(`http://localhost:3000/api/agents/${INVALID_ID}`);
      const getParams = Promise.resolve({ id: INVALID_ID });
      const getResponse = await GetAgent(getRequest, { params: getParams });
      const getData = await getResponse.json();

      // 測試 PUT 錯誤
      const putRequest = new NextRequest(`http://localhost:3000/api/agents/${INVALID_ID}`, {
        method: 'PUT',
        body: JSON.stringify(CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });
      const putParams = Promise.resolve({ id: INVALID_ID });
      const putResponse = await PUT(putRequest, { params: putParams });
      const putData = await putResponse.json();

      // 測試 DELETE 錯誤
      const deleteRequest = new NextRequest(`http://localhost:3000/api/agents/${INVALID_ID}`, {
        method: 'DELETE'
      });
      const deleteParams = Promise.resolve({ id: INVALID_ID });
      const deleteResponse = await DELETE(deleteRequest, { params: deleteParams });
      const deleteData = await deleteResponse.json();

      // 驗證所有錯誤響應都有一致的格式
      [getData, putData, deleteData].forEach(errorData => {
        expect(errorData).toHaveProperty('success', false);
        expect(errorData).toHaveProperty('error');
        expect(errorData).toHaveProperty('message');
        expect(typeof errorData.error).toBe('string');
        expect(typeof errorData.message).toBe('string');
      });

      // 驗證相同錯誤類型的響應碼一致
      expect(getResponse.status).toBe(400);
      expect(putResponse.status).toBe(400);
      expect(deleteResponse.status).toBe(400);
    });
  });

  describe('資料類型一致性測試', () => {
    test('所有操作的時間戳應該保持一致的格式', async () => {
      // 測試創建操作的時間戳
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const createRequest = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });
      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();

      // 驗證時間戳格式
      expect(createData.data.created_at).toBeDefined();
      expect(createData.data.updated_at).toBeDefined();
      expect(new Date(createData.data.created_at)).toBeInstanceOf(Date);
      expect(new Date(createData.data.updated_at)).toBeInstanceOf(Date);

      // 測試更新操作的時間戳
      mockCollection.findOne.mockResolvedValue(CREATED_AGENT);
      mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1 });
      
      const updateRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`, {
        method: 'PUT',
        body: JSON.stringify({ name: '更新測試' }),
        headers: { 'Content-Type': 'application/json' }
      });
      const updateParams = Promise.resolve({ id: AGENT_ID });
      const updateResponse = await PUT(updateRequest, { params: updateParams });
      const updateData = await updateResponse.json();

      // 驗證更新操作保持時間戳格式一致
      expect(updateData.data.created_at).toBeDefined();
      expect(updateData.data.updated_at).toBeDefined();
      expect(new Date(updateData.data.created_at)).toBeInstanceOf(Date);
      expect(new Date(updateData.data.updated_at)).toBeInstanceOf(Date);
    });

    test('ObjectId 格式應該在所有操作中保持一致', async () => {
      // 驗證創建時的 ObjectId 格式
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const createRequest = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });
      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();

      // ObjectId 應該是 24 位十六進制字符串
      expect(createData.data._id).toMatch(/^[0-9a-fA-F]{24}$/);
      
      // 驗證讀取操作返回相同格式的 ObjectId
      mockCollection.findOne.mockResolvedValue(CREATED_AGENT);
      const readRequest = new NextRequest(`http://localhost:3000/api/agents/${AGENT_ID}`);
      const readParams = Promise.resolve({ id: AGENT_ID });
      const readResponse = await GetAgent(readRequest, { params: readParams });
      const readData = await readResponse.json();

      expect(readData.data._id).toMatch(/^[0-9a-fA-F]{24}$/);
    });
  });
});
