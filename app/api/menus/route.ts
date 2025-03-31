import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

// GET /api/menus - Get all menus
export async function GET(request: NextRequest) {
  try {
    const menusCollection = collection(db, 'menus');
    const snapshot = await getDocs(menusCollection);
    
    const menus = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(menus, { status: 200 });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}

// POST /api/menus - Create a new menu
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.pdfUrl || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create a new menu document
    const menuData = {
      title: body.title,
      description: body.description || '',
      pdfUrl: body.pdfUrl,
      type: body.type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const menusCollection = collection(db, 'menus');
    const docRef = await addDoc(menusCollection, menuData);
    
    return NextResponse.json(
      { id: docRef.id, ...menuData },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { error: 'Failed to create menu' },
      { status: 500 }
    );
  }
}
