/**
 * Activity Memory CRUD 整合測試
 * 確保活動記憶的完整 CRUD 流程正常運作
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/activities/[id]/memories/route';
import { GET as GET_MEMORY, PUT, DELETE } from '@/app/api/activities/[id]/memories/[memoryId]/route';
import { Activity, AgentMemory, CreateAgentMemoryInput } from '@/types';

// 模擬 MongoDB 集合操作
const mockCollection = {
  findOne: jest.fn(),
  updateOne: jest.fn(),
};

// 模擬 MongoDB 連接
jest.mock('@/lib/mongodb', () => ({
  getActivitiesCollection: jest.fn(() => Promise.resolve(mockCollection)),
}));

// 模擬 ObjectId 生成
jest.mock('@/types', () => ({
  ...jest.requireActual('@/types'),
  generateObjectId: jest.fn(() => '507f1f77bcf86cd799439016')
}));

describe('Activity Memory CRUD 整合測試', () => {
  const mockActivity: Activity = {
    _id: '507f1f77bcf86cd799439011',
    name: '測試活動',
    course_package_id: '507f1f77bcf86cd799439012',
    agent_profile_id: '507f1f77bcf86cd799439013',
    status: 'online',
    memory_ids: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const validMemoryData: CreateAgentMemoryInput = {
    agent_id: '507f1f77bcf86cd799439013',
    type: 'hot',
    content: '整合測試記憶內容',
    tags: ['整合', '測試'],
    created_by_user_id: '507f1f77bcf86cd799439015',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 getActivitiesCollection mock 为默认行为
    const { getActivitiesCollection } = require('@/lib/mongodb');
    getActivitiesCollection.mockResolvedValue(mockCollection);
  });

  describe('完整的 CRUD 流程測試', () => {
    it('應該能夠完成 CREATE → READ → UPDATE → DELETE 的完整流程', async () => {
      // 1. CREATE - 創建記憶
      mockCollection.findOne.mockResolvedValue(mockActivity);
      mockCollection.updateOne.mockResolvedValue({ acknowledged: true });

      const createRequest = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories', {
        method: 'POST',
        body: JSON.stringify(validMemoryData),
      });

      const createResponse = await POST(createRequest, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      expect(createResponse.status).toBe(201);
      const createdMemory = await createResponse.json();
      expect(createdMemory.success).toBe(true);
      expect(createdMemory.data.content).toBe('整合測試記憶內容');

      // 2. READ - 讀取所有記憶
      const activityWithMemory = {
        ...mockActivity,
        memory_ids: [createdMemory.data]
      };
      mockCollection.findOne.mockResolvedValue(activityWithMemory);

      const readRequest = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories');
      const readResponse = await GET(readRequest, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      expect(readResponse.status).toBe(200);
      const memories = await readResponse.json();
      expect(memories.success).toBe(true);
      expect(memories.data).toHaveLength(1);

      // 3. READ - 讀取特定記憶
      const readSpecificRequest = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439016');
      const readSpecificResponse = await GET_MEMORY(readSpecificRequest, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439016' })
      });

      expect(readSpecificResponse.status).toBe(200);
      const specificMemory = await readSpecificResponse.json();
      expect(specificMemory.success).toBe(true);
      expect(specificMemory.data.content).toBe('整合測試記憶內容');

      // 4. UPDATE - 更新記憶
      const updateData = {
        content: '更新的整合測試記憶內容',
        type: 'cold',
        tags: ['更新', '整合', '測試'],
      };

      mockCollection.updateOne.mockResolvedValue({ acknowledged: true });

      const updateRequest = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439016', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const updateResponse = await PUT(updateRequest, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439016' })
      });

      expect(updateResponse.status).toBe(200);
      const updatedMemory = await updateResponse.json();
      expect(updatedMemory.success).toBe(true);
      expect(updatedMemory.data.content).toBe('更新的整合測試記憶內容');
      expect(updatedMemory.data.type).toBe('cold');

      // 5. DELETE - 刪除記憶
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      const deleteRequest = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439016', {
        method: 'DELETE',
      });

      const deleteResponse = await DELETE(deleteRequest, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439016' })
      });

      expect(deleteResponse.status).toBe(200);
      const deleteResult = await deleteResponse.json();
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toBe('記憶已成功刪除');
    });

    it('應該維持列表操作與單項操作的資料一致性', async () => {
      // 創建多個記憶
      const memory1 = { ...validMemoryData, content: '記憶1' };
      const memory2 = { ...validMemoryData, content: '記憶2' };

      mockCollection.findOne.mockResolvedValue(mockActivity);
      mockCollection.updateOne.mockResolvedValue({ acknowledged: true });

      // 創建第一個記憶
      const create1Request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories', {
        method: 'POST',
        body: JSON.stringify(memory1),
      });
      await POST(create1Request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      // 創建第二個記憶
      const create2Request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories', {
        method: 'POST',
        body: JSON.stringify(memory2),
      });
      await POST(create2Request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      // 驗證列表操作返回所有記憶
      const activityWithMemories = {
        ...mockActivity,
        memory_ids: [
          { _id: '507f1f77bcf86cd799439016', ...memory1, created_at: new Date() },
          { _id: '507f1f77bcf86cd799439017', ...memory2, created_at: new Date() }
        ]
      };
      mockCollection.findOne.mockResolvedValue(activityWithMemories);

      const readRequest = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories');
      const readResponse = await GET(readRequest, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      const memories = await readResponse.json();
      expect(memories.data).toHaveLength(2);
      expect(memories.data[0].content).toBe('記憶1');
      expect(memories.data[1].content).toBe('記憶2');
    });
  });

  describe('錯誤處理的一致性測試', () => {
    it('所有操作都應該返回一致的錯誤格式', async () => {
      // 測試無效 ID 格式
      const invalidRequest = new NextRequest('http://localhost:3000/api/activities/invalid-id/memories');
      const invalidResponse = await GET(invalidRequest, {
        params: Promise.resolve({ id: 'invalid-id' })
      });

      expect(invalidResponse.status).toBe(400);
      const invalidData = await invalidResponse.json();
      expect(invalidData.success).toBe(false);
      expect(invalidData.error).toBe('ID 格式無效');

      // 測試找不到活動
      mockCollection.findOne.mockResolvedValue(null);
      const notFoundRequest = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories');
      const notFoundResponse = await GET(notFoundRequest, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      expect(notFoundResponse.status).toBe(404);
      const notFoundData = await notFoundResponse.json();
      expect(notFoundData.success).toBe(false);
      expect(notFoundData.error).toBe('找不到指定的活動');
    });
  });

  describe('資料類型一致性測試', () => {
    it('所有操作的時間戳應該保持一致的格式', async () => {
      mockCollection.findOne.mockResolvedValue(mockActivity);
      mockCollection.updateOne.mockResolvedValue({ acknowledged: true });

      const createRequest = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories', {
        method: 'POST',
        body: JSON.stringify(validMemoryData),
      });

      const createResponse = await POST(createRequest, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      const createdMemory = await createResponse.json();
      expect(createdMemory.data.created_at).toBeDefined();
      expect(new Date(createdMemory.data.created_at)).toBeInstanceOf(Date);
    });

    it('ObjectId 格式應該在所有操作中保持一致', async () => {
      mockCollection.findOne.mockResolvedValue(mockActivity);
      mockCollection.updateOne.mockResolvedValue({ acknowledged: true });

      const createRequest = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories', {
        method: 'POST',
        body: JSON.stringify(validMemoryData),
      });

      const createResponse = await POST(createRequest, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      const createdMemory = await createResponse.json();
      expect(createdMemory.data._id).toMatch(/^[0-9a-fA-F]{24}$/);
      expect(createdMemory.data.agent_id).toMatch(/^[0-9a-fA-F]{24}$/);
      expect(createdMemory.data.created_by_user_id).toMatch(/^[0-9a-fA-F]{24}$/);
    });
  });
}); 