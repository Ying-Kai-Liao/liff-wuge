import { NextResponse } from 'next/server';
import { getCarriersByCountry } from '../../lib/services/carrierService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryId = searchParams.get('countryId');
  
  if (!countryId) {
    return NextResponse.json(
      { error: 'Country ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const carriers = await getCarriersByCountry(countryId);
    return NextResponse.json(carriers);
  } catch (error) {
    console.error('Error fetching carriers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carriers' },
      { status: 500 }
    );
  }
}
