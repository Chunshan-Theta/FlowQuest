import { NextRequest, NextResponse } from 'next/server';
import { 
  Unit, 
  UpdateUnitInput,
  isValidObjectId 
} from '@/types';
import { getUnitsCollection } from '@/lib/mongodb';

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
        message: '請提供有效的 Unit ID'
      }, { status: 400 });
    }
    
    const collection = await getUnitsCollection();
    const unit = await collection.findOne({ _id: id });
    
    if (!unit) {
      return NextResponse.json({
        success: false,
        error: '找不到 Unit',
        message: `ID 為 ${id} 的 Unit 不存在`
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: unit,
      message: '成功獲取 Unit 詳情'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '獲取 Unit 詳情失敗',
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
        message: '請提供有效的 Unit ID'
      }, { status: 400 });
    }
    
    const collection = await getUnitsCollection();
    
    // 檢查 unit 是否存在
    const existingUnit = await collection.findOne({ _id: id });
    if (!existingUnit) {
      return NextResponse.json({
        success: false,
        error: '找不到 Unit',
        message: `ID 為 ${id} 的 Unit 不存在`
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
    
    // 更新 unit
    const updatedUnit: Unit = {
      ...existingUnit,
      ...body,
      _id: id,
      updated_at: new Date(),
    };
    
    const result = await collection.replaceOne({ _id: id }, updatedUnit);
    
    if (!result.acknowledged) {
      throw new Error('更新資料庫失敗');
    }
    
    return NextResponse.json({
      success: true,
      data: updatedUnit,
      message: '成功更新 Unit'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '更新 Unit 失敗',
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
        message: '請提供有效的 Unit ID'
      }, { status: 400 });
    }
    
    const collection = await getUnitsCollection();
    
    // 檢查 unit 是否存在
    const existingUnit = await collection.findOne({ _id: id });
    if (!existingUnit) {
      return NextResponse.json({
        success: false,
        error: '找不到 Unit',
        message: `ID 為 ${id} 的 Unit 不存在`
      }, { status: 404 });
    }
    
    const result = await collection.deleteOne({ _id: id });
    
    if (!result.acknowledged) {
      throw new Error('刪除資料庫失敗');
    }
    
    return NextResponse.json({
      success: true,
      data: existingUnit,
      message: '成功刪除 Unit'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '刪除 Unit 失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
