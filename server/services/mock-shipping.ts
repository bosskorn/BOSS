/**
 * บริการขนส่งแบบจำลองสำหรับระบบ BlueDash
 * ใช้สำหรับทดสอบระบบแทนการเชื่อมต่อกับ API ของผู้ให้บริการขนส่งจริง
 */

import { randomUUID } from 'crypto';

// ประเภทข้อมูลสำหรับบริการขนส่งจำลอง
export interface MockShippingOption {
  id: string;
  name: string;
  code: string;
  price: number;
  estimatedDays: number;
  icon?: string;
  description?: string;
  providerName: string;
  isPopular?: boolean;
  isCODAvailable: boolean;
  maxCODAmount?: number;
}

export interface MockTrackingInfo {
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  statusDescription: string;
  timestamp: Date;
  location?: string;
  estimatedDelivery?: Date;
  events: Array<{
    status: string;
    timestamp: Date;
    location?: string;
    description: string;
  }>;
}

export interface MockAddress {
  province: string;
  district?: string;
  subdistrict?: string;
  zipcode: string;
  addressLine1?: string;
  addressLine2?: string;
}

export interface MockShipmentDetails {
  weight: number; // กิโลกรัม
  width?: number; // เซนติเมตร
  height?: number; // เซนติเมตร 
  length?: number; // เซนติเมตร
  parcelValue?: number; // มูลค่าพัสดุ
  isCOD?: boolean; // เก็บเงินปลายทาง
  codAmount?: number; // จำนวนเงินที่เก็บปลายทาง
}

export interface MockSenderInfo {
  name: string;
  phone: string;
  address: MockAddress;
}

export interface MockRecipientInfo {
  name: string;
  phone: string;
  address: MockAddress;
}

// ผู้ให้บริการขนส่งแบบจำลอง
const MOCK_SHIPPING_PROVIDERS = [
  {
    id: 'bluexpress', 
    name: 'Blue Express',
    logo: '🚚 Blue Express',
    description: 'บริการจัดส่งด่วนภายใน 1-2 วัน',
    services: [
      {
        code: 'bluexpress_normal',
        name: 'ปกติ (1-2 วัน)',
        estimatedDays: 2,
        icon: '🚚',
        isCODAvailable: true,
        maxCODAmount: 30000,
      },
      {
        code: 'bluexpress_express',
        name: 'ด่วน (1 วัน)',
        estimatedDays: 1,
        icon: '⚡',
        isPopular: true,
        isCODAvailable: true,
        maxCODAmount: 30000,
      },
      {
        code: 'bluexpress_sameday',
        name: 'ส่งด่วนวันนี้',
        estimatedDays: 0,
        icon: '🔥',
        isCODAvailable: true,
        maxCODAmount: 10000,
      }
    ]
  },
  {
    id: 'speedline',
    name: 'SpeedLine',
    logo: '✈️ SpeedLine',
    description: 'บริการจัดส่งราคาประหยัด',
    services: [
      {
        code: 'speedline_economy',
        name: 'ประหยัด (2-3 วัน)',
        estimatedDays: 3, 
        icon: '🚚',
        isPopular: true,
        isCODAvailable: true,
        maxCODAmount: 25000,
      },
      {
        code: 'speedline_express',
        name: 'ด่วน (1-2 วัน)',
        estimatedDays: 2,
        icon: '⚡',
        isCODAvailable: true,
        maxCODAmount: 25000,
      }
    ]
  },
  {
    id: 'thaistar',
    name: 'ThaiStar Delivery',
    logo: '🌟 ThaiStar',
    description: 'บริการจัดส่งครอบคลุมทั่วไทย',
    services: [
      {
        code: 'thaistar_standard',
        name: 'มาตรฐาน (2-3 วัน)',
        estimatedDays: 3,
        icon: '🚚',
        isCODAvailable: true, 
        maxCODAmount: 35000,
      },
      {
        code: 'thaistar_premium',
        name: 'พรีเมียม (1-2 วัน)',
        estimatedDays: 2,
        icon: '⭐',
        isPopular: true,
        isCODAvailable: true,
        maxCODAmount: 35000,
      }
    ]
  }
];

// ตารางราคาแบบจำลอง - คำนวณตามน้ำหนักและระยะทาง
const calculatePrice = (weight: number, distance: number, serviceType: string): number => {
  let basePrice = 0;
  
  // คำนวณราคาพื้นฐานตามน้ำหนัก
  if (weight <= 1) {
    basePrice = 35;
  } else if (weight <= 3) {
    basePrice = 50;
  } else if (weight <= 5) {
    basePrice = 65;
  } else if (weight <= 10) {
    basePrice = 80;
  } else {
    basePrice = 80 + (weight - 10) * 10;
  }
  
  // คำนวณเพิ่มตามระยะทาง
  const distanceFactor = Math.min(distance / 100, 5); // ไม่เกิน 5 เท่า
  basePrice += basePrice * (distanceFactor * 0.2);
  
  // ปรับตามประเภทบริการ
  if (serviceType.includes('express')) {
    basePrice *= 1.4; // ด่วนแพงกว่า 40%
  } else if (serviceType.includes('sameday')) {
    basePrice *= 2.0; // ส่งวันนี้แพงกว่า 100%
  } else if (serviceType.includes('economy')) {
    basePrice *= 0.8; // ประหยัดถูกกว่า 20%
  }
  
  return Math.round(basePrice);
};

