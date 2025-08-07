import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            FlowQuest
          </h1>
          <p className="text-gray-600">
            情境式對話訓練平台 - 透過 AI 代理人進行互動式學習體驗
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">🏗️ 專案架構</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✅ Next.js 15 with App Router</li>
              <li>✅ TypeScript 類型系統</li>
              <li>✅ Tailwind CSS 樣式框架</li>
              <li>✅ MongoDB 資料結構定義</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">📋 核心功能</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>📚 課程包管理 (已完成)</li>
              <li>🎯 關卡管理 (整合至課程包)</li>
              <li>🤖 AI 代理人設定 (已完成)</li>
              <li>💭 記憶模組系統</li>
              <li>📊 互動記錄與報告</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">快速導航</h2>
          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <Link
              href="/course-packages"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              📚 課程包管理
            </Link>
            
            <Link
              href="/agents"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🤖 Agent 管理
            </Link>
            
            <Link
              href="/activities"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🎯 活動管理
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <ol className="font-mono list-inside list-decimal text-sm text-gray-600 space-y-2">
            <li>
              已完成基本的 TypeScript 類型定義在{" "}
              <code className="bg-gray-100 font-mono font-semibold px-1 py-0.5 rounded">
                src/types/
              </code>
            </li>
            <li>
              點擊上方按鈕查看類型系統演示
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
