import { Country } from '../../types';
import { 
  getCollection, 
  getDocument, 
  getDocumentsByField,
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

// Get a country by code
export async function getCountryByCode(code: string): Promise<Country | null> {
  const countries = await getDocumentsByField<Country>(COLLECTION_NAME, 'code', code);
  return countries.length > 0 ? countries[0] : null;
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
