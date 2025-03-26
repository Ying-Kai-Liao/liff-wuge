import { NextResponse } from 'next/server';
import { 
  getUserProfile, 
  addToInquiry, 
  removeFromInquiry, 
  clearInquiry 
} from '../../../../lib/services/userService';
import { InquiryItem } from '../../../../types';

// Get user's inquiry list
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userProfile = await getUserProfile(params.id);
    
    if (!userProfile) {
      return NextResponse.json({ inquiryList: [] });
    }
    
    return NextResponse.json({ inquiryList: userProfile.inquiryList || [] });
  } catch (error) {
    console.error('Error fetching user inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiry list' },
      { status: 500 }
    );
  }
}

// Add item to inquiry list
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    
    if (!body.planId || !body.carrierId || !body.countryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const item: Omit<InquiryItem, 'addedAt'> = {
      planId: body.planId,
      carrierId: body.carrierId,
      countryId: body.countryId
    };
    
    await addToInquiry(userId, item);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding to inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to add to inquiry list' },
      { status: 500 }
    );
  }
}

// Remove item from inquiry list
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    await removeFromInquiry(userId, planId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to remove from inquiry list' },
      { status: 500 }
    );
  }
}
