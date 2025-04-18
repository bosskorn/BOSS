import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Upload, FileText, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLocation } from 'wouter';
import api from '@/services/api';

type ImportType = 'products' | 'customers' | 'orders';

const ImportDataPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<ImportType>('products');
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [importSuccess, setImportSuccess] = useState<{success: boolean, message: string, count: number} | null>(null);

  // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือยัง
  if (!user) {
    // ให้แสดงข้อความแนะนำ
    return (
      <Layout>
        <div className="container mx-auto py-16 px-4">
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>กรุณาเข้าสู่ระบบ</CardTitle>
              <CardDescription>
                คุณจำเป็นต้องเข้าสู่ระบบก่อนใช้งานหน้านำเข้าข้อมูล
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => setLocation('/auth')}>ไปยังหน้าเข้าสู่ระบบ</Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setPreviewData(null);
    setImportSuccess(null);
    
    // ถ้ามีไฟล์ที่เลือก ให้แสดงตัวอย่างข้อมูล
    if (file) {
      previewFile(file);
    }
  };

  const previewFile = async (file: File) => {
    // ตรวจสอบนามสกุลไฟล์
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      toast({
        title: 'รูปแบบไฟล์ไม่ถูกต้อง',
        description: 'กรุณาอัปโหลดไฟล์ .csv, .xlsx หรือ .xls เท่านั้น',
        variant: 'destructive',
      });
      setSelectedFile(null);
      return;
    }

    // สร้าง FormData สำหรับส่งไฟล์
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', activeTab);
    
    try {
      setIsUploading(true);
      setProgress(30);
      
      // ส่งไฟล์ไปยังเซิร์ฟเวอร์เพื่อดูตัวอย่างข้อมูล
      const response = await api.post('/api/upload/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProgress(100);
      
      if (response.data.success) {
        setPreviewData(response.data.data.slice(0, 5)); // แสดงแค่ 5 รายการแรก
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: response.data.message || 'ไม่สามารถแสดงตัวอย่างข้อมูลได้',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.response?.data?.message || error.message || 'ไม่สามารถแสดงตัวอย่างข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'กรุณาเลือกไฟล์',
        description: 'ไม่พบไฟล์ที่ต้องการนำเข้า',
        variant: 'destructive',
      });
      return;
    }

    // สร้าง FormData สำหรับส่งไฟล์
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', activeTab);
    
    try {
      setIsUploading(true);
      setProgress(10);
      
      // ส่งไฟล์ไปยังเซิร์ฟเวอร์เพื่อนำเข้าข้อมูล
      const response = await api.post('/api/upload/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            setProgress(10 + percentage);
          }
        }
      });
      
      setProgress(100);
      
      if (response.data.success) {
        setImportSuccess({
          success: true,
          message: response.data.message || 'นำเข้าข้อมูลสำเร็จ',
          count: response.data.records || 0
        });
        
        toast({
          title: 'นำเข้าข้อมูลสำเร็จ',
          description: `นำเข้าข้อมูล ${response.data.records || 0} รายการเรียบร้อยแล้ว`,
          variant: 'default',
        });
      } else {
        setImportSuccess({
          success: false,
          message: response.data.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล',
          count: 0
        });
        
        toast({
          title: 'นำเข้าข้อมูลไม่สำเร็จ',
          description: response.data.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      
      setImportSuccess({
        success: false,
        message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล',
        count: 0
      });
      
      toast({
        title: 'นำเข้าข้อมูลไม่สำเร็จ',
        description: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  // ดาวน์โหลดไฟล์เทมเพลต
  const handleDownloadTemplate = () => {
    const templateLinks = {
      products: '/templates/product_template.xlsx',
      customers: '/templates/customer_template.xlsx',
      orders: '/templates/order_template.xlsx'
    };
    
    const templateLink = templateLinks[activeTab];
    
    // เปิดหน้าต่างใหม่เพื่อดาวน์โหลดไฟล์
    window.open(templateLink, '_blank');
    
    toast({
      title: 'ดาวน์โหลดเทมเพลต',
      description: 'เริ่มดาวน์โหลดไฟล์เทมเพลตสำหรับนำเข้าข้อมูล',
    });
  };

  const getPreviewTable = () => {
    if (!previewData || previewData.length === 0) return null;
    
    const columns = Object.keys(previewData[0]);
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={`${index}-${column}`}>
                    {row[column]?.toString() || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const getImportTypeTitle = () => {
    switch (activeTab) {
      case 'products':
        return 'สินค้า';
      case 'customers':
        return 'ลูกค้า';
      case 'orders':
        return 'ออเดอร์';
      default:
        return 'ข้อมูล';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 font-kanit">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">นำเข้าข้อมูล</h1>
          <p className="text-gray-600">นำเข้าข้อมูลจากไฟล์ Excel หรือ CSV</p>
        </div>

        <Tabs defaultValue="products" onValueChange={(value) => setActiveTab(value as ImportType)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="products">สินค้า</TabsTrigger>
            <TabsTrigger value="customers">ลูกค้า</TabsTrigger>
            <TabsTrigger value="orders">ออเดอร์</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>นำเข้าข้อมูลสินค้า</CardTitle>
                <CardDescription>
                  อัปโหลดไฟล์ Excel หรือ CSV ที่มีข้อมูลสินค้า
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderImportContent()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>นำเข้าข้อมูลลูกค้า</CardTitle>
                <CardDescription>
                  อัปโหลดไฟล์ Excel หรือ CSV ที่มีข้อมูลลูกค้า
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderImportContent()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>นำเข้าข้อมูลออเดอร์</CardTitle>
                <CardDescription>
                  อัปโหลดไฟล์ Excel หรือ CSV ที่มีข้อมูลออเดอร์
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderImportContent()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );

  // ฟังก์ชันแสดงเนื้อหาสำหรับการนำเข้าข้อมูล
  function renderImportContent() {
    return (
      <div>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-gray-700">เลือกไฟล์นำเข้า</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  {selectedFile ? selectedFile.name : 'เลือกไฟล์...'}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500">รองรับไฟล์นามสกุล .csv, .xlsx, .xls เท่านั้น</p>
            </div>

            <div className="space-y-2">
              <Button variant="default" onClick={handleImport} disabled={!selectedFile || isUploading}>
                <Database className="mr-2 h-4 w-4" />
                นำเข้าข้อมูล{getImportTypeTitle()}
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate} className="ml-2">
                <FileText className="mr-2 h-4 w-4" />
                ดาวน์โหลดเทมเพลต
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">คำแนะนำการนำเข้าข้อมูล</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• ไฟล์ต้องมีหัวตารางตามเทมเพลตที่กำหนด</li>
              <li>• สามารถดาวน์โหลดเทมเพลตได้จากปุ่ม "ดาวน์โหลดเทมเพลต"</li>
              <li>• ข้อมูลจะถูกตรวจสอบความถูกต้องก่อนนำเข้า</li>
              <li>• หากมีข้อมูลซ้ำ ระบบจะอัปเดตข้อมูลที่มีอยู่แล้ว</li>
            </ul>
          </div>
        </div>

        {isUploading && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium">กำลังประมวลผล...</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {importSuccess && (
          <div className={`p-4 rounded-md mb-6 ${importSuccess.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-start">
              {importSuccess.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${importSuccess.success ? 'text-green-800' : 'text-red-800'}`}>
                  {importSuccess.success ? 'การนำเข้าข้อมูลสำเร็จ' : 'การนำเข้าข้อมูลไม่สำเร็จ'}
                </p>
                <p className={`text-sm ${importSuccess.success ? 'text-green-700' : 'text-red-700'}`}>
                  {importSuccess.message}
                </p>
                {importSuccess.success && (
                  <p className="text-sm text-green-700">
                    นำเข้าข้อมูลทั้งหมด {importSuccess.count} รายการ
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {previewData && previewData.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">ตัวอย่างข้อมูล</h3>
            {getPreviewTable()}
            <p className="text-xs text-gray-500 mt-2">
              แสดงเพียง 5 รายการแรกจากไฟล์ที่อัปโหลด
            </p>
          </div>
        )}
      </div>
    );
  }
};

export default ImportDataPage;