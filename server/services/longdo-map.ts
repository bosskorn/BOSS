import axios from 'axios';

// API Key จาก environment variable
const LONGDO_MAP_API_KEY = process.env.LONGDO_MAP_API_KEY;

// URL พื้นฐานของ API
const EXTRACT_ADDRESS_API_URL = 'https://search.longdo.com/smartsearch/json/extract_address/v2';

/**
 * อินเตอร์เฟซสำหรับผลลัพธ์ของ Longdo Extract Address API
 */
interface LongdoAddressResult {
  house_number?: string;
  road?: string;
  alley?: string;     // ซอย
  village?: string;   // หมู่บ้าน/อาคาร
  district?: string;  // อำเภอ/เขต
  subdistrict?: string; // ตำบล/แขวง
  province?: string;  // จังหวัด
  postal_code?: string; // รหัสไปรษณีย์
  country?: string;
  building?: string;  // ชื่ออาคาร
  floor?: string;     // ชั้น
  room?: string;      // ห้อง
}

/**
 * อินเตอร์เฟซสำหรับผลลัพธ์ของ API ที่เราต้องการส่งกลับ
 */
export interface AddressComponents {
  houseNumber: string;
  village: string;
  soi: string;
  road: string;
  subdistrict: string;
  district: string;
  province: string;
  zipcode: string;
}

/**
 * วิเคราะห์ข้อความที่อยู่โดยใช้ Longdo Map Extract Address API
 * 
 * @param fullAddress ข้อความที่อยู่ที่ต้องการวิเคราะห์
 * @returns ข้อมูลที่อยู่ที่แยกส่วนแล้ว
 */
export async function analyzeLongdoAddress(fullAddress: string): Promise<AddressComponents> {
  try {
    if (!LONGDO_MAP_API_KEY) {
      throw new Error('Longdo Map API key not found');
    }

    // สร้าง URL พร้อมพารามิเตอร์
    const url = `${EXTRACT_ADDRESS_API_URL}?text=${encodeURIComponent(fullAddress)}&key=${LONGDO_MAP_API_KEY}`;
    
    // เรียกใช้ API
    const response = await axios.get(url);
    const data = response.data;
    
    // ตรวจสอบว่า API ส่งผลลัพธ์ที่ถูกต้องกลับมาหรือไม่
    if (!data || !data.result) {
      throw new Error('Invalid response from Longdo Map API');
    }
    
    // แปลงข้อมูลจาก API ให้ตรงกับรูปแบบที่ต้องการ
    const addressResult: LongdoAddressResult = data.result;
    
    return {
      houseNumber: addressResult.house_number || '',
      village: addressResult.village || addressResult.building || '',
      soi: addressResult.alley || '',
      road: addressResult.road || '',
      subdistrict: addressResult.subdistrict || '',
      district: addressResult.district || '',
      province: addressResult.province || '',
      zipcode: addressResult.postal_code || '',
    };
  } catch (error: any) {
    console.error('Error analyzing address with Longdo Map API:', error);
    throw new Error(error.message || 'Failed to analyze address');
  }
}

/**
 * ค้นหาข้อมูลที่อยู่จากรหัสไปรษณีย์
 * 
 * @param zipcode รหัสไปรษณีย์
 * @returns ข้อมูลที่อยู่ที่เกี่ยวข้องกับรหัสไปรษณีย์
 */
export async function getAddressByZipcode(zipcode: string): Promise<{
  province: string,
  districts: Array<{
    district: string,
    subdistricts: string[]
  }>
}> {
  // ข้อมูลตัวอย่าง (สามารถปรับเปลี่ยนให้เรียกใช้ API จริงในอนาคต)
  const mockData: Record<string, any> = {
    '10500': {
      province: 'กรุงเทพมหานคร',
      districts: [
        {
          district: 'บางรัก',
          subdistricts: ['สีลม', 'สุริยวงศ์', 'บางรัก', 'มหาพฤฒาราม', 'สี่พระยา']
        }
      ]
    },
    '10400': {
      province: 'กรุงเทพมหานคร',
      districts: [
        {
          district: 'พญาไท',
          subdistricts: ['สามเสนใน']
        },
        {
          district: 'ราชเทวี',
          subdistricts: ['ทุ่งพญาไท', 'ถนนพญาไท', 'ถนนเพชรบุรี', 'มักกะสัน']
        }
      ]
    },
    '10330': {
      province: 'กรุงเทพมหานคร',
      districts: [
        {
          district: 'ปทุมวัน',
          subdistricts: ['รองเมือง', 'วังใหม่', 'ปทุมวัน', 'ลุมพินี']
        }
      ]
    }
  };
  
  return mockData[zipcode] || {
    province: '',
    districts: []
  };
}