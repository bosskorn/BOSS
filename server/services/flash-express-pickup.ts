import axios from 'axios';
import crypto from 'crypto';
import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';

// URL ของ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api.flashexpress.com/open';

// ฟังก์ชันสำหรับสร้างลายเซ็นดิจิตอล (signature) สำหรับ Flash Express API
function createSignature(params: Record<string, any>, apiKey: string): string {
  try {
    console.log('Starting signature creation for Flash Express Pickup API');
    
    // คัดลอกพารามิเตอร์ทั้งหมดเพื่อสร้าง signature
    const paramsForSign = { ...params };
    
    // ลบฟิลด์ที่ไม่ต้องใช้ในการสร้าง signature
    delete paramsForSign.sign;
    
    // เรียงฟิลด์ตามรหัส ASCII
    const sortedKeys = Object.keys(paramsForSign).sort();
    
    // สร้าง string จากชื่อและค่าของทุกฟิลด์ที่เรียงลำดับแล้ว
    const parts: string[] = [];
    
    for (const key of sortedKeys) {
      let value = paramsForSign[key];
      
      // ข้ามฟิลด์ที่เป็น undefined หรือ null
      if (value === undefined || value === null) {
        continue;
      }
      
      // แปลงข้อมูลเป็น string ถ้าจำเป็น
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (typeof value !== 'string') {
        value = String(value);
      }
      
      // ข้ามค่าว่าง
      if (value.trim() === '') {
        continue;
      }
      
      // เพิ่มเข้าไปในรายการสำหรับการสร้าง stringA
      parts.push(`${key}=${value}`);
    }
    
    // รวม key=value คั่นด้วย & เพื่อสร้าง stringA
    const stringA = parts.join('&');
    
    // ต่อ stringA ด้วย &key=API_KEY เพื่อสร้าง stringSignTemp
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    console.log('Flash Express pickup signature stringSignTemp:', stringSignTemp); // เพื่อดีบัก
    
    // สร้าง signature ด้วย SHA-256
    const signature = crypto.createHash('sha256').update(stringSignTemp).digest('hex').toUpperCase();
    console.log('Flash Express pickup signature result:', signature);
    
    return signature;
  } catch (error) {
    console.error('Error creating Flash Express pickup signature:', error);
    throw new Error('Failed to create signature for Flash Express Pickup API');
  }
}

// ข้อมูลที่จำเป็นสำหรับการเรียกรถเข้ารับพัสดุ
interface PickupRequestParams {
  trackingNumbers: string[];
  requestDate: Date;
  requestTimeSlot: string;
  pickupAddress: string;
  contactName: string;
  contactPhone: string;
  province: string;
  district: string;
  subdistrict: string;
  zipcode: string;
}

// ฟังก์ชันสำหรับเรียกรถเข้ารับพัสดุผ่าน Flash Express API
export async function flashExpressPickupRequest(params: PickupRequestParams): Promise<any> {
  try {
    if (!process.env.FLASH_EXPRESS_MERCHANT_ID || !process.env.FLASH_EXPRESS_API_KEY) {
      throw new Error('ไม่พบค่า Flash Express Merchant ID หรือ API Key ในไฟล์ .env');
    }

    // สร้าง Nonce และ Reference ID สำหรับการเรียกใช้ API
    const nonceStr = Date.now().toString();
    const referenceId = `PICKUP${Date.now()}`;
    
    // แปลงรูปแบบวันที่ให้เป็น YYYY-MM-DD
    const formattedDate = params.requestDate.toISOString().split('T')[0];
    
    // สร้างข้อมูลสำหรับส่งไปยัง Flash Express API
    const apiParams: Record<string, any> = {
      mchId: process.env.FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      referenceNumber: referenceId,
      
      // ข้อมูลอิทธิการเรียกรถ
      pickupDate: formattedDate,
      timeSlot: params.requestTimeSlot,
      
      // ข้อมูลที่อยู่รับพัสดุ
      province: params.province,
      city: params.district,
      district: params.subdistrict,
      address: params.pickupAddress,
      postalCode: params.zipcode,
      
      // ข้อมูลผู้ติดต่อ
      contactPerson: params.contactName,
      phone: params.contactPhone,
      
      // รายการเลขพัสดุ
      parcels: JSON.stringify(params.trackingNumbers.map(trackingNumber => ({
        pno: trackingNumber
      }))),
      
      // ข้อมูลเพิ่มเติม
      remark: "เรียกรถจากระบบอัตโนมัติ"
    };
    
    // สร้างลายเซ็น
    const signature = createSignature(apiParams, process.env.FLASH_EXPRESS_API_KEY);
    apiParams.sign = signature;
    
    console.log('Flash Express Pickup API request params:', JSON.stringify(apiParams, null, 2));
    
    // URL ของ API เรียกรถของ Flash Express
    const apiUrl = `${FLASH_EXPRESS_API_URL}/v1/pickup`;
    
    // ส่งคำขอไปยัง Flash Express API
    const response = await axios.post(apiUrl, querystring.stringify(apiParams), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });
    
    console.log('Flash Express Pickup API response:', response.data);
    
    // ตรวจสอบการตอบกลับจาก API
    if (response.data.code === 1 || response.data.msg === 'success' || response.data.message === 'success') {
      return {
        success: true,
        referenceId,
        pickupDate: formattedDate,
        timeSlot: params.requestTimeSlot,
        response: response.data
      };
    }
    
    // กรณีมีข้อผิดพลาด
    throw new Error(response.data.msg || response.data.message || 'ไม่ทราบสาเหตุ');
  } catch (error: any) {
    console.error('Error requesting pickup from Flash Express:', error);
    
    // ตรวจสอบว่าเป็นข้อผิดพลาดจาก Axios หรือไม่
    if (error.response) {
      console.error('Error response from Flash Express Pickup API:', error.response.data);
      throw new Error(error.response.data.msg || error.response.data.message || 'มีข้อผิดพลาดจาก Flash Express API');
    }
    
    throw error;
  }
}