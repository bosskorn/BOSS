import express, { Request, Response } from 'express';
import { auth, adminOnly } from '../middleware/auth';
import { storage } from '../storage';

const router = express.Router();

// API ดึงข้อมูลภาพรวมรายงาน
router.get('/overview', auth, async (req: Request, res: Response) => {
  try {
    const period = req.query.period || 'month';
    
    // ข้อมูลตัวอย่างสำหรับการพัฒนา (ในโปรดักชันควรดึงจากฐานข้อมูล)
    const sampleSalesData = [
      { name: 'มกราคม', value: 24500 },
      { name: 'กุมภาพันธ์', value: 13250 },
      { name: 'มีนาคม', value: 38600 },
      { name: 'เมษายน', value: 47800 },
      { name: 'พฤษภาคม', value: 35400 },
      { name: 'มิถุนายน', value: 29700 },
    ];

    const sampleOrderStatusData = [
      { name: 'รอจัดส่ง', value: 45 },
      { name: 'อยู่ระหว่างจัดส่ง', value: 30 },
      { name: 'จัดส่งสำเร็จ', value: 120 },
      { name: 'ยกเลิก', value: 5 },
      { name: 'คืนสินค้า', value: 10 },
    ];

    const sampleShipmentCarrierData = [
      { name: 'Flash Express', value: 85 },
      { name: 'Kerry Express', value: 45 },
      { name: 'Thailand Post', value: 30 },
      { name: 'J&T Express', value: 25 },
      { name: 'DHL', value: 15 },
    ];

    const sampleDeliveryPerformanceData = [
      { name: 'จัดส่งตรงเวลา', value: 85 },
      { name: 'จัดส่งล่าช้า', value: 15 },
    ];

    const data = {
      summary: {
        totalOrders: 210,
        totalRevenue: 189600,
        totalCustomers: 145,
        totalShipments: 198,
        orderGrowth: 12,
        revenueGrowth: 8,
        customerGrowth: 5,
        shipmentGrowth: 15,
      },
      charts: {
        salesOverTime: sampleSalesData,
        ordersByStatus: sampleOrderStatusData,
        shipmentsByCarrier: sampleShipmentCarrierData,
        deliveryPerformance: sampleDeliveryPerformanceData
      }
    };

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching report overview:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน'
    });
  }
});

