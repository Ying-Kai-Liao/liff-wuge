import { Country, Plan } from '../types';
import { 
  addCountry
} from './services/countryService';
import { 
  addPlan 
} from './services/planService';

// Define the structure of Japan plan data
export interface JapanPlan {
  carrier: string;
  duration_days: number;
  total_data?: string;
  data_per_day?: string;
  price: number;
  speed_policy?: string;
  notes?: string[];
}

// Function to convert Japan plans from the provided JSON format to our app's Plan format
export function convertJapanPlans(countryId: string, japanPlans: JapanPlan[]): Omit<Plan, 'id'>[] {
  return japanPlans.map(plan => ({
    countryId,
    country: '日本',
    carrier: plan.carrier,
    carrierLogo: '',
    plan_type: plan.data_per_day ? 'daily' as const : 'total' as const,
    sim_type: 'esim' as const,
    title: plan.data_per_day ? `每日${plan.data_per_day}` : plan.total_data || '',
    duration_days: plan.duration_days,
    data_per_day: plan.data_per_day || '',
    total_data: plan.total_data || '',
    price: plan.price || 0,
    currency: 'TWD',
    speed_policy: plan.speed_policy || '無限制',
    sharing_supported: !plan.notes?.some((note: string) => note.includes('無法分享') || note.includes('僅限一支手機')),
    device_limit: 1,
    notes: plan.notes || []
  }));
}

export const sampleCountries: Omit<Country, 'id'>[] = [
  {
    code: 'jp',
    name: '日本',
    flagIcon: '🇯🇵',
    description: '體驗先進科技與傳統文化的完美結合，從東京的繁華都市到京都的古老寺廟，日本提供多樣化的旅遊體驗。'
  },
  {
    code: 'kr',
    name: '韓國',
    flagIcon: '🇰🇷',
    description: '探索韓流文化發源地，享受首爾的現代都市風貌與濟州島的自然風光，韓國全境提供高速網路覆蓋。'
  },
  {
    code: 'us',
    name: '美國',
    flagIcon: '🇺🇸',
    description: '從紐約的摩天大樓到加州的陽光海灘，美國廣闊的國土提供多元的旅遊選擇，全國通用的eSIM方案讓您暢遊各州。'
  },
  {
    code: 'tw',
    name: '台灣',
    flagIcon: '🇹🇼',
    description: '探索寶島台灣的美食與文化，從台北101到墾丁海灘，高速網路覆蓋全島，讓您隨時分享旅途精彩。'
  },
  {
    code: 'th',
    name: '泰國',
    flagIcon: '🇹🇭',
    description: '體驗熱帶風情與佛教文化，從曼谷的繁華市集到普吉島的純淨海灘，泰國提供多種適合不同旅遊需求的eSIM方案。'
  },
  {
    code: 'sg',
    name: '新加坡',
    flagIcon: '🇸🇬',
    description: '探索這座花園城市的現代建築與多元文化，新加坡全境提供超高速網路，是商務與休閒旅行的理想選擇。'
  },
  {
    code: 'my',
    name: '馬來西亞',
    flagIcon: '🇲🇾',
    description: '從吉隆坡的雙子塔到檳城的古老街道，馬來西亞的多元文化和美食值得探索，全國網路覆蓋完善。'
  },
  {
    code: 'uk',
    name: '英國',
    flagIcon: '🇬🇧',
    description: '探索倫敦的歷史地標與蘇格蘭的壯麗高地，英國全境提供穩定網路，讓您的歐洲之旅更加便利。'
  }
];

export async function seedDatabase() {
  try {
    console.log('開始填充資料庫...');
    
    // Add countries
    const countryIds = await Promise.all(
      sampleCountries.map(async (country) => {
        const id = await addCountry(country);
        console.log(`Added country: ${country.name} with ID: ${id}`);
        return { id, code: country.code, name: country.name };
      })
    );
    
    // Add plans for each country directly (no need for carriers anymore)
    for (const countryInfo of countryIds) {
      // Create sample plans for each country
      const plans = [];
      
      // Japan plans
      if (countryInfo.code === 'jp') {
        plans.push(
          {
            countryId: countryInfo.id,
            country: countryInfo.name,
            carrier: 'NTT Docomo',
            carrierLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/DOCOMO_logo.svg/320px-DOCOMO_logo.svg.png',
            plan_type: 'total' as const,
            sim_type: 'esim' as const,
            title: '5天3GB方案',
            duration_days: 5,
            data_per_day: '',
            total_data: '3GB',
            price: 1200,
            currency: 'JPY',
            speed_policy: '用完後降速',
            sharing_supported: false,
            device_limit: 1,
            notes: ['適合短期旅行，覆蓋全日本主要城市及旅遊景點']
          },
          {
            countryId: countryInfo.id,
            country: countryInfo.name,
            carrier: 'SoftBank',
            carrierLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Softbank_mobile_logo.svg/320px-Softbank_mobile_logo.svg.png',
            plan_type: 'daily' as const,
            sim_type: 'esim' as const,
            title: '7天每日1GB方案',
            duration_days: 7,
            data_per_day: '1GB',
            total_data: '',
            price: 2000,
            currency: 'JPY',
            speed_policy: '每日用量後降速',
            sharing_supported: true,
            device_limit: 2,
            notes: ['適合一週旅行，支援熱點分享']
          }
        );
      }
      
      // Korea plans
      else if (countryInfo.code === 'kr') {
        plans.push(
          {
            countryId: countryInfo.id,
            country: countryInfo.name,
            carrier: 'KT',
            carrierLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/KT_Corporation_logo.svg/320px-KT_Corporation_logo.svg.png',
            plan_type: 'total' as const,
            sim_type: 'esim' as const,
            title: '5天3GB方案',
            duration_days: 5,
            data_per_day: '',
            total_data: '3GB',
            price: 22000,
            currency: 'KRW',
            speed_policy: '用完後降速',
            sharing_supported: true,
            device_limit: 1,
            notes: ['適合短期旅行，支援熱點分享']
          }
        );
      }
      
      // Add plans to database
      for (const plan of plans) {
        await addPlan(plan);
        console.log(`Added plan: ${plan.duration_days} days for ${plan.country} (${plan.carrier})`);
      }
    }
    
    console.log('資料庫填充完成！');
    return true;
  } catch (error) {
    console.error('填充資料庫時發生錯誤:', error);
    return false;
  }
}
