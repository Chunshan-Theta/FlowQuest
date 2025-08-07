/**
 * Activity Individual Memory API 測試
 * 確保個別記憶的 GET/PUT/DELETE 操作正常運作
 */

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/activities/[id]/memories/[memoryId]/route';
import { Activity, AgentMemory, UpdateAgentMemoryInput } from '@/types';

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

describe('Activity Individual Memory API', () => {
  const mockActivity: Activity = {
    _id: '507f1f77bcf86cd799439011',
    name: '測試活動',
    course_package_id: '507f1f77bcf86cd799439012',
    agent_profile_id: '507f1f77bcf86cd799439013',
    status: 'online',
    memory_ids: [
      {
        _id: '507f1f77bcf86cd799439014',
        agent_id: '507f1f77bcf86cd799439013',
        type: 'hot',
        content: '測試記憶內容',
        tags: ['測試', '記憶'],
        created_by_user_id: '507f1f77bcf86cd799439015',
        created_at: new Date(),
      }
    ],
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 getActivitiesCollection mock 为默认行为
    const { getActivitiesCollection } = require('@/lib/mongodb');
    getActivitiesCollection.mockResolvedValue(mockCollection);
  });

  describe('GET /api/activities/[id]/memories/[memoryId]', () => {
    it('should return specific memory', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(mockActivity);
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439014');

      // 執行
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439014' })
      });

      // 驗證
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.content).toBe('測試記憶內容');
      expect(data.data.type).toBe('hot');
    });

    it('should return 404 when activity not found', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439014');

      // 執行
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439014' })
      });

      // 驗證
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到指定的活動');
    });

    it('should return 404 when memory not found', async () => {
      // 準備
      const activityWithoutTargetMemory = { ...mockActivity, memory_ids: [] };
      mockCollection.findOne.mockResolvedValue(activityWithoutTargetMemory);
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439014');

      // 執行
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439014' })
      });

      // 驗證
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到指定的記憶');
    });

    it('should return 400 for invalid IDs', async () => {
      // 準備
      const request = new NextRequest('http://localhost:3000/api/activities/invalid-id/memories/invalid-memory-id');

      // 執行
      const response = await GET(request, {
        params: Promise.resolve({ id: 'invalid-id', memoryId: 'invalid-memory-id' })
      });

      // 驗證
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('ID 格式無效');
    });
  });

  describe('PUT /api/activities/[id]/memories/[memoryId]', () => {
    const updateData: Partial<UpdateAgentMemoryInput> = {
      content: '更新的記憶內容',
      type: 'cold',
      tags: ['更新', '記憶'],
    };

    it('should update specific memory', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(mockActivity);
      mockCollection.updateOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439014', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // 執行
      const response = await PUT(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439014' })
      });

      // 驗證
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.content).toBe('更新的記憶內容');
      expect(data.data.type).toBe('cold');
    });

    it('should return 404 when activity not found', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439014', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // 執行
      const response = await PUT(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439014' })
      });

      // 驗證
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到指定的活動');
    });

    it('should return 404 when memory not found', async () => {
      // 準備
      const activityWithoutTargetMemory = { ...mockActivity, memory_ids: [] };
      mockCollection.findOne.mockResolvedValue(activityWithoutTargetMemory);
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439014', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // 執行
      const response = await PUT(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439014' })
      });

      // 驗證
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到指定的記憶');
    });
  });

  describe('DELETE /api/activities/[id]/memories/[memoryId]', () => {
    it('should delete specific memory', async () => {
      // 準備
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439014', {
        method: 'DELETE',
      });

      // 執行
      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439014' })
      });

      // 驗證
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('記憶已成功刪除');
    });

    it('should return 404 when activity not found', async () => {
      // 準備
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439014', {
        method: 'DELETE',
      });

      // 執行
      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439014' })
      });

      // 驗證
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到指定的活動');
    });

    it('should return 404 when memory not found', async () => {
      // 準備
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 0 });
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories/507f1f77bcf86cd799439014', {
        method: 'DELETE',
      });

      // 執行
      const response = await DELETE(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011', memoryId: '507f1f77bcf86cd799439014' })
      });

      // 驗證
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到指定的記憶');
    });
  });
}); 