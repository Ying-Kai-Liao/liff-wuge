import { NextResponse } from 'next/server';
import { getPlansByCarrier, getPlansByCountry, getAllPlans } from '../../lib/services/planService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const carrierId = searchParams.get('carrierId');
  const country = searchParams.get('country');
  
  try {
    let plans;
    
    if (carrierId) {
      // Get plans by carrier ID
      plans = await getPlansByCarrier(carrierId);
    } else if (country) {
      // Get plans by country
      plans = await getPlansByCountry(country);
    } else {
      // Get all plans if no filter is provided
      plans = await getAllPlans();
    }
    
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