// API ดึงข้อมูลรายงานตามขนส่ง
router.get('/by-courier', auth, async (req: Request, res: Response) => {
  try {
    const period = req.query.period || 'month';
    const courier = req.query.courier || 'all';
    
    const sampleVolumeData = [
      { name: 'Flash Express', value: 85, percent: 42.5 },
      { name: 'Kerry Express', value: 45, percent: 22.5 },
      { name: 'Thailand Post', value: 30, percent: 15 },
      { name: 'J&T Express', value: 25, percent: 12.5 },
      { name: 'DHL', value: 15, percent: 7.5 },
    ];

    const sampleDeliveryTimeData = [
      { name: 'Flash Express', value: 1.8 },
      { name: 'Kerry Express', value: 2.2 },
      { name: 'Thailand Post', value: 3.5 },
      { name: 'J&T Express', value: 2.0 },
      { name: 'DHL', value: 1.5 },
    ];

    const samplePerformanceData = [
      { name: 'Flash Express', onTime: 85, delayed: 15 },
      { name: 'Kerry Express', onTime: 80, delayed: 20 },
      { name: 'Thailand Post', onTime: 70, delayed: 30 },
      { name: 'J&T Express', onTime: 82, delayed: 18 },
      { name: 'DHL', onTime: 90, delayed: 10 },
    ];

    const sampleDailyShipmentsData = [
      { name: 'จันทร์', FlashExpress: 12, Kerry: 8, ThailandPost: 5, JT: 7, DHL: 3 },
      { name: 'อังคาร', FlashExpress: 15, Kerry: 10, ThailandPost: 7, JT: 8, DHL: 4 },
      { name: 'พุธ', FlashExpress: 18, Kerry: 12, ThailandPost: 8, JT: 6, DHL: 5 },
      { name: 'พฤหัสบดี', FlashExpress: 14, Kerry: 9, ThailandPost: 6, JT: 9, DHL: 3 },
      { name: 'ศุกร์', FlashExpress: 21, Kerry: 11, ThailandPost: 9, JT: 8, DHL: 4 },
      { name: 'เสาร์', FlashExpress: 16, Kerry: 7, ThailandPost: 5, JT: 6, DHL: 2 },
      { name: 'อาทิตย์', FlashExpress: 9, Kerry: 5, ThailandPost: 3, JT: 4, DHL: 1 },
    ];

    const sampleCourierDetails = [
      {
        courier: 'Flash Express',
        totalOrders: 85,
        avgDeliveryTime: '1.8 วัน',
        onTimeDelivery: '85%',
        avgCost: '฿40.50',
        returns: 3,
        cod: 35,
        mostCommonRegion: 'ภาคกลาง'
      },
      {
        courier: 'Kerry Express',
        totalOrders: 45,
        avgDeliveryTime: '2.2 วัน',
        onTimeDelivery: '80%',
        avgCost: '฿45.75',
        returns: 2,
        cod: 20,
        mostCommonRegion: 'กรุงเทพฯ'
      },
      {
        courier: 'Thailand Post',
        totalOrders: 30,
        avgDeliveryTime: '3.5 วัน',
        onTimeDelivery: '70%',
        avgCost: '฿38.00',
        returns: 4,
        cod: 12,
        mostCommonRegion: 'ภาคเหนือ'
      },
      {
        courier: 'J&T Express',
        totalOrders: 25,
        avgDeliveryTime: '2.0 วัน',
        onTimeDelivery: '82%',
        avgCost: '฿42.25',
        returns: 1,
        cod: 10,
        mostCommonRegion: 'ภาคตะวันออกเฉียงเหนือ'
      },
      {
        courier: 'DHL',
        totalOrders: 15,
        avgDeliveryTime: '1.5 วัน',
        onTimeDelivery: '90%',
        avgCost: '฿120.00',
        returns: 0,
        cod: 2,
        mostCommonRegion: 'กรุงเทพฯ'
      }
    ];

    res.json({
      success: true,
      data: {
        volumeData: sampleVolumeData,
        deliveryTimeData: sampleDeliveryTimeData,
        performanceData: samplePerformanceData,
        dailyShipmentsData: sampleDailyShipmentsData,
        courierDetails: sampleCourierDetails
      }
    });
  } catch (error) {
    console.error('Error fetching courier report:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานตามขนส่ง'
    });
  }
});

