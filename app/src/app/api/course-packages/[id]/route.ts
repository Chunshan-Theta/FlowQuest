import { NextRequest, NextResponse } from 'next/server';
import { 
  CoursePackage, 
  UpdateCoursePackageInput,
  isValidObjectId 
} from '@/types';
import { getCoursePackagesCollection, getUnitsCollection } from '@/lib/mongodb';

// GET /api/course-packages/[id] - 根據 ID 獲取單一 course package
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const include_units = searchParams.get('include_units') === 'true';
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID 格式無效',
        message: '請提供有效的課程包 ID'
      }, { status: 400 });
    }
    
    const collection = await getCoursePackagesCollection();
    const coursePackage = await collection.findOne({ _id: id });
    
    if (!coursePackage) {
      return NextResponse.json({
        success: false,
        error: '找不到課程包',
        message: `ID 為 ${id} 的課程包不存在`
      }, { status: 404 });
    }
    
    // 如果需要包含 units 資料
    if (include_units) {
      const unitsCollection = await getUnitsCollection();
      const units = await unitsCollection
        .find({ course_package_id: id })
        .sort({ order: 1 })
        .toArray();
      coursePackage.units = units;
    }
    
    return NextResponse.json({
      success: true,
      data: coursePackage,
      message: '成功獲取課程包'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '獲取課程包失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// PUT /api/course-packages/[id] - 更新 course package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<UpdateCoursePackageInput> = await request.json();
    
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID 格式無效',
        message: '請提供有效的課程包 ID'
      }, { status: 400 });
    }
    
    const collection = await getCoursePackagesCollection();
    
    // 檢查 course package 是否存在
    const existingCoursePackage = await collection.findOne({ _id: id });
    if (!existingCoursePackage) {
      return NextResponse.json({
        success: false,
        error: '找不到課程包',
        message: `ID 為 ${id} 的課程包不存在`
      }, { status: 404 });
    }
    
    // 更新 course package
    const updateData = {
      ...body,
      updated_at: new Date(),
    };
    
    const result = await collection.updateOne({ _id: id }, { $set: updateData });
    
    if (!result.acknowledged) {
      throw new Error('更新資料庫失敗');
    }

    // 獲取更新後的資料
    const updatedCoursePackage = await collection.findOne({ _id: id });
    
    return NextResponse.json({
      success: true,
      data: updatedCoursePackage,
      message: '成功更新課程包'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '更新課程包失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// DELETE /api/course-packages/[id] - 刪除 course package
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
        message: '請提供有效的課程包 ID'
      }, { status: 400 });
    }
    
    const collection = await getCoursePackagesCollection();
    const unitsCollection = await getUnitsCollection();
    
    // 檢查 course package 是否存在
    const existingCoursePackage = await collection.findOne({ _id: id });
    if (!existingCoursePackage) {
      return NextResponse.json({
        success: false,
        error: '找不到課程包',
        message: `ID 為 ${id} 的課程包不存在`
      }, { status: 404 });
    }
    
    // 檢查是否有關聯的 units
    const relatedUnits = await unitsCollection.countDocuments({ course_package_id: id });
    if (relatedUnits > 0) {
      return NextResponse.json({
        success: false,
        error: '無法刪除課程包',
        message: '此課程包包含關卡，請先刪除所有關卡'
      }, { status: 400 });
    }
    
    const result = await collection.deleteOne({ _id: id });
    
    if (!result.acknowledged) {
      throw new Error('刪除資料庫失敗');
    }
    
    return NextResponse.json({
      success: true,
      data: existingCoursePackage,
      message: '成功刪除課程包'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '刪除課程包失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
