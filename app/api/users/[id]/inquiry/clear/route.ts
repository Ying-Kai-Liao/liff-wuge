import { NextResponse } from 'next/server';
import { clearInquiry } from '../../../../../lib/services/userService';

// Clear all items from inquiry list
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    await clearInquiry(userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to clear inquiry list' },
      { status: 500 }
    );
  }
}
