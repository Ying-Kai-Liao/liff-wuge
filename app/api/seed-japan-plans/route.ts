import { NextResponse } from 'next/server';
import { Plan } from '../../types';
import { addPlan } from '../../lib/services/planService';
import { getCountryByCode } from '../../lib/services/countryService';

// Custom interface for our Japan KDDI plans data
interface JapanKddiPlanData {
  carrier: string;
  country: string;
  countryId: string;
  plan_type: string;
  sim_type: string;
  title: string;
  data_per_day?: string;
  total_data?: string;
  duration_days: number;
  price: number;
  currency: string;
  speed_policy: string;
  sharing_supported: boolean;
  device_limit: number;
  notes: string[];
}

// Japan KDDI plans data
const japanKddiPlans: JapanKddiPlanData[] = [
  {
    carrier: "KDDI AU",
    country: "日本",
    countryId: "", // Will be set dynamically
    plan_type: "daily",
    sim_type: "esim",
    title: "每日500MB",
    data_per_day: "500MB",
    total_data: "", // Empty string instead of undefined
    duration_days: 3,
    price: 120,
    currency: "TWD",
    speed_policy: "用完每日流量後降速",
    sharing_supported: true,
    device_limit: 1,
    notes: [
      "每日凌晨1點重置流量",
      "出貨後60日內須安裝",
      "Tiktok、抖音、ChatGPT 無法使用",
      "QR CODE 僅限一支手機使用，無法交替，一經訂購無法取消"
    ]
  },
  {
    carrier: "KDDI AU",
    country: "日本",
    countryId: "", // Will be set dynamically
    plan_type: "daily",
    sim_type: "esim",
    title: "每日500MB",
    data_per_day: "500MB",
    total_data: "", // Empty string instead of undefined
    duration_days: 4,
    price: 140,
    currency: "TWD",
    speed_policy: "用完每日流量後降速",
    sharing_supported: true,
    device_limit: 1,
    notes: [
      "每日凌晨1點重置流量",
      "出貨後60日內須安裝",
      "Tiktok、抖音、ChatGPT 無法使用",
      "QR CODE 僅限一支手機使用，無法交替，一經訂購無法取消"
    ]
  },
  {
    carrier: "KDDI AU",
    country: "日本",
    countryId: "", // Will be set dynamically
    plan_type: "daily",
    sim_type: "esim",
    title: "每日500MB",
    data_per_day: "500MB",
    total_data: "", // Empty string instead of undefined
    duration_days: 5,
    price: 150,
    currency: "TWD",
    speed_policy: "用完每日流量後降速",
    sharing_supported: true,
    device_limit: 1,
    notes: [
      "每日凌晨1點重置流量",
      "出貨後60日內須安裝",
      "Tiktok、抖音、ChatGPT 無法使用",
      "QR CODE 僅限一支手機使用，無法交替，一經訂購無法取消"
    ]
  },
  // Physical SIM versions
  {
    carrier: "KDDI AU",
    country: "日本",
    countryId: "", // Will be set dynamically
    plan_type: "daily",
    sim_type: "physical",
    title: "每日500MB",
    data_per_day: "500MB",
    total_data: "", // Empty string instead of undefined
    duration_days: 3,
    price: 150, // Physical SIM costs more
    currency: "TWD",
    speed_policy: "用完每日流量後降速",
    sharing_supported: true,
    device_limit: 1,
    notes: [
      "每日凌晨1點重置流量",
      "實體SIM卡將會郵寄",
      "Tiktok、抖音、ChatGPT 無法使用",
      "SIM卡僅限一支手機使用，無法交替，一經訂購無法取消"
    ]
  },
  {
    carrier: "KDDI AU",
    country: "日本",
    countryId: "", // Will be set dynamically
    plan_type: "daily",
    sim_type: "physical",
    title: "每日500MB",
    data_per_day: "500MB",
    total_data: "", // Empty string instead of undefined
    duration_days: 5,
    price: 180, // Physical SIM costs more
    currency: "TWD",
    speed_policy: "用完每日流量後降速",
    sharing_supported: true,
    device_limit: 1,
    notes: [
      "每日凌晨1點重置流量",
      "實體SIM卡將會郵寄",
      "Tiktok、抖音、ChatGPT 無法使用",
      "SIM卡僅限一支手機使用，無法交替，一經訂購無法取消"
    ]
  }
];

// Convert our custom plan data to the Plan type used by the application
function convertToPlanFormat(planData: JapanKddiPlanData): Omit<Plan, 'id'> {
  return {
    country: planData.country,
    countryId: planData.countryId,
    carrier: planData.carrier,
    plan_type: planData.plan_type as "daily" | "total",
    sim_type: planData.sim_type as "esim" | "physical",
    title: planData.title,
    duration_days: planData.duration_days,
    data_per_day: planData.data_per_day || "",
    total_data: planData.total_data || "",
    price: planData.price,
    currency: planData.currency,
    speed_policy: planData.speed_policy,
    sharing_supported: planData.sharing_supported,
    device_limit: planData.device_limit,
    notes: planData.notes
  };
}

// Sanitize object to remove undefined values that Firestore can't handle
function sanitizeForFirestore<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return "";
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  const result: Record<string, any> = { ...obj as Record<string, any> };
  
  for (const key in result) {
    if (result[key] === undefined) {
      result[key] = ""; // Replace undefined with empty string for Firestore
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      // Recursively sanitize nested objects
      result[key] = sanitizeForFirestore(result[key]);
    }
  }
  
  return result;
}

export async function POST() {
  try {
    // Get Japan country ID
    const japanCountry = await getCountryByCode('jp');
    
    if (!japanCountry || !japanCountry.id) {
      return NextResponse.json({ 
        success: false, 
        message: '找不到日本國家資料，請先執行一般種子資料' 
      }, { status: 404 });
    }
    
    // Set carrier ID for all plans
    const plansWithCountryId = japanKddiPlans.map(plan => ({
      ...plan,
      countryId: japanCountry.id || ''
    }));
    
    if (!plansWithCountryId.length) {
      return NextResponse.json({ 
        success: false, 
        message: '沒有找到日本KDDI方案' 
      }, { status: 404 });
    }
    // Convert to the application's Plan format and add to database
    const planPromises = plansWithCountryId.map(plan => {
      const formattedPlan = convertToPlanFormat(plan);
      const sanitizedPlan = sanitizeForFirestore(formattedPlan);
      return addPlan(sanitizedPlan);
    });
    
    await Promise.all(planPromises);
    
    return NextResponse.json({ 
      success: true, 
      message: '成功添加日本KDDI方案！',
      count: plansWithCountryId.length
    });
  } catch (error) {
    console.error('Error adding Japan KDDI plans:', error);
    return NextResponse.json({ 
      success: false, 
      message: '添加日本KDDI方案時發生錯誤：' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}
