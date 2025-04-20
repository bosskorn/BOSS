import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  Loader2,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  price: string;
  provider: string;
  isActive: boolean;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName?: string;
  customerId?: number;
  total?: number;
  totalAmount?: string;
  status?: string;
  trackingNumber?: string | null;
  shippingMethodId?: number | null;
  createdAt?: string | Date;
  isPrinted?: boolean;
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  zipcode?: string;
  couponCode?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  codAmount?: number | string;
}

interface BulkTrackingCreateProps {
  orders: Order[];
  shippingMethods: ShippingMethod[];
  onSuccess: () => void;
}

const BulkTrackingCreate: React.FC<BulkTrackingCreateProps> = ({ 
  orders, 
  shippingMethods,
  onSuccess
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    details: Array<{
      orderId: number;
      orderNumber: string;
      success: boolean;
      trackingNumber?: string;
      error?: string;
    }>;
  } | null>(null);
  
  // กรองออเดอร์ที่ยังไม่มีเลขพัสดุเท่านั้น
  const eligibleOrders = orders.filter(order => 
    !order.trackingNumber && order.status === 'pending'
  );
  
  // เมื่อมีการเปิด Dialog ให้ล้างข้อมูลที่เลือกและผลลัพธ์ทั้งหมด
  useEffect(() => {
    if (isOpen) {
      setSelectedOrders([]);
      setSelectedMethod('');
      setResults(null);
    }
  }, [isOpen]);
  
  // ตรวจสอบการเลือกออเดอร์ทั้งหมด
  const allSelected = eligibleOrders.length > 0 && 
    selectedOrders.length === eligibleOrders.length;
  
  // ฟังก์ชันการเลือกออเดอร์ทั้งหมด
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(eligibleOrders.map(order => order.id));
    }
  };
  
  // ฟังก์ชันการเลือก/ยกเลิกการเลือกออเดอร์
  const toggleOrderSelection = (orderId: number) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };
  
  // ฟังก์ชันสร้างเลขพัสดุหลายรายการพร้อมกัน
  const createMultipleTrackingNumbers = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'ไม่ได้เลือกรายการ',
        description: 'กรุณาเลือกรายการที่ต้องการสร้างเลขพัสดุ',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedMethod) {
      toast({
        title: 'กรุณาเลือกบริษัทขนส่ง',
        description: 'คุณต้องเลือกบริษัทขนส่งก่อนสร้างเลขพัสดุ',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const successfulOrders: {
        orderId: number;
        orderNumber: string;
        success: boolean;
        trackingNumber: string;
      }[] = [];
      const failedOrders: {
        orderId: number;
        orderNumber: string;
        success: boolean;
        error: string;
      }[] = [];
      
      // ดำเนินการทีละรายการ
      for (const orderId of selectedOrders) {
        try {
          const order = orders.find(o => o.id === orderId);
          if (!order) continue;
          
          // เรียก API เพื่อสร้างเลขพัสดุ
          const response = await fetch(`/api/orders/${orderId}/tracking`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            credentials: 'include',
            body: JSON.stringify({
              shippingMethod: selectedMethod
            })
          });
          
          const data = await response.json();
          
          if (response.ok && data.success) {
            successfulOrders.push({
              orderId,
              orderNumber: order.orderNumber,
              success: true,
              trackingNumber: data.trackingNumber
            });
          } else {
            failedOrders.push({
              orderId,
              orderNumber: order.orderNumber,
              success: false,
              error: data.message || 'ไม่สามารถสร้างเลขพัสดุได้'
            });
          }
        } catch (error) {
          const order = orders.find(o => o.id === orderId);
          failedOrders.push({
            orderId,
            orderNumber: order?.orderNumber || `ออเดอร์ #${orderId}`,
            success: false,
            error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดระหว่างการสร้างเลขพัสดุ'
          });
        }
      }
      
      // บันทึกผลลัพธ์
      setResults({
        success: successfulOrders.length,
        failed: failedOrders.length,
        details: [...successfulOrders, ...failedOrders]
      });
      
      // แสดงข้อความแจ้งเตือน
      if (failedOrders.length === 0 && successfulOrders.length > 0) {
        toast({
          title: 'สร้างเลขพัสดุสำเร็จทั้งหมด',
          description: `สร้างเลขพัสดุสำเร็จ ${successfulOrders.length} รายการ`,
          variant: 'default',
        });
      } else if (successfulOrders.length > 0) {
        toast({
          title: 'สร้างเลขพัสดุสำเร็จบางส่วน',
          description: `สำเร็จ ${successfulOrders.length} รายการ, ล้มเหลว ${failedOrders.length} รายการ`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'สร้างเลขพัสดุไม่สำเร็จ',
          description: 'ไม่สามารถสร้างเลขพัสดุสำหรับรายการที่เลือกได้',
          variant: 'destructive',
        });
      }
      
      // เรียกฟังก์ชัน callback เมื่อสำเร็จ
      if (successfulOrders.length > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating multiple tracking numbers:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถสร้างเลขพัสดุหลายรายการได้',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ฟังก์ชันเมื่อปิด Dialog ล้างข้อมูล
  const handleClose = () => {
    setIsOpen(false);
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
        onClick={() => setIsOpen(true)}
      >
        <Truck className="h-4 w-4 mr-2" />
        สร้างเลขพัสดุหลายรายการ
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สร้างเลขพัสดุหลายรายการพร้อมกัน</DialogTitle>
            <DialogDescription>
              เลือกออเดอร์ที่ต้องการและบริษัทขนส่งเพื่อสร้างเลขพัสดุ
            </DialogDescription>
          </DialogHeader>
          
          {results ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div>
                  <h3 className="font-medium text-lg">ผลการสร้างเลขพัสดุ</h3>
                  <p className="text-sm text-gray-500">
                    สร้างสำเร็จ {results.success} รายการ, ล้มเหลว {results.failed} รายการ
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                    สำเร็จ: {results.success}
                  </span>
                  {results.failed > 0 && (
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm">
                      ล้มเหลว: {results.failed}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ออเดอร์</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>เลขพัสดุ/ข้อผิดพลาด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.details.map((result) => (
                      <TableRow key={result.orderId}>
                        <TableCell className="font-medium">{result.orderNumber}</TableCell>
                        <TableCell>
                          {result.success ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>สำเร็จ</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>ล้มเหลว</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.success ? (
                            <span className="font-mono">{result.trackingNumber}</span>
                          ) : (
                            <span className="text-red-600 text-sm">{result.error}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <DialogFooter>
                <Button onClick={handleClose}>ปิด</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">เลือกบริษัทขนส่ง</label>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกบริษัทขนส่ง" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* บริษัทขนส่งจำลอง */}
                    <SelectItem key="xiaobai" value="Xiaobai Express">
                      Xiaobai Express - ฿45.00
                    </SelectItem>
                    <SelectItem key="speedline" value="SpeedLine">
                      SpeedLine - ฿60.00
                    </SelectItem>
                    <SelectItem key="thaistar" value="ThaiStar Delivery">
                      ThaiStar Delivery - ฿50.00
                    </SelectItem>
                    <SelectItem key="jnt" value="J&T Express">
                      J&T Express - ฿45.00
                    </SelectItem>
                    <SelectItem key="kerry" value="Kerry Express">
                      Kerry Express - ฿50.00
                    </SelectItem>
                    <SelectItem key="thaipost" value="Thailand Post">
                      Thailand Post - ฿35.00
                    </SelectItem>
                    <SelectItem key="dhl" value="DHL Express">
                      DHL Express - ฿90.00
                    </SelectItem>
                    <SelectItem key="ninja" value="Ninja Van">
                      Ninja Van - ฿55.00
                    </SelectItem>
                    
                    {/* บริษัทขนส่งจากฐานข้อมูล */}
                    {shippingMethods
                      .filter(method => method.isActive)
                      .map((method) => (
                        <SelectItem key={method.id} value={method.name}>
                          {method.name} - ฿{parseFloat(method.price).toFixed(2)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {eligibleOrders.length === 0 ? (
                <div className="py-6 text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <h3 className="font-medium text-gray-700 mb-1">ไม่พบออเดอร์ที่สามารถสร้างเลขพัสดุได้</h3>
                  <p className="text-gray-500 text-sm">
                    ทุกออเดอร์มีเลขพัสดุแล้ว หรือมีสถานะที่ไม่สามารถสร้างเลขพัสดุได้
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border max-h-[350px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={allSelected}
                              onCheckedChange={toggleSelectAll}
                              aria-label="เลือกทั้งหมด"
                            />
                          </TableHead>
                          <TableHead>ออเดอร์</TableHead>
                          <TableHead>ลูกค้า</TableHead>
                          <TableHead>ที่อยู่</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eligibleOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={() => toggleOrderSelection(order.id)}
                                aria-label={`เลือกออเดอร์ ${order.orderNumber}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>
                              {order.customerName || order.recipientName || 'ไม่ระบุ'}
                              {order.recipientPhone && (
                                <div className="text-xs text-gray-500">{order.recipientPhone}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="truncate max-w-[200px]">
                                {[
                                  order.address, 
                                  order.subdistrict, 
                                  order.district, 
                                  order.province, 
                                  order.zipcode
                                ].filter(Boolean).join(' ')}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    <div>
                      เลือก {selectedOrders.length} จาก {eligibleOrders.length} รายการ
                    </div>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-blue-600 p-0 h-auto"
                      onClick={toggleSelectAll}
                    >
                      {allSelected ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                    </Button>
                  </div>
                </>
              )}
              
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleClose}>
                  ยกเลิก
                </Button>
                <Button 
                  onClick={createMultipleTrackingNumbers} 
                  disabled={isProcessing || selectedOrders.length === 0 || !selectedMethod}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      กำลังสร้างเลขพัสดุ...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      สร้างเลขพัสดุ {selectedOrders.length} รายการ
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkTrackingCreate;