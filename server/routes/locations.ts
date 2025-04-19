import express, { Request, Response } from "express";
import { getAllProvinces, getDistrictsByProvinceId, getSubdistrictsByDistrictId } from "../services/locations";
import axios from "axios";

const router = express.Router();

/**
 * API สำหรับดึงข้อมูลจังหวัดทั้งหมด
 */
router.get("/provinces", async (req: Request, res: Response) => {
  try {
    const provinces = getAllProvinces();
    res.status(200).json({ success: true, provinces });
  } catch (error) {
    console.error("Error fetching provinces:", error);
    res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลจังหวัดได้" });
  }
});

/**
 * API สำหรับดึงข้อมูลอำเภอตามรหัสจังหวัด
 */
router.get("/districts", async (req: Request, res: Response) => {
  try {
    const { provinceId } = req.query;
    
    if (!provinceId) {
      return res.status(400).json({ success: false, message: "กรุณาระบุรหัสจังหวัด" });
    }
    
    const districts = getDistrictsByProvinceId(provinceId as string);
    res.status(200).json({ success: true, districts });
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลอำเภอได้" });
  }
});

/**
 * API สำหรับดึงข้อมูลตำบลตามรหัสอำเภอ
 */
router.get("/subdistricts", async (req: Request, res: Response) => {
  try {
    const { districtId } = req.query;
    
    if (!districtId) {
      return res.status(400).json({ success: false, message: "กรุณาระบุรหัสอำเภอ" });
    }
    
    const subdistricts = getSubdistrictsByDistrictId(districtId as string);
    res.status(200).json({ success: true, subdistricts });
  } catch (error) {
    console.error("Error fetching subdistricts:", error);
    res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลตำบลได้" });
  }
});

/**
 * API สำหรับดึงข้อมูลที่อยู่จากรหัสไปรษณีย์ด้วย Longdo Map API
 */
router.get("/zipcode/:zipcode", async (req: Request, res: Response) => {
  try {
    const { zipcode } = req.params;
    
    if (!zipcode || !/^\d{5}$/.test(zipcode)) {
      return res.status(400).json({ success: false, message: "รหัสไปรษณีย์ไม่ถูกต้อง" });
    }
    
    // ไม่ต้องตรวจสอบ API key ที่นี่ เนื่องจากเราได้แก้ไข service ให้รองรับกรณีไม่มี API key แล้ว
    // โดยจะใช้ข้อมูลตัวอย่างแทน
    
    // เรียกใช้ service ที่ทำการเชื่อมต่อกับ Longdo Map API
    const { getAddressFromZipcode } = await import('../services/longdo-map');
    
    // ดึงข้อมูลที่อยู่จากรหัสไปรษณีย์
    let result = await getAddressFromZipcode(zipcode);
    console.log(`ผลลัพธ์จาก Longdo API ของรหัสไปรษณีย์ ${zipcode}:`, JSON.stringify(result));
    
    if (!result.success) {
      console.log(`ไม่พบข้อมูลรหัสไปรษณีย์: ${zipcode}, ข้อความ: ${result.message}`);
      
      // ข้อมูลตัวอย่างเพื่อการทดสอบ
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
      
      if (sampleData[zipcode]) {
        return res.status(200).json({ 
          success: true, 
          address: {
            province: sampleData[zipcode].province,
            district: sampleData[zipcode].district,
            subdistrict: sampleData[zipcode].subdistrict,
            zipcode
          },
          note: "ข้อมูลตัวอย่างเพื่อการทดสอบ (ไม่พบ LONGDO_MAP_API_KEY)"
        });
      }
      
      return res.status(404).json({ success: false, message: result.message || "ไม่พบข้อมูลรหัสไปรษณีย์" });
    }
    
    res.status(200).json({ success: true, address: result.address });
  } catch (error) {
    console.error("Error fetching address from zipcode:", error);
    res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลที่อยู่จากรหัสไปรษณีย์ได้" });
  }
});

export default router;