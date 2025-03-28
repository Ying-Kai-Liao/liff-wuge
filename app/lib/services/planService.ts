import { Plan } from '../../types';
import { 
  getCollection, 
  getDocument, 
  getDocumentsByField,
  addDocument, 
  updateDocument, 
  deleteDocument 
} from './firestore';

const COLLECTION_NAME = 'plans';

// Get all plans
export async function getAllPlans(): Promise<Plan[]> {
  return getCollection<Plan>(COLLECTION_NAME);
}

// Get a plan by ID
export async function getPlanById(id: string): Promise<Plan | null> {
  return getDocument<Plan>(COLLECTION_NAME, id);
}

// Get plans by carrier ID
export async function getPlansByCarrier(carrierId: string): Promise<Plan[]> {
  return getDocumentsByField<Plan>(COLLECTION_NAME, 'carrierId', carrierId);
}

// Get plans by country
export async function getPlansByCountry(country: string): Promise<Plan[]> {
  return getDocumentsByField<Plan>(COLLECTION_NAME, 'countryId', country);
}

// Add a new plan
export async function addPlan(plan: Omit<Plan, 'id'>): Promise<string> {
  return addDocument<Omit<Plan, 'id'>>(COLLECTION_NAME, plan);
}

// Update a plan
export async function updatePlan(id: string, plan: Partial<Plan>): Promise<void> {
  return updateDocument<Plan>(COLLECTION_NAME, id, plan);
}

// Delete a plan
export async function deletePlan(id: string): Promise<void> {
  return deleteDocument(COLLECTION_NAME, id);
}
