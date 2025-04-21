import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import JsBarcode from 'jsbarcode';

// ใช้โครงสร้างเดิมจาก TikTokStyleLabel แต่เปลี่ยนขนาดเป็น 100x150mm
const FlashExpressLabelNew: React.FC = () => {
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // CSS สำหรับหน้าลาเบล Flash Express ใหม่
  const labelStyles = `
    @page {
      size: 100mm 150mm;
      margin: 0;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
    }
    
    body {
      font-family: 'Kanit', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .label-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
    }
    
    .print-button {
      margin: 20px;
      padding: 10px 20px;
      background-color: #0066CC;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: 'Kanit', sans-serif;
      font-size: 16px;
    }
    
    .print-button:hover {
      background-color: #0052a3;
    }
    
    .flash-express-label {
      width: 100mm;
      height: 150mm;
      border: 1px solid #000;
      margin-bottom: 20px;
      page-break-after: always;
      position: relative;
      box-sizing: border-box;
      padding: 5mm;
      background-color: #fff;
      font-family: 'Kanit', sans-serif;
      font-size: 12px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #000;
      padding-bottom: 5mm;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
    }
    
    .flash-logo {
      height: 15mm;
      width: auto;
    }
    
    .tracking-section {
      text-align: right;
    }
    
    .tracking-number {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .barcode-container {
      display: flex;
      justify-content: center;
      margin: 5mm 0;
      height: 15mm;
    }
    
    .address-section {
      display: flex;
      flex-direction: column;
      margin-bottom: 5mm;
    }
    
    .to-address, .from-address {
      margin-bottom: 2mm;
    }
    
    .address-label {
      font-weight: bold;
      font-size: 14px;
      background-color: #f0f0f0;
      padding: 2px 5px;
      margin-bottom: 3px;
      border-radius: 3px;
    }
    
    .address-content {
      padding-left: 5px;
      font-size: 13px;
    }
    
    .recipient-name {
      font-weight: bold;
      font-size: 14px;
    }
    
    .recipient-address, .sender-address {
      font-size: 12px;
      line-height: 1.3;
    }
    
    .recipient-phone, .sender-phone {
      font-size: 12px;
      margin-top: 2px;
    }
    
    .order-info {
      display: flex;
      justify-content: space-between;
      margin-top: 5mm;
      padding: 2mm;
      border: 1px solid #ddd;
      border-radius: 3px;
      background-color: #f9f9f9;
      font-size: 12px;
    }
    
    .order-date, .order-id, .weight {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-weight: bold;
      font-size: 11px;
      color: #666;
    }
    
    .info-value {
      font-size: 12px;
    }
    
    .additional-info {
      margin-top: 5mm;
      border-top: 1px dashed #000;
      padding-top: 3mm;
      font-size: 12px;
    }
    
    .cod-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 2mm;
      padding: 2mm;
      background-color: #fff4e3;
      border: 1px solid #ffd8a8;
      border-radius: 3px;
    }
    
    .cod-label {
      font-weight: bold;
      color: #d97706;
    }
    
    .cod-amount {
      font-weight: bold;
      font-size: 16px;
      color: #d97706;
    }
    
    .qr-code-container {
      position: absolute;
      bottom: 10mm;
      right: 5mm;
      width: 20mm;
      height: 20mm;
    }
    
    .qr-code {
      width: 100%;
      height: 100%;
    }
    
    .sorting-code {
      position: absolute;
      bottom: 5mm;
      left: 5mm;
      font-size: 14px;
      font-weight: bold;
      padding: 1mm 2mm;
      border: 1px solid #000;
      background-color: #f0f0f0;
    }
    
    .product-details {
      margin-top: 3mm;
      padding: 2mm;
      border: 1px solid #ddd;
      border-radius: 3px;
      background-color: #f9f9f9;
      font-size: 12px;
    }
    
    .product-title {
      font-weight: bold;
      margin-bottom: 2mm;
    }
    
    .product-list {
      display: flex;
      flex-direction: column;
      gap: 1mm;
    }
    
    .product-item {
      display: flex;
      justify-content: space-between;
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
                  const prefix = 'FL';
                  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
                  const randomDigits = Math.floor(Math.random() * 9000) + 1000;
                  data.order.displayTrackingNumber = `${prefix}${randomDigits}${randomPart}`;
                } else if (data.order.trackingNumber) {
                  data.order.displayTrackingNumber = data.order.trackingNumber;
                } else {
                  // ถ้าไม่มีเลขพัสดุ สร้างเลขแบบจำลอง
                  const prefix = 'FL';
                  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
                  const randomDigits = Math.floor(Math.random() * 9000) + 1000;
                  data.order.displayTrackingNumber = `${prefix}${randomDigits}${randomPart}`;
                }
                
                // สร้างรหัสพื้นที่การจัดส่ง (แบบจำลอง)
                data.order.sortingCode = `${Math.floor(Math.random() * 90) + 10}F-${Math.floor(Math.random() * 90000) + 10000}`;
                
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

  return (
    <div>
      <style>{labelStyles}</style>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <div>
          <div className="no-print flex justify-center my-4">
            <button className="print-button" onClick={printLabels}>
              พิมพ์ลาเบล Flash Express ({ordersData.length} รายการ)
            </button>
          </div>
          
          <div className="label-container">
            {ordersData.map((order, index) => (
              <div key={index} className="flash-express-label">
                {/* ส่วนหัวของลาเบล */}
                <div className="header">
                  <div className="logo-section">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/th/8/89/Flash_Express_Logo.png"
                      alt="Flash Express Logo" 
                      className="flash-logo"
                    />
                  </div>
                  <div className="tracking-section">
                    <div className="tracking-number">{order.displayTrackingNumber}</div>
                  </div>
                </div>
                
                {/* ส่วนบาร์โค้ด */}
                <div className="barcode-container">
                  <svg id={`barcode-${index}`}></svg>
                </div>
                
                {/* ส่วนที่อยู่ */}
                <div className="address-section">
                  <div className="to-address">
                    <div className="address-label">ผู้รับ:</div>
                    <div className="address-content">
                      <div className="recipient-name">{order.recipientName}</div>
                      <div className="recipient-address">{order.recipientAddress}</div>
                      <div className="recipient-phone">โทร: {order.recipientPhone}</div>
                    </div>
                  </div>
                  
                  <div className="from-address">
                    <div className="address-label">ผู้ส่ง:</div>
                    <div className="address-content">
                      <div className="sender-name">BLUEDASH Logistics</div>
                      <div className="sender-address">123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110</div>
                      <div className="sender-phone">โทร: 02-123-4567</div>
                    </div>
                  </div>
                </div>
                
                {/* ข้อมูลออเดอร์ */}
                <div className="order-info">
                  <div className="order-date">
                    <span className="info-label">วันที่สั่ง</span>
                    <span className="info-value">{order.currentDate}</span>
                  </div>
                  <div className="order-id">
                    <span className="info-label">Order ID</span>
                    <span className="info-value">{order.orderNumber || order.id}</span>
                  </div>
                  <div className="weight">
                    <span className="info-label">น้ำหนัก</span>
                    <span className="info-value">{order.weight} kg</span>
                  </div>
                </div>
                
                {/* รายการสินค้า */}
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
                        <span className="product-name">{order.productName || 'สินค้า'}</span>
                        <span className="product-quantity">x {order.quantity || 1}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* ส่วน COD ถ้ามี */}
                {order.hasCOD && (
                  <div className="cod-section">
                    <span className="cod-label">เก็บเงินปลายทาง (COD)</span>
                    <span className="cod-amount">฿{order.codAmount}</span>
                  </div>
                )}
                
                {/* QR Code */}
                <div className="qr-code-container">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.displayTrackingNumber}`}
                    className="qr-code"
                    alt="QR Code"
                  />
                </div>
                
                {/* รหัสคัดแยกพื้นที่ */}
                <div className="sorting-code">{order.sortingCode}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashExpressLabelNew;