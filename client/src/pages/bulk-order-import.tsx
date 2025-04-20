import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Package, Truck } from 'lucide-react';
import api from '@/services/api';
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  price: number;
}

interface OrderPreview {
  customerName: string;
  customerPhone: string;
  address: string;
  houseNumber: string; // เพิ่มฟิลด์บ้านเลขที่
  road: string;        // เพิ่มฟิลด์ถนน
  province: string;
  district: string;
  subdistrict: string;
  zipcode: string;
  items: {
    productSku: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  shippingMethod: string;
  isCOD: boolean;
  codAmount?: number;
}

const BulkOrderImportPage: React.FC = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [orders, setOrders] = useState<OrderPreview[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [progress, setProgress] = useState(0);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    trackingNumbers: string[];
    failedOrders: { index: number; reason: string; data: OrderPreview }[];
  }>({
    success: 0,
    failed: 0,
    trackingNumbers: [],
    failedOrders: []
  });
  
  // โหลดข้อมูลวิธีการจัดส่ง
  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        const response = await api.get('/api/shipping-methods');
        if (response.data.success) {
          // เพิ่มขนส่งมาตรฐานทั้งหมดที่ใช้ในระบบ
          const standardCouriers = [
            'Xiaobai Express',
            'SpeedLine',
            'ThaiStar Delivery',
            'J&T Express', 
            'Kerry Express',
            'Thailand Post',
            'DHL Express',
            'Ninja Van',
            'Flash Express'
          ];
          
          // รวมข้อมูลขนส่งมาตรฐานกับข้อมูลจริงจาก API
          const allMethods = [...response.data.shippingMethods];
          
          // สร้าง standard shipping method objects
          standardCouriers.forEach(courier => {
            // ตรวจสอบว่ามีชื่อขนส่งนี้ในข้อมูลจริงแล้วหรือไม่
            const exists = allMethods.some(method => method.name === courier);
            if (!exists) {
              allMethods.push({
                id: `mock-${courier}`,
                name: courier,
                code: courier.substring(0, 3).toUpperCase(),
                description: `${courier} จำลอง`,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 1
              });
            }
          });
          
          setShippingMethods(allMethods);
          if (allMethods.length > 0) {
            setSelectedShippingMethod(allMethods[0].name);
          }
        }
      } catch (error) {
        console.error('Error fetching shipping methods:', error);
      }
    };
    
    fetchShippingMethods();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.name.endsWith('.xlsx') || 
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
      } else {
        toast({
          title: 'ไม่รองรับประเภทไฟล์นี้',
          description: 'โปรดเลือกไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น',
          variant: 'destructive',
        });
      }
    }
  };

  const parseExcelFile = async () => {
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // กำหนดรูปแบบข้อมูลสำหรับแสดงตัวอย่าง
      const parsedOrders: OrderPreview[] = jsonData.map((row: any) => {
        // สร้างโครงสร้างข้อมูลจากการนำเข้า Excel
        // ไม่ใช้ข้อมูลวิธีจัดส่งจากไฟล์แล้ว จะให้เลือกทีหลัง
        return {
          customerName: row['ชื่อลูกค้า'] || '',
          customerPhone: row['เบอร์โทรศัพท์'] || '',
          address: row['ที่อยู่'] || '',
          houseNumber: row['บ้านเลขที่'] || '', // เพิ่มฟิลด์บ้านเลขที่
          road: row['ถนน'] || '', // เพิ่มฟิลด์ถนน
          province: row['จังหวัด'] || '',
          district: row['อำเภอ'] || '',
          subdistrict: row['ตำบล'] || '',
          zipcode: row['รหัสไปรษณีย์'] || '',
          items: [
            {
              productSku: row['รหัสสินค้า'] || '',
              productName: '', // ไม่ใช้ชื่อสินค้าจากไฟล์ Excel แล้ว จะดึงจากฐานข้อมูลแทน
              quantity: parseInt(row['จำนวน'] || '1', 10),
              price: parseFloat(row['ราคา'] || '0')
            }
          ],
          shippingMethod: '', // ไม่ใช้ข้อมูลจากไฟล์ Excel จะใช้วิธีเลือกแทน
          isCOD: Boolean(row['เก็บเงินปลายทาง']) && ['true', 'yes', 'y', '1', 'on', 'cod', 'เก็บเงินปลายทาง'].includes(row['เก็บเงินปลายทาง']?.toString().toLowerCase()) || false,
          codAmount: row['จำนวนเงิน COD'] ? parseFloat(row['จำนวนเงิน COD']) : undefined
        };
      });

      setOrders(parsedOrders);
      setStep('preview');
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast({
        title: 'เกิดข้อผิดพลาดในการอ่านไฟล์',
        description: 'ไม่สามารถอ่านข้อมูลจากไฟล์ Excel ได้ ตรวจสอบรูปแบบไฟล์ของคุณ',
        variant: 'destructive',
      });
    }
  };

  const createOrders = async () => {
    if (orders.length === 0) {
      toast({
        title: 'ไม่พบข้อมูลออเดอร์',
        description: 'ไม่มีข้อมูลออเดอร์ที่จะนำเข้า',
        variant: 'destructive',
      });
      return;
    }
    
    // ถ้าไม่ได้เลือกขนส่งและไม่ได้เลือก "ยังไม่เลือกขนส่งตอนนี้"
    if (!selectedShippingMethod && selectedShippingMethod !== 'no_carrier') {
      toast({
        title: 'กรุณาเลือกบริษัทขนส่ง',
        description: 'โปรดเลือกบริษัทขนส่งก่อนสร้างออเดอร์ หรือเลือก "ยังไม่เลือกขนส่งตอนนี้"',
        variant: 'destructive',
      });
      return;
    }

    setStep('processing');
    setProgress(0);
    
    const successOrders: string[] = [];
    const failedOrders: { index: number; reason: string; data: OrderPreview }[] = [];
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      
      try {
        // สร้างข้อมูลสำหรับส่งไปยัง API
        const orderData = {
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          houseNumber: order.houseNumber || '', // ใช้ค่าจากข้อมูลนำเข้า (บ้านเลขที่)
          village: '',
          building: '',
          floor: '',
          roomNumber: '',
          soi: '',
          road: order.road || '', // ใช้ค่าจากข้อมูลนำเข้า (ถนน)
          fullAddress: order.address,
          province: order.province,
          district: order.district,
          subdistrict: order.subdistrict,
          zipcode: order.zipcode,
          items: order.items.map(item => ({
            sku: item.productSku,
            name: item.productName,
            quantity: item.quantity,
            price: item.price
          })),
          // ใช้การจัดส่งที่เลือกจาก UI แทนที่จะใช้จากไฟล์ Excel
          // ถ้าเลือก "no_carrier" ให้ไม่กำหนดบริษัทขนส่ง
          shippingMethod: selectedShippingMethod === 'no_carrier' ? '' : selectedShippingMethod,
          shippingCost: 40, // ค่าจัดส่งเริ่มต้น สามารถปรับได้ตามความต้องการ
          isCOD: order.isCOD,
          // กำหนดวิธีการชำระเงินตามค่า isCOD
          paymentMethod: order.isCOD ? 'cash_on_delivery' : 'bank_transfer',
          codAmount: order.codAmount || 0,
          note: '',
          // เพิ่มการส่งค่าเพื่อสร้างเลขพัสดุอัตโนมัติถ้าเลือกบริษัทขนส่ง
          generateTrackingNumber: selectedShippingMethod !== 'no_carrier',
          total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 40 // คำนวณราคารวมเบื้องต้น
        };

        // เรียกใช้ API เพื่อสร้างออเดอร์
        const response = await api.post('/api/orders', orderData);
        
        if (response.data.success) {
          // เก็บเลขพัสดุถ้ามี
          if (response.data.order.trackingNumber) {
            successOrders.push(response.data.order.trackingNumber);
          } else {
            // ถ้าไม่มีเลขพัสดุ แต่ออเดอร์สร้างสำเร็จ
            successOrders.push(`ออเดอร์ #${response.data.order.orderNumber}`);
          }
        } else {
          failedOrders.push({ 
            index: i, 
            reason: response.data.message || 'ไม่สามารถสร้างออเดอร์ได้', 
            data: order 
          });
        }
      } catch (error: any) {
        console.error(`Error creating order ${i}:`, error);
        failedOrders.push({ 
          index: i, 
          reason: error.message || 'เกิดข้อผิดพลาดระหว่างการสร้างออเดอร์', 
          data: order 
        });
      }
      
      // อัพเดทความคืบหน้า
      setProgress(Math.round(((i + 1) / orders.length) * 100));
    }
    
    // สรุปผลลัพธ์
    setResults({
      success: successOrders.length,
      failed: failedOrders.length,
      trackingNumbers: successOrders,
      failedOrders: failedOrders
    });
    
    setStep('complete');
    
    if (successOrders.length > 0) {
      toast({
        title: 'นำเข้าออเดอร์สำเร็จ',
        description: `สร้างออเดอร์สำเร็จ ${successOrders.length} รายการ, ล้มเหลว ${failedOrders.length} รายการ`,
      });
    } else {
      toast({
        title: 'นำเข้าออเดอร์ล้มเหลว',
        description: 'ไม่สามารถสร้างออเดอร์ได้ โปรดตรวจสอบข้อมูลและลองอีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const downloadTemplate = () => {
    // สร้างไฟล์ Excel ตัวอย่าง - ตัดส่วน "วิธีจัดส่ง" ออกไป
    const template = [
      {
        'ชื่อลูกค้า': 'นายตัวอย่าง นามสกุล',
        'เบอร์โทรศัพท์': '0812345678',
        'บ้านเลขที่': '123/45',  // เพิ่มคอลัมน์บ้านเลขที่
        'ถนน': 'ถนนตัวอย่าง',   // เพิ่มคอลัมน์ถนน
        'ที่อยู่': 'หมู่ 6 ซอยตัวอย่าง',
        'จังหวัด': 'กรุงเทพมหานคร',
        'อำเภอ': 'บางรัก',
        'ตำบล': 'สีลม',
        'รหัสไปรษณีย์': '10500',
        'รหัสสินค้า': 'PD001',
        'จำนวน': 1,
        'ราคา': 299,
        'เก็บเงินปลายทาง': 'yes',
        'จำนวนเงิน COD': 299
      }
    ];
    
    // สร้าง workbook และ worksheet
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ตัวอย่างนำเข้าออเดอร์");
    
    // แปลงเป็น binary และดาวน์โหลด
    XLSX.writeFile(wb, "template_bulk_order_import.xlsx");
  };

  const resetForm = () => {
    setFile(null);
    setOrders([]);
    setStep('upload');
    setProgress(0);
    setResults({
      success: 0,
      failed: 0,
      trackingNumbers: [],
      failedOrders: []
    });
  };

  // แสดงหน้า Upload
  const renderUploadStep = () => (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-800">
            นำเข้าออเดอร์ด้วยไฟล์ Excel
          </CardTitle>
          <CardDescription>
            อัพโหลดไฟล์ Excel เพื่อสร้างออเดอร์หลายรายการพร้อมกัน
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".xlsx,.xls"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <Upload className="h-12 w-12 text-blue-500 mb-4" />
              <p className="text-gray-600 mb-1">
                คลิกหรือลากไฟล์มาที่นี่เพื่ออัพโหลด
              </p>
              <p className="text-sm text-gray-500">
                รองรับเฉพาะไฟล์ Excel (.xlsx, .xls)
              </p>
            </label>
          </div>

          {file && (
            <Alert className="bg-blue-50 border-blue-200">
              <FileText className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800">ไฟล์ที่เลือก</AlertTitle>
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" /> ลบ
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-blue-800 font-medium mb-2 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              คำแนะนำการใช้งาน
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>ไฟล์ต้องมีคอลัมน์ตามรูปแบบที่กำหนด (ชื่อลูกค้า, เบอร์โทรศัพท์, ที่อยู่, ฯลฯ)</li>
              <li><b>ควรระบุบ้านเลขที่และถนนในคอลัมน์ที่กำหนด</b> เพื่อให้ข้อมูลการจัดส่งครบถ้วนและถูกต้อง</li>
              <li>ไม่จำเป็นต้องกรอกข้อมูลในทุกคอลัมน์ แต่ข้อมูลสำคัญต้องมี เช่น ชื่อลูกค้า, เบอร์โทร, ที่อยู่</li>
              <li>คอลัมน์ "เก็บเงินปลายทาง" ให้ใส่ true/yes/y สำหรับ COD</li>
              <li><b>ไม่ต้องระบุบริษัทขนส่ง</b> - คุณจะสามารถเลือกบริษัทขนส่งหลังจากอัพโหลดไฟล์แล้ว</li>
              <li>สำหรับสินค้าหลายรายการ ให้สร้างแถวใหม่โดยใช้ข้อมูลลูกค้าเดิม</li>
            </ul>
            <Button
              variant="link"
              onClick={downloadTemplate}
              className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-2"
            >
              ดาวน์โหลดไฟล์ตัวอย่าง (.xlsx)
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-end space-x-2 border-t pt-4">
          <Button
            disabled={!file}
            onClick={parseExcelFile}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            ตรวจสอบข้อมูล
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  // แสดงหน้าตัวอย่างข้อมูล
  const renderPreviewStep = () => (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-800">
            ตรวจสอบข้อมูลออเดอร์
          </CardTitle>
          <CardDescription>
            ตรวจสอบข้อมูลออเดอร์ก่อนดำเนินการสร้างออเดอร์จริง
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">โปรดตรวจสอบข้อมูล</AlertTitle>
            <AlertDescription className="text-amber-700">
              ออเดอร์ทั้งหมด {orders.length} รายการจะถูกสร้างขึ้น คุณไม่สามารถยกเลิกได้หลังจากสร้างเสร็จแล้ว
            </AlertDescription>
          </Alert>
          
          <div className="p-4 border rounded-lg">
            <div className="mb-4">
              <h3 className="font-medium mb-2 flex items-center">
                <Truck className="h-5 w-5 text-blue-600 mr-2" />
                เลือกบริษัทขนส่ง
              </h3>
              <Select
                value={selectedShippingMethod}
                onValueChange={setSelectedShippingMethod}
              >
                <SelectTrigger className="w-full md:w-80">
                  <SelectValue placeholder="เลือกบริษัทขนส่ง" />
                </SelectTrigger>
                <SelectContent>
                  {/* ตัวเลือกไม่เลือกขนส่ง */}
                  <SelectItem value="no_carrier">
                    ยังไม่เลือกขนส่งตอนนี้
                  </SelectItem>
                  
                  {/* บริษัทขนส่งมาตรฐาน - ต้องตรงกับที่ใช้ในหน้า order-list-enhanced.tsx */}
                  <SelectItem key="xiaobai" value="Xiaobai Express">
                    Xiaobai Express
                  </SelectItem>
                  <SelectItem key="speedline" value="SpeedLine">
                    SpeedLine
                  </SelectItem>
                  <SelectItem key="thaistar" value="ThaiStar Delivery">
                    ThaiStar Delivery
                  </SelectItem>
                  <SelectItem key="jnt" value="J&T Express">
                    J&T Express
                  </SelectItem>
                  <SelectItem key="kerry" value="Kerry Express">
                    Kerry Express
                  </SelectItem>
                  <SelectItem key="thaipost" value="Thailand Post">
                    Thailand Post
                  </SelectItem>
                  <SelectItem key="dhl" value="DHL Express">
                    DHL Express
                  </SelectItem>
                  <SelectItem key="ninja" value="Ninja Van">
                    Ninja Van
                  </SelectItem>
                  <SelectItem key="flash" value="Flash Express">
                    Flash Express
                  </SelectItem>
                  
                  {/* บริษัทขนส่งจากฐานข้อมูล - เฉพาะที่ไม่ใช่ขนส่งมาตรฐานด้านบน */}
                  {shippingMethods
                    .filter(method => 
                      !['Xiaobai Express', 'SpeedLine', 'ThaiStar Delivery', 'J&T Express', 
                        'Kerry Express', 'Thailand Post', 'DHL Express', 'Ninja Van', 'Flash Express',
                        'เสี่ยวไป๋ เอ็กเพรส', 'สปีดไลน์', 'ไทยสตาร์', 'เจแอนด์ที เอ็กซ์เพรส',
                        'เคอรี่ เอ็กซ์เพรส', 'ไปรษณีย์ไทย', 'ดีเอชแอล', 'นินจาแวน', 'แฟลช เอ็กซ์เพรส']
                      .includes(method.name))
                    .map((method) => (
                      <SelectItem key={method.id} value={method.name}>
                        {method.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                บริษัทขนส่งที่เลือกจะถูกใช้กับทุกออเดอร์ในการนำเข้าครั้งนี้
              </p>
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="w-12">ลำดับ</TableHead>
                    <TableHead className="w-40">ชื่อลูกค้า</TableHead>
                    <TableHead className="w-32">เบอร์โทรศัพท์</TableHead>
                    <TableHead className="w-56">ที่อยู่</TableHead>
                    <TableHead className="w-36">สินค้า</TableHead>
                    <TableHead className="w-24">COD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 6).map((order, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="max-w-[160px] truncate" title={order.customerName}>
                        {order.customerName}
                      </TableCell>
                      <TableCell>{order.customerPhone}</TableCell>
                      <TableCell className="max-w-[220px] truncate" title={`${order.address}, ${order.subdistrict}, ${order.district}, ${order.province} ${order.zipcode}`}>
                        {order.address}, {order.subdistrict}, {order.district}, {order.province} {order.zipcode}
                      </TableCell>
                      <TableCell>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm truncate" title={`รหัส: ${item.productSku} x${item.quantity} (฿${item.price})`}>
                            {item.productSku} x{item.quantity} (฿{item.price})
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        {order.isCOD ? (
                          <Badge variant="default" className="bg-orange-500">
                            ฿{order.codAmount || 0}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">ไม่มี</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length > 6 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        ... และอีก {orders.length - 6} รายการ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {orders.length > 6 && (
            <p className="text-gray-500 text-center text-sm">
              แสดง 6 รายการแรกจากทั้งหมด {orders.length} รายการ
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-between space-x-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={resetForm}
          >
            ย้อนกลับ
          </Button>
          <Button
            onClick={createOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            สร้างออเดอร์ทั้งหมด
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  // แสดงหน้ากำลังประมวลผล
  const renderProcessingStep = () => (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-800">
            กำลังสร้างออเดอร์
          </CardTitle>
          <CardDescription>
            โปรดรอสักครู่ ระบบกำลังสร้างออเดอร์ทั้งหมด {orders.length} รายการ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-full max-w-md mb-4">
              <Progress value={progress} className="h-3" />
            </div>
            <p className="text-blue-800 font-medium">
              {progress}% เสร็จสิ้น
            </p>
            <p className="text-gray-500 text-sm">
              กำลังประมวลผลออเดอร์ที่ {Math.round((orders.length * progress) /
                100)} จาก {orders.length} รายการ
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // แสดงหน้าสรุปผล
  const renderCompleteStep = () => (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-800">
            สรุปผลการนำเข้า
          </CardTitle>
          <CardDescription>
            สร้างออเดอร์เสร็จสิ้นแล้ว
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-green-800 font-medium">สำเร็จ</h3>
                <p className="text-3xl font-bold text-green-700">{results.success}</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-red-800 font-medium">ล้มเหลว</h3>
                <p className="text-3xl font-bold text-red-700">{results.failed}</p>
              </div>
            </div>
          </div>

          {results.trackingNumbers.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-blue-800 mb-2">เลขพัสดุที่สร้างเสร็จแล้ว</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="w-16">ลำดับ</TableHead>
                        <TableHead>เลขพัสดุ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.trackingNumbers.slice(0, 5).map((trackingNumber, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{trackingNumber}</TableCell>
                        </TableRow>
                      ))}
                      {results.trackingNumbers.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-gray-500">
                            ... และอีก {results.trackingNumbers.length - 5} รายการ
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {results.failedOrders.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-red-600 mb-2">รายการที่ล้มเหลว</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-50">
                        <TableHead className="w-16">ลำดับ</TableHead>
                        <TableHead className="w-40">ชื่อลูกค้า</TableHead>
                        <TableHead>สาเหตุ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.failedOrders.slice(0, 5).map((failed, index) => (
                        <TableRow key={index}>
                          <TableCell>{failed.index + 1}</TableCell>
                          <TableCell className="max-w-[160px] truncate" title={failed.data.customerName}>{failed.data.customerName}</TableCell>
                          <TableCell className="text-red-600">{failed.reason}</TableCell>
                        </TableRow>
                      ))}
                      {results.failedOrders.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-gray-500">
                            ... และอีก {results.failedOrders.length - 5} รายการ
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end space-x-2 border-t pt-4">
          <Button
            onClick={resetForm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            สร้างออเดอร์ใหม่
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 font-kanit bg-gradient-to-br from-white to-blue-50 rounded-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent flex items-center">
            <Package className="mr-2 h-8 w-8 text-blue-600" />
            นำเข้าออเดอร์จาก Excel
          </h1>
          <p className="text-gray-600 text-lg mt-2">สร้างออเดอร์หลายรายการพร้อมกันโดยนำเข้าจากไฟล์ Excel</p>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-indigo-500 mt-4 rounded-full"></div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex">
              <div className={`flex items-center ${step === 'upload' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} flex items-center justify-center mr-2`}>
                  1
                </div>
                <span>อัพโหลดไฟล์</span>
              </div>
              <div className={`w-16 h-[2px] mx-2 ${step === 'upload' ? 'bg-gray-200' : 'bg-blue-400'}`}></div>
              
              <div className={`flex items-center ${step === 'preview' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full ${step === 'preview' ? 'bg-blue-600 text-white' : step === 'upload' ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'} flex items-center justify-center mr-2`}>
                  2
                </div>
                <span>ตรวจสอบข้อมูล</span>
              </div>
              <div className={`w-16 h-[2px] mx-2 ${step === 'upload' || step === 'preview' ? 'bg-gray-200' : 'bg-blue-400'}`}></div>
              
              <div className={`flex items-center ${step === 'processing' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full ${step === 'processing' ? 'bg-blue-600 text-white' : step === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} flex items-center justify-center mr-2`}>
                  3
                </div>
                <span>กำลังประมวลผล</span>
              </div>
              <div className={`w-16 h-[2px] mx-2 ${step === 'complete' ? 'bg-blue-400' : 'bg-gray-200'}`}></div>
              
              <div className={`flex items-center ${step === 'complete' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full ${step === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} flex items-center justify-center mr-2`}>
                  4
                </div>
                <span>เสร็จสิ้น</span>
              </div>
            </div>
          </div>
        </div>

        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'processing' && renderProcessingStep()}
        {step === 'complete' && renderCompleteStep()}
      </div>
    </Layout>
  );
};

export default BulkOrderImportPage;