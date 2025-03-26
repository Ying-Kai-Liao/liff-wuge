import { Country } from '../../types';
import { 
  getCollection, 
  getDocument, 
  addDocument, 
  updateDocument, 
  deleteDocument 
} from './firestore';

const COLLECTION_NAME = 'countries';

// Get all countries
export async function getAllCountries(): Promise<Country[]> {
  return getCollection<Country>(COLLECTION_NAME);
}

// Get a country by ID
export async function getCountryById(id: string): Promise<Country | null> {
  return getDocument<Country>(COLLECTION_NAME, id);
}

// Add a new country
export async function addCountry(country: Omit<Country, 'id'>): Promise<string> {
  return addDocument<Omit<Country, 'id'>>(COLLECTION_NAME, country);
}

// Update a country
export async function updateCountry(id: string, country: Partial<Country>): Promise<void> {
  return updateDocument<Country>(COLLECTION_NAME, id, country);
}

// Delete a country
export async function deleteCountry(id: string): Promise<void> {
  return deleteDocument(COLLECTION_NAME, id);
}
