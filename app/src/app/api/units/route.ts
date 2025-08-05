import { NextRequest, NextResponse } from 'next/server';
import { 
  Unit, 
  CreateUnitInput,
  UnitFilter,
  generateObjectId,
  isValidObjectId 
} from '@/types';
import { getUnitsCollection, getCoursePackagesCollection } from '@/lib/mongodb';

// GET /api/units - 獲取所有 units
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course_package_id = searchParams.get('course_package_id');
    const title = searchParams.get('title');
    const agent_role = searchParams.get('agent_role');
    const order_min = searchParams.get('order_min');
    const order_max = searchParams.get('order_max');
    
    const collection = await getUnitsCollection();
    
    // 構建查詢條件
    const query: any = {};
    if (course_package_id && isValidObjectId(course_package_id)) {
      query.course_package_id = course_package_id;
    }
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    if (agent_role) {
      query.agent_role = { $regex: agent_role, $options: 'i' };
    }
    if (order_min) {
      query.order = { ...query.order, $gte: parseInt(order_min) };
    }
    if (order_max) {
      query.order = { ...query.order, $lte: parseInt(order_max) };
    }
    
    const units = await collection.find(query).sort({ order: 1 }).toArray();
    
    return NextResponse.json({
      success: true,
      data: units,
      message: '成功獲取關卡列表'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '獲取關卡列表失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// POST /api/units - 創建新的 unit
export async function POST(request: NextRequest) {
  try {
    const body: CreateUnitInput = await request.json();
    
    // 基本驗證
    if (!body.title || !body.course_package_id || !body.agent_role || !body.user_role) {
      return NextResponse.json({
        success: false,
        error: '必填欄位缺失',
        message: '請確認所有必填欄位已填寫'
      }, { status: 400 });
    }
    
    if (!isValidObjectId(body.course_package_id)) {
      return NextResponse.json({
        success: false,
        error: '課程包 ID 格式無效',
        message: '請提供有效的課程包 ID'
      }, { status: 400 });
    }

    // 驗證數值參數
    if (body.max_turns !== undefined && (typeof body.max_turns !== 'number' || body.max_turns <= 0)) {
      return NextResponse.json({
        success: false,
        error: '參數驗證失敗',
        message: 'max_turns 必須是正整數'
      }, { status: 400 });
    }

    if (body.order !== undefined && (typeof body.order !== 'number' || body.order <= 0)) {
      return NextResponse.json({
        success: false,
        error: '參數驗證失敗',
        message: 'order 必須是正整數'
      }, { status: 400 });
    }

    // 驗證課程包是否存在
    const coursePackagesCollection = await getCoursePackagesCollection();
    const coursePackage = await coursePackagesCollection.findOne({ _id: body.course_package_id });
    
    if (!coursePackage) {
      return NextResponse.json({
        success: false,
        error: '課程包不存在',
        message: '指定的課程包不存在，請檢查 course_package_id'
      }, { status: 400 });
    }

    const collection = await getUnitsCollection();    // 創建新的 unit
    const newUnit: Unit = {
      _id: generateObjectId(),
      ...body,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const result = await collection.insertOne(newUnit);
    
    if (!result.acknowledged) {
      throw new Error('插入資料庫失敗');
    }
    
    return NextResponse.json({
      success: true,
      data: newUnit,
      message: '成功創建關卡'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '創建關卡失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
