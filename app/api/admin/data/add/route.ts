import { NextResponse } from 'next/server';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

// POST /api/admin/data/add
export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();
    
    if (!type || !['countries', 'plans'].includes(type)) {
      return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }
    
    // Add timestamp
    const dataWithTimestamp = {
      ...data,
      createdAt: new Date()
    };
    
    // Add document to Firestore
    const docRef = await addDoc(collection(db, type), dataWithTimestamp);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: 'Document added successfully' 
    });
  } catch (error) {
    console.error('Error adding document:', error);
    return NextResponse.json({ error: 'Failed to add document' }, { status: 500 });
  }
}
