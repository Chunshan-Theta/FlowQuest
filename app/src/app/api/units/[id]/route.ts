import { NextRequest, NextResponse } from 'next/server';
import { 
  Unit, 
  UpdateUnitInput,
  isValidObjectId 
} from '@/types';
import { getUnitsCollection, getCoursePackagesCollection } from '@/lib/mongodb';

// GET /api/units/[id] - 根據 ID 獲取單一 unit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID 格式無效',
        message: '請提供有效的關卡 ID'
      }, { status: 400 });
    }
    
    const collection = await getUnitsCollection();
    const unit = await collection.findOne({ _id: id });
    
    if (!unit) {
      return NextResponse.json({
        success: false,
        error: '找不到關卡',
        message: `ID 為 ${id} 的關卡不存在`
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: unit,
      message: '成功獲取關卡'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '獲取關卡失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// PUT /api/units/[id] - 更新 unit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<UpdateUnitInput> = await request.json();
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID 格式無效',
        message: '請提供有效的關卡 ID'
      }, { status: 400 });
    }
    
    const collection = await getUnitsCollection();
    
    // 檢查 unit 是否存在
    const existingUnit = await collection.findOne({ _id: id });
    if (!existingUnit) {
      return NextResponse.json({
        success: false,
        error: '找不到關卡',
        message: `ID 為 ${id} 的關卡不存在`
      }, { status: 404 });
    }
    
    // 基本驗證
    if (body.course_package_id && !isValidObjectId(body.course_package_id)) {
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

    // 如果更新課程包ID，驗證課程包是否存在
    if (body.course_package_id) {
      const coursePackagesCollection = await getCoursePackagesCollection();
      const coursePackage = await coursePackagesCollection.findOne({ _id: body.course_package_id });
      
      if (!coursePackage) {
        return NextResponse.json({
          success: false,
          error: '課程包不存在',
          message: '指定的課程包不存在，請檢查 course_package_id'
        }, { status: 400 });
      }
    }
    
    // 更新 unit
    const updateData = {
      ...body,
      updated_at: new Date(),
    };
    
    const result = await collection.updateOne({ _id: id }, { $set: updateData });
    
    if (!result.acknowledged) {
      throw new Error('更新資料庫失敗');
    }

    // 獲取更新後的資料
    const updatedUnit = await collection.findOne({ _id: id });
    
    return NextResponse.json({
      success: true,
      data: updatedUnit,
      message: '成功更新關卡'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '更新關卡失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// DELETE /api/units/[id] - 刪除 unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID 格式無效',
        message: '請提供有效的關卡 ID'
      }, { status: 400 });
    }
    
    const collection = await getUnitsCollection();
    
    // 檢查 unit 是否存在
    const existingUnit = await collection.findOne({ _id: id });
    if (!existingUnit) {
      return NextResponse.json({
        success: false,
        error: '找不到關卡',
        message: `ID 為 ${id} 的關卡不存在`
      }, { status: 404 });
    }
    
    const result = await collection.deleteOne({ _id: id });
    
    if (!result.acknowledged) {
      throw new Error('刪除資料庫失敗');
    }
    
    return NextResponse.json({
      success: true,
      data: existingUnit,
      message: '成功刪除關卡'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '刪除關卡失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
