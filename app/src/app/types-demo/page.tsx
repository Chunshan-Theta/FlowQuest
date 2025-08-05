'use client';

import React from 'react';
import { 
  EXAMPLES, 
  validateCoursePackage, 
  validateUnit,
  formatValidationErrors,
  generateObjectId,
} from '@/types';

export default function TypesDemo() {
  const handleTestValidation = () => {
    // 測試課程包驗證
    console.log('=== 課程包驗證測試 ===');
    const coursePackageErrors = validateCoursePackage(EXAMPLES.COURSE_PACKAGE);
    console.log('課程包驗證結果:', coursePackageErrors.length === 0 ? '通過' : formatValidationErrors(coursePackageErrors));
    
    // 測試關卡驗證
    console.log('=== 關卡驗證測試 ===');
    const unitErrors = validateUnit(EXAMPLES.UNITS[0]);
    console.log('關卡驗證結果:', unitErrors.length === 0 ? '通過' : formatValidationErrors(unitErrors));
    
    // 生成新 ID
    console.log('=== 新 ID 生成 ===');
    console.log('新 ObjectId:', generateObjectId());
  };

  const handleShowExampleData = () => {
    console.log('=== 範例資料 ===');
    console.log('課程包:', EXAMPLES.COURSE_PACKAGE);
    console.log('關卡列表:', EXAMPLES.UNITS);
    console.log('代理人檔案:', EXAMPLES.AGENT_PROFILE);
    console.log('記憶資料:', EXAMPLES.MEMORIES);
    console.log('活動實例:', EXAMPLES.ACTIVITY);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🚀 FlowQuest 類型系統演示
          </h1>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                📋 已定義的資料結構
              </h2>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>✅ CoursePackage - 課程包</li>
                <li>✅ Unit - 關卡</li>
                <li>✅ AgentProfile - 代理人檔案</li>
                <li>✅ AgentMemory - 記憶模組</li>
                <li>✅ Activity - 活動實例</li>
                <li>✅ InteractionLog - 互動記錄</li>
                <li>✅ InteractionReport - 報告</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-800 mb-4">
                🛠️ 工具函數
              </h2>
              <ul className="space-y-2 text-sm text-green-700">
                <li>✅ 資料驗證函數</li>
                <li>✅ 類型守衛函數</li>
                <li>✅ 工具函數</li>
                <li>✅ 常數定義</li>
                <li>✅ 範例資料</li>
                <li>✅ 錯誤處理</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">
              📝 範例課程：{EXAMPLES.COURSE_PACKAGE.title}
            </h2>
            <p className="text-yellow-700 mb-4">
              {EXAMPLES.COURSE_PACKAGE.description}
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {EXAMPLES.UNITS.map((unit) => (
                <div key={unit._id} className="bg-white p-4 rounded border">
                  <h3 className="font-semibold text-sm mb-2">{unit.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {unit.agent_role} vs {unit.user_role}
                  </p>
                  <p className="text-xs text-gray-500">
                    最大回合數: {unit.max_turns}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleTestValidation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🧪 測試驗證函數
            </button>
            
            <button
              onClick={handleShowExampleData}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              📊 顯示範例資料
            </button>
            
            <button
              onClick={() => window.open('https://www.mongodb.com/docs/manual/reference/bson-types/', '_blank')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              📚 MongoDB BSON 文檔
            </button>
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💡 使用方式
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>1. 打開瀏覽器的開發者工具 (F12) 查看 Console 輸出</p>
              <p>2. 點擊上方按鈕來測試不同功能</p>
              <p>3. 在 <code className="bg-gray-200 px-1 rounded">src/types/</code> 目錄中查看完整的類型定義</p>
              <p>4. 使用 <code className="bg-gray-200 px-1 rounded">import &#123; ... &#125; from &apos;@/types&apos;</code> 來匯入需要的類型</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
