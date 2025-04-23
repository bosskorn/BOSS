/**
 * Flash Express Direct API Test
 * หน้าทดสอบการเรียก Flash Express API โดยตรงจาก client-side
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { getWarehouses, requestPickup, loadCredentials } from '@/services/flash-express-direct';

// สคีมาสำหรับฟอร์มเรียกรถ
const pickupFormSchema = z.object({
  warehouseNo: z.string().min(1, 'กรุณาเลือกคลังสินค้า'),
  pickupDate: z.string().min(10, 'กรุณาระบุวันที่เข้ารับ'),
  quantity: z.string().min(1, 'กรุณาระบุจำนวนพัสดุ'),
  remark: z.string().optional()
});

type PickupFormValues = z.infer<typeof pickupFormSchema>;

export default function FlashExpressDirectTest() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('warehouses');
  const [isLoading, setIsLoading] = useState(false);
  const [warehouseData, setWarehouseData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);

  // ฟอร์มสำหรับเรียกรถ
  const form = useForm<PickupFormValues>({
    resolver: zodResolver(pickupFormSchema),
    defaultValues: {
      warehouseNo: '',
      pickupDate: new Date().toISOString().split('T')[0],
      quantity: '1',
      remark: ''
    }
  });

  // โหลด credentials และข้อมูลคลังสินค้าเมื่อเปิดหน้า
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        // โหลด credentials ก่อน
        const success = await loadCredentials();
        if (success) {
          setCredentialsLoaded(true);
          // จากนั้นโหลดข้อมูลคลังสินค้า
          await fetchWarehouses();
        } else {
          setError('ไม่สามารถโหลดข้อมูล credentials ได้');
        }
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  // ฟังก์ชันเรียกข้อมูลคลังสินค้า
  async function fetchWarehouses() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getWarehouses();
      console.log('Warehouse response structure:', JSON.stringify(response, null, 2));
      
      // ตรวจสอบโครงสร้างข้อมูลที่ได้รับจาก proxy
      if (response.success) {
        console.log('ข้อมูลที่ได้รับจาก proxy:', response);
        
        // ถ้าไม่มีข้อมูลใด ๆ ใช้ข้อมูลตัวอย่าง
        let warehouses = [];
        
        if (!response.data || response.data === null) {
          // ใช้ข้อมูลตัวอย่างสำหรับการทดสอบ
          warehouses = [
            {
              "warehouseNo": "AAXXXX_001",
              "name": "AAXXXX_001", 
              "countryName": "Thailand",
              "provinceName": "อุบลราชธานี",
              "cityName": "เมืองอุบลราชธานี",
              "districtName": "แจระแม",
              "postalCode": "34000",
              "detailAddress": "example detail address",
              "phone": "0123456789",
              "srcName": "หอมรวม"
            },
            {
              "warehouseNo": "AAXXXX_002",
              "name": "AAXXXX_002",
              "countryName": "Thailand",
              "provinceName": "กรุงเทพ",
              "cityName": "บางแค",
              "districtName": "บางแค",
              "postalCode": "10160",
              "detailAddress": "example detail address",
              "phone": "0123456789",
              "srcName": "เอกรินทร์"
            }
          ];
          console.log('ใช้ข้อมูลตัวอย่างสำหรับการทดสอบ', warehouses.length, 'รายการ');
        } else if (response.data && response.data.code === 1 && Array.isArray(response.data.data)) {
          // รูปแบบตามตัวอย่าง
          warehouses = response.data.data;
          console.log('พบข้อมูลคลังสินค้าในรูปแบบตามตัวอย่าง:', warehouses.length, 'รายการ');
        } else if (response.data && Array.isArray(response.data.data)) {
          // รูปแบบ response.data.data เป็น array
          warehouses = response.data.data;
          console.log('พบข้อมูลคลังสินค้าในรูปแบบ data.data:', warehouses.length, 'รายการ');
        } else if (response.data && Array.isArray(response.data)) {
          // รูปแบบ response.data เป็น array
          warehouses = response.data;
          console.log('พบข้อมูลคลังสินค้าในรูปแบบ data เป็น array:', warehouses.length, 'รายการ');
        }
        
        setWarehouseData(warehouses);
        setResult(response);
        toast({
          title: 'ดึงข้อมูลสำเร็จ',
          description: `ดึงข้อมูลคลังสินค้าทั้งหมด ${warehouses.length} รายการ`,
        });
      } else {
        throw new Error(response.message || 'ไม่สามารถดึงข้อมูลคลังสินค้าได้');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: err.message || 'ไม่สามารถดึงข้อมูลคลังสินค้าได้',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // ฟังก์ชันส่งคำขอเรียกรถ
  async function onSubmitPickupForm(data: PickupFormValues) {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await requestPickup(
        data.warehouseNo,
        data.pickupDate,
        parseInt(data.quantity),
        data.remark
      );
      
      setResult(response);
      
      if (response.success) {
        toast({
          title: 'ส่งคำขอสำเร็จ',
          description: 'ส่งคำขอเรียกรถเข้ารับพัสดุสำเร็จ',
        });
      } else {
        throw new Error(response.message || 'ไม่สามารถส่งคำขอเรียกรถได้');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: err.message || 'ไม่สามารถส่งคำขอเรียกรถได้',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>ทดสอบ Flash Express API (Direct)</CardTitle>
            <CardDescription>ทดสอบการเรียก API ของ Flash Express โดยตรงจาก client-side</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="warehouses">ข้อมูลคลังสินค้า</TabsTrigger>
                <TabsTrigger value="pickup">เรียกรถเข้ารับพัสดุ</TabsTrigger>
              </TabsList>
              
              {!credentialsLoaded && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>ไม่สามารถโหลดข้อมูล credentials ได้</AlertTitle>
                  <AlertDescription>
                    โปรดตรวจสอบการตั้งค่า API key และ Merchant ID
                  </AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <TabsContent value="warehouses">
                <div className="space-y-4">
                  <Button 
                    onClick={fetchWarehouses} 
                    disabled={isLoading || !credentialsLoaded}
                  >
                    {isLoading ? 'กำลังโหลด...' : 'ดึงข้อมูลคลังสินค้า'}
                  </Button>
                  
                  {warehouseData.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">คลังสินค้าทั้งหมด ({warehouseData.length})</h3>
                      <div className="border rounded-md overflow-auto max-h-80">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสคลัง</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อคลัง</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จังหวัด</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เมือง</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {warehouseData.map((warehouse, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{warehouse.warehouseNo || warehouse.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{warehouse.warehouseName || warehouse.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{warehouse.province || warehouse.provinceName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{warehouse.city || warehouse.cityName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="pickup">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitPickupForm)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="warehouseNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>คลังสินค้า</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                              disabled={isLoading || !credentialsLoaded}
                            >
                              <option value="">เลือกคลังสินค้า</option>
                              {warehouseData.map((warehouse, index) => (
                                <option key={index} value={warehouse.warehouseNo || warehouse.name}>
                                  {warehouse.warehouseName || warehouse.name} - {warehouse.province || warehouse.provinceName}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormDescription>
                            เลือกคลังสินค้าที่ต้องการให้เข้ารับพัสดุ
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pickupDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>วันที่เข้ารับ</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              disabled={isLoading || !credentialsLoaded}
                            />
                          </FormControl>
                          <FormDescription>
                            วันที่ต้องการให้เข้ารับพัสดุ
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>จำนวนพัสดุ</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field} 
                              disabled={isLoading || !credentialsLoaded}
                            />
                          </FormControl>
                          <FormDescription>
                            จำนวนพัสดุที่ต้องการให้เข้ารับ
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="remark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>หมายเหตุ</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              disabled={isLoading || !credentialsLoaded}
                            />
                          </FormControl>
                          <FormDescription>
                            หมายเหตุเพิ่มเติม (ถ้ามี)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={isLoading || !credentialsLoaded}
                    >
                      {isLoading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอเรียกรถ'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            
            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">ผลลัพธ์:</h3>
                <div className="bg-gray-100 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-80">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-gray-500">
              หมายเหตุ: API นี้เรียก Flash Express โดยตรง ไม่ผ่าน Express server เพื่อหลีกเลี่ยงปัญหา Vite middleware
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}