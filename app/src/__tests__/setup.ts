/**
 * Jest 設置文件
 * 配置測試環境的全局設置
 */

import '@testing-library/jest-dom';

// 模擬 MongoDB 連接
jest.mock('@/lib/mongodb', () => ({
  getAgentsCollection: jest.fn(),
}));

// 設置測試環境變數
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true
});
Object.defineProperty(process.env, 'MONGODB_URI', {
  value: 'mongodb://localhost:27017/flowquest-test',
  writable: true
});

// 全局測試設置
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  // 在測試環境中靜默日誌輸出，除非是錯誤
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error,
};
