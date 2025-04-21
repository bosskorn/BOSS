import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * หน้าสำหรับพิมพ์ลาเบลหลายรายการในหน้าเดียว
 * ใช้ query parameter orders=id1,id2,id3,... เพื่อระบุรายการที่ต้องการพิมพ์
 */
const PrintMultipleLabels = () => {
  // State สำหรับเก็บข้อมูล
  const [isLoading, setIsLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [sortingCode] = useState('SS1');
  const [senderName] = useState('BLUEDASH LOGISTICS');
  const [senderPhone] = useState('02-123-4567');
  const [senderAddress] = useState('เลขที่ 888 อาคารมณียาเซ็นเตอร์ ถนนพระราม 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330');
  const [serviceType] = useState('Standard');
  const [weight] = useState('1.000');
  const [warehouseCode] = useState('BL-1234');
  const [customerCode] = useState('BLUEDASH');

  // ดึงข้อมูลออเดอร์จาก URL parameter
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const ordersParam = params.get('orders');
        
        if (!ordersParam) {
          toast({
            title: 'ไม่พบรายการที่ต้องการพิมพ์',
            description: 'กรุณาระบุรายการที่ต้องการพิมพ์ผ่าน URL parameter orders',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        const orderIds = ordersParam.split(',');
        if (orderIds.length === 0) {
          toast({
            title: 'ไม่พบรายการที่ต้องการพิมพ์',
            description: 'กรุณาระบุรายการที่ต้องการพิมพ์อย่างน้อย 1 รายการ',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        console.log('พิมพ์ลาเบลสำหรับออเดอร์:', orderIds);
        
        // ดึงข้อมูลทุกออเดอร์
        const token = localStorage.getItem('auth_token');
        const allOrders = [];
        
        for (const id of orderIds) {
          try {
            const response = await fetch(`/api/orders/${id}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.order) {
                // ดึงข้อมูลลูกค้าสำหรับแต่ละออเดอร์
                if (data.order.customerId) {
                  try {
                    const customerResponse = await fetch(`/api/customers/${data.order.customerId}`, {
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                      },
                      credentials: 'include'
                    });
                    
                    if (customerResponse.ok) {
                      const customerData = await customerResponse.json();
                      if (customerData.success && customerData.customer) {
                        data.order.customer = customerData.customer;
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching customer data:', error);
                  }
                }
                
                // แปลงเลขพัสดุถ้าขึ้นต้นด้วย "แบบ" ให้ใช้รูปแบบเสี่ยวไป๋ เอ็กเพรส แทน
                if (data.order.trackingNumber && data.order.trackingNumber.startsWith('แบบ')) {
                  // สร้างเลขพัสดุแบบจำลองถ้าเป็นแบบเริ่มต้น
                  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
                  data.order.displayTrackingNumber = 'FLE' + randomPart;
                } else {
                  data.order.displayTrackingNumber = data.order.trackingNumber;
                }
                
                // เพิ่มข้อมูลเพิ่มเติมที่จำเป็นสำหรับการพิมพ์
                // กำหนดยอดเงิน COD จากข้อมูลออเดอร์
                data.order.codAmount = (data.order.paymentMethod === 'cod' || data.order.paymentMethod === 'cash_on_delivery') 
                  ? data.order.totalAmount : '0.00';
                
                // ข้อมูลลูกค้า
                let cusName = data.order.customerName || 'ไม่ระบุชื่อผู้รับ';
                let cusPhone = '';
                let cusAddress = 'ไม่ระบุที่อยู่ผู้รับ';
                
                // ถ้ามีข้อมูลลูกค้าเพิ่มเติม
                if (data.order.customer) {
                  const customer = data.order.customer;
                  cusName = customer.name || cusName;
                  cusPhone = customer.phone || '';
                  
                  // ประกอบที่อยู่
                  const addressParts = [];
                  if (customer.address) addressParts.push(customer.address);
                  if (customer.addressNumber) addressParts.push(`เลขที่ ${customer.addressNumber}`);
                  if (customer.road) addressParts.push(`ถนน${customer.road}`);
                  if (customer.subDistrict) addressParts.push(`แขวง/ตำบล ${customer.subDistrict}`);
                  if (customer.district) addressParts.push(`เขต/อำเภอ ${customer.district}`);
                  if (customer.province) addressParts.push(`${customer.province}`);
                  if (customer.postalCode) addressParts.push(`${customer.postalCode}`);
                  
                  if (addressParts.length > 0) {
                    cusAddress = addressParts.join(' ');
                  }
                }
                
                data.order.recipientName = cusName;
                data.order.recipientPhone = cusPhone;
                data.order.recipientAddress = cusAddress;
                
                // หาเขต/อำเภอ จากที่อยู่
                const addressParts = cusAddress.split(' ');
                const possibleDistrict = addressParts.find((part: string) => 
                  part.includes('อ.') || part.includes('อำเภอ') || part.includes('เขต')
                );
                
                if (possibleDistrict) {
                  data.order.district = possibleDistrict.replace('อ.', '').replace('อำเภอ', '').replace('เขต', '');
                } else {
                  data.order.district = '';
                }
                
                // สร้างวันที่
                const today = new Date();
                data.order.shippingDate = today.toLocaleString('th-TH', { 
                  day: '2-digit', month: '2-digit', year: 'numeric', 
                  hour: '2-digit', minute: '2-digit'
                });
                
                // วันที่คาดว่าจะถึง (เพิ่ม 2 วัน)
                const estimatedDelivery = new Date(today);
                estimatedDelivery.setDate(today.getDate() + 2);
                data.order.estimatedDate = estimatedDelivery.toLocaleDateString('th-TH', {
                  day: '2-digit', month: '2-digit', year: 'numeric'
                });
                
                // เพิ่มเข้าในรายการ
                allOrders.push(data.order);
              }
            }
          } catch (error) {
            console.error(`Error fetching order ${id}:`, error);
          }
        }
        
        if (allOrders.length === 0) {
          toast({
            title: 'ไม่พบข้อมูลออเดอร์',
            description: 'ไม่สามารถดึงข้อมูลออเดอร์ที่ต้องการพิมพ์ได้',
            variant: 'destructive',
          });
        } else {
          console.log('ดึงข้อมูลออเดอร์ทั้งหมดสำเร็จ:', allOrders.length, 'รายการ');
          setOrdersData(allOrders);
          
          // เมื่อข้อมูลพร้อม ให้เตรียมพิมพ์อัตโนมัติ
          setTimeout(() => {
            printLabels();
          }, 1000);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลออเดอร์ได้',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };
    
    fetchOrderData();
  }, []);
  
  // ฟังก์ชันพิมพ์ลาเบล
  const printLabels = () => {
    window.print();
  };
  
  // แสดงผลบนหน้าเว็บ
  return (
    <div className="overflow-hidden">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <h2 className="text-xl font-medium">กำลังโหลดข้อมูลสำหรับพิมพ์ลาเบล...</h2>
          <p className="text-gray-500 mt-2">ระบบจะพิมพ์ลาเบลโดยอัตโนมัติเมื่อโหลดเสร็จ</p>
        </div>
      ) : ordersData.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">ไม่พบข้อมูลออเดอร์</h2>
            <p className="text-gray-700 mb-4">ไม่สามารถดึงข้อมูลออเดอร์ที่ต้องการพิมพ์ได้</p>
            <p className="text-gray-600 mb-6">กรุณาตรวจสอบว่ารหัสออเดอร์ถูกต้องและมีการสร้างเลขพัสดุแล้ว</p>
            <Button 
              onClick={() => window.close()} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              ปิดหน้านี้
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {/* ส่วนที่แสดงเฉพาะบนหน้าจอ ไม่พิมพ์ */}
          <div className="print:hidden p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">ลาเบลพร้อมสำหรับการพิมพ์</h1>
            <p className="text-gray-600 mb-6 text-center">
              {ordersData.length > 1 
                ? `กำลังพิมพ์ ${ordersData.length} ลาเบล ระบบจะพิมพ์ลาเบลโดยอัตโนมัติ`
                : 'กำลังพิมพ์ 1 ลาเบล ระบบจะพิมพ์ลาเบลโดยอัตโนมัติ'}
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800 mb-2">รายการลาเบลที่จะพิมพ์ ({ordersData.length})</h3>
              <ul className="text-sm text-blue-700 list-disc ml-5 mb-3">
                {ordersData.map((order, index) => (
                  <li key={index} className="mb-1">
                    <span className="text-gray-700">#{order.orderNumber || 'N/A'}</span>
                    {' - '}
                    <span className="font-medium">{order.recipientName}</span>
                    {' - '}
                    <span>{order.displayTrackingNumber}</span>
                  </li>
                ))}
              </ul>
              
              <div className="bg-white border border-blue-100 rounded-lg p-4 mb-5">
                <h3 className="text-lg font-medium text-blue-800 mb-2">ตัวอย่างลาเบล</h3>
                <p className="text-gray-600 text-sm mb-3">
                  จะพิมพ์ทั้งหมด {ordersData.length} ลาเบล ({ordersData.length} หน้า)
                </p>
                <div className="border rounded-lg h-28 overflow-auto">
                  {ordersData.map((order, index) => (
                    <div key={index} className="border-b p-2 flex items-center">
                      <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-medium mr-2">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{order.recipientName}</p>
                        <p className="text-xs text-gray-500 truncate">{order.recipientAddress}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">{order.orderNumber || 'N/A'}</p>
                        <p className="text-xs text-blue-600">{order.displayTrackingNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center mt-4">
                <Button 
                  onClick={printLabels} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  พิมพ์ลาเบลทั้งหมด ({ordersData.length} หน้า)
                </Button>
              </div>
            </div>
          </div>
          
          {/* ส่วนที่จะพิมพ์ */}
          <div className="hidden print:block w-full">
            {ordersData.map((order, index) => (
              <div 
                key={index} 
                className="w-[100mm] h-[150mm] border border-dashed border-gray-400 mx-auto my-4 p-2 relative page-break-after-always"
              >
                <div className="flex justify-between text-xs border-b border-gray-800 pb-1 mb-2">
                  <div>วันที่: {order.shippingDate}</div>
                  <div>{order.district || ''} ({sortingCode})</div>
                </div>
                
                <div className="text-center border-b border-gray-800 py-2">
                  <div className="text-xs mb-1 tracking-widest">{order.displayTrackingNumber}</div>
                </div>
                
                <div className="flex border-b border-gray-800">
                  <div className="w-2/3 p-2 border-r border-gray-800 text-center font-bold">
                    {order.orderNumber || 'N/A'}
                  </div>
                  <div className="w-1/3 p-2 text-xs">
                    <div>บริการ: {serviceType}</div>
                    <div>น้ำหนัก: {weight} kg</div>
                  </div>
                </div>
                
                <div className="border-b border-gray-800 p-2 text-xs">
                  <div className="font-bold">ผู้รับ: {order.recipientName}</div>
                  <div>โทร: {order.recipientPhone}</div>
                  <div>{order.recipientAddress}</div>
                </div>
                
                <div className="flex border-b border-gray-800">
                  <div className="w-2/3 p-2 text-xs border-r border-gray-800">
                    <div className="font-bold">ผู้ส่ง: {senderName}</div>
                    <div>โทร: {senderPhone}</div>
                    <div>{senderAddress}</div>
                  </div>
                  <div className="w-1/3 p-2 flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${order.displayTrackingNumber}`} 
                      alt="QR Code" 
                      className="w-16 h-16"
                    />
                  </div>
                </div>
                
                {parseFloat(order.codAmount) > 0 && (
                  <div className="flex border-b border-gray-800">
                    <div className="w-2/5 bg-black text-white p-2 font-bold text-center border-r border-gray-800">
                      เก็บเงินปลายทาง
                    </div>
                    <div className="w-3/5 p-2 text-center font-bold">
                      ฿ {parseFloat(order.codAmount).toLocaleString('th-TH', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                )}
                
                <div className="flex text-xs p-2">
                  <div className="w-1/2">
                    <div>คาดว่าจะถึงวันที่:</div>
                    <div className="font-bold">{order.estimatedDate}</div>
                  </div>
                  <div className="w-1/2 text-right">
                    <div>รหัสลูกค้า: {customerCode}</div>
                    <div>รหัสคลัง: {warehouseCode}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintMultipleLabels;