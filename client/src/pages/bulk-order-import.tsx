import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Package } from 'lucide-react';
import api from '@/services/api';
import * as XLSX from 'xlsx';

interface OrderPreview {
  customerName: string;
  customerPhone: string;
  address: string;
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
        // ตัวอย่างการแปลง (ต้องปรับให้ตรงกับรูปแบบของไฟล์ Excel ที่ใช้)
        return {
          customerName: row['ชื่อลูกค้า'] || '',
          customerPhone: row['เบอร์โทรศัพท์'] || '',
          address: row['ที่อยู่'] || '',
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
          shippingMethod: row['วิธีจัดส่ง'] || 'Flash Express - ส่งด่วน',
          isCOD: row['เก็บเงินปลายทาง']?.toString().toLowerCase() === 'true' || row['เก็บเงินปลายทาง'] === 'yes' || row['เก็บเงินปลายทาง'] === 'y' || false,
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
          houseNumber: '', // จะต้องแยกจากที่อยู่
          village: '',
          building: '',
          floor: '',
          roomNumber: '',
          soi: '',
          road: '',
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
          shippingMethod: order.shippingMethod,
          shippingCost: 40, // ค่าจัดส่งเริ่มต้น สามารถปรับได้ตามความต้องการ
          isCOD: order.isCOD,
          codAmount: order.codAmount || 0,
          note: '',
          total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 40 // คำนวณราคารวมเบื้องต้น
        };

        // เรียกใช้ API เพื่อสร้างออเดอร์
        const response = await api.post('/api/orders', orderData);
        
        if (response.data.success) {
          successOrders.push(response.data.order.trackingNumber);
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
    // สร้างไฟล์ Excel ตัวอย่าง
    const template = [
      {
        'ชื่อลูกค้า': 'นายตัวอย่าง นามสกุล',
        'เบอร์โทรศัพท์': '0812345678',
        'ที่อยู่': '123/45 หมู่ 6 ซอยตัวอย่าง ถนนตัวอย่าง',
        'จังหวัด': 'กรุงเทพมหานคร',
        'อำเภอ': 'บางรัก',
        'ตำบล': 'สีลม',
        'รหัสไปรษณีย์': '10500',
        'รหัสสินค้า': 'PD001',
        'จำนวน': 1,
        'ราคา': 299,
        'วิธีจัดส่ง': 'Flash Express - ส่งด่วน',
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
              <li>ไม่จำเป็นต้องกรอกข้อมูลในทุกคอลัมน์ แต่ข้อมูลสำคัญต้องมี เช่น ชื่อลูกค้า, เบอร์โทร, ที่อยู่</li>
              <li>คอลัมน์ "เก็บเงินปลายทาง" ให้ใส่ true/yes/y สำหรับ COD</li>
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

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>ชื่อลูกค้า</TableHead>
                  <TableHead>เบอร์โทรศัพท์</TableHead>
                  <TableHead>ที่อยู่</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>COD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 10).map((order, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.customerPhone}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {order.address}, {order.subdistrict}, {order.district}, {order.province} {order.zipcode}
                    </TableCell>
                    <TableCell>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          รหัส: {item.productSku} x{item.quantity} (฿{item.price})
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {order.isCOD ? (
                        <span className="text-orange-600">
                          COD ฿{order.codAmount || 0}
                        </span>
                      ) : (
                        <span className="text-gray-500">ไม่มี</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {orders.length > 10 && (
            <p className="text-gray-500 text-center text-sm">
              แสดง 10 รายการแรกจากทั้งหมด {orders.length} รายการ
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
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="w-[80px]">ลำดับ</TableHead>
                      <TableHead>เลขพัสดุ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.trackingNumbers.map((trackingNumber, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{trackingNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {results.failedOrders.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-red-600 mb-2">รายการที่ล้มเหลว</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-red-50">
                      <TableHead className="w-[80px]">ลำดับ</TableHead>
                      <TableHead>ชื่อลูกค้า</TableHead>
                      <TableHead>สาเหตุ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.failedOrders.map((failed, index) => (
                      <TableRow key={index}>
                        <TableCell>{failed.index + 1}</TableCell>
                        <TableCell>{failed.data.customerName}</TableCell>
                        <TableCell className="text-red-600">{failed.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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