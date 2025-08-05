/**
 * 數據驗證功能測試
 * 確保輸入驗證邏輯的一致性
 */

import { 
  validateAgentProfile,
  formatValidationErrors,
  isValidObjectId 
} from '@/types';
import { AgentProfile } from '@/types';

describe('數據驗證功能測試', () => {
  describe('validateAgentProfile', () => {
    test('應該通過有效的代理人資料驗證', () => {
      const validAgent = {
        name: '有效代理人',
        persona: {
          tone: '友善',
          background: '專業顧問',
          voice: '溫暖'
        },
        memory_config: {
          memory_ids: [],
          cold_memory_ids: []
        }
      };

      const errors = validateAgentProfile(validAgent);
      expect(errors).toHaveLength(0);
    });

    test('應該拒絕空的代理人名稱', () => {
      const invalidAgent = {
        name: '',
        persona: {
          tone: '友善',
          background: '專業顧問',
          voice: '溫暖'
        },
        memory_config: {
          memory_ids: [],
          cold_memory_ids: []
        }
      };

      const errors = validateAgentProfile(invalidAgent);
      expect(errors).toContain('代理人名稱為必填欄位');
    });

    test('應該拒絕缺少名稱的代理人資料', () => {
      const invalidAgent = {
        persona: {
          tone: '友善',
          background: '專業顧問',
          voice: '溫暖'
        },
        memory_config: {
          memory_ids: [],
          cold_memory_ids: []
        }
      };

      const errors = validateAgentProfile(invalidAgent);
      expect(errors).toContain('代理人名稱為必填欄位');
    });

    test('應該拒絕過長的代理人名稱', () => {
      const invalidAgent = {
        name: 'a'.repeat(101), // 假設限制為 100 個字符
        persona: {
          tone: '友善',
          background: '專業顧問',
          voice: '溫暖'
        },
        memory_config: {
          memory_ids: [],
          cold_memory_ids: []
        }
      };

      const errors = validateAgentProfile(invalidAgent);
      expect(errors.some(error => error.includes('名稱長度不能超過'))).toBe(true);
    });

    test('應該接受部分欄位的更新資料', () => {
      const partialAgent = {
        name: '部分更新的代理人'
      };

      const errors = validateAgentProfile(partialAgent);
      expect(errors).toHaveLength(0);
    });

    test('應該驗證記憶配置中的 ObjectId 格式', () => {
      const invalidAgent = {
        name: '測試代理人',
        memory_config: {
          memory_ids: [
            {
              _id: 'invalid-id',
              type: 'hot' as const,
              content: '測試記憶',
              tags: [],
              agent_id: '507f1f77bcf86cd799439011',
              created_by_user_id: '507f1f77bcf86cd799439011',
              created_at: new Date()
            }
          ],
          cold_memory_ids: []
        }
      };

      const errors = validateAgentProfile(invalidAgent);
      expect(errors.some(error => error.includes('記憶 ID 格式無效'))).toBe(true);
    });
  });

  describe('isValidObjectId', () => {
    test('應該接受有效的 ObjectId', () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '000000000000000000000000',
        'ffffffffffffffffffffffff'
      ];

      validIds.forEach(id => {
        expect(isValidObjectId(id)).toBe(true);
      });
    });

    test('應該拒絕無效的 ObjectId', () => {
      const invalidIds = [
        'invalid-id',
        '507f1f77bcf86cd79943901', // 太短
        '507f1f77bcf86cd799439011z', // 包含非十六進制字符
        '507f1f77bcf86cd799439011aa', // 太長
        '',
        null,
        undefined
      ];

      invalidIds.forEach(id => {
        expect(isValidObjectId(id as string)).toBe(false);
      });
    });
  });

  describe('formatValidationErrors', () => {
    test('應該格式化單個錯誤', () => {
      const errors = ['代理人名稱為必填欄位'];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe('代理人名稱為必填欄位');
    });

    test('應該格式化多個錯誤', () => {
      const errors = [
        '代理人名稱為必填欄位',
        '記憶 ID 格式無效'
      ];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('代理人名稱為必填欄位');
      expect(formatted).toContain('記憶 ID 格式無效');
    });

    test('應該處理空錯誤陣列', () => {
      const errors: string[] = [];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe('');
    });
  });

  describe('完整的驗證流程測試', () => {
    test('應該模擬真實的 API 驗證流程', () => {
      // 模擬從前端收到的資料
      const frontendData = {
        name: '前端提交的代理人',
        persona: {
          tone: '專業友善',
          background: '客戶服務專家',
          voice: '清晰親切'
        },
        memory_config: {
          memory_ids: [],
          cold_memory_ids: []
        }
      };

      // 進行驗證
      const errors = validateAgentProfile(frontendData);

      // 應該通過驗證
      expect(errors).toHaveLength(0);

      // 如果有錯誤，格式化錯誤訊息
      if (errors.length > 0) {
        const errorMessage = formatValidationErrors(errors);
        expect(typeof errorMessage).toBe('string');
      }
    });

    test('應該確保驗證規則的一致性', () => {
      // 測試多個類似的無效輸入，確保驗證結果一致
      const invalidInputs = [
        { name: '' },
        { name: '   ' }, // 只有空格
        { name: '\t\n' }, // 只有空白字符
      ];

      invalidInputs.forEach(input => {
        const errors = validateAgentProfile(input);
        expect(errors).toContain('代理人名稱為必填欄位');
      });
    });

    test('應該驗證嵌套物件的完整性', () => {
      const validNestedData = {
        name: '測試代理人',
        persona: {
          tone: '友善',
          background: '專業',
          voice: '清晰'
        },
        memory_config: {
          memory_ids: [],
          cold_memory_ids: []
        }
      };

      const errors = validateAgentProfile(validNestedData);
      expect(errors).toHaveLength(0);

      // 確保部分嵌套資料也能正確驗證
      const partialNestedData = {
        name: '測試代理人',
        persona: {
          tone: '友善',
          background: '專業',
          voice: '清晰'
        }
      };

      const partialErrors = validateAgentProfile(partialNestedData);
      expect(partialErrors).toHaveLength(0);
    });
  });
});
