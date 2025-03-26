import { NextResponse } from 'next/server';
import { getPlansByCarrier } from '../../lib/services/planService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const carrierId = searchParams.get('carrierId');
  
  if (!carrierId) {
    return NextResponse.json(
      { error: 'Carrier ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const plans = await getPlansByCarrier(carrierId);
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
