import { NextResponse } from 'next/server';
import { collection, addDoc, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

// POST /api/admin/data/batch
export async function POST(request: Request) {
  try {
    const { action, planIds, targetCountryId, targetCountryName } = await request.json();
    
    if (!action || !planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request. Must provide action and planIds array.' 
      }, { status: 400 });
    }
    
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      newIds: [] as string[],
      errors: [] as string[]
    };
    
    // Handle different batch actions
    switch (action) {
      case 'delete':
        // Delete multiple plans
        for (const planId of planIds) {
          try {
            await deleteDoc(doc(db, 'plans', planId));
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to delete plan ${planId}: ${error}`);
          }
        }
        break;
        
      case 'duplicate':
        // Duplicate multiple plans
        for (const planId of planIds) {
          try {
            // Get original plan
            const planDoc = await getDoc(doc(db, 'plans', planId));
            
            if (!planDoc.exists()) {
              results.failed++;
              results.errors.push(`Plan ${planId} not found`);
              continue;
            }
            
            // Create a new plan based on the original
            const originalPlan = planDoc.data();
            const newPlan = {
              ...originalPlan,
              title: `${originalPlan.title} (複製)`,
              createdAt: new Date(),
              duplicatedFrom: planId
            };
            
            // Add the new plan
            const newPlanRef = await addDoc(collection(db, 'plans'), newPlan);
            results.processed++;
            results.newIds.push(newPlanRef.id);
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to duplicate plan ${planId}: ${error}`);
          }
        }
        break;
        
      case 'migrate':
        // Migrate multiple plans to a different country
        if (!targetCountryId || !targetCountryName) {
          return NextResponse.json({ 
            error: 'Missing targetCountryId or targetCountryName for migrate action' 
          }, { status: 400 });
        }
        
        for (const planId of planIds) {
          try {
            // Get original plan
            const planDoc = await getDoc(doc(db, 'plans', planId));
            
            if (!planDoc.exists()) {
              results.failed++;
              results.errors.push(`Plan ${planId} not found`);
              continue;
            }
            
            // Create an updated plan with the new country
            const originalPlan = planDoc.data();
            const updatedPlan = {
              ...originalPlan,
              countryId: targetCountryId,
              country: targetCountryName,
              updatedAt: new Date(),
              migratedFrom: planId
            };
            
            // Add the new plan
            const newPlanRef = await addDoc(collection(db, 'plans'), updatedPlan);
            results.processed++;
            results.newIds.push(newPlanRef.id);
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to migrate plan ${planId}: ${error}`);
          }
        }
        break;
        
      default:
        return NextResponse.json({ 
          error: `Unsupported action: ${action}` 
        }, { status: 400 });
    }
    
    // Set success to false if any operations failed
    if (results.failed > 0) {
      results.success = false;
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing batch operation:', error);
    return NextResponse.json({ 
      error: 'Failed to process batch operation' 
    }, { status: 500 });
  }
}
