import axios from 'axios';
import { Request, Response } from 'express';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://api-sandbox.flashexpress.com/open-api/v2';
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// ตรวจสอบว่ามี API key หรือไม่
if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
  console.warn('FLASH_EXPRESS_MERCHANT_ID or FLASH_EXPRESS_API_KEY not set');
}

// ประเภทข้อมูลสำหรับตัวเลือกการจัดส่ง
interface FlashExpressShippingOption {
  id: number;
  name: string;
  price: number;
  deliveryTime: string;
  provider: string;
  serviceId: string;
  logo?: string;
}

// ประเภทข้อมูลสำหรับที่อยู่
interface AddressInfo {
  province: string;
  district: string;
  subdistrict: string;
  zipcode: string;
}

/**
 * ดึงตัวเลือกการจัดส่งจาก Flash Express
 */
export const getFlashExpressShippingOptions = async (
  fromAddress: AddressInfo,
  toAddress: AddressInfo,
  packageInfo: {
    weight: number; // น้ำหนักเป็นกิโลกรัม
    width: number;  // ความกว้างเป็นเซนติเมตร
    length: number; // ความยาวเป็นเซนติเมตร
    height: number; // ความสูงเป็นเซนติเมตร
  }
): Promise<FlashExpressShippingOption[]> => {
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }

    // ทำการเรียก API จริง (ในกรณีทดสอบให้จำลองข้อมูล)
    // ในสภาพแวดล้อมจริงจะต้องเรียก API ของ Flash Express

    // จำลองข้อมูลสำหรับทดสอบ
    const mockOptions: FlashExpressShippingOption[] = [
      {
        id: 1,
        name: 'Flash Express - ส่งด่วน',
        price: 60,
        deliveryTime: '1-2 วัน',
        provider: 'Flash Express',
        serviceId: 'FLASH-FAST',
        logo: '/assets/flash-express.png'
      },
      {
        id: 2,
        name: 'Flash Express - ส่งธรรมดา',
        price: 40,
        deliveryTime: '2-3 วัน',
        provider: 'Flash Express',
        serviceId: 'FLASH-NORMAL',
        logo: '/assets/flash-express.png'
      }
    ];

    return mockOptions;
    
    /* ตัวอย่างการเรียก API จริง
    const response = await axios({
      method: 'post',
      url: `${FLASH_EXPRESS_API_URL}/shipping/calculate-fee`,
      headers: {
        'Content-Type': 'application/json',
        'X-Flash-Merchant-Id': FLASH_EXPRESS_MERCHANT_ID,
        'X-Flash-Api-Key': FLASH_EXPRESS_API_KEY,
      },
      data: {
        from: {
          province: fromAddress.province,
          district: fromAddress.district,
          subdistrict: fromAddress.subdistrict,
          postcode: fromAddress.zipcode,
        },
        to: {
          province: toAddress.province,
          district: toAddress.district,
          subdistrict: toAddress.subdistrict,
          postcode: toAddress.zipcode,
        },
        parcel: {
          weight: packageInfo.weight,
          width: packageInfo.width,
          length: packageInfo.length,
          height: packageInfo.height,
        }
      }
    });

    // แปลงข้อมูลจาก API เป็นรูปแบบที่ต้องการ
    const options: FlashExpressShippingOption[] = response.data.data.map((item: any, index: number) => ({
      id: index + 1,
      name: `Flash Express - ${item.service_name}`,
      price: item.fee,
      deliveryTime: item.estimated_delivery_time,
      provider: 'Flash Express',
      serviceId: item.service_id,
      logo: '/assets/flash-express.png'
    }));

    return options;
    */
  } catch (error: any) {
    console.error('Error getting Flash Express shipping options:', error);
    throw new Error(`Failed to get shipping options: ${error.message}`);
  }
};

/**
 * สร้างการจัดส่งใหม่กับ Flash Express
 */
export const createFlashExpressShipping = async (
  orderId: string,
  senderInfo: {
    name: string;
    phone: string;
    address: string;
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
  },
  receiverInfo: {
    name: string;
    phone: string;
    address: string;
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
  },
  packageInfo: {
    weight: number;
    width: number;
    length: number;
    height: number;
  },
  serviceId: string,
  codAmount: number = 0,
): Promise<{ 
  success: boolean; 
  trackingNumber?: string; 
  labelUrl?: string; 
  error?: string;
}> => {
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }

    // จำลองการสร้างเลขติดตามพัสดุ
    const trackingNumber = `FLE${Date.now().toString().substring(5)}`;
    const labelUrl = `https://example.com/label/${trackingNumber}.pdf`;

    return {
      success: true,
      trackingNumber,
      labelUrl
    };
    
    /* ตัวอย่างการเรียก API จริง
    const response = await axios({
      method: 'post',
      url: `${FLASH_EXPRESS_API_URL}/shipment/create`,
      headers: {
        'Content-Type': 'application/json',
        'X-Flash-Merchant-Id': FLASH_EXPRESS_MERCHANT_ID,
        'X-Flash-Api-Key': FLASH_EXPRESS_API_KEY,
      },
      data: {
        shipment: {
          ref_no: orderId,
          service_id: serviceId,
          from: {
            name: senderInfo.name,
            phone: senderInfo.phone,
            address: senderInfo.address,
            province: senderInfo.province,
            district: senderInfo.district,
            subdistrict: senderInfo.subdistrict,
            postcode: senderInfo.zipcode,
          },
          to: {
            name: receiverInfo.name,
            phone: receiverInfo.phone,
            address: receiverInfo.address,
            province: receiverInfo.province,
            district: receiverInfo.district,
            subdistrict: receiverInfo.subdistrict,
            postcode: receiverInfo.zipcode,
          },
          parcel: {
            weight: packageInfo.weight,
            width: packageInfo.width,
            length: packageInfo.length,
            height: packageInfo.height,
          },
          cod_amount: codAmount,
          is_cod: codAmount > 0,
        }
      }
    });

    // ตรวจสอบผลลัพธ์
    if (response.data.status === 'success') {
      return {
        success: true,
        trackingNumber: response.data.data.tracking_number,
        labelUrl: response.data.data.label_url
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Unknown error'
      };
    }
    */
  } catch (error: any) {
    console.error('Error creating Flash Express shipping:', error);
    return {
      success: false,
      error: error.message || 'Failed to create shipping'
    };
  }
};

/**
 * ตรวจสอบสถานะการจัดส่งจาก Flash Express
 */
export const getFlashExpressTrackingStatus = async (trackingNumber: string): Promise<any> => {
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }

    // จำลองข้อมูลสถานะการจัดส่ง
    const mockStatus = {
      tracking_number: trackingNumber,
      status: 'in_transit',
      estimated_delivery: new Date(Date.now() + 86400000).toISOString(),
      history: [
        {
          timestamp: new Date().toISOString(),
          status: 'Parcel picked up',
          location: 'Bangkok Sorting Center'
        }
      ]
    };

    return mockStatus;
    
    /* ตัวอย่างการเรียก API จริง
    const response = await axios({
      method: 'get',
      url: `${FLASH_EXPRESS_API_URL}/shipment/tracking/${trackingNumber}`,
      headers: {
        'X-Flash-Merchant-Id': FLASH_EXPRESS_MERCHANT_ID,
        'X-Flash-Api-Key': FLASH_EXPRESS_API_KEY,
      }
    });

    return response.data.data;
    */
  } catch (error: any) {
    console.error('Error getting Flash Express tracking status:', error);
    throw new Error(`Failed to get tracking status: ${error.message}`);
  }
};