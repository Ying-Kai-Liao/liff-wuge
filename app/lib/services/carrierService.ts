import { Carrier } from '../../types';
import { 
  getCollection, 
  getDocument, 
  getDocumentsByField,
  addDocument, 
  updateDocument, 
  deleteDocument 
} from './firestore';

const COLLECTION_NAME = 'carriers';

// Get all carriers
export async function getAllCarriers(): Promise<Carrier[]> {
  return getCollection<Carrier>(COLLECTION_NAME);
}

// Get a carrier by ID
export async function getCarrierById(id: string): Promise<Carrier | null> {
  return getDocument<Carrier>(COLLECTION_NAME, id);
}

// Get carriers by country ID
export async function getCarriersByCountry(countryId: string): Promise<Carrier[]> {
  return getDocumentsByField<Carrier>(COLLECTION_NAME, 'countryId', countryId);
}

// Add a new carrier
export async function addCarrier(carrier: Omit<Carrier, 'id'>): Promise<string> {
  return addDocument<Omit<Carrier, 'id'>>(COLLECTION_NAME, carrier);
}

// Update a carrier
export async function updateCarrier(id: string, carrier: Partial<Carrier>): Promise<void> {
  return updateDocument<Carrier>(COLLECTION_NAME, id, carrier);
}

// Delete a carrier
export async function deleteCarrier(id: string): Promise<void> {
  return deleteDocument(COLLECTION_NAME, id);
}