// คำนวณระยะทางจำลองระหว่างรหัสไปรษณีย์
const calculateMockDistance = (fromZipcode: string, toZipcode: string): number => {
  // แบ่งตามภูมิภาค
  const getRegion = (zipcode: string): string => {
    const zipNumber = parseInt(zipcode);
    if (zipNumber >= 10000 && zipNumber <= 19999) return 'central';
    if (zipNumber >= 20000 && zipNumber <= 29999) return 'eastern';
    if (zipNumber >= 30000 && zipNumber <= 39999) return 'northeastern';
    if (zipNumber >= 40000 && zipNumber <= 49999) return 'northeastern';
    if (zipNumber >= 50000 && zipNumber <= 58999) return 'northern';
    if (zipNumber >= 70000 && zipNumber <= 79999) return 'western';
    if (zipNumber >= 80000 && zipNumber <= 96999) return 'southern';
    return 'central';
  };
  
  const fromRegion = getRegion(fromZipcode);
  const toRegion = getRegion(toZipcode);
  
  if (fromZipcode === toZipcode) return 5; // ในเขตเดียวกัน
  
  if (fromRegion === toRegion) {
    // ภายในภูมิภาคเดียวกัน
    return 50 + Math.abs(parseInt(fromZipcode) - parseInt(toZipcode)) % 100;
  } else {
    // ข้ามภูมิภาค
    return 200 + Math.abs(parseInt(fromZipcode) - parseInt(toZipcode)) % 300;
  }
};

/**
 * ดึงรายการตัวเลือกบริการขนส่งแบบจำลอง
 */
export const getMockShippingOptions = (
  fromAddress: MockAddress,
  toAddress: MockAddress,
  details: MockShipmentDetails
): Promise<MockShippingOption[]> => {
  return new Promise((resolve) => {
    // จำลองการดีเลย์ของการเรียก API
    setTimeout(() => {
      const distance = calculateMockDistance(
        fromAddress.zipcode, 
        toAddress.zipcode
      );
      
      const options: MockShippingOption[] = [];
      
      // สร้างตัวเลือกการจัดส่งสำหรับทุกผู้ให้บริการ
      MOCK_SHIPPING_PROVIDERS.forEach(provider => {
        provider.services.forEach(service => {
          const price = calculatePrice(details.weight, distance, service.code);
          
          options.push({
            id: `${provider.id}_${service.code}_${Date.now()}`,
            name: service.name,
            code: service.code,
            price: price,
            estimatedDays: service.estimatedDays,
            icon: service.icon,
            description: `จัดส่งโดย ${provider.name}`,
            providerName: provider.name,
            isPopular: service.isPopular || false,
            isCODAvailable: service.isCODAvailable,
            maxCODAmount: service.maxCODAmount,
          });
        });
      });
      
      // เรียงลำดับตามราคา
      options.sort((a, b) => a.price - b.price);
      
      resolve(options);
    }, 800); // จำลองความล่าช้าของ API 800ms
  });
};

/**
 * สร้างการจัดส่งแบบจำลอง
 */
export const createMockShipment = (
  sender: MockSenderInfo,
  recipient: MockRecipientInfo,
  details: MockShipmentDetails,
  shippingCode: string
): Promise<{ trackingNumber: string; price: number }> => {
  return new Promise((resolve) => {
    // จำลองการดีเลย์ของการเรียก API
    setTimeout(() => {
      // สร้างเลขพัสดุแบบจำลอง
      const providerCode = shippingCode.split('_')[0].substring(0, 3).toUpperCase();
      const randomPart = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
      const trackingNumber = `${providerCode}${randomPart}TH`;
      
      // คำนวณราคา
      const distance = calculateMockDistance(
        sender.address.zipcode,
        recipient.address.zipcode
      );
      
      const price = calculatePrice(details.weight, distance, shippingCode);
      
      resolve({
        trackingNumber,
        price
      });
    }, 1500); // จำลองความล่าช้าของการสร้างพัสดุ 1.5 วินาที
  });
};

/**
 * ดึงข้อมูลการติดตามพัสดุแบบจำลอง
 */