// API ดึงข้อมูลรายงานตามพื้นที่
router.get('/by-area', auth, async (req: Request, res: Response) => {
  try {
    const period = req.query.period || 'month';
    const region = req.query.region || 'all';
    const province = req.query.province || 'all';
    
    const sampleRegionData = [
      { name: 'กรุงเทพและปริมณฑล', value: 95, percent: 47.5 },
      { name: 'ภาคกลาง', value: 35, percent: 17.5 },
      { name: 'ภาคเหนือ', value: 22, percent: 11.0 },
      { name: 'ภาคตะวันออกเฉียงเหนือ', value: 18, percent: 9.0 },
      { name: 'ภาคตะวันออก', value: 15, percent: 7.5 },
      { name: 'ภาคตะวันตก', value: 8, percent: 4.0 },
      { name: 'ภาคใต้', value: 7, percent: 3.5 },
    ];

    const sampleProvinceData = [
      { name: 'กรุงเทพมหานคร', value: 65, percent: 32.5 },
      { name: 'นนทบุรี', value: 12, percent: 6.0 },
      { name: 'ปทุมธานี', value: 8, percent: 4.0 },
      { name: 'สมุทรปราการ', value: 6, percent: 3.0 },
      { name: 'เชียงใหม่', value: 10, percent: 5.0 },
      { name: 'ชลบุรี', value: 9, percent: 4.5 },
      { name: 'อื่นๆ', value: 90, percent: 45.0 },
    ];

    const sampleDeliveryTimeData = [
      { name: 'กรุงเทพและปริมณฑล', value: 1.2 },
      { name: 'ภาคกลาง', value: 1.8 },
      { name: 'ภาคเหนือ', value: 2.5 },
      { name: 'ภาคตะวันออกเฉียงเหนือ', value: 3.0 },
      { name: 'ภาคตะวันออก', value: 2.0 },
      { name: 'ภาคตะวันตก', value: 2.2 },
      { name: 'ภาคใต้', value: 3.5 },
    ];

    const sampleRevenueData = [
      { name: 'กรุงเทพและปริมณฑล', value: 85000 },
      { name: 'ภาคกลาง', value: 42000 },
      { name: 'ภาคเหนือ', value: 28000 },
      { name: 'ภาคตะวันออกเฉียงเหนือ', value: 25000 },
      { name: 'ภาคตะวันออก', value: 20000 },
      { name: 'ภาคตะวันตก', value: 15000 },
      { name: 'ภาคใต้', value: 18000 },
    ];

    const sampleTopDistrictsData = [
      { name: 'จตุจักร', region: 'กรุงเทพฯ', value: 25, growth: 15 },
      { name: 'บางนา', region: 'กรุงเทพฯ', value: 20, growth: 8 },
      { name: 'ห้วยขวาง', region: 'กรุงเทพฯ', value: 18, growth: 5 },
      { name: 'ปากเกร็ด', region: 'นนทบุรี', value: 15, growth: 12 },
      { name: 'เมือง', region: 'เชียงใหม่', value: 10, growth: -3 },
      { name: 'ศรีราชา', region: 'ชลบุรี', value: 8, growth: 10 },
      { name: 'หาดใหญ่', region: 'สงขลา', value: 7, growth: 4 },
      { name: 'คลองหลวง', region: 'ปทุมธานี', value: 6, growth: 7 },
      { name: 'บางพลี', region: 'สมุทรปราการ', value: 5, growth: -2 },
      { name: 'เมือง', region: 'อุดรธานี', value: 5, growth: 6 },
    ];

    const sampleDetailedAreaData = [
      {
        region: 'กรุงเทพและปริมณฑล',
        orders: 95,
        revenue: '฿85,000',
        avgOrderValue: '฿895',
        deliveryTime: '1.2 วัน',
        onTimeRate: '92%',
        returnRate: '2.5%',
        topCourier: 'Flash Express'
      },
      {
        region: 'ภาคกลาง',
        orders: 35,
        revenue: '฿42,000',
        avgOrderValue: '฿1,200',
        deliveryTime: '1.8 วัน',
        onTimeRate: '88%',
        returnRate: '3.2%',
        topCourier: 'Kerry Express'
      },
      {
        region: 'ภาคเหนือ',
        orders: 22,
        revenue: '฿28,000',
        avgOrderValue: '฿1,270',
        deliveryTime: '2.5 วัน',
        onTimeRate: '75%',
        returnRate: '4.5%',
        topCourier: 'Thailand Post'
      },
      {
        region: 'ภาคตะวันออกเฉียงเหนือ',
        orders: 18,
        revenue: '฿25,000',
        avgOrderValue: '฿1,390',
        deliveryTime: '3.0 วัน',
        onTimeRate: '70%',
        returnRate: '5.0%',
        topCourier: 'Thailand Post'
      },
      {
        region: 'ภาคตะวันออก',
        orders: 15,
        revenue: '฿20,000',
        avgOrderValue: '฿1,330',
        deliveryTime: '2.0 วัน',
        onTimeRate: '85%',
        returnRate: '3.0%',
        topCourier: 'J&T Express'
      },
      {
        region: 'ภาคตะวันตก',
        orders: 8,
        revenue: '฿15,000',
        avgOrderValue: '฿1,875',
        deliveryTime: '2.2 วัน',
        onTimeRate: '82%',
        returnRate: '3.8%',
        topCourier: 'Kerry Express'
      },
      {
        region: 'ภาคใต้',
        orders: 7,
        revenue: '฿18,000',
        avgOrderValue: '฿2,570',
        deliveryTime: '3.5 วัน',
        onTimeRate: '65%',
        returnRate: '6.2%',
        topCourier: 'Thailand Post'
      }
    ];

    res.json({
      success: true,
      data: {
        regionData: sampleRegionData,
        provinceData: sampleProvinceData,
        deliveryTimeData: sampleDeliveryTimeData,
        revenueData: sampleRevenueData,
        topDistrictsData: sampleTopDistrictsData,
        detailedAreaData: sampleDetailedAreaData
      }
    });
  } catch (error) {
    console.error('Error fetching area report:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานตามพื้นที่'
    });
  }
});

