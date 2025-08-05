import { NextRequest, NextResponse } from 'next/server';
import { 
  CoursePackage, 
  CreateCoursePackageInput,
  CoursePackageFilter,
  generateObjectId 
} from '@/types';
import { getCoursePackagesCollection, getUnitsCollection } from '@/lib/mongodb';

// GET /api/course-packages - 獲取所有 course packages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const created_after = searchParams.get('created_after');
    const created_before = searchParams.get('created_before');
    const include_units = searchParams.get('include_units') === 'true';
    
    const collection = await getCoursePackagesCollection();
    
    // 構建查詢條件
    const query: any = {};
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    if (created_after || created_before) {
      query.created_at = {};
      if (created_after) {
        query.created_at.$gte = new Date(created_after);
      }
      if (created_before) {
        query.created_at.$lte = new Date(created_before);
      }
    }
    
    let coursePackages = await collection.find(query).sort({ created_at: -1 }).toArray();
    
    // 如果需要包含 units 資料
    if (include_units) {
      const unitsCollection = await getUnitsCollection();
      
      for (let i = 0; i < coursePackages.length; i++) {
        const units = await unitsCollection
          .find({ course_package_id: coursePackages[i]._id })
          .sort({ order: 1 })
          .toArray();
        coursePackages[i].units = units;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: coursePackages,
      message: '成功獲取課程包列表'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '獲取課程包列表失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// POST /api/course-packages - 創建新的 course package
export async function POST(request: NextRequest) {
  try {
    const body: CreateCoursePackageInput = await request.json();
    
    // 基本驗證
    if (!body.title || !body.description) {
      return NextResponse.json({
        success: false,
        error: '必填欄位缺失',
        message: '請確認標題和描述已填寫'
      }, { status: 400 });
    }
    
    const collection = await getCoursePackagesCollection();
    
    // 創建新的 course package
    const newCoursePackage: CoursePackage = {
      _id: generateObjectId(),
      title: body.title,
      description: body.description,
      units: body.units || [],
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const result = await collection.insertOne(newCoursePackage);
    
    if (!result.acknowledged) {
      throw new Error('插入資料庫失敗');
    }
    
    return NextResponse.json({
      success: true,
      data: newCoursePackage,
      message: '成功創建課程包'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '創建課程包失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
