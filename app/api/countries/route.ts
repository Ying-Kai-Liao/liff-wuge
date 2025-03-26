import { NextResponse } from 'next/server';
import { getAllCountries } from '../../lib/services/countryService';

export async function GET() {
  try {
    const countries = await getAllCountries();
    return NextResponse.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
