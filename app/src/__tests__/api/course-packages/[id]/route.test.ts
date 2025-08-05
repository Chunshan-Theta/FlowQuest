/**
 * CoursePackage Individual API 測試
 * 確保 GET, PUT, DELETE 個別操作的正確性
 */

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/course-packages/[id]/route';
import { CoursePackage } from '@/types';
import { ObjectId } from 'mongodb';

// 模擬 MongoDB 集合操作
const mockToArray = jest.fn();
const mockCoursePackagesCollection = {
  findOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
};

const mockUnitsCollection = {
  find: jest.fn(() => ({
    sort: jest.fn(() => ({
      toArray: mockToArray
    }))
  })),
  countDocuments: jest.fn(),
};

// 模擬 MongoDB 連接
jest.mock('@/lib/mongodb', () => ({
  getCoursePackagesCollection: jest.fn(() => Promise.resolve(mockCoursePackagesCollection)),
  getUnitsCollection: jest.fn(() => Promise.resolve(mockUnitsCollection)),
}));

// 測試數據
const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
const INVALID_OBJECT_ID = 'invalid_id';

const MOCK_COURSE_PACKAGE: CoursePackage = {
  _id: VALID_OBJECT_ID,
  title: '客戶服務培訓',
  description: '提升客戶服務技巧和問題處理能力',
  units: [],
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

const MOCK_UPDATE_INPUT = {
  title: '進階客戶服務培訓',
  description: '提升客戶服務技巧和處理複雜問題的能力',
};

const MOCK_UNITS = [
  {
    _id: 'unit1',
    title: '關卡1',
    course_package_id: VALID_OBJECT_ID,
    agent_role: 'AI助手',
    user_role: '用戶',
    intro_message: '歡迎',
    outro_message: '結束',
    max_turns: 10,
    agent_behavior_prompt: '友善回應',
    pass_condition: { type: 'keyword', value: ['完成'] },
    order: 1,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  }
];

// API 返回的格式（日期是字串）
const MOCK_COURSE_PACKAGE_RESPONSE = {
  _id: VALID_OBJECT_ID,
  title: '客戶服務培訓',
  description: '提升客戶服務技巧和問題處理能力',
  units: [],
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

describe('CoursePackage Individual API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 MongoDB 連接 mock
    const { getCoursePackagesCollection, getUnitsCollection } = require('@/lib/mongodb');
    getCoursePackagesCollection.mockResolvedValue(mockCoursePackagesCollection);
    getUnitsCollection.mockResolvedValue(mockUnitsCollection);
  });

  describe('GET /api/course-packages/[id]', () => {
    test('應該成功獲取指定課程包', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(MOCK_COURSE_PACKAGE_RESPONSE);
      expect(data.message).toBe('成功獲取課程包');
      expect(mockCoursePackagesCollection.findOne).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
    });

    test('應該支援包含關卡數據的查詢', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockToArray.mockResolvedValue(MOCK_UNITS);
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}?include_units=true`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.units).toBeDefined();
      expect(data.data.units.length).toBe(1);
      expect(mockUnitsCollection.find).toHaveBeenCalledWith({ course_package_id: VALID_OBJECT_ID });
    });

    test('應該處理課程包不存在的情況', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到課程包');
    });

    test('應該處理無效的 ObjectId', async () => {
      // 準備
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${INVALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: INVALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('ID 格式無效');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getCoursePackagesCollection } = require('@/lib/mongodb');
      getCoursePackagesCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('獲取課程包失敗');
    });
  });

  describe('PUT /api/course-packages/[id]', () => {
    test('應該成功更新課程包', async () => {
      // 準備
      const updatedCoursePackage = {
        ...MOCK_COURSE_PACKAGE,
        ...MOCK_UPDATE_INPUT,
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };
      
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockCoursePackagesCollection.updateOne.mockResolvedValue({ 
        acknowledged: true, 
        modifiedCount: 1 
      });
      mockCoursePackagesCollection.findOne
        .mockResolvedValueOnce(MOCK_COURSE_PACKAGE) // 第一次調用（檢查存在）
        .mockResolvedValueOnce(updatedCoursePackage); // 第二次調用（返回更新後的數據）

      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(MOCK_UPDATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(MOCK_UPDATE_INPUT.title);
      expect(data.data.description).toBe(MOCK_UPDATE_INPUT.description);
      expect(data.message).toBe('成功更新課程包');
      
      expect(mockCoursePackagesCollection.updateOne).toHaveBeenCalledWith(
        { _id: VALID_OBJECT_ID },
        { 
          $set: { 
            ...MOCK_UPDATE_INPUT,
            updated_at: expect.any(Date)
          }
        }
      );
    });

    test('應該處理課程包不存在的情況', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(MOCK_UPDATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到課程包');
    });

    test('應該處理無效的 ObjectId', async () => {
      // 準備
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${INVALID_OBJECT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(MOCK_UPDATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: INVALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('ID 格式無效');
    });

    test('應該處理資料庫更新失敗', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockCoursePackagesCollection.updateOne.mockResolvedValue({ 
        acknowledged: false, 
        modifiedCount: 0 
      });
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(MOCK_UPDATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('更新課程包失敗');
    });

    test('應該處理 JSON 解析錯誤', async () => {
      // 準備
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'PUT',
        body: '{ invalid json',
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('更新課程包失敗');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getCoursePackagesCollection } = require('@/lib/mongodb');
      getCoursePackagesCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(MOCK_UPDATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('更新課程包失敗');
    });
  });

  describe('DELETE /api/course-packages/[id]', () => {
    test('應該成功刪除課程包（沒有關聯關卡）', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.countDocuments.mockResolvedValue(0);
      mockCoursePackagesCollection.deleteOne.mockResolvedValue({ 
        acknowledged: true, 
        deletedCount: 1 
      });
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'DELETE'
      });

      // 執行
      const response = await DELETE(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('成功刪除課程包');
      expect(mockUnitsCollection.countDocuments).toHaveBeenCalledWith({ course_package_id: VALID_OBJECT_ID });
      expect(mockCoursePackagesCollection.deleteOne).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
    });

    test('應該處理刪除有關聯關卡的課程包', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.countDocuments.mockResolvedValue(1);
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'DELETE'
      });

      // 執行
      const response = await DELETE(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('無法刪除課程包');
      expect(data.message).toBe('此課程包包含關卡，請先刪除所有關卡');
    });

    test('應該處理課程包不存在的情況', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'DELETE'
      });

      // 執行
      const response = await DELETE(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到課程包');
    });

    test('應該處理無效的 ObjectId', async () => {
      // 準備
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${INVALID_OBJECT_ID}`, {
        method: 'DELETE'
      });

      // 執行
      const response = await DELETE(request, { params: Promise.resolve({ id: INVALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('ID 格式無效');
    });

    test('應該處理資料庫刪除失敗', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.countDocuments.mockResolvedValue(0);
      mockCoursePackagesCollection.deleteOne.mockResolvedValue({ 
        acknowledged: false, 
        deletedCount: 0 
      });
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'DELETE'
      });

      // 執行
      const response = await DELETE(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('刪除課程包失敗');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getCoursePackagesCollection } = require('@/lib/mongodb');
      getCoursePackagesCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'DELETE'
      });

      // 執行
      const response = await DELETE(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('刪除課程包失敗');
    });
  });

  describe('輸入輸出一致性測試', () => {
    test('更新的課程包應該與輸入數據一致', async () => {
      // 準備
      const updatedCoursePackage = {
        ...MOCK_COURSE_PACKAGE,
        ...MOCK_UPDATE_INPUT,
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };
      
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockCoursePackagesCollection.updateOne.mockResolvedValue({ 
        acknowledged: true, 
        modifiedCount: 1 
      });
      mockCoursePackagesCollection.findOne
        .mockResolvedValueOnce(MOCK_COURSE_PACKAGE)
        .mockResolvedValueOnce(updatedCoursePackage);

      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(MOCK_UPDATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證輸入輸出一致性
      expect(data.data.title).toBe(MOCK_UPDATE_INPUT.title);
      expect(data.data.description).toBe(MOCK_UPDATE_INPUT.description);
      
      // 驗證不變的欄位
      expect(data.data._id).toBe(MOCK_COURSE_PACKAGE._id);
      expect(data.data.created_at).toBeDefined();
      
      // 驗證更新時間
      expect(new Date(data.data.updated_at)).toBeInstanceOf(Date);
    });

    test('時間戳格式應該一致', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證時間戳格式
      expect(data.data.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(data.data.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(data.data.created_at)).toBeInstanceOf(Date);
      expect(new Date(data.data.updated_at)).toBeInstanceOf(Date);
    });

    test('ObjectId 格式應該一致', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      const request = new NextRequest(`http://localhost:3000/api/course-packages/${VALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證 ObjectId 格式 (24 位十六進制字符串)
      expect(data.data._id).toMatch(/^[0-9a-fA-F]{24}$/);
    });
  });
});
