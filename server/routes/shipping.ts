import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import {
  getFlashExpressShippingOptions,
  createFlashExpressShipping,
  getFlashExpressTrackingStatus
} from '../services/flash-express';
import { analyzeAddress } from '../services/longdo-map';

const router = express.Router();

/**
 * API สำหรับดึงตัวเลือกการจัดส่ง
 */
router.post('/options', auth, async (req: Request, res: Response) => {
  try {
    const { fromAddress, toAddress, packageInfo } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!fromAddress || !toAddress || !packageInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required information'
      });
    }
    
    // ดึงตัวเลือกการจัดส่ง
    const options = await getFlashExpressShippingOptions(
      fromAddress,
      toAddress,
      packageInfo
    );
    
    res.json({
      success: true,
      options
    });
  } catch (error: any) {
    console.error('Error getting shipping options:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get shipping options'
    });
  }
});

/**
 * API สำหรับสร้างการจัดส่งใหม่
 */
router.post('/create', auth, async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      senderInfo,
      receiverInfo,
      packageInfo,
      serviceId,
      codAmount = 0
    } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!orderId || !senderInfo || !receiverInfo || !packageInfo || !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required information'
      });
    }
    
    // สร้างการจัดส่ง
    const result = await createFlashExpressShipping(
      orderId,
      senderInfo,
      receiverInfo,
      packageInfo,
      serviceId,
      codAmount
    );
    
    if (result.success) {
      res.json({
        success: true,
        trackingNumber: result.trackingNumber,
        labelUrl: result.labelUrl
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to create shipping'
      });
    }
  } catch (error: any) {
    console.error('Error creating shipping:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create shipping'
    });
  }
});

/**
 * API สำหรับตรวจสอบสถานะการจัดส่ง
 */
router.get('/track/:trackingNumber', async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number is required'
      });
    }
    
    const status = await getFlashExpressTrackingStatus(trackingNumber);
    
    res.json({
      success: true,
      status
    });
  } catch (error: any) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to track shipment'
    });
  }
});

/**
 * API สำหรับวิเคราะห์ที่อยู่ (ใช้การวิเคราะห์แบบ local)
 */
router.post('/analyze-address', auth, async (req: Request, res: Response) => {
  try {
    const { fullAddress } = req.body;
    
    if (!fullAddress) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }
    
    // วิเคราะห์ที่อยู่ด้วยวิธี local แทนการใช้ Longdo Map API
    const addressComponents = parseAddress(fullAddress);
    
    // ตรวจสอบว่ามีข้อมูลที่วิเคราะห์ได้บ้างหรือไม่
    if (Object.keys(addressComponents).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถวิเคราะห์ที่อยู่ได้'
      });
    }
    
    res.json({
      success: true,
      address: addressComponents
    });
  } catch (error: any) {
    console.error('Error analyzing address:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze address'
    });
  }
});

// ฟังก์ชันสำหรับแยกประเภทข้อมูลที่อยู่จากข้อความ
function parseAddress(text: string): any {
  const components: any = {};
  
  // แยกตามบรรทัด
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const addressText = lines.join(' ');
  
  // ดึงรหัสไปรษณีย์ (เป็นตัวเลข 5 หลักที่มักจะอยู่ท้ายที่อยู่)
  const zipRegex = /\b(\d{5})\b/;
  const zipMatch = addressText.match(zipRegex);
  if (zipMatch) {
    components.zipcode = zipMatch[1];
  }
  
  // ดึงเลขที่บ้าน/อาคาร (ตัวเลข/ตัวเลข หรือตัวเลขอย่างเดียว ที่อยู่ต้นประโยค)
  const houseNumberRegex = /(?:^|\s)([0-9\/\-]+)(?:\s|$)/;
  const houseNumberMatch = addressText.match(houseNumberRegex);
  if (houseNumberMatch) {
    components.houseNumber = houseNumberMatch[1];
  }
  
  // ดึงชื่อหมู่บ้าน/อาคาร หรือ หมู่ที่
  const villageRegex = /(?:หมู่บ้าน|หมู่|ม\.|อาคาร|คอนโด)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const villageMatch = addressText.match(villageRegex);
  if (villageMatch) {
    components.village = villageMatch[0].trim();
  }
  
  // ดึงข้อมูลซอย
  const soiRegex = /(?:ซอย|ซ\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const soiMatch = addressText.match(soiRegex);
  if (soiMatch) {
    components.soi = soiMatch[0].trim();
  }
  
  // ดึงข้อมูลถนน
  const roadRegex = /(?:ถนน|ถ\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const roadMatch = addressText.match(roadRegex);
  if (roadMatch) {
    components.road = roadMatch[0].trim();
  }
  
  // รายชื่อจังหวัดและคำนำหน้าแขวง/ตำบล/อำเภอ/เขต
  const provinceNames = [
    "กรุงเทพ", "กรุงเทพฯ", "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", 
    "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", 
    "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", 
    "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", 
    "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พะเยา", "พระนครศรีอยุธยา", 
    "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", 
    "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", 
    "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", 
    "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", 
    "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", 
    "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี", "อำนาจเจริญ"
  ];
  
  // ค้นหาจังหวัด
  for (const province of provinceNames) {
    if (addressText.includes(province)) {
      components.province = province;
      break;
    }
  }
  
  // ค้นหาแขวง/ตำบล และเขต/อำเภอ
  const subdistrictRegex = /(?:แขวง|ตำบล|ต\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const subdistrictMatch = addressText.match(subdistrictRegex);
  if (subdistrictMatch) {
    components.subdistrict = subdistrictMatch[0].trim();
  }
  
  const districtRegex = /(?:เขต|อำเภอ|อ\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const districtMatch = addressText.match(districtRegex);
  if (districtMatch) {
    components.district = districtMatch[0].trim();
  }
  
  // หากไม่พบแขวง/ตำบล และเขต/อำเภอด้วยการค้นหาแบบมีคำนำหน้า 
  // ให้ลองค้นหาจากคำที่มักมาก่อนจังหวัด
  if (components.province && !components.district && !components.subdistrict) {
    // ตัดตั้งแต่จังหวัดออกไป
    const beforeProvince = addressText.split(components.province)[0];
    const words = beforeProvince.split(/\s+/);
    
    // มักเรียงเป็น ตำบล -> อำเภอ -> จังหวัด หรือใช้ชื่อเลย
    if (words.length >= 2) {
      // อาจเป็นชื่ออำเภอโดยตรง
      components.district = words[words.length - 1];
      
      // และอาจเป็นชื่อตำบลก่อนหน้านั้น
      if (words.length >= 3) {
        components.subdistrict = words[words.length - 2];
      }
    }
  }
  
  return components;
}

export default router;