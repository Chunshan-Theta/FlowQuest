import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SimpleChatRequest, SimpleChatResponse } from '@/types';
import { getOpenAIClient } from '@/lib/openai';

// 懶加載 OpenAI 客戶端，只在需要時初始化
function ensureOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
}

export async function POST(request: NextRequest) {
  try {
    // 檢查 API 金鑰是否設定
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API 金鑰未設定。請在環境變數中設定 OPENAI_API_KEY。',
        message: ''
      } as SimpleChatResponse, { status: 500 });
    }

    // 解析請求資料
    const { messages, max_tokens = 1000, temperature = 0.7 }: SimpleChatRequest = await request.json();

    // 驗證請求資料
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({
        success: false,
        error: '請求格式錯誤：需要提供訊息陣列',
        message: ''
      } as SimpleChatResponse, { status: 400 });
    }

    // 呼叫 OpenAI API
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: max_tokens,
      temperature: temperature,
    });

    // 取得回應訊息
    const responseMessage = completion.choices[0]?.message?.content;

    if (!responseMessage) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI 沒有回傳有效的回應',
        message: ''
      } as SimpleChatResponse, { status: 500 });
    }

    // 回傳成功回應
    return NextResponse.json({
      success: true,
      message: responseMessage,
    } as SimpleChatResponse);

  } catch (error) {
    console.error('Chat API 錯誤:', error);

    // 處理 OpenAI 特定錯誤
    if (error instanceof Error) {
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json({
          success: false,
          error: 'OpenAI API 配額不足，請檢查您的帳戶額度。',
          message: ''
        } as SimpleChatResponse, { status: 429 });
      } else if (error.message.includes('invalid_api_key')) {
        return NextResponse.json({
          success: false,
          error: 'OpenAI API 金鑰無效，請檢查環境變數設定。',
          message: ''
        } as SimpleChatResponse, { status: 401 });
      }
    }

    // 一般錯誤處理
    return NextResponse.json({
      success: false,
      error: '伺服器內部錯誤，請稍後再試。',
      message: ''
    } as SimpleChatResponse, { status: 500 });
  }
}

// 處理其他 HTTP 方法
export async function GET() {
  return NextResponse.json({
    success: false,
    error: '此端點僅支援 POST 請求',
    message: ''
  } as SimpleChatResponse, { status: 405 });
}
