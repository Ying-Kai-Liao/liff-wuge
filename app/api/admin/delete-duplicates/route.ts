import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { 
  collection, 
  getDocs, 
  deleteDoc,
  doc
} from 'firebase/firestore';

interface Plan {
  id: string;
  carrierId: string;
  days: number;
  dataAmount: string;
  price: number;
  [key: string]: any;
}

export async function POST() {
  try {
    // Track statistics
    const stats = {
      plansChecked: 0,
      duplicatesFound: 0,
      duplicatesDeleted: 0,
      errors: 0
    };

    // Get all plans
    const plansRef = collection(db, 'plans');
    const plansSnapshot = await getDocs(plansRef);
    const plans = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Plan[];
    
    stats.plansChecked = plans.length;
    
    // Group plans by carrier and find duplicates
    const plansByCarrier: Record<string, Plan[]> = {};
    
    // First, group plans by carrier
    plans.forEach(plan => {
      const carrierId = plan.carrierId;
      if (!plansByCarrier[carrierId]) {
        plansByCarrier[carrierId] = [];
      }
      plansByCarrier[carrierId].push(plan);
    });
    
    // For each carrier, find and delete duplicates
    for (const carrierPlans of Object.values(plansByCarrier)) {
      // Skip if carrier has only one plan
      if (carrierPlans.length <= 1) continue;
      
      // Find duplicates (plans with same days and dataAmount)
      const uniquePlans: Record<string, Plan> = {};
      const duplicates: Plan[] = [];
      
      carrierPlans.forEach(plan => {
        // Create a key based on plan properties that should be unique
        const key = `${plan.days}-${plan.dataAmount}-${plan.price}`;
        
        if (uniquePlans[key]) {
          // This is a duplicate
          duplicates.push(plan);
          stats.duplicatesFound++;
        } else {
          // This is the first occurrence
          uniquePlans[key] = plan;
        }
      });
      
      // Delete duplicates
      for (const duplicate of duplicates) {
        try {
          await deleteDoc(doc(db, 'plans', duplicate.id));
          stats.duplicatesDeleted++;
        } catch (error) {
          console.error(`Error deleting duplicate plan ${duplicate.id}:`, error);
          stats.errors++;
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `已檢查 ${stats.plansChecked} 個方案，找到 ${stats.duplicatesFound} 個重複項目，成功刪除 ${stats.duplicatesDeleted} 個。${stats.errors > 0 ? `刪除過程中發生 ${stats.errors} 個錯誤。` : ''}`,
      stats
    });
  } catch (error) {
    console.error('Error deleting duplicates:', error);
    return NextResponse.json({ 
      success: false, 
      message: '刪除重複資料時發生錯誤: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}
