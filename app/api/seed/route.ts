import { NextResponse } from 'next/server';
import { seedDatabase } from '../../lib/seed-data';

export async function POST() {
  try {
    const success = await seedDatabase();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: '資料庫填充成功！您現在可以瀏覽eSIM目錄。' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: '填充資料庫時發生錯誤，請查看控制台日誌。' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: '填充資料庫時發生錯誤：' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}
