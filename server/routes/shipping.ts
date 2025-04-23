import { Router } from 'express';
import { auth } from '../middleware/auth';
import { storage } from '../storage';

const router = Router();

/**
 * API สำหรับดึงตัวเลือกการจัดส่ง
 */
router.post('/options', auth, async (req, res) => {
  try {
    // ตัวเลือกการจัดส่งเริ่มต้น
    const defaultOptions = [
      {
        id: 1,
        name: 'บริการส่งด่วน',
        price: 60,
        deliveryTime: '1-2 วัน',
        provider: 'บริการจัดส่ง',
        serviceId: 'EXPRESS-FAST',
        logo: '/assets/shipping-icon.png'
      },
      {
        id: 2,
        name: 'บริการส่งธรรมดา',
        price: 40,
        deliveryTime: '2-3 วัน',
        provider: 'บริการจัดส่ง',
        serviceId: 'EXPRESS-NORMAL',
        logo: '/assets/shipping-icon.png'
      }
    ];

    res.json({
      success: true,
      options: defaultOptions
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
 * API สำหรับ Mock การสร้างเลขพัสดุ
 */
router.post('/create', auth, async (req: Request, res: Response) => {
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!req.body.senderInfo || !req.body.receiverInfo || !req.body.packageInfo) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        missingFields: ['ข้อมูลผู้ส่งหรือผู้รับไม่ครบถ้วน']
      });
    }

    // สร้างเลขพัสดุจำลอง
    const trackingNumberPrefix = 'TRK';
    const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const trackingNumber = `${trackingNumberPrefix}${randomDigits}TH`;

    // จำลองการตอบกลับ
    res.json({
      success: true,
      trackingNumber: trackingNumber,
      sortCode: 'SC' + Math.floor(Math.random() * 1000).toString().padStart(4, '0'),
      message: 'สร้างเลขพัสดุสำเร็จ'
    });
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

    // สร้างข้อมูลสถานะการจัดส่งจำลอง
    const statusOptions = ['pending', 'in_transit', 'out_for_delivery', 'delivered'];
    const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    // สร้างข้อมูลการติดตามจำลอง
    const mockTrackingInfo = {
      trackingNumber,
      status: randomStatus,
      statusText: getStatusText(randomStatus),
      updatedAt: new Date().toISOString(),
      details: [
        {
          status: 'created',
          statusText: 'สร้างรายการพัสดุแล้ว',
          location: 'ศูนย์คัดแยกต้นทาง',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 วันก่อน
        }
      ]
    };
    
    // เพิ่มสถานะเพิ่มเติมตามสถานะปัจจุบัน
    if (['in_transit', 'out_for_delivery', 'delivered'].includes(randomStatus)) {
      mockTrackingInfo.details.push({
        status: 'in_transit',
        statusText: 'พัสดุอยู่ระหว่างการขนส่ง',
        location: 'ศูนย์คัดแยกกลาง',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 ชั่วโมงก่อน
      });
    }
    
    if (['out_for_delivery', 'delivered'].includes(randomStatus)) {
      mockTrackingInfo.details.push({
        status: 'out_for_delivery',
        statusText: 'กำลังนำส่งพัสดุ',
        location: 'ศูนย์กระจายสินค้าปลายทาง',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 ชั่วโมงก่อน
      });
    }
    
    if (randomStatus === 'delivered') {
      mockTrackingInfo.details.push({
        status: 'delivered',
        statusText: 'จัดส่งสำเร็จ',
        location: 'ปลายทาง',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 ชั่วโมงก่อน
      });
    }

    res.json({
      success: true,
      status: mockTrackingInfo
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

// ฟังก์ชันช่วยแปลสถานะเป็นข้อความภาษาไทย
function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'รอดำเนินการ';
    case 'in_transit':
      return 'อยู่ระหว่างการขนส่ง';
    case 'out_for_delivery':
      return 'กำลังนำส่ง';
    case 'delivered':
      return 'จัดส่งสำเร็จ';
    default:
      return 'ไม่ทราบสถานะ';
  }
}

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