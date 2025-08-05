/**
 * Unit Individual API 測試
 * 確保 GET, PUT, DELETE 個別操作的正確性
 */

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/units/[id]/route';
import { Unit } from '@/types';

// 模擬 MongoDB 集合操作
const mockUnitsCollection = {
  findOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
};

const mockCoursePackagesCollection = {
  findOne: jest.fn(),
};

// 模擬 MongoDB 連接
jest.mock('@/lib/mongodb', () => ({
  getUnitsCollection: jest.fn(() => Promise.resolve(mockUnitsCollection)),
  getCoursePackagesCollection: jest.fn(() => Promise.resolve(mockCoursePackagesCollection)),
}));

// 測試數據
const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
const INVALID_OBJECT_ID = 'invalid_id';

const MOCK_UNIT: Unit = {
  _id: VALID_OBJECT_ID,
  title: '客戶溝通技巧',
  course_package_id: '507f1f77bcf86cd799439010',
  agent_role: 'AI客服助手',
  user_role: '客戶',
  intro_message: '歡迎來到客戶服務模擬練習！我將扮演一位有問題需要解決的客戶。',
  outro_message: '練習完成！您已經掌握了基本的客戶溝通技巧。',
  max_turns: 10,
  agent_behavior_prompt: '扮演一位有產品問題的客戶，態度友善但有些擔心',
  pass_condition: { type: 'keyword', value: ['解決', '滿意', '謝謝'] },
  order: 1,
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

const MOCK_UPDATE_INPUT = {
  title: '進階客戶溝通技巧',
  agent_role: '專業AI客服助手',
  user_role: '複雜需求客戶',
  intro_message: '歡迎來到進階客戶服務模擬練習！',
  outro_message: '恭喜！您已掌握進階客戶溝通技巧。',
  max_turns: 15,
  agent_behavior_prompt: '扮演一位有複雜問題的客戶，態度較為挑剔',
  pass_condition: { type: 'keyword', value: ['完美解決', '非常滿意', '感謝'] },
  order: 2
};

const MOCK_COURSE_PACKAGE = {
  _id: '507f1f77bcf86cd799439010',
  title: '客戶服務培訓',
  description: '提升客戶服務技巧和問題處理能力',
  units: [],
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

// API 返回的格式（日期是字串）
const MOCK_UNIT_RESPONSE = {
  _id: VALID_OBJECT_ID,
  title: '客戶溝通技巧',
  course_package_id: '507f1f77bcf86cd799439010',
  agent_role: 'AI客服助手',
  user_role: '客戶',
  intro_message: '歡迎來到客戶服務模擬練習！我將扮演一位有問題需要解決的客戶。',
  outro_message: '練習完成！您已經掌握了基本的客戶溝通技巧。',
  max_turns: 10,
  agent_behavior_prompt: '扮演一位有產品問題的客戶，態度友善但有些擔心',
  pass_condition: { type: 'keyword', value: ['解決', '滿意', '謝謝'] },
  order: 1,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

describe('Unit Individual API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 MongoDB 連接 mock
    const { getUnitsCollection, getCoursePackagesCollection } = require('@/lib/mongodb');
    getUnitsCollection.mockResolvedValue(mockUnitsCollection);
    getCoursePackagesCollection.mockResolvedValue(mockCoursePackagesCollection);
  });

  describe('GET /api/units/[id]', () => {
    test('應該成功獲取指定關卡', async () => {
      // 準備
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(MOCK_UNIT_RESPONSE);
      expect(data.message).toBe('成功獲取關卡');
      expect(mockUnitsCollection.findOne).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
    });

    test('應該處理關卡不存在的情況', async () => {
      // 準備
      mockUnitsCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到關卡');
    });

    test('應該處理無效的 ObjectId', async () => {
      // 準備
      const request = new NextRequest(`http://localhost:3000/api/units/${INVALID_OBJECT_ID}`);

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
      const { getUnitsCollection } = require('@/lib/mongodb');
      getUnitsCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('獲取關卡失敗');
    });
  });

  describe('PUT /api/units/[id]', () => {
    test('應該成功更新關卡', async () => {
      // 準備
      const updatedUnit = {
        ...MOCK_UNIT,
        ...MOCK_UPDATE_INPUT,
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };
      
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.updateOne.mockResolvedValue({ 
        acknowledged: true, 
        modifiedCount: 1 
      });
      mockUnitsCollection.findOne
        .mockResolvedValueOnce(MOCK_UNIT) // 第一次調用（檢查存在）
        .mockResolvedValueOnce(updatedUnit); // 第二次調用（返回更新後的數據）

      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
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
      expect(data.data.agent_role).toBe(MOCK_UPDATE_INPUT.agent_role);
      expect(data.data.user_role).toBe(MOCK_UPDATE_INPUT.user_role);
      expect(data.data.max_turns).toBe(MOCK_UPDATE_INPUT.max_turns);
      expect(data.data.order).toBe(MOCK_UPDATE_INPUT.order);
      expect(data.message).toBe('成功更新關卡');
      
      expect(mockUnitsCollection.updateOne).toHaveBeenCalledWith(
        { _id: VALID_OBJECT_ID },
        { 
          $set: { 
            ...MOCK_UPDATE_INPUT,
            updated_at: expect.any(Date)
          }
        }
      );
    });

    test('應該處理關卡不存在的情況', async () => {
      // 準備
      mockUnitsCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
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
      expect(data.error).toBe('找不到關卡');
    });

    test('應該處理無效的 ObjectId', async () => {
      // 準備
      const request = new NextRequest(`http://localhost:3000/api/units/${INVALID_OBJECT_ID}`, {
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

    test('應該驗證 course_package_id 對應的課程包存在', async () => {
      // 準備
      const updateInputWithNewCoursePackage = {
        ...MOCK_UPDATE_INPUT,
        course_package_id: '507f1f77bcf86cd799439011' // 有效的 ObjectId 格式但不存在的課程包
      };
      
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      mockCoursePackagesCollection.findOne.mockResolvedValue(null);
      
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(updateInputWithNewCoursePackage),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('課程包不存在');
    });

    test('應該驗證 max_turns 為正整數', async () => {
      // 準備
      const invalidInput = {
        ...MOCK_UPDATE_INPUT,
        max_turns: -5
      };
      
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(invalidInput),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('參數驗證失敗');
      expect(data.message).toBe('max_turns 必須是正整數');
    });

    test('應該驗證 order 為正整數', async () => {
      // 準備
      const invalidInput = {
        ...MOCK_UPDATE_INPUT,
        order: 0
      };
      
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(invalidInput),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('參數驗證失敗');
      expect(data.message).toBe('order 必須是正整數');
    });

    test('應該處理資料庫更新失敗', async () => {
      // 準備
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.updateOne.mockResolvedValue({ 
        acknowledged: false, 
        modifiedCount: 0 
      });
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
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
      expect(data.error).toBe('更新關卡失敗');
    });

    test('應該處理 JSON 解析錯誤', async () => {
      // 準備
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
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
      expect(data.error).toBe('更新關卡失敗');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getUnitsCollection } = require('@/lib/mongodb');
      getUnitsCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
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
      expect(data.error).toBe('更新關卡失敗');
    });
  });

  describe('DELETE /api/units/[id]', () => {
    test('應該成功刪除關卡', async () => {
      // 準備
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      mockUnitsCollection.deleteOne.mockResolvedValue({ 
        acknowledged: true, 
        deletedCount: 1 
      });
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
        method: 'DELETE'
      });

      // 執行
      const response = await DELETE(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('成功刪除關卡');
      expect(mockUnitsCollection.deleteOne).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
    });

    test('應該處理關卡不存在的情況', async () => {
      // 準備
      mockUnitsCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
        method: 'DELETE'
      });

      // 執行
      const response = await DELETE(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到關卡');
    });

    test('應該處理無效的 ObjectId', async () => {
      // 準備
      const request = new NextRequest(`http://localhost:3000/api/units/${INVALID_OBJECT_ID}`, {
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
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      mockUnitsCollection.deleteOne.mockResolvedValue({ 
        acknowledged: false, 
        deletedCount: 0 
      });
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
        method: 'DELETE'
      });

      // 執行
      const response = await DELETE(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('刪除關卡失敗');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getUnitsCollection } = require('@/lib/mongodb');
      getUnitsCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
        method: 'DELETE'
      });

      // 執行
      const response = await DELETE(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('刪除關卡失敗');
    });
  });

  describe('輸入輸出一致性測試', () => {
    test('更新的關卡應該與輸入數據一致', async () => {
      // 準備
      const updatedUnit = {
        ...MOCK_UNIT,
        ...MOCK_UPDATE_INPUT,
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };
      
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.updateOne.mockResolvedValue({ 
        acknowledged: true, 
        modifiedCount: 1 
      });
      mockUnitsCollection.findOne
        .mockResolvedValueOnce(MOCK_UNIT)
        .mockResolvedValueOnce(updatedUnit);

      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`, {
        method: 'PUT',
        body: JSON.stringify(MOCK_UPDATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await PUT(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證輸入輸出一致性
      expect(data.data.title).toBe(MOCK_UPDATE_INPUT.title);
      expect(data.data.agent_role).toBe(MOCK_UPDATE_INPUT.agent_role);
      expect(data.data.user_role).toBe(MOCK_UPDATE_INPUT.user_role);
      expect(data.data.intro_message).toBe(MOCK_UPDATE_INPUT.intro_message);
      expect(data.data.outro_message).toBe(MOCK_UPDATE_INPUT.outro_message);
      expect(data.data.max_turns).toBe(MOCK_UPDATE_INPUT.max_turns);
      expect(data.data.agent_behavior_prompt).toBe(MOCK_UPDATE_INPUT.agent_behavior_prompt);
      expect(data.data.pass_condition).toEqual(MOCK_UPDATE_INPUT.pass_condition);
      expect(data.data.order).toBe(MOCK_UPDATE_INPUT.order);
      
      // 驗證不變的欄位
      expect(data.data._id).toBe(MOCK_UNIT._id);
      expect(data.data.course_package_id).toBe(MOCK_UNIT.course_package_id);
      expect(data.data.created_at).toBeDefined();
      
      // 驗證更新時間
      expect(new Date(data.data.updated_at)).toBeInstanceOf(Date);
    });

    test('時間戳格式應該一致', async () => {
      // 準備
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`);

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
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證 ObjectId 格式 (24 位十六進制字符串)
      expect(data.data._id).toMatch(/^[0-9a-fA-F]{24}$/);
    });

    test('pass_condition 結構應該保持一致', async () => {
      // 準備
      mockUnitsCollection.findOne.mockResolvedValue(MOCK_UNIT);
      const request = new NextRequest(`http://localhost:3000/api/units/${VALID_OBJECT_ID}`);

      // 執行
      const response = await GET(request, { params: Promise.resolve({ id: VALID_OBJECT_ID }) });
      const data = await response.json();

      // 驗證 pass_condition 結構
      expect(data.data.pass_condition).toHaveProperty('type');
      expect(data.data.pass_condition).toHaveProperty('value');
      expect(data.data.pass_condition.type).toBe(MOCK_UNIT.pass_condition.type);
      expect(data.data.pass_condition.value).toEqual(MOCK_UNIT.pass_condition.value);
    });
  });
});
