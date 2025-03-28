import { NextResponse } from 'next/server';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

// GET /api/admin/data?type=countries|carriers|plans
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
  if (!type || !['countries', 'carriers', 'plans'].includes(type)) {
    return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, type));
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(items);
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    return NextResponse.json({ error: `Failed to fetch ${type}` }, { status: 500 });
  }
}

// DELETE /api/admin/data?type=countries|carriers|plans&id=documentId
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  
  if (!type || !['countries', 'plans'].includes(type)) {
    return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
  }
  
  if (!id) {
    return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
  }
  
  try {
    await deleteDoc(doc(db, type, id));
    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error(`Error deleting ${type} ${id}:`, error);
    return NextResponse.json({ error: `Failed to delete document` }, { status: 500 });
  }
}