// API ดึงข้อมูลรายงาน COD
router.get('/cod', auth, async (req: Request, res: Response) => {
  try {
    const period = req.query.period || 'month';
    const start = req.query.start;
    const end = req.query.end;
    const search = req.query.search;
    
    const sampleCodStatusData = [
      { name: 'เก็บเงินแล้ว', value: 45, percent: 45 },
      { name: 'โอนเงินแล้ว', value: 30, percent: 30 },
      { name: 'รอดำเนินการ', value: 15, percent: 15 },
      { name: 'ยกเลิก', value: 10, percent: 10 },
    ];

    const sampleCodTrendData = [
      { date: '01/04/2025', value: 15000 },
      { date: '02/04/2025', value: 18000 },
      { date: '03/04/2025', value: 12000 },
      { date: '04/04/2025', value: 22000 },
      { date: '05/04/2025', value: 20000 },
      { date: '06/04/2025', value: 15000 },
      { date: '07/04/2025', value: 10000 },
      { date: '08/04/2025', value: 25000 },
      { date: '09/04/2025', value: 30000 },
      { date: '10/04/2025', value: 28000 },
      { date: '11/04/2025', value: 20000 },
      { date: '12/04/2025', value: 18000 },
      { date: '13/04/2025', value: 15000 },
      { date: '14/04/2025', value: 22000 },
    ];

    const sampleCodByAreaData = [
      { name: 'กรุงเทพและปริมณฑล', value: 85000 },
      { name: 'ภาคกลาง', value: 45000 },
      { name: 'ภาคเหนือ', value: 32000 },
      { name: 'ภาคตะวันออกเฉียงเหนือ', value: 28000 },
      { name: 'ภาคตะวันออก', value: 25000 },
      { name: 'ภาคตะวันตก', value: 18000 },
      { name: 'ภาคใต้', value: 15000 },
    ];

    const sampleCodByAmountData = [
      { name: '< ฿500', value: 35 },
      { name: '฿500 - ฿999', value: 25 },
      { name: '฿1,000 - ฿1,999', value: 20 },
      { name: '฿2,000 - ฿4,999', value: 12 },
      { name: '฿5,000 - ฿9,999', value: 5 },
      { name: '≥ ฿10,000', value: 3 },
    ];

    const samplePendingTransfersData = [
      { name: 'Flash Express', value: 25000, count: 15 },
      { name: 'Kerry Express', value: 18000, count: 10 },
      { name: 'Thailand Post', value: 12000, count: 8 },
      { name: 'J&T Express', value: 8000, count: 5 },
    ];

    const sampleCodDetailedList = [
      {
        id: 'COD001',
        orderNumber: 'ORD-12345',
        amount: 1250,
        customerName: 'สมชาย มั่งมี',
        date: '10/04/2025',
        status: 'collected',
        courier: 'Flash Express',
        trackingNumber: 'FLX123456789TH'
      },
      {
        id: 'COD002',
        orderNumber: 'ORD-12346',
        amount: 2500,
        customerName: 'สมหญิง รวยเงิน',
        date: '11/04/2025',
        status: 'transferred',
        courier: 'Kerry Express',
        trackingNumber: 'KRY987654321TH'
      },
      {
        id: 'COD003',
        orderNumber: 'ORD-12347',
        amount: 850,
        customerName: 'วิชัย มากมี',
        date: '12/04/2025',
        status: 'pending',
        courier: 'Thailand Post',
        trackingNumber: 'EMS123456789TH'
      },
      {
        id: 'COD004',
        orderNumber: 'ORD-12348',
        amount: 1800,
        customerName: 'ชนาภา ดีงาม',
        date: '12/04/2025',
        status: 'pending',
        courier: 'J&T Express',
        trackingNumber: 'JNT123456789TH'
      },
      {
        id: 'COD005',
        orderNumber: 'ORD-12349',
        amount: 950,
        customerName: 'พิชัย วิเศษ',
        date: '13/04/2025',
        status: 'cancelled',
        courier: 'Flash Express',
        trackingNumber: 'FLX567891234TH'
      },
      {
        id: 'COD006',
        orderNumber: 'ORD-12350',
        amount: 3200,
        customerName: 'มานี รักษ์ดี',
        date: '14/04/2025',
        status: 'collected',
        courier: 'Kerry Express',
        trackingNumber: 'KRY123789456TH'
      },
      {
        id: 'COD007',
        orderNumber: 'ORD-12351',
        amount: 1500,
        customerName: 'สุรชัย มากทรัพย์',
        date: '15/04/2025',
        status: 'collected',
        courier: 'Flash Express',
        trackingNumber: 'FLX456789123TH'
      },
      {
        id: 'COD008',
        orderNumber: 'ORD-12352',
        amount: 2200,
        customerName: 'อำไพ สินธร',
        date: '15/04/2025',
        status: 'transferred',
        courier: 'Thailand Post',
        trackingNumber: 'EMS456789123TH'
      },
      {
        id: 'COD009',
        orderNumber: 'ORD-12353',
        amount: 1800,
        customerName: 'สมบัติ มิตรดี',
        date: '16/04/2025',
        status: 'pending',
        courier: 'J&T Express',
        trackingNumber: 'JNT456789123TH'
      },
      {
        id: 'COD010',
        orderNumber: 'ORD-12354',
        amount: 5000,
        customerName: 'กอบกุล ศรีสมบัติ',
        date: '17/04/2025',
        status: 'collected',
        courier: 'Flash Express',
        trackingNumber: 'FLX789123456TH'
      }
    ];

    res.json({
      success: true,
      data: {
        codStatusData: sampleCodStatusData,
        codTrendData: sampleCodTrendData,
        codByAreaData: sampleCodByAreaData,
        codByAmountData: sampleCodByAmountData,
        pendingTransfersData: samplePendingTransfersData,
        codDetailedList: sampleCodDetailedList
      }
    });
  } catch (error) {
    console.error('Error fetching COD report:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน COD'
    });
  }
});

