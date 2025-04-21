import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';

/**
 * หน้าสำหรับพิมพ์ลาเบลหลายรายการในรูปแบบ J&T Express (ใช้พื้นฐานจาก Flash Express)
 * ใช้ query parameter orders=id1,id2,id3,... เพื่อระบุรายการที่ต้องการพิมพ์
 * ขนาดลาเบล: 100mm x 150mm
 */
const JntExpressLabel = () => {
  // State สำหรับเก็บข้อมูล
  const [isLoading, setIsLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [sortingCode] = useState('JT1');

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
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .preview-header {
      margin-bottom: 10px;
    }
    
    .shipping-label-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: flex-start;
    }
    
    .shipping-label {
      width: 380px;
      height: 570px;
      border: 1px solid #ccc;
      padding: 0;
      position: relative;
      box-sizing: border-box;
      page-break-after: always;
      background-color: white;
      overflow: hidden;
    }
    
    .label-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #000;
      padding: 8px;
      background-color: #EB1C24;
    }
    
    /* ลบสไตล์ dropoff-info ตามต้องการ */
    
    .tiktok-logo, .jnt-logo, .service-type {
      flex: 1;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .tiktok-logo {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      font-size: 20px;
      font-weight: bold;
      color: #FFFFFF;
    }
    
    .bluedash-logo-img {
      max-height: 35px;
      width: auto;
    }
    
    .jnt-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      color: #FFFFFF;
    }
    
    .service-type {
      text-align: right;
      justify-content: flex-end;
      font-size: 16px;
      font-weight: 500;
      color: #FFFFFF;
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
      position: relative;
    }
    
    .sender-info {
      padding-right: 100px; /* เว้นพื้นที่ด้านขวาสำหรับ sender QR Code */
      font-size: 10px; /* ปรับขนาดข้อความผู้ส่งให้เล็กลง */
    }
    
    .recipient-info {
      padding-right: 20px; /* ลดพื้นที่ด้านขวาเพราะเราใช้ float-right สำหรับ QR Code แล้ว */
      min-height: 85px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .recipient-address, .sender-address {
      max-width: calc(100% - 90px); /* ลดความกว้างด้านขวาสำหรับ QR Code */
      word-break: break-word;
    }
    
    .sender-info-header {
      font-weight: 500;
      margin-bottom: 2px;
      font-size: 9px;
    }
    
    .recipient-info-header {
      font-weight: 500;
      margin-bottom: 3px;
    }
    
    .cod-section {
      display: flex;
      border-bottom: 1px solid #000;
    }
    
    .cod-label {
      flex: 1;
      background: #EB1C24;
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
    
    .product-details {
      border-bottom: 1px solid #000;
      padding: 8px 10px;
      font-size: 11px;
    }
    
    .product-title {
      font-weight: 500;
      margin-bottom: 5px;
    }
    
    .product-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    
    .product-item {
      display: flex;
      justify-content: space-between;
    }
    
    .product-name {
      font-weight: normal;
    }
    
    .product-quantity {
      font-weight: bold;
    }
    
    .pickup-delivery {
      position: absolute;
      right: 10px;
      bottom: 30px;
      padding: 5px 10px;
      font-weight: bold;
      border: 1px solid #000;
    }
    
    .qr-code-container {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 65px;
      height: 65px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }
    
    .qr-code {
      width: 62px;
      height: 62px;
      object-fit: contain;
      border: 1px solid #eee;
    }
    
    /* ลบ CSS ของข้อความแนวตั้งออกตามที่ต้องการ */
    
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
        const allOrders: any[] = [];
        
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
                  // สร้างเลขพัสดุแบบจำลองสำหรับ J&T Express
                  const prefix = 'JTH';
                  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
                  const randomDigits = Math.floor(Math.random() * 9000) + 1000;
                  data.order.displayTrackingNumber = `${prefix}${randomDigits}${randomPart}`;
                } else if (data.order.trackingNumber) {
                  data.order.displayTrackingNumber = data.order.trackingNumber;
                } else {
                  // ถ้าไม่มีเลขพัสดุ สร้างเลขแบบจำลองสำหรับ J&T Express
                  const prefix = 'JTH';
                  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
                  const randomDigits = Math.floor(Math.random() * 9000) + 1000;
                  data.order.displayTrackingNumber = `${prefix}${randomDigits}${randomPart}`;
                }
                
                // สร้างรหัสพื้นที่การจัดส่งสำหรับ J&T Express (แบบจำลอง)
                data.order.sortingCode = `${Math.floor(Math.random() * 90) + 10}J-${Math.floor(Math.random() * 90000) + 10000}`;
                
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
                  
                  cusAddress = addressParts.join(' ');
                }
                
                // กำหนดข้อมูลผู้รับ
                data.order.recipientName = cusName;
                data.order.recipientPhone = cusPhone || data.order.customerPhone || '-';
                data.order.recipientAddress = cusAddress;
                
                // กำหนดวันที่ปัจจุบัน
                const today = new Date();
                const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
                data.order.currentDate = formattedDate;
                
                allOrders.push(data.order);
              }
            }
          } catch (error) {
            console.error(`Error fetching order #${id}:`, error);
          }
        }
        
        setOrdersData(allOrders);
        setIsLoading(false);
        
        // รอให้ DOM อัปเดตก่อนจะทำงานกับบาร์โค้ด
        setTimeout(() => {
          allOrders.forEach((order, index) => {
            try {
              // สร้าง barcode
              JsBarcode(`#barcode-${index}`, order.displayTrackingNumber, {
                format: "CODE128",
                displayValue: false,
                width: 1.5,
                height: 50,
                margin: 0
              });
            } catch (error) {
              console.error(`Error generating barcode for order #${order.id}:`, error);
            }
          });
        }, 500);
        
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
          description: 'ไม่สามารถดึงข้อมูลออเดอร์ได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };
    
    fetchOrderData();
  }, []);

  // Helper functions
  const getQRCodeUrl = (trackingNumber: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingNumber)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <style>{labelStyles}</style>
      <div className="print-controls">
        <h1>J&T Express Shipping Labels</h1>
        <div>
          <p>จำนวน {ordersData.length} รายการ</p>
          <Button 
            disabled={isLoading || ordersData.length === 0} 
            onClick={handlePrint}
          >
            พิมพ์ลาเบล ({ordersData.length} รายการ)
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <div className="p-4">
          <div className="shipping-label-container">
            {ordersData.map((order, index) => (
              <div key={index} className="shipping-label">
                {/* แสดงส่วนบนของลาเบล */}
                <div className="label-header">
                  <div className="tiktok-logo">
                    BLUEDASH
                  </div>
                  <div className="jnt-logo">
                    J&T Express
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
                    <div>JT1</div>
                    <div>JTH-BKK</div>
                    <div>พร้อม</div>
                  </div>
                </div>
                
                {/* แสดงข้อมูลผู้ส่ง */}
                <div className="sender-info">
                  <div className="sender-info-header">จาก BLUEDASH (+66)0632291123</div>
                  <div className="sender-address">8/88 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900</div>
                </div>
                
                {/* แสดงข้อมูลผู้รับ */}
                {/* แสดงข้อมูลผู้รับพร้อม QR Code */}
                <div className="recipient-info">
                  <div className="recipient-info-header">ถึง {order.recipientName} ({order.recipientPhone})</div>
                  <div className="recipient-address">{order.recipientAddress}</div>
                  <div className="qr-code-container">
                    <img src={getQRCodeUrl(order.displayTrackingNumber)} className="qr-code" alt="QR Code" />
                  </div>
                </div>
                
                {/* แสดงส่วน COD (ถ้ามี) */}
                {order.hasCOD && (
                  <div className="cod-section">
                    <div className="cod-label">COD</div>
                    <div className="cod-amount">฿{order.codAmount}</div>
                  </div>
                )}
                
                {/* แสดงส่วนน้ำหนัก */}
                <div className="shipment-details">
                  <div className="weight-info">
                    Weight: {order.weight || '0.500'} KG
                  </div>
                  <div className="signature-area">
                    ลายเซ็นผู้รับ:
                  </div>
                </div>
                
                {/* แสดงส่วนรายละเอียดการจัดส่ง */}
                <div className="dates-section">
                  <div className="order-date">
                    <div>Order ID:</div>
                    <div>{order.orderNumber || order.id || '-'}</div>
                  </div>
                  <div className="shipping-date">
                    <div>Shipping Date:</div>
                    <div>{order.shippingDate || order.currentDate}</div>
                  </div>
                </div>
                
                {/* เพิ่มส่วนแสดงข้อมูลสินค้าและจำนวน */}
                <div className="product-details">
                  <div className="product-title">รายการสินค้า:</div>
                  <div className="product-list">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item: any, i: number) => (
                        <div key={i} className="product-item">
                          <span className="product-name">{item.productName || 'สินค้า'}</span>
                          <span className="product-quantity">x {item.quantity || 1}</span>
                        </div>
                      ))
                    ) : (
                      <div className="product-item">
                        <span className="product-name">{order.productName || 'เสื้อยืดคอกลม'}</span>
                        <span className="product-quantity">x {order.quantity || 1}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* ลบ PICKUP ตามที่ต้องการ */}
                
                {/* ลบข้อความแนวตั้งด้านข้างออกตามที่ต้องการ */}
                
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

export default JntExpressLabel;