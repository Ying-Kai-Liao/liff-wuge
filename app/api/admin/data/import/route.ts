import { NextResponse } from 'next/server';
import { collection, addDoc, getDoc, doc, query, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Country, Plan } from '@/app/types';

// POST /api/admin/data/import
export async function POST(request: Request) {
  try {
    const { countries, plans, updateExisting } = await request.json();
    
    interface ImportResults {
      countries: {
        added: number;
        skipped: number;
        errors: string[];
      };
      plans: {
        added: number;
        updated: number;
        skipped: number;
        errors: string[];
      };
    }
    
    const results: ImportResults = {
      countries: { added: 0, skipped: 0, errors: [] },
      plans: { added: 0, updated: 0, skipped: 0, errors: [] }
    };
    
    // Process countries
    if (countries && Array.isArray(countries)) {
      for (const country of countries) {
        try {
          // Skip if missing required fields
          if (!country.name || !country.code) {
            results.countries.skipped++;
            results.countries.errors.push(`Skipped country: Missing required fields (name or code)`);
            continue;
          }
          
          // Always generate a new ID for countries (never update countries)
          delete country.id;
          
          // Add country to Firestore
          const countryRef = doc(collection(db, 'countries'));
          await setDoc(countryRef, {
            ...country,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          results.countries.added++;
        } catch (error) {
          console.error('Error adding country:', error);
          results.countries.errors.push(`Error adding country: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.countries.skipped++;
        }
      }
    }
    
    // Get all countries for reference
    const countriesSnapshot = await getDocs(collection(db, 'countries'));
    const countriesMap = new Map();
    countriesSnapshot.forEach(doc => {
      const countryData = doc.data();
      // Map by name (lowercase for case-insensitive matching)
      countriesMap.set(countryData.name.toLowerCase(), {
        id: doc.id,
        ...countryData
      });
      // Also map by code for alternative lookup
      if (countryData.code) {
        countriesMap.set(countryData.code.toLowerCase(), {
          id: doc.id,
          ...countryData
        });
      }
    });
    
    // Process plans
    if (plans && Array.isArray(plans)) {
      for (const plan of plans) {
        try {
          // Skip if missing required fields
          if (!plan.title || !plan.carrier) {
            results.plans.skipped++;
            results.plans.errors.push(`Skipped plan: Missing required fields (title or carrier)`);
            continue;
          }
          
          // Create a clean plan object with only the allowed properties
          const cleanPlan = sanitizePlanData(plan);
          
          // Resolve countryId from country name or code if provided
          if (!cleanPlan.countryId && plan.country) {
            const countryKey = plan.country.toLowerCase();
            if (countriesMap.has(countryKey)) {
              const countryData = countriesMap.get(countryKey);
              cleanPlan.countryId = countryData.id;
              cleanPlan.country = countryData.name; // Use the proper case from the database
            } else {
              // Try to find by code
              const matchingCountry = Array.from(countriesMap.values()).find(
                c => c.code && c.code.toLowerCase() === countryKey
              );
              
              if (matchingCountry) {
                cleanPlan.countryId = matchingCountry.id;
                cleanPlan.country = matchingCountry.name;
              } else {
                results.plans.skipped++;
                results.plans.errors.push(`Skipped plan "${plan.title}": Country "${plan.country}" not found`);
                continue;
              }
            }
          } else if (!cleanPlan.countryId) {
            results.plans.skipped++;
            results.plans.errors.push(`Skipped plan "${plan.title}": No country specified`);
            continue;
          } else {
            // countryId is provided, get the country name
            const countryDoc = await getDoc(doc(db, 'countries', cleanPlan.countryId));
            if (countryDoc.exists()) {
              const countryData = countryDoc.data();
              cleanPlan.country = countryData.name;
            } else {
              results.plans.skipped++;
              results.plans.errors.push(`Skipped plan "${plan.title}": Country with ID "${cleanPlan.countryId}" not found`);
              continue;
            }
          }
          
          // Check if we should update an existing plan
          if (updateExisting && plan.id) {
            // Verify the plan exists
            const planDoc = await getDoc(doc(db, 'plans', plan.id));
            
            if (planDoc.exists()) {
              // Update existing plan
              await updateDoc(doc(db, 'plans', plan.id), {
                ...cleanPlan,
                updatedAt: new Date()
              });
              
              results.plans.updated++;
            } else {
              // Plan ID doesn't exist, create new without custom ID
              delete plan.id;
              
              const planRef = doc(collection(db, 'plans'));
              await setDoc(planRef, {
                ...cleanPlan,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              
              results.plans.added++;
            }
          } else {
            // Not in update mode, always generate new ID
            delete plan.id;
            
            // Add plan to Firestore
            const planRef = doc(collection(db, 'plans'));
            await setDoc(planRef, {
              ...cleanPlan,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            results.plans.added++;
          }
        } catch (error) {
          console.error('Error adding plan:', error);
          results.plans.errors.push(`Error adding plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.plans.skipped++;
        }
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}

// Helper function to sanitize plan data
function sanitizePlanData(plan: any): Partial<Plan> {
  // List of allowed properties for plans
  const allowedProperties = [
    'carrier',
    'carrierLogo',
    'plan_type',
    'sim_type',
    'title',
    'duration_days',
    'data_per_day',
    'total_data',
    'price',
    'currency',
    'speed_policy',
    'sharing_supported',
    'device_limit',
    'notes',
    'countryId',
    'country'
  ];
  
  // Create a new object with only the allowed properties
  const sanitizedPlan: Partial<Plan> = {};
  
  for (const prop of allowedProperties) {
    if (prop in plan) {
      (sanitizedPlan as any)[prop] = plan[prop];
    }
  }
  
  return sanitizedPlan;
}
