// Type definitions for the eSIM directory app

export interface Country {
  id?: string;
  code: string;
  name: string;
  flagIcon: string;
  description: string;
}

export type PlanType = "daily" | "total"
export type SimType = "esim" | "physical"

export interface Plan {
  id: string
  countryId: string
  country: string
  carrier: string
  carrierLogo?: string      // Added for direct carrier logo access
  plan_type: PlanType        // daily / total
  sim_type: SimType          // esim / physical
  title: string              // e.g. 每日3GB
  duration_days: number
  data_per_day?: string
  total_data?: string
  price: number
  currency?: string          // optional, default to "TWD"
  speed_policy: string
  sharing_supported: boolean
  device_limit?: number | null
  is_popular?: boolean
  notes: string[]            // 條列式備註
}

export interface CartItem {
  planId: string
  quantity: number           // 數量（通常是 1，但也可 2 以上）
  addedAt: Date
  overridePrice?: number     // 若可使用折扣或自訂價，可填入
  note?: string              // 備註給客服/店家
}

export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  cart: CartItem[];
}
