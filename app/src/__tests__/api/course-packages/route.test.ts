/**
 * CoursePackages Collection API 測試
 * 確保 POST 和 GET 集合操作的輸入輸出一致性
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/course-packages/route';
import { CoursePackage, CreateCoursePackageInput } from '@/types';

// 模擬 MongoDB 集合操作
const mockToArray = jest.fn();
const mockSort = jest.fn(() => ({
  toArray: mockToArray
}));
const mockCoursePackagesCollection = {
  find: jest.fn(() => ({
    sort: mockSort,
    toArray: mockToArray
  })),
  insertOne: jest.fn(),
};

const mockUnitsCollection = {
  find: jest.fn(() => ({
    sort: jest.fn(() => ({
      toArray: jest.fn()
    }))
  })),
};

// 模擬 MongoDB 連接
jest.mock('@/lib/mongodb', () => ({
  getCoursePackagesCollection: jest.fn(() => Promise.resolve(mockCoursePackagesCollection)),
  getUnitsCollection: jest.fn(() => Promise.resolve(mockUnitsCollection)),
}));

// 模擬 ObjectId 生成
jest.mock('@/types', () => ({
  ...jest.requireActual('@/types'),
  generateObjectId: jest.fn(() => '507f1f77bcf86cd799439012')
}));

// 測試數據
const MOCK_CREATE_INPUT: CreateCoursePackageInput = {
  title: '銷售技巧培訓',
  description: '通過角色扮演學習銷售溝通技巧，提升成交率',
  units: []
};

const MOCK_COURSE_PACKAGES: CoursePackage[] = [
  {
    _id: '507f1f77bcf86cd799439011',
    title: '客戶服務培訓',
    description: '提升客戶服務技巧和問題處理能力',
    units: [],
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  },
  {
    _id: '507f1f77bcf86cd799439012',
    title: '銷售技巧培訓',
    description: '通過角色扮演學習銷售溝通技巧，提升成交率',
    units: [],
    created_at: new Date('2024-01-02T00:00:00Z'),
    updated_at: new Date('2024-01-02T00:00:00Z'),
  }
];

// API 返回的格式（日期是字串）
const MOCK_COURSE_PACKAGES_RESPONSE = [
  {
    _id: '507f1f77bcf86cd799439011',
    title: '客戶服務培訓',
    description: '提升客戶服務技巧和問題處理能力',
    units: [],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439012',
    title: '銷售技巧培訓',
    description: '通過角色扮演學習銷售溝通技巧，提升成交率',
    units: [],
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  }
];

describe('CoursePackages Collection API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 MongoDB 連接 mock
    const { getCoursePackagesCollection, getUnitsCollection } = require('@/lib/mongodb');
    getCoursePackagesCollection.mockResolvedValue(mockCoursePackagesCollection);
    getUnitsCollection.mockResolvedValue(mockUnitsCollection);
    
    // 設置預設的 mock 行為
    mockSort.mockReturnValue({
      toArray: mockToArray
    });
    mockToArray.mockResolvedValue(MOCK_COURSE_PACKAGES);
  });

  describe('GET /api/course-packages', () => {
    test('應該成功獲取所有課程包', async () => {
      // 準備
      const request = new NextRequest('http://localhost:3000/api/course-packages');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(MOCK_COURSE_PACKAGES_RESPONSE);
      expect(data.message).toBe('成功獲取課程包列表');
      expect(mockCoursePackagesCollection.find).toHaveBeenCalledWith({});
      expect(mockSort).toHaveBeenCalledWith({ created_at: -1 });
    });

    test('應該支援按標題搜尋課程包', async () => {
      // 準備
      const filteredCoursePackages = [MOCK_COURSE_PACKAGES[0]];
      const filteredResponse = [MOCK_COURSE_PACKAGES_RESPONSE[0]];
      mockToArray.mockResolvedValue(filteredCoursePackages);
      const request = new NextRequest('http://localhost:3000/api/course-packages?title=客戶服務');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(filteredResponse);
      expect(mockCoursePackagesCollection.find).toHaveBeenCalledWith({
        title: { $regex: '客戶服務', $options: 'i' }
      });
    });

    test('應該支援包含關卡數據的查詢', async () => {
      // 準備
      const mockUnits = [
        {
          _id: '507f1f77bcf86cd799439020',
          title: '客戶問候練習',
          course_package_id: '507f1f77bcf86cd799439011',
          agent_role: '客戶服務代表',
          user_role: '客戶',
          intro_message: '歡迎來到客戶問候練習',
          outro_message: '很好！您已經掌握了基本問候技巧',
          max_turns: 5,
          agent_behavior_prompt: '請扮演一位專業的客戶服務代表',
          pass_condition: { type: 'keyword', value: ['完成'] },
          order: 1,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
        }
      ];

      // 設置 units collection mock
      const mockUnitsSort = jest.fn(() => ({
        toArray: jest.fn().mockResolvedValue(mockUnits)
      }));
      const mockUnitsFind = jest.fn(() => ({
        sort: mockUnitsSort
      }));
      mockUnitsCollection.find = mockUnitsFind;
      
      const request = new NextRequest('http://localhost:3000/api/course-packages?include_units=true');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data[0].units).toBeDefined();
      expect(data.data[0].units.length).toBe(1);
      expect(mockUnitsFind).toHaveBeenCalledWith({ 
        course_package_id: '507f1f77bcf86cd799439011' 
      });
    });

    test('應該支援日期範圍過濾', async () => {
      // 準備
      const filteredCoursePackages = [MOCK_COURSE_PACKAGES[1]];
      mockToArray.mockResolvedValue(filteredCoursePackages);
      const request = new NextRequest('http://localhost:3000/api/course-packages?created_after=2024-01-01T12:00:00Z&created_before=2024-01-03T00:00:00Z');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCoursePackagesCollection.find).toHaveBeenCalledWith({
        created_at: {
          $gte: new Date('2024-01-01T12:00:00Z'),
          $lte: new Date('2024-01-03T00:00:00Z')
        }
      });
    });

    test('應該返回空陣列當沒有找到課程包', async () => {
      // 準備
      mockToArray.mockResolvedValue([]);
      const request = new NextRequest('http://localhost:3000/api/course-packages');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.message).toBe('成功獲取課程包列表');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getCoursePackagesCollection } = require('@/lib/mongodb');
      getCoursePackagesCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest('http://localhost:3000/api/course-packages');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('獲取課程包列表失敗');
      expect(data.message).toBe(errorMessage);
    });
  });

  describe('POST /api/course-packages', () => {
    test('應該成功創建新的課程包', async () => {
      // 準備
      mockCoursePackagesCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/course-packages', {
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
      expect(data.data.description).toBe(MOCK_CREATE_INPUT.description);
      expect(data.data.units).toEqual([]);
      expect(data.data.created_at).toBeDefined();
      expect(data.data.updated_at).toBeDefined();
      expect(data.message).toBe('成功創建課程包');
    });

    test('應該驗證必填欄位 - 缺少標題', async () => {
      // 準備
      const invalidInput = {
        description: '描述',
        units: []
      };
      const request = new NextRequest('http://localhost:3000/api/course-packages', {
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
      expect(data.message).toBe('請確認標題和描述已填寫');
    });

    test('應該驗證必填欄位 - 缺少描述', async () => {
      // 準備
      const invalidInput = {
        title: '標題',
        units: []
      };
      const request = new NextRequest('http://localhost:3000/api/course-packages', {
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
      expect(data.message).toBe('請確認標題和描述已填寫');
    });

    test('應該處理資料庫插入失敗', async () => {
      // 準備
      mockCoursePackagesCollection.insertOne.mockResolvedValue({ acknowledged: false });
      const request = new NextRequest('http://localhost:3000/api/course-packages', {
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
      expect(data.error).toBe('創建課程包失敗');
      expect(data.message).toBe('插入資料庫失敗');
    });

    test('應該處理 JSON 解析錯誤', async () => {
      // 準備
      const request = new NextRequest('http://localhost:3000/api/course-packages', {
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
      expect(data.error).toBe('創建課程包失敗');
    });

    test('應該處理資料庫連接錯誤', async () => {
      // 準備
      const errorMessage = 'Database connection failed';
      const { getCoursePackagesCollection } = require('@/lib/mongodb');
      getCoursePackagesCollection.mockRejectedValue(new Error(errorMessage));
      const request = new NextRequest('http://localhost:3000/api/course-packages', {
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
      expect(data.error).toBe('創建課程包失敗');
      expect(data.message).toBe(errorMessage);
    });
  });

  describe('輸入輸出一致性測試', () => {
    test('創建的課程包應該與輸入數據一致', async () => {
      // 準備
      mockCoursePackagesCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/course-packages', {
        method: 'POST',
        body: JSON.stringify(MOCK_CREATE_INPUT),
        headers: { 'Content-Type': 'application/json' }
      });

      // 執行
      const response = await POST(request);
      const data = await response.json();

      // 驗證輸入輸出一致性
      expect(data.data.title).toBe(MOCK_CREATE_INPUT.title);
      expect(data.data.description).toBe(MOCK_CREATE_INPUT.description);
      expect(data.data.units).toEqual(MOCK_CREATE_INPUT.units);
      
      // 驗證系統生成的欄位
      expect(data.data._id).toBeDefined();
      expect(data.data.created_at).toBeDefined();
      expect(data.data.updated_at).toBeDefined();
      expect(new Date(data.data.created_at)).toBeInstanceOf(Date);
      expect(new Date(data.data.updated_at)).toBeInstanceOf(Date);
    });

    test('時間戳格式應該一致', async () => {
      // 準備
      mockToArray.mockResolvedValue(MOCK_COURSE_PACKAGES);
      const request = new NextRequest('http://localhost:3000/api/course-packages');

      // 執行
      const response = await GET(request);
      const data = await response.json();

      // 驗證時間戳格式
      data.data.forEach((coursePackage: any) => {
        expect(coursePackage.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(coursePackage.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(new Date(coursePackage.created_at)).toBeInstanceOf(Date);
        expect(new Date(coursePackage.updated_at)).toBeInstanceOf(Date);
      });
    });

    test('ObjectId 格式應該一致', async () => {
      // 準備
      mockCoursePackagesCollection.insertOne.mockResolvedValue({ acknowledged: true });
      const request = new NextRequest('http://localhost:3000/api/course-packages', {
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
  });
});
