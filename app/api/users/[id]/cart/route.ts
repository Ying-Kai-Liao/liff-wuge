import { NextResponse } from 'next/server';
import { 
  getUserProfile, 
  addToCart, 
  removeFromCart
} from '../../../../lib/services/userService';
import { CartItem } from '../../../../types';

// Get user's cart
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userProfile = await getUserProfile((await params).id);
    
    if (!userProfile) {
      return NextResponse.json({ cart: [] });
    }
    
    return NextResponse.json({ cart: userProfile.cart || [] });
  } catch (error) {
    console.error('Error fetching user cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// Add item to cart
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await params).id;
    const body = await request.json();
    
    if (!body.planId || !body.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const item: Omit<CartItem, 'addedAt'> = {
      planId: body.planId,
      quantity: body.quantity,
    };
    
    await addToCart(userId, item);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

// Remove item from cart
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await params).id;
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId') || '';
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    await removeFromCart(userId, planId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove from cart' },
      { status: 500 }
    );
  }
}
