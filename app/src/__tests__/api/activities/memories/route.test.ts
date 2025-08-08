/**
 * Activity Memories API 測試
 * 確保活動記憶的 CRUD 操作正常運作
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/activities/[id]/memories/route';
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

describe('Activity Memories API', () => {
  const mockActivity: Activity = {
    _id: '507f1f77bcf86cd799439011',
    name: '測試活動',
    course_package_id: '507f1f77bcf86cd799439012',
    agent_profile_id: '507f1f77bcf86cd799439013',
    status: 'online',
    memories: [
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

  const mockCollection = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 getActivitiesCollection mock 为默认行为
    const { getActivitiesCollection } = require('@/lib/mongodb');
    getActivitiesCollection.mockResolvedValue(mockCollection);
  });

  describe('GET /api/activities/[id]/memories', () => {
    it('should return all memories for an activity', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(mockActivity);
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories');

      // 執行
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      // 驗證
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].content).toBe('測試記憶內容');
    });

    it('should return empty array when activity has no memories', async () => {
      // 準備
      const activityWithoutMemories = { ...mockActivity, memories: [] };
      mockCollection.findOne.mockResolvedValue(activityWithoutMemories);
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories');

      // 執行
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      // 驗證
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });

    it('should return 404 when activity not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories');
      const response = await GET(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到指定的活動');
    });

    it('should return 400 for invalid activity ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/activities/invalid-id/memories');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'invalid-id' })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('ID 格式無效');
    });
  });

  describe('POST /api/activities/[id]/memories', () => {
    const validMemoryData: CreateAgentMemoryInput = {
      agent_id: '507f1f77bcf86cd799439013',
      type: 'hot',
      content: '新的記憶內容',
      tags: ['新記憶', '重要'],
      created_by_user_id: '507f1f77bcf86cd799439015',
    };

    it('should create a new memory for an activity', async () => {
      // 準備
      mockCollection.findOne.mockResolvedValue(mockActivity);
      mockCollection.updateOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories', {
        method: 'POST',
        body: JSON.stringify(validMemoryData),
      });

      // 執行
      const response = await POST(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      // 驗證
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.content).toBe('新的記憶內容');
      expect(data.data.type).toBe('hot');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidMemoryData = {
        agent_id: '507f1f77bcf86cd799439013',
        type: 'hot',
        // missing content and created_by_user_id
      };

      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories', {
        method: 'POST',
        body: JSON.stringify(invalidMemoryData),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('缺少必要欄位');
    });

    it('should return 400 for invalid ID format', async () => {
      const invalidMemoryData = {
        ...validMemoryData,
        agent_id: 'invalid-id',
      };

      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories', {
        method: 'POST',
        body: JSON.stringify(invalidMemoryData),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('ID 格式無效');
    });

    it('should return 404 when activity not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/activities/507f1f77bcf86cd799439011/memories', {
        method: 'POST',
        body: JSON.stringify(validMemoryData),
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439011' })
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到指定的活動');
    });
  });
}); 