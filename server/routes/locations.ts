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
    
    // ตรวจสอบว่ามี API key สำหรับ Longdo Map หรือไม่
    if (!process.env.LONGDO_MAP_API_KEY) {
      return res.status(500).json({ success: false, message: "ไม่พบ API key สำหรับ Longdo Map" });
    }
    
    // เรียกใช้ Longdo Map API เพื่อดึงข้อมูลจากรหัสไปรษณีย์
    const response = await axios.get(`https://api.longdo.com/map/services/address?zipcode=${zipcode}&key=${process.env.LONGDO_MAP_API_KEY}`);
    
    if (!response.data || response.data.error) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลรหัสไปรษณีย์" });
    }
    
    const addressData = response.data;
    
    // แปลงข้อมูลจาก Longdo Map API เป็นรูปแบบที่เราต้องการ
    const addressComponents = {
      province: addressData.province || "",
      district: addressData.district || "",
      subdistrict: addressData.subdistrict || "",
      zipcode: zipcode
    };
    
    res.status(200).json({ success: true, address: addressComponents });
  } catch (error) {
    console.error("Error fetching address from zipcode:", error);
    res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลที่อยู่จากรหัสไปรษณีย์ได้" });
  }
});

export default router;