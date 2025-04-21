import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';

/**
 * หน้าสำหรับพิมพ์ลาเบลหลายรายการในรูปแบบ TikTok Shop / Flash Express (ตามต้นฉบับ)
 * ใช้ query parameter orders=id1,id2,id3,... เพื่อระบุรายการที่ต้องการพิมพ์
 */
const TikTokStyleLabelPage = () => {
  // State สำหรับเก็บข้อมูล
  const [isLoading, setIsLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [sortingCode] = useState('SS1');

  // CSS สำหรับการแสดงลาเบล
  const labelStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
    
    @media print {
      @page {
        size: 100mm 150mm;
        margin: 0;
      }
      
      body {
        margin: 0;
        padding: 0;
      }
      
      .print-controls {
        display: none !important;
      }
      
      .shipping-label {
        page-break-after: always;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
      }
    }
    
    body {
      font-family: 'Kanit', sans-serif;
      margin: 0;
      padding: 0;
    }
    
    .print-controls {
      text-align: center;
      margin: 20px;
      font-family: 'Kanit', sans-serif;
    }
    
    .shipping-label-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .shipping-label {
      width: 100mm;
      height: 150mm;
      border: 1px dashed #000;
      margin: 10px auto;
      box-sizing: border-box;
      position: relative;
      font-family: 'Kanit', sans-serif;
      page-break-after: always;
      overflow: hidden;
    }
    
    .label-header {
      display: flex;
      justify-content: space-between;
      padding: 5px 10px;
      border-bottom: 1px solid #000;
      font-size: 12px;
    }
    
    .tiktok-logo, .flash-logo, .service-type {
      flex: 1;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .tiktok-logo {
      font-weight: bold;
      text-align: left;
      justify-content: flex-start;
    }
    
    .flash-logo {
      font-style: italic;
      font-weight: bold;
    }
    
    .service-type {
      text-align: right;
      justify-content: flex-end;
    }
    
    .barcode-section {
      padding: 5px;
      text-align: center;
      border-bottom: 1px solid #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .barcode-svg {
      max-width: 100%;
      height: 50px;
      margin: 0 auto;
    }
    
    .tracking-number {
      font-size: 12px;
      margin-top: 3px;
      letter-spacing: 1px;
    }
    
    .order-number-section {
      display: flex;
      border-bottom: 1px solid #000;
    }
    
    .order-number {
      flex: 2;
      padding: 10px;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      border-right: 1px solid #000;
    }
    
    .sorting-info {
      flex: 1;
      padding: 5px;
      font-size: 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .sender-info, .recipient-info {
      padding: 5px 10px;
      border-bottom: 1px solid #000;
      font-size: 12px;
    }
    
    .sender-info-header, .recipient-info-header {
      font-weight: 500;
      margin-bottom: 3px;
    }
    
    .cod-section {
      display: flex;
      border-bottom: 1px solid #000;
    }
    
    .cod-label {
      flex: 1;
      background: #000;
      color: #fff;
      padding: 10px;
      text-align: center;
      font-weight: bold;
      font-size: 16px;
    }
    
    .cod-amount {
      flex: 2;
      padding: 10px;
      text-align: center;
      font-weight: bold;
      font-size: 16px;
    }
    
    .shipment-details {
      display: flex;
      border-bottom: 1px solid #000;
      font-size: 10px;
    }
    
    .weight-info {
      flex: 2;
      padding: 5px 10px;
      border-right: 1px solid #000;
    }
    
    .signature-area {
      flex: 1;
      padding: 5px 10px;
      font-size: 8px;
    }
    
    .dates-section {
      display: flex;
      border-bottom: 1px solid #000;
      font-size: 10px;
    }
    
    .order-date {
      flex: 1;
      padding: 5px;
      border-right: 1px solid #000;
    }
    
    .shipping-date, .estimated-date {
      flex: 1;
      padding: 5px;
    }
    
    .pickup-delivery {
      position: absolute;
      right: 10px;
      bottom: 30px;
      padding: 5px 10px;
      font-weight: bold;
      border: 1px solid #000;
    }
    
    .qr-code {
      position: absolute;
      right: 10px;
      top: 215px;
      width: 85px;
      height: 85px;
    }
    
    .vertical-text-left, .vertical-text-right {
      position: absolute;
      font-size: 10px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
    }
    
    .vertical-text-left {
      left: 0;
      top: 50%;
      transform: translateY(-50%) rotate(180deg);
    }
    
    .vertical-text-right {
      right: 0;
      top: 50%;
      transform: translateY(-50%);
    }
    
    .dashed-cut-line {
      position: absolute;
      bottom: 0;
      width: 100%;
      border-bottom: 1px dashed #000;
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
    
    .scissors-icon {
      font-size: 14px;
      margin-left: 5px;
      transform: rotate(90deg);
    }
  `;

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
        
        const ids = ordersParam.split(',');
        if (ids.length === 0) {
          toast({
            title: 'ไม่พบรายการที่ต้องการพิมพ์',
            description: 'กรุณาระบุรายการที่ต้องการพิมพ์อย่างน้อย 1 รายการ',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        console.log('พิมพ์ลาเบลสำหรับออเดอร์:', ids);
        setOrderIds(ids);
        
        // ดึงข้อมูลทุกออเดอร์
        const token = localStorage.getItem('auth_token');
        const allOrders = [];
        
        for (const id of ids) {
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
                
                // แปลงเลขพัสดุถ้าขึ้นต้นด้วย "แบบ" ให้ใช้รูปแบบใหม่แทน
                if (data.order.trackingNumber && data.order.trackingNumber.startsWith('แบบ')) {
                  // สร้างเลขพัสดุแบบจำลอง
                  const prefix = 'THT';
                  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
                  const randomDigits = Math.floor(Math.random() * 9000) + 1000;
                  data.order.displayTrackingNumber = `${prefix}${randomDigits}T${randomPart}Z`;
                } else if (data.order.trackingNumber) {
                  data.order.displayTrackingNumber = data.order.trackingNumber;
                } else {
                  // ถ้าไม่มีเลขพัสดุ สร้างเลขแบบจำลอง
                  const prefix = 'THT';
                  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
                  const randomDigits = Math.floor(Math.random() * 9000) + 1000;
                  data.order.displayTrackingNumber = `${prefix}${randomDigits}T${randomPart}Z`;
                }
                
                // สร้างรหัสพื้นที่การจัดส่ง (แบบจำลอง)
                data.order.sortingCode = `${Math.floor(Math.random() * 90) + 10}S-${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 90) + 10}`;
                
                // เพิ่มข้อมูลเพิ่มเติมที่จำเป็นสำหรับการพิมพ์
                // กำหนดยอดเงิน COD จากข้อมูลออเดอร์
                data.order.codAmount = (data.order.paymentMethod === 'cod' || data.order.paymentMethod === 'cash_on_delivery') 
                  ? parseFloat(data.order.totalAmount).toFixed(2) : '0.00';
                data.order.hasCOD = (data.order.paymentMethod === 'cod' || data.order.paymentMethod === 'cash_on_delivery');
                
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
                data.order.recipientPhone = cusPhone || '-';
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
                data.order.currentDate = today.toLocaleDateString('th-TH', {
                  day: '2-digit', month: '2-digit', year: '2-digit' 
                });
                
                data.order.shippingDate = today.toLocaleString('th-TH', { 
                  day: '2-digit', month: '2-digit', year: '2-digit',
                  hour: '2-digit', minute: '2-digit'
                });
                
                // วันที่คาดว่าจะถึง (เพิ่ม 2 วัน)
                const estimatedDelivery = new Date(today);
                estimatedDelivery.setDate(today.getDate() + 2);
                data.order.estimatedDate = estimatedDelivery.toLocaleDateString('th-TH', {
                  day: '2-digit', month: '2-digit', year: '2-digit'
                });
                
                // สร้างเลขออเดอร์สำหรับแสดง
                if (!data.order.orderNumber) {
                  const randomOrderId = Math.floor(Math.random() * 900000000) + 100000000;
                  data.order.orderNumber = randomOrderId.toString();
                }
                
                // สร้างน้ำหนักสินค้า
                data.order.weight = (Math.random() * 5).toFixed(3);
                
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
          console.log('ดึงข้อมูลออเดอร์ครบทั้งหมด:', JSON.stringify(allOrders.map(order => order.id)));
          setOrdersData(allOrders);
          
          // เมื่อข้อมูลพร้อม ให้เตรียมพิมพ์อัตโนมัติหลังจาก 2 วินาที
          setTimeout(() => {
            printLabels();
          }, 2000);
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
  
  // สร้างบาร์โค้ดสำหรับแต่ละลาเบล
  useEffect(() => {
    if (ordersData.length > 0 && !isLoading) {
      // รอให้ DOM พร้อมก่อนสร้างบาร์โค้ด
      setTimeout(() => {
        ordersData.forEach((order, index) => {
          try {
            const barcodeElement = document.getElementById(`barcode-${index}`);
            if (barcodeElement) {
              JsBarcode(barcodeElement, order.displayTrackingNumber, {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: false,
                margin: 5,
                textAlign: "center"
              });
            }
          } catch (error) {
            console.error(`Error generating barcode for order ${order.id}:`, error);
          }
        });
      }, 500);
    }
  }, [ordersData, isLoading]);
  
  // ฟังก์ชันพิมพ์ลาเบล
  const printLabels = () => {
    window.print();
  };
  
  const getMissingOrders = () => {
    const foundIds = ordersData.map(order => order.id.toString());
    return orderIds.filter(id => !foundIds.includes(id));
  };
  
  // ฟังก์ชั่นสำหรับการสร้าง QR Code
  const getQRCodeUrl = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${encodeURIComponent(text)}`;
  };
  
  // แสดงผลบนหน้าเว็บ
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: labelStyles }} />
      
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
          <div className="print-controls">
            <h1 className="text-2xl font-bold mb-4 text-center">ลาเบลพร้อมสำหรับการพิมพ์</h1>
            <p className="text-gray-600 mb-6 text-center">
              {ordersData.length > 1 
                ? `กำลังพิมพ์ ${ordersData.length} ลาเบล ระบบจะพิมพ์ลาเบลโดยอัตโนมัติ`
                : 'กำลังพิมพ์ 1 ลาเบล ระบบจะพิมพ์ลาเบลโดยอัตโนมัติ'}
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-4xl mx-auto">
              <h3 className="font-medium text-blue-800 mb-2">รายการลาเบลที่จะพิมพ์ ({ordersData.length}/{orderIds.length})</h3>
              
              {getMissingOrders().length > 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2 mb-3">
                  <p className="text-yellow-800 text-sm font-medium">ไม่พบข้อมูลบางรายการ</p>
                  <p className="text-yellow-700 text-xs">รายการที่ไม่พบ: {getMissingOrders().join(', ')}</p>
                </div>
              )}
              
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
          
          {/* ส่วนที่จะพิมพ์ - ลาเบลสไตล์ TikTok / Flash Express */}
          <div className="shipping-label-container">
            {ordersData.map((order, index) => (
              <div key={index} className="shipping-label">
                {/* แสดงส่วนบนของลาเบล */}
                <div className="label-header">
                  <div className="tiktok-logo">
                    TikTok Shop
                  </div>
                  <div className="flash-logo">
                    FLASH Express
                  </div>
                  <div className="service-type">
                    Standard
                  </div>
                </div>
                
                {/* แสดงบาร์โค้ด */}
                <div className="barcode-section">
                  <svg id={`barcode-${index}`} className="barcode-svg"></svg>
                  <div className="tracking-number">{order.displayTrackingNumber}</div>
                </div>
                
                {/* แสดงเลขออเดอร์และรหัสการจัดส่ง */}
                <div className="order-number-section">
                  <div className="order-number">{order.sortingCode}</div>
                  <div className="sorting-info">
                    <div>SS1</div>
                    <div>2TPY_BDC-ตบ</div>
                    <div>พร้อม</div>
                  </div>
                </div>
                
                {/* แสดงข้อมูลผู้ส่ง */}
                <div className="sender-info">
                  <div className="sender-info-header">จาก JSB Candy (+66)0836087712</div>
                  <div>24 ซอยรามคำแหงมาเก็ต 008 แขวงวังทองหลาง, บางกะปิ, กรุงเทพ 10160</div>
                </div>
                
                {/* แสดงข้อมูลผู้รับ */}
                <div className="recipient-info">
                  <div className="recipient-info-header">ถึง {order.recipientName} ({order.recipientPhone})</div>
                  <div>{order.recipientAddress}</div>
                </div>
                
                {/* แสดง QR Code */}
                <img src={getQRCodeUrl(order.displayTrackingNumber)} className="qr-code" alt="QR Code" />
                
                {/* แสดงส่วน COD (ถ้ามี) */}
                {order.hasCOD && (
                  <div className="cod-section">
                    <div className="cod-label">COD</div>
                    <div className="cod-amount">Weight : 4.000 KG</div>
                  </div>
                )}
                
                {/* แสดงส่วนรายละเอียดการจัดส่ง */}
                <div className="dates-section">
                  <div className="order-date">
                    <div>Order ID:</div>
                    <div>57851596{Math.floor(Math.random() * 900000) + 100000}</div>
                  </div>
                  <div className="shipping-date">
                    <div>Shipping Date:</div>
                    <div>{order.currentDate} 23:34</div>
                  </div>
                </div>
                
                {/* แสดงส่วน PICKUP */}
                <div className="pickup-delivery">PICK-UP</div>
                
                {/* แสดงข้อความแนวตั้งด้านข้าง */}
                <div className="vertical-text-left">{order.displayTrackingNumber}</div>
                <div className="vertical-text-right">{order.displayTrackingNumber}</div>
                
                {/* แสดงเส้นตัดขอบล่าง */}
                <div className="dashed-cut-line">
                  <span className="scissors-icon">✂</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TikTokStyleLabelPage;