import { Country, Carrier, Plan } from '../types';
import { 
  addCountry
} from './services/countryService';
import { 
  addCarrier
} from './services/carrierService';
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
export function convertJapanPlans(carrierId: string, japanPlans: JapanPlan[]): Omit<Plan, 'id'>[] {
  return japanPlans.map(plan => ({
    carrierId,
    days: plan.duration_days,
    dataAmount: plan.data_per_day ? `每日${plan.data_per_day}` : plan.total_data || '',
    dailyLimit: plan.data_per_day ? plan.data_per_day : null,
    price: plan.price || 0,
    currency: 'TWD',
    throttling: plan.speed_policy?.includes('降速') || false,
    sharingSupported: !plan.notes?.some((note: string) => note.includes('無法分享') || note.includes('僅限一支手機')),
    deviceLimit: 1,
    notes: plan.notes?.join('、') || ''
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

export const sampleCarriers: (countryId: string) => Omit<Carrier, 'id'>[] = (countryId: string) => {
  const countryCode = countryId.split('-')[0];
  
  switch(countryCode) {
    case 'jp':
      return [
        {
          name: 'NTT Docomo',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/DOCOMO_logo.svg/320px-DOCOMO_logo.svg.png'
        },
        {
          name: 'SoftBank',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Softbank_mobile_logo.svg/320px-Softbank_mobile_logo.svg.png'
        },
        {
          name: 'KDDI (au)',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Au_logo.svg/320px-Au_logo.svg.png'
        }
      ];
    case 'kr':
      return [
        {
          name: 'KT',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/KT_Corporation_logo.svg/320px-KT_Corporation_logo.svg.png'
        },
        {
          name: 'SK Telecom',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/SK_Telecom_Logo.svg/320px-SK_Telecom_Logo.svg.png'
        },
        {
          name: 'LG U+',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/LG_Uplus_logo.svg/320px-LG_Uplus_logo.svg.png'
        }
      ];
    case 'us':
      return [
        {
          name: 'AT&T',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/AT%26T_logo_2016.svg/320px-AT%26T_logo_2016.svg.png'
        },
        {
          name: 'T-Mobile',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/T-Mobile_logo.svg/320px-T-Mobile_logo.svg.png'
        },
        {
          name: 'Verizon',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Verizon_logo.svg/320px-Verizon_logo.svg.png'
        }
      ];
    case 'tw':
      return [
        {
          name: '中華電信',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Chunghwa_Telecom_logo.svg/320px-Chunghwa_Telecom_logo.svg.png'
        },
        {
          name: '台灣大哥大',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Taiwan_Mobile_logo.svg/320px-Taiwan_Mobile_logo.svg.png'
        },
        {
          name: '遠傳電信',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/FETnet_logo.svg/320px-FETnet_logo.svg.png'
        }
      ];
    case 'th':
      return [
        {
          name: 'AIS',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/AIS_logo.svg/320px-AIS_logo.svg.png'
        },
        {
          name: 'DTAC',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Dtac_logo.svg/320px-Dtac_logo.svg.png'
        },
        {
          name: 'True Move H',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/True_Move_H_Logo.svg/320px-True_Move_H_Logo.svg.png'
        }
      ];
    case 'sg':
      return [
        {
          name: 'Singtel',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Singtel_logo.svg/320px-Singtel_logo.svg.png'
        },
        {
          name: 'StarHub',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/StarHub_logo.svg/320px-StarHub_logo.svg.png'
        },
        {
          name: 'M1',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/M1_Limited_logo.svg/320px-M1_Limited_logo.svg.png'
        }
      ];
    case 'my':
      return [
        {
          name: 'Maxis',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Maxis_Communications_logo.svg/320px-Maxis_Communications_logo.svg.png'
        },
        {
          name: 'Celcom',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Celcom_logo.svg/320px-Celcom_logo.svg.png'
        },
        {
          name: 'Digi',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/DiGi_Telecommunications_logo.svg/320px-DiGi_Telecommunications_logo.svg.png'
        }
      ];
    case 'uk':
      return [
        {
          name: 'Vodafone',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vodafone_icon.svg/320px-Vodafone_icon.svg.png'
        },
        {
          name: 'EE',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/EE_logo.svg/320px-EE_logo.svg.png'
        },
        {
          name: 'O2',
          countryId,
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/O2_logo.svg/320px-O2_logo.svg.png'
        }
      ];
    default:
      return [];
  }
};

export const samplePlans: (carrierId: string) => Omit<Plan, 'id'>[] = (carrierId: string) => {
  // Extract country code from carrier ID (format: "countryCode-randomId-carrierId")
  const parts = carrierId.split('-');
  const countryCode = parts.length > 0 ? parts[0] : '';
  
  // Different plans based on country
  switch(countryCode) {
    case 'jp':
      return [
        {
          carrierId,
          days: 5,
          dataAmount: '3GB',
          dailyLimit: null,
          price: 1200,
          currency: 'JPY',
          throttling: true,
          sharingSupported: false,
          deviceLimit: 1,
          notes: '適合短期旅行，覆蓋全日本主要城市及旅遊景點'
        },
        {
          carrierId,
          days: 8,
          dataAmount: '5GB',
          dailyLimit: null,
          price: 1800,
          currency: 'JPY',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 2,
          notes: '支援熱點分享，適合一週旅行'
        },
        {
          carrierId,
          days: 15,
          dataAmount: '10GB',
          dailyLimit: null,
          price: 2800,
          currency: 'JPY',
          throttling: false,
          sharingSupported: true,
          deviceLimit: 3,
          notes: '適合長期旅行，不限速，可分享給多台裝置'
        },
        {
          carrierId,
          days: 30,
          dataAmount: '無限量',
          dailyLimit: '2GB 高速，之後降速',
          price: 4500,
          currency: 'JPY',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 5,
          notes: '每日2GB高速流量，超過後降速至128kbps，適合長期停留'
        }
      ];
    case 'kr':
      return [
        {
          carrierId,
          days: 3,
          dataAmount: '1GB',
          dailyLimit: null,
          price: 15000,
          currency: 'KRW',
          throttling: false,
          sharingSupported: false,
          deviceLimit: 1,
          notes: '適合短期週末旅行，覆蓋首爾及主要城市'
        },
        {
          carrierId,
          days: 5,
          dataAmount: '3GB',
          dailyLimit: null,
          price: 22000,
          currency: 'KRW',
          throttling: false,
          sharingSupported: true,
          deviceLimit: 1,
          notes: '適合短期旅行，支援熱點分享'
        },
        {
          carrierId,
          days: 10,
          dataAmount: '7GB',
          dailyLimit: null,
          price: 35000,
          currency: 'KRW',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 2,
          notes: '適合中期旅行，用完後降速至256kbps'
        },
        {
          carrierId,
          days: 30,
          dataAmount: '無限量',
          dailyLimit: '1.5GB 高速，之後降速',
          price: 65000,
          currency: 'KRW',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 3,
          notes: '適合長期旅行，每日1.5GB高速流量，超過後降速'
        }
      ];
    case 'us':
      return [
        {
          carrierId,
          days: 7,
          dataAmount: '5GB',
          dailyLimit: null,
          price: 29.99,
          currency: 'USD',
          throttling: false,
          sharingSupported: true,
          deviceLimit: 2,
          notes: '覆蓋全美50州，支援5G網路（視地區而定）'
        },
        {
          carrierId,
          days: 15,
          dataAmount: '10GB',
          dailyLimit: null,
          price: 44.99,
          currency: 'USD',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 3,
          notes: '用完後降速至3G速度，仍可正常使用基本功能'
        },
        {
          carrierId,
          days: 30,
          dataAmount: '20GB',
          dailyLimit: null,
          price: 69.99,
          currency: 'USD',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 5,
          notes: '適合長期旅行，用完後降速但不斷線'
        },
        {
          carrierId,
          days: 30,
          dataAmount: '無限量',
          dailyLimit: null,
          price: 89.99,
          currency: 'USD',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 5,
          notes: '真正無限量，但用量超過35GB可能會被限速'
        }
      ];
    case 'tw':
      return [
        {
          carrierId,
          days: 3,
          dataAmount: '無限量',
          dailyLimit: '1GB 高速，之後降速',
          price: 300,
          currency: 'TWD',
          throttling: true,
          sharingSupported: false,
          deviceLimit: 1,
          notes: '適合短期旅行，覆蓋全台灣'
        },
        {
          carrierId,
          days: 5,
          dataAmount: '無限量',
          dailyLimit: '2GB 高速，之後降速',
          price: 450,
          currency: 'TWD',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 1,
          notes: '支援熱點分享，適合5天旅行'
        },
        {
          carrierId,
          days: 7,
          dataAmount: '6GB',
          dailyLimit: null,
          price: 599,
          currency: 'TWD',
          throttling: false,
          sharingSupported: true,
          deviceLimit: 2,
          notes: '不限速，用完為止，適合一週旅行'
        },
        {
          carrierId,
          days: 15,
          dataAmount: '15GB',
          dailyLimit: null,
          price: 999,
          currency: 'TWD',
          throttling: false,
          sharingSupported: true,
          deviceLimit: 3,
          notes: '適合長期旅行，支援5G網路（視地區而定）'
        }
      ];
    case 'th':
      return [
        {
          carrierId,
          days: 4,
          dataAmount: '2GB',
          dailyLimit: null,
          price: 199,
          currency: 'THB',
          throttling: false,
          sharingSupported: false,
          deviceLimit: 1,
          notes: '適合短期旅行，覆蓋曼谷及主要旅遊城市'
        },
        {
          carrierId,
          days: 8,
          dataAmount: '6GB',
          dailyLimit: null,
          price: 349,
          currency: 'THB',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 1,
          notes: '用完後降速至128kbps，支援熱點分享'
        },
        {
          carrierId,
          days: 15,
          dataAmount: '15GB',
          dailyLimit: null,
          price: 599,
          currency: 'THB',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 2,
          notes: '適合兩週旅行，覆蓋全泰國主要城市及海島'
        },
        {
          carrierId,
          days: 30,
          dataAmount: '30GB',
          dailyLimit: null,
          price: 999,
          currency: 'THB',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 3,
          notes: '適合長期旅行，用完後降速但不斷線'
        }
      ];
    case 'sg':
      return [
        {
          carrierId,
          days: 3,
          dataAmount: '100GB',
          dailyLimit: null,
          price: 12,
          currency: 'SGD',
          throttling: false,
          sharingSupported: true,
          deviceLimit: 1,
          notes: '超高速網路，覆蓋全新加坡，支援5G'
        },
        {
          carrierId,
          days: 5,
          dataAmount: '無限量',
          dailyLimit: null,
          price: 20,
          currency: 'SGD',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 2,
          notes: '用量超過20GB後可能降速，但仍維持高速網路'
        },
        {
          carrierId,
          days: 7,
          dataAmount: '無限量',
          dailyLimit: null,
          price: 25,
          currency: 'SGD',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 3,
          notes: '真正無限量，支援熱點分享，適合商務旅行'
        }
      ];
    case 'my':
      return [
        {
          carrierId,
          days: 5,
          dataAmount: '5GB',
          dailyLimit: null,
          price: 30,
          currency: 'MYR',
          throttling: false,
          sharingSupported: false,
          deviceLimit: 1,
          notes: '覆蓋馬來西亞主要城市及旅遊景點'
        },
        {
          carrierId,
          days: 10,
          dataAmount: '10GB',
          dailyLimit: null,
          price: 50,
          currency: 'MYR',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 2,
          notes: '用完後降速至256kbps，支援熱點分享'
        },
        {
          carrierId,
          days: 15,
          dataAmount: '15GB',
          dailyLimit: null,
          price: 70,
          currency: 'MYR',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 3,
          notes: '適合長期旅行，覆蓋全馬來西亞'
        }
      ];
    case 'uk':
      return [
        {
          carrierId,
          days: 7,
          dataAmount: '5GB',
          dailyLimit: null,
          price: 15,
          currency: 'GBP',
          throttling: false,
          sharingSupported: true,
          deviceLimit: 1,
          notes: '覆蓋英國主要城市，支援4G/5G網路'
        },
        {
          carrierId,
          days: 10,
          dataAmount: '10GB',
          dailyLimit: null,
          price: 20,
          currency: 'GBP',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 2,
          notes: '用完後降速，支援熱點分享'
        },
        {
          carrierId,
          days: 30,
          dataAmount: '20GB',
          dailyLimit: null,
          price: 35,
          currency: 'GBP',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 3,
          notes: '適合長期旅行，覆蓋全英國及部分歐洲國家'
        },
        {
          carrierId,
          days: 30,
          dataAmount: '無限量',
          dailyLimit: '2GB 高速，之後降速',
          price: 50,
          currency: 'GBP',
          throttling: true,
          sharingSupported: true,
          deviceLimit: 5,
          notes: '每日2GB高速流量，超過後降速，適合長期停留'
        }
      ];
    default:
      // Default plans for any other country
      return [
        {
          carrierId,
          days: 5,
          dataAmount: '3GB',
          dailyLimit: null,
          price: 499,
          currency: 'TWD',
          throttling: false,
          sharingSupported: false,
          deviceLimit: 1,
          notes: '基本方案，適合短期旅行'
        },
        {
          carrierId,
          days: 7,
          dataAmount: '5GB',
          dailyLimit: null,
          price: 699,
          currency: 'TWD',
          throttling: false,
          sharingSupported: true,
          deviceLimit: 2,
          notes: '標準方案，支援熱點分享'
        },
        {
          carrierId,
          days: 15,
          dataAmount: '10GB',
          dailyLimit: null,
          price: 999,
          currency: 'TWD',
          throttling: false,
          sharingSupported: true,
          deviceLimit: 3,
          notes: '高級方案，適合長期旅行'
        }
      ];
  }
};

export async function seedDatabase() {
  try {
    console.log('開始填充資料庫...');
    
    // Add countries
    const countryIds = await Promise.all(
      sampleCountries.map(async (country) => {
        const id = await addCountry(country);
        console.log(`Added country: ${country.name} with ID: ${id}`);
        return { id, code: country.code };
      })
    );
    
    // Add carriers for each country
    const carrierIds = [];
    for (const { id: countryId } of countryIds) {
      const carriers = sampleCarriers(countryId);
      for (const carrier of carriers) {
        const carrierId = await addCarrier(carrier);
        console.log(`Added carrier: ${carrier.name} for country: ${countryId}`);
        carrierIds.push(carrierId);
      }
    }
    
    // Add plans for each carrier
    for (const carrierId of carrierIds) {
      const plans = samplePlans(carrierId);
      for (const plan of plans) {
        await addPlan(plan);
        console.log(`Added plan: ${plan.days} days / ${plan.dataAmount} for carrier: ${carrierId}`);
      }
    }
    
    console.log('資料庫填充完成！');
    return true;
  } catch (error) {
    console.error('填充資料庫時發生錯誤:', error);
    return false;
  }
}
