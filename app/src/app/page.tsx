import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FlowQuest
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-2xl">
            情境式對話訓練平台 - 透過 AI 代理人進行互動式學習體驗
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">🏗️ 專案架構</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✅ Next.js 15 with App Router</li>
              <li>✅ TypeScript 類型系統</li>
              <li>✅ Tailwind CSS 樣式框架</li>
              <li>✅ MongoDB 資料結構定義</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border">
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
        
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            href="/course-packages"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-purple-600 text-white gap-2 hover:bg-purple-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            📚 課程包管理
          </Link>
          
          <Link
            href="/agents"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            🤖 Agent 管理
          </Link>
          
          <Link
            href="/activities"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            活動管理
          </Link>
          
         
        </div>
        
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left mt-8">
          <li className="mb-2 tracking-[-.01em]">
            已完成基本的 TypeScript 類型定義在{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/types/
            </code>
          </li>
          <li className="tracking-[-.01em]">
            點擊上方按鈕查看類型系統演示
          </li>
        </ol>

      </main>

    </div>
  );
}
