import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Printer, Loader2, ChevronLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import JsBarcode from 'jsbarcode';

// สำหรับพิมพ์ลาเบลหลายรายการพร้อมกัน
const PrintMultipleLabels: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [labelType, setLabelType] = useState('standard'); // หรือ 'flash', 'jt', 'tiktok'

  useEffect(() => {
    // ดึงพารามิเตอร์จาก URL
    const params = new URLSearchParams(window.location.search);
    const orderIdsParam = params.get('orders');
    const orderIds = orderIdsParam ? orderIdsParam.split(',').filter(id => id && id.trim() !== '') : [];
    const type = params.get('type') || 'standard';
    
    setLabelType(type);
    
    console.log('Received orderIds:', orderIds);
    
    if (!orderIdsParam || orderIds.length === 0) {
      toast({
        title: 'ไม่พบรายการที่ต้องการพิมพ์',
        description: 'กรุณาเลือกรายการที่ต้องการพิมพ์ลาเบล',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    
    // ดึงข้อมูลออเดอร์ทั้งหมด
    fetchOrders(orderIds);
  }, []);

  // ฟังก์ชันดึงข้อมูลออเดอร์
  const fetchOrders = async (orderIds: string[]) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // log สถานะก่อนดึงข้อมูล
      console.log('Fetching orders with IDs:', orderIds);
      
      // ดึงข้อมูลออเดอร์ทุกรายการแบบ parallel
      const orderPromises = orderIds.map(id => 
        fetch(`/api/orders/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          credentials: 'include'
        })
        .then(res => {
          if (!res.ok) {
            console.error(`Failed to fetch order ${id}:`, res.status, res.statusText);
            return { success: false, error: `Error ${res.status}: ${res.statusText}` };
          }
          return res.json();
        })
        .catch(err => {
          console.error(`Error fetching order ${id}:`, err);
          return { success: false, error: err.message };
        })
      );
      
      const results = await Promise.all(orderPromises);
      console.log('API responses:', results);
      
      // กรองเฉพาะผลลัพธ์ที่สำเร็จ
      const validOrders = results
        .filter(result => result.success && result.data)
        .map(result => result.data);
      
      console.log('Valid orders:', validOrders.length);
      
      if (validOrders.length === 0) {
        toast({
          title: 'ไม่พบข้อมูลออเดอร์',
          description: 'ไม่สามารถดึงข้อมูลออเดอร์ที่เลือกได้ กรุณาตรวจสอบว่าออเดอร์มีเลขพัสดุและยังคงอยู่ในระบบ',
          variant: 'destructive',
        });
      } else {
        setOrders(validOrders);
        
        // สร้าง barcodes หลังจากดึงข้อมูลสำเร็จและ DOM สร้างเสร็จ
        setTimeout(() => {
          generateBarcodes(validOrders);
          
          // อัตโนมัติเปิดหน้าพิมพ์เมื่อโหลดข้อมูลเสร็จสมบูรณ์
          setTimeout(() => {
            handlePrint();
          }, 500);
        }, 200);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลออเดอร์ได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสร้าง Barcodes
  const generateBarcodes = (orders: any[]) => {
    console.log('กำลังสร้างบาร์โค้ดสำหรับ', orders.length, 'รายการ');
    orders.forEach((order, index) => {
      if (order.trackingNumber) {
        try {
          const barcodeId = `barcode-${order.id}`;
          console.log('กำลังสร้างบาร์โค้ด ID:', barcodeId, 'สำหรับเลขพัสดุ:', order.trackingNumber);
          const barcodeElement = document.getElementById(barcodeId);
          
          if (barcodeElement) {
            // แปลงเลขพัสดุถ้าขึ้นต้นด้วย "แบบ"
            let trackingNumber = order.trackingNumber;
            if (trackingNumber.startsWith('แบบ')) {
              // สร้างเลขพัสดุแบบจำลอง
              const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
              trackingNumber = 'FLE' + randomPart;
              console.log('แปลงเลขพัสดุจาก', order.trackingNumber, 'เป็น', trackingNumber);
            }
            
            JsBarcode(barcodeElement, trackingNumber, {
              format: "CODE128",
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 12,
              marginTop: 10,
              marginBottom: 0,
              background: "#ffffff"
            });
            console.log('สร้างบาร์โค้ดสำเร็จ');
          } else {
            console.error(`ไม่พบ element สำหรับบาร์โค้ดของออเดอร์ #${order.id} (ID: ${barcodeId})`);
          }
        } catch (error) {
          console.error(`เกิดข้อผิดพลาดในการสร้างบาร์โค้ดสำหรับออเดอร์ #${order.id}:`, error);
        }
      } else {
        console.warn(`ออเดอร์ #${order.id} ไม่มีเลขพัสดุ`);
      }
    });
  };

  // ฟังก์ชันพิมพ์เอกสาร
  const handlePrint = () => {
    window.print();
  };

  // ฟังก์ชันย้อนกลับไปหน้ารายการออเดอร์
  const goBack = () => {
    setLocation('/orders-all');
  };

  // Helper function เพื่อจัดรูปแบบเงิน
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // ฟังก์ชันแปลงเลขพัสดุให้อยู่ในรูปแบบที่อ่านง่าย
  const formatTrackingNumber = (trackingNumber: string) => {
    // แบ่งเป็นกลุ่มๆ ละ 4 ตัวอักษร
    return trackingNumber.replace(/(.{4})/g, '$1 ').trim();
  };

  // สร้าง CSS สำหรับแต่ละประเภทลาเบล
  const getLabelStyle = () => {
    if (labelType === 'flash') {
      return 'flash-label';
    } else if (labelType === 'jt') {
      return 'jt-label';
    } else if (labelType === 'tiktok') {
      return 'tiktok-label';
    } else {
      return 'standard-label';
    }
  };

  // ไม่มีออเดอร์
  if (!isLoading && orders.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>ไม่พบรายการที่ต้องการพิมพ์</AlertTitle>
          <AlertDescription>
            ไม่พบข้อมูลออเดอร์ที่ต้องการพิมพ์ลาเบล หรือออเดอร์อาจไม่มีเลขพัสดุ
          </AlertDescription>
        </Alert>
        <Button onClick={goBack} variant="outline" className="mt-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          กลับไปหน้ารายการออเดอร์
        </Button>
      </div>
    );
  }

  // หน้ากำลังโหลด
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <h1 className="text-lg font-medium">กำลังโหลดข้อมูลสำหรับพิมพ์ลาเบล...</h1>
      </div>
    );
  }

  return (
    <div className="print-container">
      {/* ปุ่มควบคุมสำหรับหน้าจอเท่านั้น ไม่แสดงตอนพิมพ์ */}
      <div className="no-print container mx-auto py-4 px-6 max-w-7xl flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={goBack} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            กลับไปหน้ารายการออเดอร์
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="h-4 w-4 mr-2" />
            พิมพ์ ({orders.length} รายการ)
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <h1 className="text-lg font-medium mb-2">รายการลาเบลที่จะพิมพ์ ({orders.length} รายการ)</h1>
            <p className="text-sm text-gray-500 mb-4">
              พิมพ์ลาเบลประเภท: {
                labelType === 'flash' ? 'Flash Express' :
                labelType === 'jt' ? 'J&T Express' :
                labelType === 'tiktok' ? 'TikTok Shop' : 'แบบมาตรฐาน'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* เนื้อหาส่วนที่จะพิมพ์ */}
      <div className="print-content">
        {orders.map((order, index) => (
          <div 
            key={order.id} 
            className={`shipping-label ${getLabelStyle()}`}
            style={{ pageBreakAfter: index < orders.length - 1 ? 'always' : 'auto' }}
          >
            {labelType === 'flash' && (
              <div className="flash-express-label">
                <div className="header">
                  <div className="logo">Flash Express</div>
                  <div className="tracking-number">{formatTrackingNumber(order.trackingNumber)}</div>
                </div>
                
                <div className="barcode-container">
                  <svg id={`barcode-${order.id}`}></svg>
                </div>
                
                <div className="addresses">
                  <div className="sender">
                    <strong>ผู้ส่ง:</strong>
                    <div>BLUEDASH LOGISTICS</div>
                    <div>เลขที่ 888 อาคารมณียาเซ็นเตอร์ ถนนพระราม 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330</div>
                    <div>โทร: 02-123-4567</div>
                  </div>
                  
                  <div className="recipient">
                    <strong>ผู้รับ:</strong>
                    <div>{order.customerName || (order.customer?.name) || 'ไม่ระบุ'}</div>
                    <div>{order.customer?.address || 'ไม่ระบุที่อยู่'}</div>
                    <div>{order.customer?.phone || 'ไม่ระบุเบอร์โทร'}</div>
                  </div>
                </div>
                
                <div className="footer">
                  {order.paymentStatus === 'cod' || order.paymentMethod === 'cod' || order.paymentMethod === 'cash_on_delivery' ? (
                    <div className="cod">
                      <span>COD: {formatCurrency(parseFloat(order.totalAmount || '0'))}</span>
                    </div>
                  ) : (
                    <div className="prepaid">ชำระเงินแล้ว</div>
                  )}
                </div>
              </div>
            )}
            
            {labelType === 'jt' && (
              <div className="jt-express-label">
                <div className="header">
                  <div className="logo">J&T Express</div>
                  <div className="tracking-number">{formatTrackingNumber(order.trackingNumber)}</div>
                </div>
                
                <div className="barcode-container">
                  <svg id={`barcode-${order.id}`}></svg>
                </div>
                
                <div className="addresses">
                  <div className="sender">
                    <strong>ผู้ส่ง:</strong>
                    <div>BLUEDASH LOGISTICS</div>
                    <div>เลขที่ 888 อาคารมณียาเซ็นเตอร์ ถนนพระราม 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330</div>
                    <div>โทร: 02-123-4567</div>
                  </div>
                  
                  <div className="recipient">
                    <strong>ผู้รับ:</strong>
                    <div>{order.customerName || (order.customer?.name) || 'ไม่ระบุ'}</div>
                    <div>{order.customer?.address || 'ไม่ระบุที่อยู่'}</div>
                    <div>{order.customer?.phone || 'ไม่ระบุเบอร์โทร'}</div>
                  </div>
                </div>
                
                <div className="footer">
                  {order.paymentStatus === 'cod' || order.paymentMethod === 'cod' || order.paymentMethod === 'cash_on_delivery' ? (
                    <div className="cod">
                      <span>COD: {formatCurrency(parseFloat(order.totalAmount || '0'))}</span>
                    </div>
                  ) : (
                    <div className="prepaid">ชำระเงินแล้ว</div>
                  )}
                </div>
              </div>
            )}
            
            {labelType === 'tiktok' && (
              <div className="tiktok-shop-label">
                <div className="header">
                  <div className="logo">TikTok Shop</div>
                  <div className="tracking-number">{formatTrackingNumber(order.trackingNumber)}</div>
                </div>
                
                <div className="barcode-container">
                  <svg id={`barcode-${order.id}`}></svg>
                </div>
                
                <div className="order-number">
                  <span>เลขออเดอร์: {order.orderNumber}</span>
                </div>
                
                <div className="addresses">
                  <div className="sender">
                    <strong>ผู้ส่ง:</strong>
                    <div>BLUEDASH LOGISTICS</div>
                    <div>เลขที่ 888 อาคารมณียาเซ็นเตอร์ ถนนพระราม 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330</div>
                    <div>โทร: 02-123-4567</div>
                  </div>
                  
                  <div className="recipient">
                    <strong>ผู้รับ:</strong>
                    <div>{order.customerName || (order.customer?.name) || 'ไม่ระบุ'}</div>
                    <div>{order.customer?.address || 'ไม่ระบุที่อยู่'}</div>
                    <div>{order.customer?.phone || 'ไม่ระบุเบอร์โทร'}</div>
                  </div>
                </div>
                
                <div className="footer">
                  {order.paymentStatus === 'cod' || order.paymentMethod === 'cod' || order.paymentMethod === 'cash_on_delivery' ? (
                    <div className="cod">
                      <span>COD: {formatCurrency(parseFloat(order.totalAmount || '0'))}</span>
                    </div>
                  ) : (
                    <div className="prepaid">ชำระเงินแล้ว</div>
                  )}
                </div>
              </div>
            )}
            
            {labelType === 'standard' && (
              <div className="standard-label">
                <div className="header">
                  <div className="logo">BLUEDASH</div>
                  <div className="tracking-number">{formatTrackingNumber(order.trackingNumber)}</div>
                </div>
                
                <div className="barcode-container">
                  <svg id={`barcode-${order.id}`}></svg>
                </div>
                
                <div className="order-info">
                  <span>เลขออเดอร์: {order.orderNumber}</span>
                </div>
                
                <div className="addresses">
                  <div className="sender">
                    <strong>ผู้ส่ง:</strong>
                    <div>BLUEDASH LOGISTICS</div>
                    <div>เลขที่ 888 อาคารมณียาเซ็นเตอร์ ถนนพระราม 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330</div>
                    <div>โทร: 02-123-4567</div>
                  </div>
                  
                  <div className="recipient">
                    <strong>ผู้รับ:</strong>
                    <div>{order.customerName || (order.customer?.name) || 'ไม่ระบุ'}</div>
                    <div>{order.customer?.address || 'ไม่ระบุที่อยู่'}</div>
                    <div>{order.customer?.phone || 'ไม่ระบุเบอร์โทร'}</div>
                  </div>
                </div>
                
                <div className="footer">
                  {order.paymentStatus === 'cod' || order.paymentMethod === 'cod' || order.paymentMethod === 'cash_on_delivery' ? (
                    <div className="cod">
                      <span>COD: {formatCurrency(parseFloat(order.totalAmount || '0'))}</span>
                    </div>
                  ) : (
                    <div className="prepaid">ชำระเงินแล้ว</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CSS สำหรับพิมพ์ */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-content {
            margin: 0;
            padding: 0;
          }
          
          .shipping-label {
            page-break-inside: avoid;
            padding: 10mm;
            width: 100mm;
            height: 100mm;
            margin: 0 auto;
            font-family: 'Kanit', sans-serif;
            box-sizing: border-box;
            border: 1px solid #ccc;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          
          .logo {
            font-weight: bold;
            font-size: 14px;
          }
          
          .tracking-number {
            font-weight: bold;
            font-size: 14px;
          }
          
          .barcode-container {
            margin: 10px 0;
            text-align: center;
          }
          
          .addresses {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 10px 0;
            font-size: 12px;
          }
          
          .sender, .recipient {
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          
          .footer {
            margin-top: 10px;
            font-weight: bold;
            font-size: 14px;
          }
          
          .cod {
            color: #e53e3e;
          }
          
          .prepaid {
            color: #38a169;
          }
          
          /* เพิ่มสไตล์เฉพาะ */
          .flash-express-label .header {
            background-color: #fd5c63;
            color: white;
            padding: 5px;
            border-radius: 4px;
          }
          
          .jt-express-label .header {
            background-color: #d10911;
            color: white;
            padding: 5px;
            border-radius: 4px;
          }
          
          .tiktok-shop-label .header {
            background-color: #000;
            color: white;
            padding: 5px;
            border-radius: 4px;
          }
          
          .standard-label .header {
            background-color: #3b82f6;
            color: white;
            padding: 5px;
            border-radius: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintMultipleLabels;