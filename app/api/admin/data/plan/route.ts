import { NextResponse } from 'next/server';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

// POST /api/admin/data/plan/duplicate
// Duplicates a plan with optional changes
export async function POST(request: Request) {
  try {
    const { planId, changes = {} } = await request.json();
    
    if (!planId) {
      return NextResponse.json({ error: 'Missing plan ID' }, { status: 400 });
    }
    
    // Get the original plan
    const planDoc = await getDoc(doc(db, 'plans', planId));
    
    if (!planDoc.exists()) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Create a new plan based on the original with changes
    const originalPlan = planDoc.data();
    const newPlan = {
      ...originalPlan,
      ...changes,
      createdAt: new Date(),
      duplicatedFrom: planId
    };
    
    // Add the new plan
    const newPlanRef = await addDoc(collection(db, 'plans'), newPlan);
    
    return NextResponse.json({ 
      success: true, 
      id: newPlanRef.id,
      message: 'Plan duplicated successfully' 
    });
  } catch (error) {
    console.error('Error duplicating plan:', error);
    return NextResponse.json({ error: 'Failed to duplicate plan' }, { status: 500 });
  }
}

// PUT /api/admin/data/plan/migrate
// Migrates a plan to a different country
export async function PUT(request: Request) {
  try {
    const { planId, newCountryId, newCountryName } = await request.json();
    
    if (!planId || !newCountryId || !newCountryName) {
      return NextResponse.json({ 
        error: 'Missing required fields: planId, newCountryId, newCountryName' 
      }, { status: 400 });
    }
    
    // Get the original plan
    const planDoc = await getDoc(doc(db, 'plans', planId));
    
    if (!planDoc.exists()) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Create an updated plan with the new country
    const originalPlan = planDoc.data();
    const updatedPlan = {
      ...originalPlan,
      countryId: newCountryId,
      country: newCountryName,
      updatedAt: new Date()
    };
    
    // Add the new plan (we're creating a new one rather than updating to keep history)
    const newPlanRef = await addDoc(collection(db, 'plans'), updatedPlan);
    
    return NextResponse.json({ 
      success: true, 
      id: newPlanRef.id,
      message: 'Plan migrated successfully' 
    });
  } catch (error) {
    console.error('Error migrating plan:', error);
    return NextResponse.json({ error: 'Failed to migrate plan' }, { status: 500 });
  }
}
