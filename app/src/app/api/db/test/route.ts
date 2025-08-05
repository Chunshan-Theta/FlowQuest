import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/mongodb';
import { initializeDatabase } from '@/lib/init-db';

// GET /api/db/test - 測試數據庫連接
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const init = searchParams.get('init');
    
    // 測試連接
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: '數據庫連接失敗',
        message: '請檢查 MongoDB 服務是否正在運行和環境變數配置'
      }, { status: 500 });
    }
    
    let initResult = null;
    
    // 如果請求初始化
    if (init === 'true') {
      initResult = await initializeDatabase();
      if (!initResult) {
        return NextResponse.json({
          success: false,
          error: '數據庫初始化失敗',
          message: '連接成功但初始化過程中發生錯誤'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        connected: isConnected,
        initialized: initResult
      },
      message: `數據庫連接成功${initResult ? '，初始化完成' : ''}`
    });
  } catch (error) {
    console.error('數據庫測試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '數據庫測試失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
