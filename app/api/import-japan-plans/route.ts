import { NextResponse } from 'next/server';
import { convertJapanPlans, JapanPlan } from '../../lib/seed-data';
import { addPlan } from '../../lib/services/planService';
import { getCarriersByCountry } from '../../lib/services/carrierService';

export async function POST(request: Request) {
  try {
    // Parse the request body to get the Japan plans
    const japanPlans = await request.json() as JapanPlan[];
    
    if (!Array.isArray(japanPlans) || japanPlans.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '無效的計劃數據格式' 
      }, { status: 400 });
    }
    
    // Get all carriers for Japan
    const japanCarriers = await getCarriersByCountry('jp-0');
    
    if (!japanCarriers || japanCarriers.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '找不到日本的電信商，請先執行資料庫種子填充' 
      }, { status: 404 });
    }
    
    // Group plans by carrier
    const plansByCarrier: Record<string, JapanPlan[]> = {};
    
    japanPlans.forEach(plan => {
      const carrierName = plan.carrier;
      if (!plansByCarrier[carrierName]) {
        plansByCarrier[carrierName] = [];
      }
      plansByCarrier[carrierName].push(plan);
    });
    
    // Import plans for each carrier
    let totalPlansAdded = 0;
    
    for (const [carrierName, plans] of Object.entries(plansByCarrier)) {
      // Find the matching carrier
      const carrier = japanCarriers.find(c => 
        c.name.toLowerCase().includes(carrierName.toLowerCase()) || 
        carrierName.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (carrier && carrier.id) {
        // Convert and add plans
        const convertedPlans = convertJapanPlans(carrier.id, plans);
        
        for (const plan of convertedPlans) {
          await addPlan(plan);
          totalPlansAdded++;
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `成功導入 ${totalPlansAdded} 個日本 eSIM 計劃`,
      totalPlansAdded
    });
  } catch (error) {
    console.error('導入日本計劃時出錯:', error);
    return NextResponse.json({ 
      success: false, 
      message: '導入日本計劃時出錯: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}
