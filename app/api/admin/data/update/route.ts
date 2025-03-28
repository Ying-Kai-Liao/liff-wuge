import { NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

// PUT /api/admin/data/update
export async function PUT(request: Request) {
  try {
    const { type, id, data } = await request.json();
    
    if (!type || !['countries', 'plans'].includes(type)) {
      return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }
    
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }
    
    // Check if document exists
    const docRef = doc(db, type, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return NextResponse.json({ error: `${type === 'countries' ? 'Country' : 'Plan'} not found` }, { status: 404 });
    }
    
    // Add timestamp
    const dataWithTimestamp = {
      ...data,
      updatedAt: new Date()
    };
    
    // Update document in Firestore
    await updateDoc(docRef, dataWithTimestamp);
    
    return NextResponse.json({ 
      success: true, 
      message: `${type === 'countries' ? 'Country' : 'Plan'} updated successfully`,
      id
    });
  } catch (error) {
    console.error('Error updating data:', error);
    return NextResponse.json({ 
      error: 'Failed to update data' 
    }, { status: 500 });
  }
}
