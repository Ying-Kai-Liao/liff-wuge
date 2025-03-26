// Type definitions for the eSIM directory app

export interface Country {
  id?: string;
  code: string;
  name: string;
  flagIcon: string;
  description: string;
}

export interface Carrier {
  id?: string;
  name: string;
  countryId: string;
  logo?: string;
}

export interface Plan {
  id?: string;
  carrierId: string;
  days: number;
  dataAmount: string;
  dailyLimit: string | null;
  price: number;
  currency: string;
  throttling: boolean;
  sharingSupported: boolean;
  deviceLimit: number | null;
  notes: string;
}

export interface InquiryItem {
  planId: string;
  carrierId: string;
  countryId: string;
  addedAt: number;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  inquiryList: InquiryItem[];
}
