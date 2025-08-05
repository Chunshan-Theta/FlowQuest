/**
 * Units Collection API 測試
 * 確保 POST 和 GET 集合操作的輸入輸出一致性
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/units/route';
import { Unit, CreateUnitInput } from '@/types';

// 模擬 MongoDB 集合操作
const mockToArray = jest.fn();
const mockUnitsCollection = {
  find: jest.fn(() => ({
    sort: jest.fn(() => ({
      toArray: mockToArray
    }))
  })),
  insertOne: jest.fn(),
};

const mockCoursePackagesCollection = {
  findOne: jest.fn(),
};

// 模擬 MongoDB 連接
jest.mock('@/lib/mongodb', () => ({
  getUnitsCollection: jest.fn(() => Promise.resolve(mockUnitsCollection)),
  getCoursePackagesCollection: jest.fn(() => Promise.resolve(mockCoursePackagesCollection)),
}));

// 模擬 ObjectId 生成
jest.mock('@/types', () => ({
  ...jest.requireActual('@/types'),
  generateObjectId: jest.fn(() => '507f1f77bcf86cd799439012')
}));

// 測試數據
const MOCK_CREATE_INPUT: CreateUnitInput = {
  title: '客戶溝通技巧',
  course_package_id: '507f1f77bcf86cd799439011',
  agent_role: 'AI客服助手',
  user_role: '客戶',
  intro_message: '歡迎來到客戶服務模擬練習！我將扮演一位有問題需要解決的客戶。',
  outro_message: '練習完成！您已經掌握了基本的客戶溝通技巧。',
  max_turns: 10,
  agent_behavior_prompt: '扮演一位有產品問題的客戶，態度友善但有些擔心',
  pass_condition: {
    type: 'keyword',
    value: ['解決', '滿意', '謝謝']
  },
  order: 1
};

const MOCK_UNITS: Unit[] = [
  {
    _id: '507f1f77bcf86cd799439011',
    title: '基礎溝通技巧',
    course_package_id: '507f1f77bcf86cd799439010',
    agent_role: 'AI助手',
    user_role: '用戶',
    intro_message: '歡迎開始練習',
    outro_message: '練習結束',
    max_turns: 5,
    agent_behavior_prompt: '友善回應',
    pass_condition: { type: 'keyword', value: ['完成'] },
    order: 1,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  },
  {
    _id: '507f1f77bcf86cd799439012',
    title: '客戶溝通技巧',
    course_package_id: '507f1f77bcf86cd799439011',
    agent_role: 'AI客服助手',
    user_role: '客戶',
    intro_message: '歡迎來到客戶服務模擬練習！我將扮演一位有問題需要解決的客戶。',
    outro_message: '練習完成！您已經掌握了基本的客戶溝通技巧。',
    max_turns: 10,
    agent_behavior_prompt: '扮演一位有產品問題的客戶，態度友善但有些擔心',
    pass_condition: { type: 'keyword', value: ['解決', '滿意', '謝謝'] },
    order: 1,
    created_at: new Date('2024-01-02T00:00:00Z'),
    updated_at: new Date('2024-01-02T00:00:00Z'),
  }
];

// API 返回的格式（日期是字串）
const MOCK_UNITS_RESPONSE = [
  {
    _id: '507f1f77bcf86cd799439011',
    title: '基礎溝通技巧',
    course_package_id: '507f1f77bcf86cd799439010',
    agent_role: 'AI助手',
    user_role: '用戶',
    intro_message: '歡迎開始練習',
    outro_message: '練習結束',
    max_turns: 5,
    agent_behavior_prompt: '友善回應',
    pass_condition: { type: 'keyword', value: ['完成'] },
    order: 1,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439012',
    title: '客戶溝通技巧',
    course_package_id: '507f1f77bcf86cd799439011',
    agent_role: 'AI客服助手',
    user_role: '客戶',
    intro_message: '歡迎來到客戶服務模擬練習！我將扮演一位有問題需要解決的客戶。',
    outro_message: '練習完成！您已經掌握了基本的客戶溝通技巧。',
    max_turns: 10,
    agent_behavior_prompt: '扮演一位有產品問題的客戶，態度友善但有些擔心',
    pass_condition: { type: 'keyword', value: ['解決', '滿意', '謝謝'] },
    order: 1,
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  }
];

const MOCK_COURSE_PACKAGE = {
  _id: '507f1f77bcf86cd799439011',
  title: '客戶服務培訓',
  description: '提升客戶服務技巧和問題處理能力',
  units: [],
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

describe('Units Collection API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 MongoDB 連接 mock
    const { getUnitsCollection, getCoursePackagesCollection } = require('@/lib/mongodb');
    getUnitsCollection.mockResolvedValue(mockUnitsCollection);
    getCoursePackagesCollection.mockResolvedValue(mockCoursePackagesCollection);
  });

  describe('GET /api/units', () => {
    test('應該成功獲取所有關卡', async () => {
      // 準備
      mockToArray.mockResolvedValue(MOCK_UNITS);
      const request = new NextRequest('http://localhost:3000/api/units');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(MOCK_UNITS_RESPONSE);
      expect(data.message).toBe('成功獲取關卡列表');
      expect(mockUnitsCollection.find).toHaveBeenCalledWith({});
    });

    test('應該支援按課程包ID過濾關卡', async () => {
      // 準備
      const filteredUnits = [MOCK_UNITS[1]];
      const filteredResponse = [MOCK_UNITS_RESPONSE[1]];
      mockToArray.mockResolvedValue(filteredUnits);
      const request = new NextRequest('http://localhost:3000/api/units?course_package_id=507f1f77bcf86cd799439011');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(filteredResponse);
      expect(mockUnitsCollection.find).toHaveBeenCalledWith({
        course_package_id: '507f1f77bcf86cd799439011'
      });
    });

    test('應該支援按標題搜尋關卡', async () => {
      // 準備
      const filteredUnits = [MOCK_UNITS[0]];
      const filteredResponse = [MOCK_UNITS_RESPONSE[0]];
      mockToArray.mockResolvedValue(filteredUnits);
      const request = new NextRequest('http://localhost:3000/api/units?title=基礎');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(filteredResponse);
      expect(mockUnitsCollection.find).toHaveBeenCalledWith({
        title: { $regex: '基礎', $options: 'i' }
      });
    });

    test('應該支援組合查詢條件', async () => {
      // 準備
      const filteredUnits = [MOCK_UNITS[1]];
      mockToArray.mockResolvedValue(filteredUnits);
      const request = new NextRequest('http://localhost:3000/api/units?course_package_id=507f1f77bcf86cd799439011&title=客戶');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUnitsCollection.find).toHaveBeenCalledWith({
        course_package_id: '507f1f77bcf86cd799439011',
        title: { $regex: '客戶', $options: 'i' }
      });
    });

    test('應該返回空陣列當沒有找到關卡', async () => {
      // 準備
      mockToArray.mockResolvedValue([]);
      const request = new NextRequest('http://localhost:3000/api/units');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.message).toBe('成功獲取關卡列表');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getUnitsCollection } = require('@/lib/mongodb');
      getUnitsCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest('http://localhost:3000/api/units');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('獲取關卡列表失敗');
      expect(data.message).toBe(errorMessage);
    });
  });

  describe('POST /api/units', () => {
    test('應該成功創建新的關卡', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/units', {
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
      expect(data.data._id).toBe('507f1f77bcf86cd799439012');
      expect(data.data.title).toBe(MOCK_CREATE_INPUT.title);
      expect(data.data.course_package_id).toBe(MOCK_CREATE_INPUT.course_package_id);
      expect(data.data.agent_role).toBe(MOCK_CREATE_INPUT.agent_role);
      expect(data.data.user_role).toBe(MOCK_CREATE_INPUT.user_role);
      expect(data.data.intro_message).toBe(MOCK_CREATE_INPUT.intro_message);
      expect(data.data.outro_message).toBe(MOCK_CREATE_INPUT.outro_message);
      expect(data.data.max_turns).toBe(MOCK_CREATE_INPUT.max_turns);
      expect(data.data.agent_behavior_prompt).toBe(MOCK_CREATE_INPUT.agent_behavior_prompt);
      expect(data.data.pass_condition).toEqual(MOCK_CREATE_INPUT.pass_condition);
      expect(data.data.order).toBe(MOCK_CREATE_INPUT.order);
      expect(data.data.created_at).toBeDefined();
      expect(data.data.updated_at).toBeDefined();
      expect(data.message).toBe('成功創建關卡');
    });

    test('應該驗證必填欄位 - 缺少標題', async () => {
      // 準備
      const invalidInput = {
        course_package_id: '507f1f77bcf86cd799439011',
        agent_role: 'AI助手',
        user_role: '用戶',
        intro_message: '歡迎',
        outro_message: '結束',
        max_turns: 10,
        agent_behavior_prompt: '友善回應',
        pass_condition: { type: 'keyword', value: ['完成'] },
        order: 1
      };
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(invalidInput),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('必填欄位缺失');
      expect(data.message).toContain('請確認所有必填欄位已填寫');
    });

    test('應該驗證必填欄位 - 缺少課程包ID', async () => {
      // 準備
      const invalidInput = {
        title: '測試關卡',
        agent_role: 'AI助手',
        user_role: '用戶',
        intro_message: '歡迎',
        outro_message: '結束',
        max_turns: 10,
        agent_behavior_prompt: '友善回應',
        pass_condition: { type: 'keyword', value: ['完成'] },
        order: 1
      };
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(invalidInput),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('必填欄位缺失');
    });

    test('應該驗證課程包是否存在', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(MOCK_CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('課程包不存在');
      expect(data.message).toBe('指定的課程包不存在，請檢查 course_package_id');
    });

    test('應該驗證 max_turns 為正整數', async () => {
      // 準備
      const invalidInput = {
        ...MOCK_CREATE_INPUT,
        max_turns: -5
      };
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(invalidInput),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
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
        ...MOCK_CREATE_INPUT,
        order: 0
      };
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(invalidInput),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('參數驗證失敗');
      expect(data.message).toBe('order 必須是正整數');
    });

    test('應該處理資料庫插入失敗', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.insertOne.mockResolvedValue({ acknowledged: false });
      const request = new NextRequest('http://localhost:3000/api/units', {
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
      expect(data.error).toBe('創建關卡失敗');
      expect(data.message).toBe('插入資料庫失敗');
    });

    test('應該處理 JSON 解析錯誤', async () => {
      // 準備
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: '{ invalid json',
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('創建關卡失敗');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getUnitsCollection } = require('@/lib/mongodb');
      getUnitsCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest('http://localhost:3000/api/units', {
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
      expect(data.error).toBe('創建關卡失敗');
      expect(data.message).toBe(errorMessage);
    });
  });

  describe('輸入輸出一致性測試', () => {
    test('創建的關卡應該與輸入數據一致', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(MOCK_CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證輸入輸出一致性
      expect(data.data.title).toBe(MOCK_CREATE_INPUT.title);
      expect(data.data.course_package_id).toBe(MOCK_CREATE_INPUT.course_package_id);
      expect(data.data.agent_role).toBe(MOCK_CREATE_INPUT.agent_role);
      expect(data.data.user_role).toBe(MOCK_CREATE_INPUT.user_role);
      expect(data.data.intro_message).toBe(MOCK_CREATE_INPUT.intro_message);
      expect(data.data.outro_message).toBe(MOCK_CREATE_INPUT.outro_message);
      expect(data.data.max_turns).toBe(MOCK_CREATE_INPUT.max_turns);
      expect(data.data.agent_behavior_prompt).toBe(MOCK_CREATE_INPUT.agent_behavior_prompt);
      expect(data.data.pass_condition).toEqual(MOCK_CREATE_INPUT.pass_condition);
      expect(data.data.order).toBe(MOCK_CREATE_INPUT.order);
      
      // 驗證系統生成的欄位
      expect(data.data._id).toBeDefined();
      expect(data.data.created_at).toBeDefined();
      expect(data.data.updated_at).toBeDefined();
      expect(new Date(data.data.created_at)).toBeInstanceOf(Date);
      expect(new Date(data.data.updated_at)).toBeInstanceOf(Date);
    });

    test('時間戳格式應該一致', async () => {
      // 準備
      mockToArray.mockResolvedValue(MOCK_UNITS);
      const request = new NextRequest('http://localhost:3000/api/units');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證時間戳格式
      data.data.forEach((unit: any) => {
        expect(unit.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(unit.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(new Date(unit.created_at)).toBeInstanceOf(Date);
        expect(new Date(unit.updated_at)).toBeInstanceOf(Date);
      });
    });

    test('ObjectId 格式應該一致', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(MOCK_CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證 ObjectId 格式 (24 位十六進制字符串)
      expect(data.data._id).toMatch(/^[0-9a-fA-F]{24}$/);
    });

    test('pass_condition 結構應該保持一致', async () => {
      // 準備
      mockCoursePackagesCollection.findOne.mockResolvedValue(MOCK_COURSE_PACKAGE);
      mockUnitsCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/units', {
        method: 'POST',
        body: JSON.stringify(MOCK_CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證 pass_condition 結構
      expect(data.data.pass_condition).toHaveProperty('type');
      expect(data.data.pass_condition).toHaveProperty('value');
      expect(data.data.pass_condition.type).toBe(MOCK_CREATE_INPUT.pass_condition.type);
      expect(data.data.pass_condition.value).toEqual(MOCK_CREATE_INPUT.pass_condition.value);
    });
  });
});
