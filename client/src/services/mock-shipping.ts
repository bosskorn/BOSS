/**
 * บริการขนส่งแบบจำลองสำหรับฝั่งไคลเอนต์
 * ใช้เรียก API ของบริการขนส่งแบบจำลองที่สร้างขึ้นเพื่อทดสอบ
 */

import axios from 'axios';

// ประเภทข้อมูลที่ใช้ร่วมกันกับ API
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

export interface MockAddress {
  province: string;
  district?: string;
  subdistrict?: string;
  zipcode: string;
  addressLine1?: string;
  addressLine2?: string;
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

export interface MockShipmentDetails {
  weight: number;
  dimensions?: {
    width?: number;
    height?: number;
    length?: number;
  };
  value?: number;
  isCOD?: boolean;
  codAmount?: number;
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

export interface MockProvince {
  province: string;
  districts: Array<{
    name: string;
    zipcode: string;
  }>;
}

/**
 * ดึงตัวเลือกการจัดส่งจากบริการขนส่งแบบจำลอง
 */
export const getMockShippingOptions = async (
  address: MockAddress,
  weight: number = 1,
  dimensions?: { width?: number; height?: number; length?: number },
  value?: number
): Promise<MockShippingOption[]> => {
  try {
    const response = await axios.post('/api/mock-shipping/options', {
      address,
      weight,
      dimensions,
      value
    });

    if (response.data && response.data.success) {
      return response.data.options;
    } else {
      throw new Error(response.data?.message || 'ไม่สามารถดึงข้อมูลตัวเลือกการจัดส่งได้');
    }
  } catch (error: any) {
    console.error('Error getting mock shipping options:', error);
    throw new Error(`ไม่สามารถดึงข้อมูลตัวเลือกการจัดส่งได้: ${error.message}`);
  }
};

/**
 * สร้างการจัดส่งใหม่ผ่านบริการขนส่งแบบจำลอง
 */
export const createMockShipment = async (
  sender: MockSenderInfo,
  recipient: MockRecipientInfo,
  details: MockShipmentDetails,
  shippingCode: string
): Promise<{ trackingNumber: string; price: number }> => {
  try {
    const response = await axios.post('/api/mock-shipping/create', {
      sender,
      recipient,
      weight: details.weight,
      dimensions: details.dimensions,
      value: details.value,
      shippingCode,
      isCOD: details.isCOD,
      codAmount: details.codAmount
    });

    if (response.data && response.data.success) {
      return {
        trackingNumber: response.data.trackingNumber,
        price: response.data.price
      };
    } else {
      throw new Error(response.data?.message || 'ไม่สามารถสร้างการจัดส่งได้');
    }
  } catch (error: any) {
    console.error('Error creating mock shipment:', error);
    throw new Error(`ไม่สามารถสร้างการจัดส่งได้: ${error.message}`);
  }
};

/**
 * ติดตามสถานะพัสดุ
 */
export const trackMockShipment = async (trackingNumber: string): Promise<MockTrackingInfo> => {
  try {
    const response = await axios.get(`/api/mock-shipping/track/${trackingNumber}`);

    if (response.data && response.data.success) {
      // แปลง string เป็น Date objects
      const trackingInfo = response.data.trackingInfo;
      
      // แปลงข้อมูลวันที่ที่รับมาเป็น Date objects
      trackingInfo.timestamp = new Date(trackingInfo.timestamp);
      if (trackingInfo.estimatedDelivery) {
        trackingInfo.estimatedDelivery = new Date(trackingInfo.estimatedDelivery);
      }
      
      // แปลงข้อมูลวันที่ในประวัติการเคลื่อนไหว
      trackingInfo.events = trackingInfo.events.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }));
      
      return trackingInfo;
    } else {
      throw new Error(response.data?.message || 'ไม่สามารถติดตามพัสดุได้');
    }
  } catch (error: any) {
    console.error('Error tracking mock shipment:', error);
    throw new Error(`ไม่สามารถติดตามพัสดุได้: ${error.message}`);
  }
};

/**
 * ดึงข้อมูลจังหวัดทั้งหมด
 */
export const getMockProvinces = async (): Promise<MockProvince[]> => {
  try {
    const response = await axios.get('/api/mock-shipping/provinces');

    if (response.data && response.data.success) {
      return response.data.provinces;
    } else {
      throw new Error(response.data?.message || 'ไม่สามารถดึงข้อมูลจังหวัดได้');
    }
  } catch (error: any) {
    console.error('Error getting mock provinces:', error);
    throw new Error(`ไม่สามารถดึงข้อมูลจังหวัดได้: ${error.message}`);
  }
};