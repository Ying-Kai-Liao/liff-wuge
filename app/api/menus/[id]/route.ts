import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

// GET /api/menus/[id] - Get a specific menu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menuRef = doc(db, 'menus', id);
    const menuSnap = await getDoc(menuRef);
    
    if (!menuSnap.exists()) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { id: menuSnap.id, ...menuSnap.data() },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

// PUT /api/menus/[id] - Update a menu
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.pdfUrl || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const menuRef = doc(db, 'menus', id);
    const menuSnap = await getDoc(menuRef);
    
    if (!menuSnap.exists()) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }
    
    // Update the menu
    const menuData = {
      title: body.title,
      description: body.description || '',
      pdfUrl: body.pdfUrl,
      type: body.type,
      updatedAt: serverTimestamp(),
      createdAt: menuSnap.data().createdAt || serverTimestamp(),
    };
    
    await updateDoc(menuRef, menuData);
    
    return NextResponse.json(
      { id, ...menuData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json(
      { error: 'Failed to update menu' },
      { status: 500 }
    );
  }
}

// DELETE /api/menus/[id] - Delete a menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const menuRef = doc(db, 'menus', id);
    const menuSnap = await getDoc(menuRef);
    
    if (!menuSnap.exists()) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }
    
    await deleteDoc(menuRef);
    
    return NextResponse.json(
      { message: 'Menu deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu' },
      { status: 500 }
    );
  }
}
