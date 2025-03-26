import { NextResponse } from 'next/server';
import { getCountryById } from '../../../lib/services/countryService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const country = await getCountryById((await params).id);
    
    if (!country) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(country);
  } catch (error) {
    console.error('Error fetching country:', error);
    return NextResponse.json(
      { error: 'Failed to fetch country' },
      { status: 500 }
    );
  }
}