// API ดึงข้อมูลรายงานพัสดุตีกลับ
router.get('/returns', auth, async (req: Request, res: Response) => {
  try {
    const period = req.query.period || 'month';
    const start = req.query.start;
    const end = req.query.end;
    const reason = req.query.reason || 'all';
    const courier = req.query.courier || 'all';
    const search = req.query.search;

    const sampleReturnTrendData = [
      { date: '01/04/2025', value: 5 },
      { date: '02/04/2025', value: 3 },
      { date: '03/04/2025', value: 7 },
      { date: '04/04/2025', value: 4 },
      { date: '05/04/2025', value: 8 },
      { date: '06/04/2025', value: 6 },
      { date: '07/04/2025', value: 5 },
      { date: '08/04/2025', value: 9 },
      { date: '09/04/2025', value: 8 },
      { date: '10/04/2025', value: 7 },
      { date: '11/04/2025', value: 5 },
      { date: '12/04/2025', value: 4 },
      { date: '13/04/2025', value: 3 },
      { date: '14/04/2025', value: 6 },
    ];

    const sampleReturnReasonData = [
      { name: 'ที่อยู่ไม่ถูกต้อง', value: 15, percent: 25 },
      { name: 'ลูกค้าปฏิเสธรับพัสดุ', value: 12, percent: 20 },
      { name: 'ไม่พบผู้รับ', value: 10, percent: 16.67 },
      { name: 'สินค้าไม่ตรงตามสั่ง', value: 8, percent: 13.33 },
      { name: 'สินค้าเสียหาย', value: 7, percent: 11.67 },
      { name: 'ปัญหาการชำระเงิน', value: 5, percent: 8.33 },
      { name: 'อื่นๆ', value: 3, percent: 5 }
    ];

    const sampleReturnCourierData = [
      { name: 'Flash Express', value: 18, percent: 30 },
      { name: 'Kerry Express', value: 15, percent: 25 },
      { name: 'Thailand Post', value: 12, percent: 20 },
      { name: 'J&T Express', value: 10, percent: 16.67 },
      { name: 'DHL', value: 5, percent: 8.33 }
    ];

    const sampleReturnAreaData = [
      { name: 'กรุงเทพและปริมณฑล', value: 20 },
      { name: 'ภาคกลาง', value: 10 },
      { name: 'ภาคเหนือ', value: 8 },
      { name: 'ภาคตะวันออกเฉียงเหนือ', value: 12 },
      { name: 'ภาคตะวันออก', value: 5 },
      { name: 'ภาคตะวันตก', value: 3 },
      { name: 'ภาคใต้', value: 2 }
    ];

    const sampleReturnAvgTimeData = [
      { name: 'Flash Express', value: 2.5 },
      { name: 'Kerry Express', value: 3.2 },
      { name: 'Thailand Post', value: 4.5 },
      { name: 'J&T Express', value: 3.8 },
      { name: 'DHL', value: 2.0 }
    ];

    const sampleReturnsList = [
      {
        id: 'RET001',
        orderNumber: 'ORD-12345',
        trackingNumber: 'FLX123456789TH',
        customerName: 'สมชาย มั่งมี',
        date: '10/04/2025',
        reason: 'address_not_found',
        courier: 'Flash Express',
        status: 'resolved',
        resolution: 'จัดส่งใหม่',
        costImpact: 120
      },
      {
        id: 'RET002',
        orderNumber: 'ORD-12346',
        trackingNumber: 'KRY987654321TH',
        customerName: 'สมหญิง รวยเงิน',
        date: '11/04/2025',
        reason: 'customer_refused',
        courier: 'Kerry Express',
        status: 'processing',
        resolution: 'รอลูกค้ายืนยัน',
        costImpact: 85
      },
      {
        id: 'RET003',
        orderNumber: 'ORD-12347',
        trackingNumber: 'EMS123456789TH',
        customerName: 'วิชัย มากมี',
        date: '12/04/2025',
        reason: 'wrong_item',
        courier: 'Thailand Post',
        status: 'pending',
        resolution: 'รอการจัดการ',
        costImpact: 150
      },
      {
        id: 'RET004',
        orderNumber: 'ORD-12348',
        trackingNumber: 'JNT123456789TH',
        customerName: 'ชนาภา ดีงาม',
        date: '12/04/2025',
        reason: 'damaged',
        courier: 'J&T Express',
        status: 'processing',
        resolution: 'ส่งสินค้าใหม่',
        costImpact: 200
      },
      {
        id: 'RET005',
        orderNumber: 'ORD-12349',
        trackingNumber: 'FLX567891234TH',
        customerName: 'พิชัย วิเศษ',
        date: '13/04/2025',
        reason: 'customer_not_available',
        courier: 'Flash Express',
        status: 'resolved',
        resolution: 'จัดส่งใหม่',
        costImpact: 95
      },
      {
        id: 'RET006',
        orderNumber: 'ORD-12350',
        trackingNumber: 'KRY123789456TH',
        customerName: 'มานี รักษ์ดี',
        date: '14/04/2025',
        reason: 'payment_issue',
        courier: 'Kerry Express',
        status: 'cancelled',
        resolution: 'ยกเลิกคำสั่งซื้อ',
        costImpact: 180
      },
      {
        id: 'RET007',
        orderNumber: 'ORD-12351',
        trackingNumber: 'FLX456789123TH',
        customerName: 'สุรชัย มากทรัพย์',
        date: '15/04/2025',
        reason: 'other',
        courier: 'Flash Express',
        status: 'pending',
        resolution: 'รอการตรวจสอบ',
        costImpact: 110
      },
      {
        id: 'RET008',
        orderNumber: 'ORD-12352',
        trackingNumber: 'EMS456789123TH',
        customerName: 'อำไพ สินธร',
        date: '15/04/2025',
        reason: 'address_not_found',
        courier: 'Thailand Post',
        status: 'processing',
        resolution: 'ตรวจสอบที่อยู่',
        costImpact: 75
      },
      {
        id: 'RET009',
        orderNumber: 'ORD-12353',
        trackingNumber: 'JNT456789123TH',
        customerName: 'สมบัติ มิตรดี',
        date: '16/04/2025',
        reason: 'customer_refused',
        courier: 'J&T Express',
        status: 'resolved',
        resolution: 'คืนเงิน',
        costImpact: 250
      },
      {
        id: 'RET010',
        orderNumber: 'ORD-12354',
        trackingNumber: 'FLX789123456TH',
        customerName: 'กอบกุล ศรีสมบัติ',
        date: '17/04/2025',
        reason: 'damaged',
        courier: 'Flash Express',
        status: 'pending',
        resolution: 'รอการจัดการ',
        costImpact: 320
      }
    ];

    res.json({
      success: true,
      data: {
        returnTrendData: sampleReturnTrendData,
        returnReasonData: sampleReturnReasonData,
        returnCourierData: sampleReturnCourierData,
        returnAreaData: sampleReturnAreaData,
        returnAvgTimeData: sampleReturnAvgTimeData,
        returnsList: sampleReturnsList
      }
    });
  } catch (error) {
    console.error('Error fetching returns report:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานพัสดุตีกลับ'
    });
  }
});

export default router;