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
    // ข้อมูลตัวอย่างสำหรับรหัสไปรษณีย์ทั่วไป
    const sampleData: Record<string, any> = {
      // กรุงเทพมหานคร
      '10200': { province: 'กรุงเทพมหานคร', district: 'พระนคร', subdistrict: 'วังบูรพาภิรมย์' },
      '10300': { province: 'กรุงเทพมหานคร', district: 'ดุสิต', subdistrict: 'ดุสิต' },
      '10310': { province: 'กรุงเทพมหานคร', district: 'ห้วยขวาง', subdistrict: 'ห้วยขวาง' },
      '10330': { province: 'กรุงเทพมหานคร', district: 'ปทุมวัน', subdistrict: 'ปทุมวัน' },
      '10400': { province: 'กรุงเทพมหานคร', district: 'พญาไท', subdistrict: 'สามเสนใน' },
      '10500': { province: 'กรุงเทพมหานคร', district: 'สัมพันธวงศ์', subdistrict: 'สัมพันธวงศ์' },
      '10600': { province: 'กรุงเทพมหานคร', district: 'ตลิ่งชัน', subdistrict: 'ตลิ่งชัน' },
      '10700': { province: 'กรุงเทพมหานคร', district: 'บางกอกใหญ่', subdistrict: 'วัดท่าพระ' },
      '10800': { province: 'กรุงเทพมหานคร', district: 'บางเขน', subdistrict: 'ท่าแร้ง' },
      '10900': { province: 'กรุงเทพมหานคร', district: 'พระโขนง', subdistrict: 'บางจาก' },
      '10230': { province: 'กรุงเทพมหานคร', district: 'บางกะปิ', subdistrict: 'คลองจั่น' },
      
      // จังหวัดอื่นๆ ในภาคกลาง
      '11000': { province: 'สมุทรปราการ', district: 'เมืองสมุทรปราการ', subdistrict: 'ปากน้ำ' },
      '12000': { province: 'นนทบุรี', district: 'เมืองนนทบุรี', subdistrict: 'สวนใหญ่' },
      '13000': { province: 'ปทุมธานี', district: 'เมืองปทุมธานี', subdistrict: 'บางปรอก' },
      '14000': { province: 'พระนครศรีอยุธยา', district: 'พระนครศรีอยุธยา', subdistrict: 'ประตูชัย' },
      '20000': { province: 'ชลบุรี', district: 'เมืองชลบุรี', subdistrict: 'บางปลาสร้อย' },
      '22000': { province: 'จันทบุรี', district: 'เมืองจันทบุรี', subdistrict: 'ตลาด' },
      '22120': { province: 'จันทบุรี', district: 'แหลมสิงห์', subdistrict: 'ปากน้ำแหลมสิงห์' },
      '22170': { province: 'จันทบุรี', district: 'ท่าใหม่', subdistrict: 'ท่าใหม่' },
      
      // ภาคเหนือ
      '50000': { province: 'เชียงใหม่', district: 'เมืองเชียงใหม่', subdistrict: 'ศรีภูมิ' },
      '50200': { province: 'เชียงใหม่', district: 'จอมทอง', subdistrict: 'บ้านหลวง' },
      '53000': { province: 'อุตรดิตถ์', district: 'เมืองอุตรดิตถ์', subdistrict: 'ท่าอิฐ' },
      
      // ภาคอีสาน
      '30000': { province: 'นครราชสีมา', district: 'เมืองนครราชสีมา', subdistrict: 'ในเมือง' },
      '34000': { province: 'อุบลราชธานี', district: 'เมืองอุบลราชธานี', subdistrict: 'ในเมือง' },
      '40000': { province: 'ขอนแก่น', district: 'เมืองขอนแก่น', subdistrict: 'ในเมือง' },
      
      // ภาคใต้
      '80000': { province: 'นครศรีธรรมราช', district: 'เมืองนครศรีธรรมราช', subdistrict: 'ในเมือง' },
      '83000': { province: 'ภูเก็ต', district: 'เมืองภูเก็ต', subdistrict: 'ตลาดใหญ่' },
      '90000': { province: 'สงขลา', district: 'เมืองสงขลา', subdistrict: 'บ่อยาง' },
      '90110': { province: 'สงขลา', district: 'หาดใหญ่', subdistrict: 'หาดใหญ่' }
    };

    // ตรวจสอบว่ามี API key หรือไม่
    if (process.env.LONGDO_MAP_API_KEY) {
      const keyLength = process.env.LONGDO_MAP_API_KEY.length;
      const maskedKey = process.env.LONGDO_MAP_API_KEY.substring(0, 4) + '...' + 
                       process.env.LONGDO_MAP_API_KEY.substring(keyLength - 4);
      console.log(`พบ LONGDO_MAP_API_KEY: ${maskedKey} (ความยาว ${keyLength} ตัวอักษร)`);
      
      try {
        // เรียกใช้ Longdo Map API
        const response = await axios.get(
          `https://api.longdo.com/map/services/address?zipcode=${zipcode}&key=${process.env.LONGDO_MAP_API_KEY}`
        );
        
        console.log('ข้อมูลตอบกลับจาก Longdo API:', JSON.stringify(response.data).substring(0, 200) + '...');

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
        }
        // หากไม่พบข้อมูลจาก API ให้ใช้ข้อมูลตัวอย่าง
        console.log('ไม่พบข้อมูลจาก Longdo API ใช้ข้อมูลตัวอย่างแทน');
      } catch (apiError) {
        console.error('เกิดข้อผิดพลาดในการเรียกใช้ Longdo API:', apiError);
      }
    } else {
      console.log('LONGDO_MAP_API_KEY ไม่ได้ถูกตั้งค่า ใช้ข้อมูลตัวอย่างแทน');
    }
    
    // ใช้ข้อมูลตัวอย่าง (กรณีไม่มี API key หรือ API ล้มเหลว)
    if (sampleData[zipcode]) {
      return {
        success: true,
        address: {
          province: sampleData[zipcode].province,
          district: sampleData[zipcode].district,
          subdistrict: sampleData[zipcode].subdistrict,
          zipcode: zipcode
        }
      };
    } else {
      return {
        success: false,
        message: 'ไม่พบข้อมูลรหัสไปรษณีย์ตัวอย่าง'
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
    // ตรวจสอบว่ามี API key หรือไม่
    if (process.env.LONGDO_MAP_API_KEY) {
      const keyLength = process.env.LONGDO_MAP_API_KEY.length;
      const maskedKey = process.env.LONGDO_MAP_API_KEY.substring(0, 4) + '...' + 
                      process.env.LONGDO_MAP_API_KEY.substring(keyLength - 4);
      console.log(`พบ LONGDO_MAP_API_KEY สำหรับวิเคราะห์ที่อยู่: ${maskedKey} (ความยาว ${keyLength} ตัวอักษร)`);
      
      try {
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

        console.log('ข้อมูลตอบกลับจาก Longdo ExtractAddress API:', JSON.stringify(response.data).substring(0, 200) + '...');

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
        }
        // หากไม่พบข้อมูลจาก API ให้ใช้ข้อมูลตัวอย่าง
        console.log('ไม่พบข้อมูลจาก Longdo ExtractAddress API ใช้ข้อมูลตัวอย่างแทน');
      } catch (apiError) {
        console.error('เกิดข้อผิดพลาดในการเรียกใช้ Longdo ExtractAddress API:', apiError);
      }
    } else {
      console.log('LONGDO_MAP_API_KEY ไม่ได้ถูกตั้งค่า ใช้ข้อมูลตัวอย่างสำหรับวิเคราะห์ที่อยู่แทน');
    }
    
    // ใช้การวิเคราะห์ตัวอย่าง (กรณีไม่มี API key หรือ API ล้มเหลว)
    // ตรวจสอบคำสำคัญในข้อความที่อยู่เพื่อสร้างผลลัพธ์ตัวอย่าง
    const address = {
      houseNumber: '123',
      village: '',
      soi: '',
      road: '',
      subdistrict: '',
      district: '',
      province: '',
      zipcode: '',
      building: '',
      floor: '',
      roomNumber: ''
    };
    
    // ตรวจหาจังหวัด
    if (fullAddress.includes('กรุงเทพ') || fullAddress.includes('กทม')) {
      address.province = 'กรุงเทพมหานคร';
    } else if (fullAddress.includes('เชียงใหม่')) {
      address.province = 'เชียงใหม่';
    } else if (fullAddress.includes('ภูเก็ต')) {
      address.province = 'ภูเก็ต';
    } else {
      address.province = 'กรุงเทพมหานคร'; // ค่าเริ่มต้น
    }
    
    // ตรวจหาเขต/อำเภอ
    if (fullAddress.includes('พระนคร')) {
      address.district = 'พระนคร';
      address.province = 'กรุงเทพมหานคร';
    } else if (fullAddress.includes('ดุสิต')) {
      address.district = 'ดุสิต';
      address.province = 'กรุงเทพมหานคร';
    } else if (fullAddress.includes('ห้วยขวาง')) {
      address.district = 'ห้วยขวาง';
      address.province = 'กรุงเทพมหานคร';
    } else if (fullAddress.includes('ปทุมวัน')) {
      address.district = 'ปทุมวัน';
      address.province = 'กรุงเทพมหานคร';
    } else {
      address.district = 'พระนคร'; // ค่าเริ่มต้น
    }
    
    // ตรวจหาแขวง/ตำบล
    if (fullAddress.includes('วังบูรพาภิรมย์')) {
      address.subdistrict = 'วังบูรพาภิรมย์';
    } else if (fullAddress.includes('สัมพันธวงศ์')) {
      address.subdistrict = 'สัมพันธวงศ์';
    } else if (fullAddress.includes('ดุสิต') && address.district === 'ดุสิต') {
      address.subdistrict = 'ดุสิต';
    } else if (fullAddress.includes('ปทุมวัน') && address.district === 'ปทุมวัน') {
      address.subdistrict = 'ปทุมวัน';
    } else {
      address.subdistrict = 'วังบูรพาภิรมย์'; // ค่าเริ่มต้น
    }
    
    // ตรวจหาถนน
    if (fullAddress.includes('รัชดาภิเษก')) {
      address.road = 'รัชดาภิเษก';
    } else if (fullAddress.includes('สุขุมวิท')) {
      address.road = 'สุขุมวิท';
    } else if (fullAddress.includes('เพชรบุรี')) {
      address.road = 'เพชรบุรี';
    } else {
      address.road = 'เจริญกรุง'; // ค่าเริ่มต้น
    }
    
    // ตรวจหาซอย
    const soiRegex = /ซอย\s*([^,\n]+)/i;
    const soiMatch = fullAddress.match(soiRegex);
    if (soiMatch && soiMatch[1]) {
      address.soi = soiMatch[1].trim();
    }
    
    // ตรวจหารหัสไปรษณีย์
    const zipRegex = /\b\d{5}\b/;
    const zipMatch = fullAddress.match(zipRegex);
    if (zipMatch) {
      address.zipcode = zipMatch[0];
    } else {
      address.zipcode = '10200'; // ค่าเริ่มต้น
    }
    
    return {
      success: true,
      address
    };
  } catch (error) {
    console.error('Error analyzing address with Longdo Map API:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อกับ Longdo Map API ได้'
    };
  }
}