export const getMockTrackingInfo = (trackingNumber: string): Promise<MockTrackingInfo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // จำลองสถานะพัสดุแบบสุ่ม
      const statuses = ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed'] as const;
      const randomIndex = Math.floor(Math.random() * statuses.length);
      const status = statuses[randomIndex];
      
      // กำหนดข้อความสถานะ
      let statusDescription = '';
      switch (status) {
        case 'pending':
          statusDescription = 'รอจัดส่ง';
          break;
        case 'in_transit':
          statusDescription = 'กำลังจัดส่ง';
          break;
        case 'out_for_delivery':
          statusDescription = 'กำลังนำส่ง';
          break;
        case 'delivered': 
          statusDescription = 'จัดส่งสำเร็จ';
          break;
        case 'failed':
          statusDescription = 'จัดส่งไม่สำเร็จ';
          break;
        default:
          statusDescription = 'ไม่ระบุสถานะ';
      }
      
      // สร้างประวัติการเคลื่อนไหวพัสดุ
      const now = new Date();
      const events = [];
      
      events.push({
        status: 'created',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 วันก่อน
        location: 'คลังสินค้าต้นทาง',
        description: 'สร้างรายการพัสดุแล้ว'
      });
      
      if (status !== 'pending') {
        events.push({
          status: 'picked_up',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 วันก่อน
          location: 'ศูนย์คัดแยกต้นทาง',
          description: 'พัสดุถูกนำเข้าสู่ระบบการจัดส่ง'
        });
      }
      
      if (status === 'in_transit' || status === 'out_for_delivery' || status === 'delivered' || status === 'failed') {
        events.push({
          status: 'in_transit',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12), // 12 ชั่วโมงก่อน
          location: 'ศูนย์คัดแยกกลาง',
          description: 'พัสดุอยู่ระหว่างการจัดส่ง'
        });
      }
      
      if (status === 'out_for_delivery' || status === 'delivered' || status === 'failed') {
        events.push({
          status: 'out_for_delivery',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 ชั่วโมงก่อน 
          location: 'ศูนย์กระจายสินค้าปลายทาง',
          description: 'พัสดุกำลังถูกนำส่งถึงผู้รับ'
        });
      }
      
      if (status === 'delivered') {
        events.push({
          status: 'delivered',
          timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 นาทีก่อน
          location: 'ถึงผู้รับแล้ว',
          description: 'จัดส่งสำเร็จ'
        });
      }
      
      if (status === 'failed') {
        events.push({
          status: 'failed',
          timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 นาทีก่อน
          location: 'ศูนย์จัดส่งปลายทาง',
          description: 'จัดส่งไม่สำเร็จ ไม่พบผู้รับ'
        });
      }
      
      // เรียงลำดับตามเวลา
      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // สร้างข้อมูลการติดตาม
      const trackingInfo: MockTrackingInfo = {
        trackingNumber,
        status,
        statusDescription,
        timestamp: events[events.length - 1].timestamp,
        location: events[events.length - 1].location,
        estimatedDelivery: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2), // อีก 2 วัน
        events,
      };
      
      resolve(trackingInfo);
    }, 1000); // จำลองความล่าช้า 1 วินาที
  });
};

/**
 * ข้อมูลจังหวัดและรหัสไปรษณีย์ในประเทศไทย (เฉพาะบางส่วน)
 */
export const MOCK_THAI_PROVINCES = [
  {
    province: 'กรุงเทพมหานคร',
    districts: [
      { name: 'พระนคร', zipcode: '10200' },
      { name: 'ดุสิต', zipcode: '10300' },
      { name: 'หนองจอก', zipcode: '10530' },
      { name: 'บางรัก', zipcode: '10500' },
      { name: 'บางเขน', zipcode: '10220' }
    ]
  },
  {
    province: 'เชียงใหม่',
    districts: [
      { name: 'เมืองเชียงใหม่', zipcode: '50000' },
      { name: 'จอมทอง', zipcode: '50160' },
      { name: 'แม่แจ่ม', zipcode: '50270' },
      { name: 'เชียงดาว', zipcode: '50170' },
      { name: 'ดอยสะเก็ด', zipcode: '50220' }
    ]
  },
  {
    province: 'ชลบุรี',
    districts: [
      { name: 'เมืองชลบุรี', zipcode: '20000' },
      { name: 'บ้านบึง', zipcode: '20170' },
      { name: 'หนองใหญ่', zipcode: '20190' },
      { name: 'บางละมุง', zipcode: '20150' },
      { name: 'พานทอง', zipcode: '20160' }
    ]
  },
  {
    province: 'เชียงราย',
    districts: [
      { name: 'เมืองเชียงราย', zipcode: '57000' },
      { name: 'เวียงชัย', zipcode: '57210' },
      { name: 'เชียงของ', zipcode: '57140' },
      { name: 'เทิง', zipcode: '57160' },
      { name: 'พาน', zipcode: '57120' }
    ]
  },
  {
    province: 'นครราชสีมา',
    districts: [
      { name: 'เมืองนครราชสีมา', zipcode: '30000' },
      { name: 'ครบุรี', zipcode: '30250' },
      { name: 'สีคิ้ว', zipcode: '30140' },
      { name: 'ปากช่อง', zipcode: '30130' },
      { name: 'พิมาย', zipcode: '30110' }
    ]
  }
];