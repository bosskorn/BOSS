import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import Layout from '@/components/Layout';
import { Loader2, Clock, CreditCard, Truck, MapPin, Phone, User, Package, ChevronRight, ArrowLeft, Printer, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

// อินเทอร์เฟซสำหรับข้อมูลรายการสินค้า
interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  imageUrl?: string;
}

// อินเทอร์เฟซสำหรับข้อมูลลูกค้า
interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  province: string;
  district: string;
  subdistrict: string;
  zipcode: string;
  addressNumber?: string;
  road?: string;
  moo?: string;
  soi?: string;
  building?: string;
  floor?: string;
}

// อินเทอร์เฟซสำหรับข้อมูลการจัดส่ง
interface Shipping {
  method: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier: string;
  cost: number;
  estimatedDelivery?: string;
  status: string;
  statusHistory: Array<{
    date: string;
    status: string;
    description: string;
    location?: string;
  }>;
}

// อินเทอร์เฟซสำหรับข้อมูลคำสั่งซื้อ
interface Order {
  id: number;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customer: Customer;
  items: OrderItem[];
  paymentMethod: string;
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  shipping: Shipping;
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  total: number;
  notes?: string;
}

const OrderDetail: React.FC = () => {
  const [, params] = useRoute('/order-detail/:id');
  const orderId = params?.id;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('details');

  // ฟังก์ชันเรียกข้อมูลคำสั่งซื้อจาก API
  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('ข้อมูลคำสั่งซื้อที่ได้รับจาก API:', data.order);
        
        // ดึงข้อมูลลูกค้า
        let customerData = {
          id: data.order.customerId || 0,
          name: data.order.customerName || 'ไม่ระบุชื่อ',
          email: '',
          phone: data.order.customerPhone || '',
          address: data.order.customerAddress || '',
          province: data.order.customerProvince || '',
          district: data.order.customerDistrict || '',
          subdistrict: data.order.customerSubdistrict || '',
          zipcode: data.order.customerZipcode || '',
          // ข้อมูลเพิ่มเติม
          addressNumber: data.order.customerAddressNumber || '',
          road: data.order.customerRoad || '',
          moo: data.order.customerMoo || '',
          soi: data.order.customerSoi || '',
          building: data.order.customerBuilding || '',
          floor: data.order.customerFloor || '',
        };
        
        // ดึงข้อมูลสินค้า (ถ้ามี)
        let orderItems = data.order.items || [];
        if (!Array.isArray(orderItems)) {
          orderItems = [];
        }
        
        // สร้างข้อมูลการจัดส่ง
        let shippingData = {
          method: data.order.shippingMethod || 'ไม่ระบุ',
          trackingNumber: data.order.trackingNumber || undefined,
          trackingUrl: data.order.trackingUrl || undefined,
          carrier: data.order.shippingCarrier || 'ไม่ระบุ',
          cost: parseFloat(data.order.shippingFee || '0'),
          estimatedDelivery: undefined,
          status: data.order.status || 'pending',
          statusHistory: []
        };
        
        // เพิ่มประวัติการจัดส่ง
        if (data.order.trackingNumber) {
          // กรณีมีเลขพัสดุแล้ว
          shippingData.statusHistory = [
            {
              date: data.order.shippingDate || data.order.updatedAt || data.order.createdAt,
              status: 'เตรียมการจัดส่ง',
              description: `สร้างเลขพัสดุ ${data.order.trackingNumber} แล้ว`
            },
            {
              date: data.order.createdAt,
              status: 'สร้างคำสั่งซื้อ',
              description: 'คำสั่งซื้อถูกสร้างขึ้นในระบบ'
            }
          ];
        } else {
          // กรณียังไม่มีเลขพัสดุ
          shippingData.statusHistory = [{
            date: data.order.createdAt || new Date().toISOString(),
            status: 'สร้างคำสั่งซื้อ',
            description: 'คำสั่งซื้อถูกสร้างขึ้นในระบบ'
          }];
        }
        
        // ระบุผู้ให้บริการจากเลขพัสดุ
        if (data.order.trackingNumber) {
          const trackingNumber = data.order.trackingNumber.toUpperCase();
          
          // ตรวจสอบผู้ให้บริการจัดส่งจากเลขพัสดุอย่างละเอียด
          if (trackingNumber.includes('TST') || trackingNumber.includes('THA')) {
            shippingData.carrier = 'ThaiStar Delivery';
          } else if (trackingNumber.includes('THP') || trackingNumber.includes('TH')) {
            shippingData.carrier = 'Thailand Post';
          } else if (trackingNumber.includes('SPE') || trackingNumber.includes('PD')) {
            shippingData.carrier = 'SpeedLine';
          } else if (trackingNumber.includes('KRY') || trackingNumber.includes('KERRY')) {
            shippingData.carrier = 'Kerry Express';
          } else if (trackingNumber.includes('JNT') || trackingNumber.includes('J&T')) {
            shippingData.carrier = 'J&T Express';
          } else if (trackingNumber.includes('XBE') || trackingNumber.includes('XB')) {
            shippingData.carrier = 'Xiaobai Express';
          } else if (trackingNumber.includes('FLE') || trackingNumber.includes('FLASH')) {
            shippingData.carrier = 'Flash Express';
          } else if (trackingNumber.includes('DHL')) {
            shippingData.carrier = 'DHL Express';
          } else if (trackingNumber.includes('NJV') || trackingNumber.includes('NINJA')) {
            shippingData.carrier = 'Ninja Van';
          }
          
          // ลอจิกตรวจสอบแบบที่ 2: ดูจากตัวอักษร 3 ตัวแรก
          if (shippingData.carrier === 'ไม่ระบุ') {
            if (trackingNumber.startsWith('TST') || trackingNumber.startsWith('THA')) {
              shippingData.carrier = 'ThaiStar Delivery';
            } else if (trackingNumber.startsWith('THP')) {
              shippingData.carrier = 'Thailand Post';
            } else if (trackingNumber.startsWith('SPE')) {
              shippingData.carrier = 'SpeedLine';
            } else if (trackingNumber.startsWith('KRY')) {
              shippingData.carrier = 'Kerry Express';
            } else if (trackingNumber.startsWith('JNT')) {
              shippingData.carrier = 'J&T Express';
            } else if (trackingNumber.startsWith('XBE')) {
              shippingData.carrier = 'Xiaobai Express';
            } else if (trackingNumber.startsWith('FLE')) {
              shippingData.carrier = 'Flash Express';
            } else if (trackingNumber.startsWith('DHL')) {
              shippingData.carrier = 'DHL Express';
            } else if (trackingNumber.startsWith('NJV')) {
              shippingData.carrier = 'Ninja Van';
            }
          }
        }
        
        // สร้างข้อมูลคำสั่งซื้อที่เข้ากับ interface Order
        const formattedOrder: Order = {
          id: data.order.id,
          orderNumber: data.order.orderNumber,
          date: data.order.createdAt,
          status: data.order.status || 'pending',
          customer: customerData,
          items: orderItems.map((item: any) => ({
            id: item.id || 0,
            productId: item.productId || 0,
            productName: item.productName || 'ไม่ระบุสินค้า',
            sku: item.sku || '',
            quantity: item.quantity || 1,
            price: parseFloat(item.price || '0'),
            discount: parseFloat(item.discount || '0'),
            total: parseFloat(item.total || '0'),
            imageUrl: item.imageUrl
          })),
          paymentMethod: data.order.paymentMethod || 'ไม่ระบุ',
          paymentStatus: data.order.paymentStatus || 'unpaid',
          shipping: shippingData,
          subtotal: parseFloat(data.order.subtotal || '0'),
          discount: parseFloat(data.order.discount || '0'),
          tax: 0,
          shippingCost: parseFloat(data.order.shippingFee || '0'),
          total: parseFloat(data.order.totalAmount || '0'),
          notes: data.order.note
        };
        
        console.log('ข้อมูลคำสั่งซื้อที่จัดรูปแบบแล้ว:', formattedOrder);
        setOrder(formattedOrder);
      } else {
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // เรียกข้อมูลเมื่อโหลดหน้าและ orderId เปลี่ยน
  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // ฟังก์ชันเปลี่ยนสถานะคำสั่งซื้อ
  const updateOrderStatus = async (newStatus: Order['status']) => {
    if (!orderId) return;
    
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // อัปเดตข้อมูล order ในสเตท
        setOrder(prev => prev ? {...prev, status: newStatus} : null);
        
        toast({
          title: 'อัปเดตสถานะสำเร็จ',
          description: `สถานะคำสั่งซื้อถูกเปลี่ยนเป็น "${getStatusText(newStatus)}" เรียบร้อยแล้ว`,
          variant: 'default',
        });
      } else {
        throw new Error(data.message || 'ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้',
        variant: 'destructive',
      });
    }
  };

  // ฟังก์ชันส่งอีเมลไปยังลูกค้า
  const sendEmailToCustomer = async (type: 'confirmation' | 'shipping' | 'reminder') => {
    if (!orderId) return;
    
    try {
      const response = await fetch(`/api/orders/${orderId}/email`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ type })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'ส่งอีเมลสำเร็จ',
          description: data.message || 'อีเมลถูกส่งไปยังลูกค้าเรียบร้อยแล้ว',
          variant: 'default',
        });
      } else {
        throw new Error(data.message || 'ไม่สามารถส่งอีเมลได้');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถส่งอีเมลได้',
        variant: 'destructive',
      });
    }
  };

  // ฟังก์ชันฟอร์แมตเลขเป็นรูปแบบเงินบาท
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // ฟังก์ชันฟอร์แมตวันที่เป็นรูปแบบวันที่ไทย
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  };

  // แปลงสถานะเป็นข้อความภาษาไทย
  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'processing': return 'กำลังจัดการ';
      case 'shipped': return 'จัดส่งแล้ว';
      case 'delivered': return 'จัดส่งสำเร็จ';
      case 'cancelled': return 'ยกเลิก';
      default: return 'ไม่ระบุ';
    }
  };

  // แปลงวิธีการชำระเงินเป็นข้อความภาษาไทย
  const translatePaymentMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cod': return 'เก็บเงินปลายทาง';
      case 'cash_on_delivery': return 'เก็บเงินปลายทาง';
      case 'bank_transfer': return 'โอนเงินผ่านธนาคาร';
      case 'credit_card': return 'บัตรเครดิต';
      case 'debit_card': return 'บัตรเดบิต';
      case 'counter_service': return 'เคาน์เตอร์เซอร์วิส';
      case 'promptpay': return 'พร้อมเพย์';
      case 'true_money': return 'ทรูมันนี่';
      default: return method;
    }
  };

  // แปลงสถานะการชำระเงินเป็นข้อความภาษาไทย
  const getPaymentStatusText = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'ชำระแล้ว';
      case 'unpaid': return 'รอชำระเงิน';
      case 'refunded': return 'คืนเงินแล้ว';
      default: return 'ไม่ระบุ';
    }
  };

  // สร้าง Badge สำหรับสถานะ
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">รอดำเนินการ</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">กำลังจัดการ</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">จัดส่งแล้ว</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">จัดส่งสำเร็จ</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">ยกเลิก</Badge>;
      default:
        return <Badge variant="outline">ไม่ระบุ</Badge>;
    }
  };

  // สร้าง Badge สำหรับสถานะการชำระเงิน
  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">ชำระแล้ว</Badge>;
      case 'unpaid':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">รอชำระเงิน</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">คืนเงินแล้ว</Badge>;
      default:
        return <Badge variant="outline">ไม่ระบุ</Badge>;
    }
  };

  // สร้างปุ่มที่แสดงตามสถานะ
  const renderActionButtons = () => {
    if (!order) return null;
    
    const actions = [];
    
    // ปุ่มพิมพ์ใบสั่งซื้อ แสดงเสมอ
    actions.push(
      <Button key="print" variant="outline" className="bg-gray-50" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-2" />
        พิมพ์ใบสั่งซื้อ
      </Button>
    );
    
    // ปุ่มส่งอีเมลไปยังลูกค้า แสดงเฉพาะเมื่อลูกค้ามีอีเมล
    if (order.customer.email) {
      actions.push(
        <Button key="email" variant="outline" className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100" onClick={() => sendEmailToCustomer('confirmation')}>
          <ExternalLink className="h-4 w-4 mr-2" />
          ส่งอีเมลถึงลูกค้า
        </Button>
      );
    }
    
    // ปุ่มอัปเดตสถานะตามสถานะปัจจุบัน
    switch (order.status) {
      case 'pending':
        actions.push(
          <Button key="process" className="bg-blue-600 hover:bg-blue-700" onClick={() => updateOrderStatus('processing')}>
            ดำเนินการคำสั่งซื้อ
          </Button>
        );
        break;
      case 'processing':
        actions.push(
          <Button key="ship" className="bg-purple-600 hover:bg-purple-700" onClick={() => updateOrderStatus('shipped')}>
            <Truck className="h-4 w-4 mr-2" />
            บันทึกการจัดส่ง
          </Button>
        );
        break;
      case 'shipped':
        actions.push(
          <Button key="deliver" className="bg-green-600 hover:bg-green-700" onClick={() => updateOrderStatus('delivered')}>
            จัดส่งเรียบร้อยแล้ว
          </Button>
        );
        break;
    }
    
    // ปุ่มยกเลิกคำสั่งซื้อ แสดงเฉพาะเมื่อสถานะเป็น pending หรือ processing
    if (['pending', 'processing'].includes(order.status)) {
      actions.push(
        <Button key="cancel" variant="outline" className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100" onClick={() => updateOrderStatus('cancelled')}>
          ยกเลิก
        </Button>
      );
    }
    
    return actions;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* หัวข้อและปุ่มกลับ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="flex items-center">
            <Button variant="ghost" className="mr-2 p-0 hover:bg-transparent" asChild>
              <Link href="/orders-all">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">รายละเอียดคำสั่งซื้อ</h1>
              {!isLoading && order && (
                <p className="text-gray-500">
                  เลขที่: <span className="font-medium">{order.orderNumber}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* สถานะและปุ่มดำเนินการ */}
          {!isLoading && order && (
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 justify-start sm:justify-end">
              {getStatusBadge(order.status)}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-500">กำลังโหลดข้อมูล...</span>
          </div>
        ) : !order ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-700">ไม่พบข้อมูลคำสั่งซื้อ</h3>
            <p className="text-gray-500 mt-1">คำสั่งซื้อที่คุณต้องการดูอาจถูกลบไปแล้วหรือไม่มีอยู่ในระบบ</p>
            <Button className="mt-4" asChild>
              <Link href="/orders-all">กลับไปยังรายการคำสั่งซื้อ</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              {/* ข้อมูลทั่วไปของคำสั่งซื้อ */}
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">ข้อมูลคำสั่งซื้อ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">วันที่สั่งซื้อ:</span>
                    <span className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(order.date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">สถานะคำสั่งซื้อ:</span>
                    <span>{getStatusBadge(order.status)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">วิธีการชำระเงิน:</span>
                    <span className="font-medium flex items-center">
                      <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
                      {translatePaymentMethod(order.paymentMethod)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">วิธีการจัดส่ง:</span>
                    <span className="font-medium flex items-center">
                      <Truck className="h-4 w-4 mr-1 text-gray-400" />
                      {order.shipping.carrier || "ไม่ระบุ"}
                    </span>
                  </div>
                  {order.shipping.trackingNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">เลขพัสดุ:</span>
                      <span className="font-medium">
                        {order.shipping.trackingUrl ? (
                          <a 
                            href={order.shipping.trackingUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {order.shipping.trackingNumber}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        ) : (
                          order.shipping.trackingNumber
                        )}
                      </span>
                    </div>
                  )}
                  {order.notes && (
                    <div className="pt-2">
                      <span className="text-gray-500 block mb-1">หมายเหตุ:</span>
                      <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded border border-gray-100">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ข้อมูลลูกค้า */}
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">ข้อมูลลูกค้า</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start">
                    <User className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">{order.customer.name}</div>
                      {order.customer.email && (
                        <a href={`mailto:${order.customer.email}`} className="text-sm text-blue-600 hover:underline">
                          {order.customer.email}
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {order.customer.phone && (
                    <div className="flex items-start">
                      <Phone className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                      <div>
                        <a href={`tel:${order.customer.phone}`} className="hover:underline">
                          {order.customer.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start pt-1">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium mb-1">ที่อยู่จัดส่ง</div>
                      <div className="text-gray-600">
                        {/* ตรวจสอบข้อมูลบ้านเลขที่และถนน */}
                        {order.customer.address || (order.customer.addressNumber && order.customer.road) ? (
                          <div className="mb-2">
                            {/* ถ้ามีเลขที่บ้านหรือถนน ให้แสดงเป็นรายการแยก */}
                            {order.customer.addressNumber && (
                              <p className="mb-1">
                                <span className="font-medium">บ้านเลขที่:</span> {order.customer.addressNumber}
                              </p>
                            )}
                            {order.customer.road && (
                              <p className="mb-1">
                                <span className="font-medium">ถนน:</span> {order.customer.road}
                              </p>
                            )}
                            {/* ถ้ามีซอย */}
                            {order.customer.soi && (
                              <p className="mb-1">
                                <span className="font-medium">ซอย:</span> {order.customer.soi}
                              </p>
                            )}
                            {/* ถ้ามีหมู่ */}
                            {order.customer.moo && (
                              <p className="mb-1">
                                <span className="font-medium">หมู่:</span> {order.customer.moo}
                              </p>
                            )}
                            {/* ถ้ามีอาคาร/คอนโด */}
                            {order.customer.building && (
                              <p className="mb-1">
                                <span className="font-medium">อาคาร/คอนโด:</span> {order.customer.building}
                              </p>
                            )}
                            {/* ถ้ามีชั้น */}
                            {order.customer.floor && (
                              <p className="mb-1">
                                <span className="font-medium">ชั้น:</span> {order.customer.floor}
                              </p>
                            )}
                            {/* ถ้ามีที่อยู่แบบรวม */}
                            {order.customer.address && (
                              <p className="mb-1">
                                <span className="font-medium">ที่อยู่เพิ่มเติม:</span> {order.customer.address}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mb-2">
                            <div className="flex items-center mb-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                              <span className="font-medium">ข้อมูลที่อยู่ไม่ครบถ้วน</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              กรุณาระบุบ้านเลขที่และถนนให้ครบถ้วนก่อนจัดส่งเพื่อป้องกันปัญหาการจัดส่ง
                            </p>
                          </div>
                        )}
                        <p>
                          {order.customer.subdistrict} {order.customer.district} {order.customer.province} {order.customer.zipcode}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* สรุปคำสั่งซื้อ */}
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">สรุปคำสั่งซื้อ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">รวม ({order.items.length} รายการ):</span>
                    <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                  </div>
                  
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">ส่วนลด:</span>
                      <span className="font-medium text-red-500">- {formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">ค่าจัดส่ง:</span>
                    <span className="font-medium">{formatCurrency(order.shippingCost)}</span>
                  </div>
                  
                  {order.tax > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">ภาษี:</span>
                      <span className="font-medium">{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">ยอดรวมทั้งสิ้น:</span>
                    <span className="font-bold text-xl text-purple-600">{formatCurrency(order.total)}</span>
                  </div>
                  
                  <div className="pt-3 space-y-2">
                    {renderActionButtons()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* แท็บแสดงรายละเอียดและประวัติการจัดส่ง */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="details">รายการสินค้า</TabsTrigger>
                <TabsTrigger value="tracking">ติดตามการจัดส่ง</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>สินค้า</TableHead>
                          <TableHead className="text-right">ราคาต่อหน่วย</TableHead>
                          <TableHead className="text-center">จำนวน</TableHead>
                          <TableHead className="text-right">ส่วนลด</TableHead>
                          <TableHead className="text-right">รวม</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center">
                                {item.imageUrl ? (
                                  <div className="h-10 w-10 rounded bg-gray-100 mr-3">
                                    <img 
                                      src={item.imageUrl} 
                                      alt={item.productName}
                                      className="h-full w-full object-cover rounded"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-3">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{item.productName}</div>
                                  <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tracking" className="mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <span>ประวัติการจัดส่ง</span>
                      {order.shipping.trackingUrl && (
                        <a 
                          href={order.shipping.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:underline flex items-center"
                        >
                          ติดตามพัสดุ <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {order.shipping.statusHistory.length > 0 ? (
                      <div className="space-y-4">
                        {order.shipping.statusHistory.map((history, index) => (
                          <div key={index} className="relative pl-6 pb-8">
                            {/* เส้นแนวตั้งเชื่อมจุด */}
                            {index !== order.shipping.statusHistory.length - 1 && (
                              <div className="absolute left-[9px] top-[18px] bottom-0 w-0.5 bg-gray-200" />
                            )}
                            
                            {/* จุดสถานะ */}
                            <div className="absolute left-0 top-[8px] h-4 w-4 rounded-full border border-purple-500 bg-white" />
                            
                            <div className="flex flex-col">
                              <div className="font-medium text-gray-900">{history.status}</div>
                              <time className="text-sm text-gray-500">{formatDate(history.date)}</time>
                              <div className="text-gray-600 mt-1">{history.description}</div>
                              {history.location && (
                                <div className="text-sm text-gray-500 mt-1">
                                  <span className="inline-flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" /> {history.location}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        <Truck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p>ยังไม่มีข้อมูลการติดตามการจัดส่ง</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetail;