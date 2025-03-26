import { NextResponse } from 'next/server';
import { getCarrierById } from '../../../lib/services/carrierService';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const carrier = await getCarrierById((await context.params).id);
    
    if (!carrier) {
      return NextResponse.json(
        { error: 'Carrier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(carrier);
  } catch (error) {
    console.error('Error fetching carrier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carrier' },
      { status: 500 }
    );
  }
}
