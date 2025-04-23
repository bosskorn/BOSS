import axios from 'axios';
import crypto from 'crypto';
import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';

// URL ของ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api.flashexpress.com';

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
    
    // สร้างข้อมูลสำหรับส่งไปยัง Flash Express API ตามเอกสารและตัวอย่างล่าสุด
    const apiParams: Record<string, any> = {
      mchId: process.env.FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      warehouseNo: `${process.env.FLASH_EXPRESS_MERCHANT_ID}_001`, // เพิ่ม warehouseNo ตามรูปแบบในตัวอย่าง
      
      // ข้อมูลที่อยู่รับพัสดุ (แบบแยกข้อมูล)
      srcName: params.contactName,
      srcPhone: params.contactPhone,
      srcProvinceName: params.province,
      srcCityName: params.district,
      srcDistrictName: params.subdistrict,
      srcPostalCode: params.zipcode,
      srcDetailAddress: params.pickupAddress,
      
      // จำนวนพัสดุโดยประมาณ - ใช้ค่า fix 100 ตามตัวอย่าง
      estimateParcelNumber: 100,
      
      // เพิ่มข้อมูลวันที่และช่วงเวลาที่ต้องการให้เข้ารับ
      pickupDate: formattedDate,
      pickupTimeSlot: params.requestTimeSlot,
      
      // เพิ่มข้อมูลหมายเลขพัสดุ (ถ้ามี)
      pno: params.trackingNumbers.length > 0 ? params.trackingNumbers.join(',') : undefined,
      
      // ข้อมูลเพิ่มเติม - ใช้ตามตัวอย่าง
      remark: "ASAP"
    };
    
    // สร้างลายเซ็น
    const signature = createSignature(apiParams, process.env.FLASH_EXPRESS_API_KEY);
    apiParams.sign = signature;
    
    console.log('Flash Express Pickup API request params:', JSON.stringify(apiParams, null, 2));
    
    // URL ของ API เรียกรถของ Flash Express ตามเอกสารล่าสุด
    const apiUrl = `${FLASH_EXPRESS_API_URL}/open/v1/notify`;
    console.log('Flash Express Pickup API URL:', apiUrl);
    
    // แสดงข้อมูลแบบละเอียดเพื่อการตรวจสอบ
    console.log('Flash Express Pickup API - ข้อมูลที่จะส่งในแบบ URL-encoded:');
    console.log(querystring.stringify(apiParams));
    
    try {
      // ส่งคำขอไปยัง Flash Express API
      console.log('Sending request to Flash Express Pickup API...');
      const response = await axios.post(apiUrl, querystring.stringify(apiParams), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'ShipSync/1.0',
          'X-API-Key': process.env.FLASH_EXPRESS_API_KEY || ''
        },
        responseType: 'json',
        validateStatus: (status) => status < 500, // ยอมรับการตอบกลับที่มี status code น้อยกว่า 500
        timeout: 15000, // เพิ่ม timeout เป็น 15 วินาที
        maxRedirects: 0 // ป้องกันการ redirect ที่อาจนำไปสู่การได้รับ HTML
      });
      
      // ตรวจสอบว่าการตอบกลับเป็น HTML (มีแท็ก DOCTYPE) หรือไม่
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        console.error('Flash Express API returned HTML instead of JSON:', response.data.substring(0, 200));
        throw new Error('Flash Express API ตอบกลับด้วยหน้าเว็บแทนที่จะเป็น JSON - โปรดตรวจสอบ API Key และการตั้งค่า');
      }
      
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
      
      // กรณีมีรหัสข้อผิดพลาด 1001 (ไม่มีข้อมูล) ให้อธิบายเพิ่มเติม
      if (response.data.code === 1001) {
        console.warn('Flash Express API returned code 1001 (ไม่มีข้อมูล):', response.data);
        throw new Error('Flash Express API แจ้งว่าไม่มีข้อมูล (รหัส 1001) - ข้อมูลที่ระบุอาจไม่ถูกต้องหรือไม่ครบถ้วน');
      }
      
      // กรณีมีข้อผิดพลาดอื่นๆ
      throw new Error(response.data.message || response.data.msg || `รหัสข้อผิดพลาด: ${response.data.code}` || 'ไม่ทราบสาเหตุ');
    } catch (axiosError: any) {
      if (axiosError.response) {
        // ตรวจสอบข้อผิดพลาดจาก Axios
        const responseData = axiosError.response.data;
        
        // ตรวจสอบว่าข้อมูลตอบกลับเป็น HTML หรือไม่
        if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE')) {
          console.error('Error: Flash Express API returned HTML:', responseData.substring(0, 200));
          throw new Error('Flash Express API ตอบกลับด้วยหน้าเว็บแทนที่จะเป็น JSON - โปรดตรวจสอบ API Key และการตั้งค่า');
        }
        
        // เช็คกรณี 404 Not Found
        if (axiosError.response.status === 404) {
          console.error('Flash Express API endpoint not found (404):', axiosError.response.config.url);
          throw new Error('ไม่พบ Endpoint ของ Flash Express API - กรุณาตรวจสอบ URL');
        }
        
        // เช็คกรณี 401 Unauthorized หรือ 403 Forbidden
        if (axiosError.response.status === 401 || axiosError.response.status === 403) {
          console.error('Flash Express API authorization error:', axiosError.response.status, responseData);
          throw new Error('ไม่สามารถยืนยันตัวตนกับ Flash Express API ได้ - กรุณาตรวจสอบ Merchant ID และ API Key');
        }
        
        console.error('Error response from Flash Express Pickup API:', responseData);
        
        // จัดการข้อผิดพลาดตามรหัสข้อผิดพลาดที่ Flash Express ส่งกลับมา
        if (responseData && responseData.code) {
          const errorCode = responseData.code;
          const errorMessage = responseData.message || responseData.msg || 'ไม่ทราบข้อผิดพลาด';
          
          switch (errorCode) {
            case 1001:
              throw new Error(`Flash Express API: ไม่มีข้อมูล (รหัส ${errorCode})`);
            default:
              throw new Error(`Flash Express API: ${errorMessage} (รหัส ${errorCode})`);
          }
        }
        
        throw new Error(
          (responseData.msg || responseData.message || 'มีข้อผิดพลาดจาก Flash Express API') + 
          (responseData.code ? ` (รหัสข้อผิดพลาด: ${responseData.code})` : '')
        );
      }
      
      // กรณีที่ข้อผิดพลาดระบุว่าไม่สามารถแปลง HTML เป็น JSON ได้
      if (axiosError.message && axiosError.message.includes("Unexpected token '<'")) {
        console.error('Error parsing Flash Express API response - received HTML instead of JSON');
        throw new Error('Flash Express API ส่งคืนหน้าเว็บแทนที่จะเป็น JSON - API Key หรือ URL อาจไม่ถูกต้อง');
      }
      
      // กรณีที่เกิดข้อผิดพลาด timeout
      if (axiosError.code === 'ECONNABORTED') {
        console.error('Flash Express API request timed out');
        throw new Error('การเชื่อมต่อกับ Flash Express API หมดเวลา - อาจเกิดจากปัญหาเครือข่ายหรือ API ไม่ตอบสนอง');
      }
      
      throw axiosError;
    }
  } catch (error: any) {
    console.error('Error requesting pickup from Flash Express:', error);
    throw error;
  }
}