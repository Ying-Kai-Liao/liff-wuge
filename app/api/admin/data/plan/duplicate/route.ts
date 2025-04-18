import { NextResponse } from 'next/server';
import { collection, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Plan } from '@/app/types';

// POST /api/admin/data/plan/duplicate
export async function POST(request: Request) {
  try {
    const { planId, changes } = await request.json();
    
    if (!planId) {
      return NextResponse.json({ error: 'Missing plan ID' }, { status: 400 });
    }
    
    // Get the original plan
    const planDoc = await getDoc(doc(db, 'plans', planId));
    
    if (!planDoc.exists()) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Create a new plan based on the original
    const originalPlan = planDoc.data() as Plan;
    
    // Apply changes if provided
    const newPlan = {
      ...originalPlan,
      ...changes,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Remove the id from the new plan (will be generated by Firestore)
    delete newPlan.id;
    
    // Add the new plan to Firestore
    const newPlanRef = await addDoc(collection(db, 'plans'), newPlan);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Plan duplicated successfully',
      id: newPlanRef.id
    });
  } catch (error) {
    console.error('Error duplicating plan:', error);
    return NextResponse.json({ 
      error: `Failed to duplicate plan: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
