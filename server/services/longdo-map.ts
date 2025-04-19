/**
 * Longdo Map Service
 * บริการสำหรับเรียกใช้ API ของ Longdo Map
 */

import axios from 'axios';

/**
 * ค้นหาและดึงข้อมูลที่อยู่จากรหัสไปรษณีย์
 * @param zipcode รหัสไปรษณีย์
 * @returns ข้อมูลจังหวัด อำเภอ และตำบลที่ตรงกับรหัสไปรษณีย์
 */
export async function getAddressFromZipcode(zipcode: string) {
  try {
    if (!process.env.LONGDO_MAP_API_KEY) {
      throw new Error('LONGDO_MAP_API_KEY ไม่ได้ถูกตั้งค่า');
    }

    // เรียกใช้ Longdo Map API
    const response = await axios.get(
      `https://api.longdo.com/map/services/address?zipcode=${zipcode}&key=${process.env.LONGDO_MAP_API_KEY}`
    );

    // ตรวจสอบผลลัพธ์
    if (response.data && !response.data.error) {
      return {
        success: true,
        address: {
          province: response.data.province || '',
          district: response.data.district || '',
          subdistrict: response.data.subdistrict || '',
          zipcode: zipcode
        }
      };
    } else {
      return {
        success: false,
        message: response.data.error || 'ไม่พบข้อมูลที่อยู่'
      };
    }
  } catch (error) {
    console.error('Error fetching address from Longdo Map API:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อกับ Longdo Map API ได้'
    };
  }
}

/**
 * วิเคราะห์ที่อยู่จากข้อความยาวและแยกส่วนประกอบ
 * @param fullAddress ข้อความที่อยู่ยาว
 * @returns ส่วนประกอบของที่อยู่ที่แยกแล้ว
 */
export async function analyzeAddress(fullAddress: string) {
  try {
    if (!process.env.LONGDO_MAP_API_KEY) {
      throw new Error('LONGDO_MAP_API_KEY ไม่ได้ถูกตั้งค่า');
    }

    // เรียกใช้ Longdo Map API สำหรับวิเคราะห์ที่อยู่
    const response = await axios.post(
      `https://api.longdo.com/ExtractAddress/json/search`,
      { addr: fullAddress },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          key: process.env.LONGDO_MAP_API_KEY
        }
      }
    );

    // ตรวจสอบผลลัพธ์
    if (response.data && response.data.components) {
      const components = response.data.components;
      
      // แปลงข้อมูลจาก Longdo Map API เป็นรูปแบบที่เราต้องการ
      return {
        success: true,
        address: {
          houseNumber: components.no || '',
          village: components.village || '',
          soi: components.soi || '',
          road: components.road || '',
          subdistrict: components.tumbon || '',
          district: components.amphoe || '',
          province: components.province || '',
          zipcode: components.postcode || '',
          building: components.room || components.building || '',
          floor: components.floor || '',
          roomNumber: components.room || ''
        }
      };
    } else {
      return {
        success: false,
        message: 'ไม่สามารถวิเคราะห์ที่อยู่ได้'
      };
    }
  } catch (error) {
    console.error('Error analyzing address with Longdo Map API:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อกับ Longdo Map API ได้'
    };
  }
}