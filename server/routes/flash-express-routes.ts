import { Router } from "express";
import { z } from "zod";
import { getShippingOptions, createShipment, trackShipment } from "../services/flash-express-working";
import { auth } from "../middleware/auth";
import { storage } from "../storage";

const router = Router();

// สคีมาตรวจสอบข้อมูลสำหรับคำนวณค่าจัดส่ง
const calculateRateSchema = z.object({
  originAddress: z.object({
    province: z.string(),
    district: z.string(),
    subdistrict: z.string(),
    zipcode: z.string(),
  }),
  destinationAddress: z.object({
    province: z.string(),
    district: z.string(),
    subdistrict: z.string(),
    zipcode: z.string(),
  }),
  packageDetails: z.object({
    weight: z.number().positive(),
    width: z.number().positive(),
    length: z.number().positive(),
    height: z.number().positive(),
  }),
});

// สคีมาตรวจสอบข้อมูลสำหรับสร้างเลขพัสดุ
const createShipmentSchema = z.object({
  // ข้อมูลผู้ส่ง
  senderName: z.string(),
  senderPhone: z.string(),
  senderAddress: z.object({
    address: z.string(),
    province: z.string(),
    district: z.string(),
    subdistrict: z.string(),
    zipcode: z.string(),
  }),
  
  // ข้อมูลผู้รับ
  recipientName: z.string(),
  recipientPhone: z.string(),
  recipientAddress: z.object({
    address: z.string(),
    province: z.string(),
    district: z.string(),
    subdistrict: z.string(),
    zipcode: z.string(),
  }),
  
  // ข้อมูลพัสดุ
  weight: z.number().positive(),
  width: z.number().positive(),
  length: z.number().positive(),
  height: z.number().positive(),
  
  // อื่นๆ
  remark: z.string().optional(),
  insured: z.number().default(0),
  codEnabled: z.number().default(0),
  codAmount: z.number().default(0),
  articleCategory: z.string().default('1'),
  expressCategory: z.string().default('1'),
  parcelKind: z.string().default('1'),
});

// คำนวณค่าจัดส่ง Flash Express
router.post("/calculate", auth, async (req, res) => {
  try {
    // ตรวจสอบข้อมูล
    const validationResult = calculateRateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "ข้อมูลไม่ถูกต้อง",
        details: validationResult.error.format(),
      });
    }
    
    const { originAddress, destinationAddress, packageDetails } = validationResult.data;
    
    // เรียกใช้บริการคำนวณค่าจัดส่ง
    const result = await getShippingOptions(originAddress, destinationAddress, packageDetails);
    
    return res.json(result);
  } catch (error: any) {
    console.error("Error calculating shipping rate:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการคำนวณค่าจัดส่ง",
    });
  }
});

// สร้างเลขพัสดุ Flash Express
router.post("/create", auth, async (req, res) => {
  try {
    // ตรวจสอบข้อมูล
    const validationResult = createShipmentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "ข้อมูลไม่ถูกต้อง",
        details: validationResult.error.format(),
      });
    }

    const userId = (req.user as any).id;
    
    // ตรวจสอบยอดเงินว่าเพียงพอหรือไม่
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบข้อมูลผู้ใช้",
      });
    }
    
    // คำนวณค่าส่งเพื่อตรวจสอบความถูกต้องก่อนส่ง API
    const { senderAddress, recipientAddress, weight, width, length, height, insured, codEnabled, codAmount } = validationResult.data;
    
    const packageDetails = { weight, width, length, height };
    const shippingRate = await getShippingOptions(senderAddress, recipientAddress, packageDetails);
    
    if (!shippingRate.success) {
      return res.status(400).json({
        success: false,
        error: `ไม่สามารถคำนวณค่าจัดส่งได้: ${shippingRate.error}`,
      });
    }
    
    // คำนวณค่าบริการทั้งหมด (ค่าส่ง + ประกัน + COD)
    let totalFee = shippingRate.price;
    if (insured === 1) {
      totalFee += 20; // ค่าประกัน 20 บาท
    }
    
    if (codEnabled === 1 && codAmount > 0) {
      const codFee = Math.max(codAmount * 0.03, 10); // ค่าธรรมเนียม COD 3% หรือขั้นต่ำ 10 บาท
      totalFee += codFee;
    }
    
    // ค่าธรรมเนียมแพลตฟอร์ม
    const platformFee = 25; // ค่าธรรมเนียมแพลตฟอร์ม 25 บาท
    totalFee += platformFee;
    
    // ตรวจสอบยอดเงินคงเหลือ
    if (Number(user.balance) < totalFee) {
      return res.status(400).json({
        success: false,
        error: `ยอดเงินไม่เพียงพอ กรุณาเติมเงิน จำนวนเงินที่ต้องการ ${totalFee.toFixed(2)} บาท แต่มียอดเงินคงเหลือ ${Number(user.balance).toFixed(2)} บาท`,
      });
    }
    
    // สร้างเลขพัสดุ
    const shipmentResult = await createShipment(validationResult.data);
    
    if (!shipmentResult.success) {
      return res.status(400).json({
        success: false,
        error: shipmentResult.error || "ไม่สามารถสร้างเลขพัสดุได้",
        errorData: shipmentResult,
      });
    }
    
    // หักเงินจากบัญชีผู้ใช้
    await storage.updateUserBalance(userId, -totalFee);
    
    // บันทึกประวัติการใช้บริการ
    await storage.createFeeHistory({
      userId,
      amount: totalFee,
      description: `ค่าบริการจัดส่งพัสดุ Flash Express เลขติดตาม ${shipmentResult.trackingNumber}`,
      type: "shipping",
      status: "completed"
    });
    
    // บันทึกข้อมูลออเดอร์
    const order = await storage.createOrder({
      userId,
      trackingNumber: shipmentResult.trackingNumber,
      senderName: validationResult.data.senderName,
      senderPhone: validationResult.data.senderPhone,
      senderAddress: `${senderAddress.address} ${senderAddress.subdistrict} ${senderAddress.district} ${senderAddress.province} ${senderAddress.zipcode}`,
      recipientName: validationResult.data.recipientName,
      recipientPhone: validationResult.data.recipientPhone,
      recipientAddress: `${recipientAddress.address} ${recipientAddress.subdistrict} ${recipientAddress.district} ${recipientAddress.province} ${recipientAddress.zipcode}`,
      shippingMethod: "Flash Express",
      status: "pending",
      amount: totalFee,
      weight: weight,
      shippingData: JSON.stringify(shipmentResult),
      remark: validationResult.data.remark || "",
    });
    
    return res.json({
      success: true,
      trackingNumber: shipmentResult.trackingNumber,
      orderId: order.id,
      amount: totalFee,
      message: "สร้างเลขพัสดุสำเร็จ",
    });
  } catch (error: any) {
    console.error("Error creating shipment:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการสร้างเลขพัสดุ",
    });
  }
});

// ติดตามสถานะพัสดุ
router.get("/track/:trackingNumber", auth, async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        error: "กรุณาระบุเลขพัสดุ",
      });
    }
    
    const result = await trackShipment(trackingNumber);
    
    return res.json(result);
  } catch (error: any) {
    console.error("Error tracking shipment:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการติดตามพัสดุ",
    });
  }
});

export default router;