import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';

/**
 * หน้าสำหรับพิมพ์ลาเบลหลายรายการในหน้าเดียว (รองรับการพิมพ์ทั้งหมด)
 * ใช้ query parameter orders=id1,id2,id3,... เพื่อระบุรายการที่ต้องการพิมพ์
 * ใช้รูปแบบลาเบลที่เหมือนกับในหน้า flash-express-label-fixed
 */
const PrintLabelsFullFixedPage = () => {
  // State สำหรับเก็บข้อมูล
  const [isLoading, setIsLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [sortingCode] = useState('SS1');
  const [senderName] = useState('BLUEDASH LOGISTICS');
  const [senderPhone] = useState('02-123-4567');
  const [senderAddress] = useState('เลขที่ 888 อาคารมณียาเซ็นเตอร์ ถนนพระราม 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330');
  const [serviceType] = useState('Standard');
  const [weight] = useState('1.000');
  const [warehouseCode] = useState('BL-1234');
  const [customerCode] = useState('BLUEDASH');

  // CSS สำหรับการแสดงลาเบล
  const labelStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700&display=swap');
    
    .print-container {
      font-family: 'Kanit', sans-serif;
    }
    
    .print-controls {
      text-align: center;
      margin: 20px;
    }
    
    .print-button {
      padding: 10px 20px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-family: 'Kanit', sans-serif;
      font-size: 14px;
    }
    
    .print-button:hover {
      background: #0055aa;
    }
    
    .flash-express-label {
      width: 100mm;
      min-height: 150mm;
      border: 1px dashed #000;
      margin: 10px auto;
      padding: 10px;
      box-sizing: border-box;
      background-color: white;
      page-break-after: always;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    
    .logo-title {
      font-size: 16px;
      font-weight: bold;
    }
    
    .tracking-box {
      text-align: right;
    }
    
    .tracking-title {
      font-size: 12px;
      color: #666;
    }
    
    .tracking-number {
      font-size: 16px;
      font-weight: bold;
    }
    
    .barcode-container {
      text-align: center;
      margin: 15px 0;
    }
    
    .addresses {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .sender, .recipient {
      border: 1px solid #ddd;
      padding: 10px;
    }
    
    .address-title {
      font-weight: bold;
      margin-bottom: 5px;
      border-bottom: 1px dashed #ddd;
      padding-bottom: 5px;
    }
    
    .sender-info, .recipient-info {
      font-size: 14px;
    }
    
    .name, .address, .phone {
      margin: 3px 0;
    }
    
    .order-details {
      border: 1px solid #ddd;
      padding: 10px;
      margin-bottom: 15px;
    }
    
    .order-number {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .products {
      margin-top: 5px;
      font-size: 12px;
    }
    
    .product-title {
      font-weight: bold;
      margin-bottom: 3px;
    }
    
    .product-list {
      padding-left: 10px;
    }
    
    .product-item {
      margin-bottom: 2px;
    }
    
    .cod-section {
      border: 1px solid #000;
      display: flex;
      margin-bottom: 15px;
    }
    
    .cod-label {
      background-color: #000;
      color: white;
      font-weight: bold;
      padding: 10px;
      width: 40%;
      text-align: center;
    }
    
    .cod-amount {
      padding: 10px;
      width: 60%;
      text-align: center;
      font-weight: bold;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    
    @media print {
      .print-controls, .preview-area {
        display: none !important;
      }
      
      .flash-express-label {
        page-break-after: always;
        margin: 0;
        border: none;
      }
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
                width: 1.5,
                height: 50,
                displayValue: false,
                margin: 0
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
  
  // แสดงผลบนหน้าเว็บ
  return (
    <div className="print-container">
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
          <div className="print-controls preview-area">
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
          
          {/* ส่วนที่จะพิมพ์ */}
          <div>
            {ordersData.map((order, index) => (
              <div key={index} className="flash-express-label">
                <div className="header">
                  <div className="logo-title">เสี่ยวไป๋ เอ็กเพรส</div>
                  <div className="tracking-box">
                    <div className="tracking-title">หมายเลขพัสดุ | Tracking Number</div>
                    <div className="tracking-number">{order.displayTrackingNumber}</div>
                  </div>
                </div>

                <div className="barcode-container">
                  <svg id={`barcode-${index}`}></svg>
                </div>

                <div className="addresses">
                  <div className="sender">
                    <div className="address-title">ผู้ส่ง | From</div>
                    <div className="sender-info">
                      <p className="name">{senderName}</p>
                      <p className="address">{senderAddress}</p>
                      <p className="phone">โทร: {senderPhone}</p>
                    </div>
                  </div>
                  
                  <div className="recipient">
                    <div className="address-title">ผู้รับ | To</div>
                    <div className="recipient-info">
                      <p className="name">{order.recipientName}</p>
                      <p className="address">{order.recipientAddress}</p>
                      <p className="phone">โทร: {order.recipientPhone || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="order-details">
                  <div className="order-number">เลขออเดอร์: {order.orderNumber || 'N/A'}</div>
                  <div className="shipping-details" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div>บริการ: {serviceType}</div>
                    <div>น้ำหนัก: {weight} kg</div>
                  </div>
                </div>
                
                {parseFloat(order.codAmount) > 0 && (
                  <div className="cod-section">
                    <div className="cod-label">เก็บเงินปลายทาง</div>
                    <div className="cod-amount">
                      ฿ {parseFloat(order.codAmount).toLocaleString('th-TH', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                )}
                
                <div className="footer">
                  <div>
                    <div>คาดว่าจะถึงวันที่:</div>
                    <div style={{ fontWeight: 'bold' }}>{order.estimatedDate}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
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

export default PrintLabelsFullFixedPage;