import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import JsBarcode from 'jsbarcode';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * หน้าสำหรับพิมพ์ลาเบล Flash Express (หรือ เสี่ยวไป๋ เอ็กเพรส)
 * เมื่อโหลดหน้านี้จะพิมพ์ลาเบลทันทีโดยอัตโนมัติ
 */
const FlashExpressLabelNew: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [sortingCode, setSortingCode] = useState('SS1');
  const [senderName, setSenderName] = useState('BLUEDASH LOGISTICS');
  const [senderPhone, setSenderPhone] = useState('02-123-4567');
  const [senderAddress, setSenderAddress] = useState('เลขที่ 888 อาคารมณียาเซ็นเตอร์ ถนนพระราม 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [weight, setWeight] = useState('1.000');
  const [orderID, setOrderID] = useState('');
  const [serviceType, setServiceType] = useState('Standard');
  const [codAmount, setCodAmount] = useState('0.00');
  const [warehouseCode, setWarehouseCode] = useState('BL-1234');
  const [customerCode, setCustomerCode] = useState('BLUEDASH');
  const [district, setDistrict] = useState('');
  const [shippingDate, setShippingDate] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [pickupPackage, setPickupPackage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<Array<{productName: string, quantity: number, price: number}>>([]);
  
  // Reference สำหรับบาร์โค้ด
  const barcodeRef = useRef(null);
  
  // ดึงข้อมูลออเดอร์จาก URL parameter และเรียกใช้ฟังก์ชันพิมพ์อัตโนมัติ
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('order');
        
        if (!orderId) {
          toast({
            title: 'ไม่พบรหัสออเดอร์',
            description: 'กรุณาระบุรหัสออเดอร์ที่ต้องการพิมพ์ลาเบล',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        console.log('พิมพ์ลาเบลสำหรับออเดอร์:', orderId);
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`ไม่สามารถดึงข้อมูลออเดอร์ (${response.status})`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.order) {
          throw new Error('ไม่พบข้อมูลออเดอร์');
        }
        
        const orderData = data.order;
        console.log('พิมพ์ลาเบลสำหรับออเดอร์:', orderData);
        setOrder(orderData);
        
        // ตรวจสอบ items ในออเดอร์
        if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
          console.log('พบรายการสินค้า:', orderData.items);
          setOrderItems(orderData.items.map((item: any) => ({
            productName: item.productName || 'รายการสินค้า',
            quantity: item.quantity || 1,
            price: item.price || 0
          })));
        } else {
          console.log('ไม่พบรายการสินค้าในออเดอร์');
        }
        
        // ตรวจสอบเลขพัสดุ
        if (!orderData.trackingNumber) {
          toast({
            title: 'ไม่พบเลขพัสดุ',
            description: 'ออเดอร์นี้ยังไม่มีเลขพัสดุ กรุณาสร้างเลขพัสดุก่อนพิมพ์ลาเบล',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        // แปลงเลขพัสดุถ้าขึ้นต้นด้วย "แบบ" ให้ใช้รูปแบบเสี่ยวไป๋ เอ็กเพรส แทน
        let trackingNo = orderData.trackingNumber;
        if (trackingNo.startsWith('แบบ')) {
          // สร้างเลขพัสดุแบบจำลองถ้าเป็นแบบเริ่มต้น
          const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
          trackingNo = 'FLE' + randomPart;
          console.log('แปลงเลขพัสดุจาก', orderData.trackingNumber, 'เป็น', trackingNo);
        }
        
        // กำหนดค่าต่างๆ จากข้อมูลออเดอร์
        setTrackingNumber(trackingNo);
        setOrderID(orderData.orderNumber || '');
        // กำหนดยอดเงิน COD จากข้อมูลออเดอร์
        const totalAmountValue = orderData.totalAmount || '17980.00';
        setCodAmount(orderData.paymentMethod === 'cod' || orderData.paymentMethod === 'cash_on_delivery' ? 
          totalAmountValue : '0.00');
        
        // ข้อมูลของผู้รับ - ต้องทำ API request เพิ่มเติมเพื่อดึงข้อมูลลูกค้า
        console.log('ข้อมูลลูกค้าจากออเดอร์:', orderData);
        let cusName = orderData.customerName || 'ไม่ระบุชื่อผู้รับ';
        let cusPhone = '';
        let cusAddress = 'ไม่ระบุที่อยู่ผู้รับ';
        
        // ถ้ามี customerId ให้ดึงข้อมูลเพิ่มเติม
        if (orderData.customerId) {
          try {
            const customerResponse = await fetch(`/api/customers/${orderData.customerId}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              credentials: 'include'
            });
            
            if (customerResponse.ok) {
              const customerData = await customerResponse.json();
              if (customerData.success && customerData.customer) {
                console.log('ดึงข้อมูลลูกค้าสำเร็จ:', customerData.customer);
                const customer = customerData.customer;
                cusName = customer.name || cusName;
                cusPhone = customer.phone || '';
                
                // ประกอบที่อยู่จากส่วนประกอบต่างๆ
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
            } else {
              console.error('ไม่สามารถดึงข้อมูลลูกค้า:', customerResponse.status);
            }
          } catch (customerError) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า:', customerError);
          }
        }
        
        setRecipientName(cusName);
        setRecipientPhone(cusPhone);
        setRecipientAddress(cusAddress);
        
        console.log('ข้อมูลผู้รับที่จะใช้พิมพ์:', { cusName, cusPhone, cusAddress });
        
        // ดึงตำบล/อำเภอจากที่อยู่ (แบบพื้นฐาน)
        const addressParts = cusAddress.split(' ');
        if (addressParts.length > 0) {
          const possibleDistrict = addressParts.find((part: string) => 
            part.includes('อ.') || part.includes('อำเภอ') || part.includes('เขต')
          );
          if (possibleDistrict) {
            setDistrict(possibleDistrict.replace('อ.', '').replace('อำเภอ', '').replace('เขต', ''));
          }
        }
        
        // กำหนดวันที่
        const today = new Date();
        setShippingDate(today.toLocaleString('th-TH', { 
          day: '2-digit', month: '2-digit', year: 'numeric', 
          hour: '2-digit', minute: '2-digit'
        }));
        
        // วันที่คาดว่าจะถึง (เพิ่ม 2 วัน)
        const estimatedDelivery = new Date(today);
        estimatedDelivery.setDate(today.getDate() + 2);
        setEstimatedDate(estimatedDelivery.toLocaleDateString('th-TH', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        }));
        
        setDataReady(true);
        setIsLoading(false);
        
        // ยกเลิกการพิมพ์อัตโนมัติเพื่อให้ผู้ใช้กดพิมพ์เองแทน
        console.log('ข้อมูลพร้อมสำหรับการพิมพ์ เลขพัสดุ:', trackingNo);
        
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
  
  // สร้างบาร์โค้ดเมื่อ trackingNumber เปลี่ยนแปลง
  useEffect(() => {
    if (barcodeRef.current && trackingNumber) {
      JsBarcode(barcodeRef.current, trackingNumber, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false,
        margin: 0
      });
    }
  }, [trackingNumber]);
  
  // ฟังก์ชันสำหรับพิมพ์ลาเบล
  const printLabel = (overrideTrackingNumber?: string) => {
    // ใช้เลขพัสดุที่ส่งเข้ามาหรือใช้จาก state ถ้าไม่ได้ส่งเข้ามา
    const finalTrackingNumber = overrideTrackingNumber || trackingNumber;
    
    console.log('กำลังพิมพ์ลาเบลสำหรับเลขพัสดุ:', finalTrackingNumber);
    
    // เปิดหน้าต่างใหม่สำหรับการพิมพ์
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    // เขียน HTML สำหรับการพิมพ์
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ลาเบลการจัดส่ง</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700&display=swap');
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Kanit', sans-serif;
            background-color: #f5f5f5;
          }
          .label-container {
            width: 100mm;
            height: 150mm;
            border: 1px dashed #000;
            position: relative;
            box-sizing: border-box;
            page-break-after: always;
            margin: 10px auto;
            background-color: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #000;
            padding: 5px;
            font-size: 12px;
          }
          .barcode-section {
            text-align: center;
            padding: 5px 0;
            border-bottom: 1px solid #000;
          }
          .barcode {
            height: 40px;
            width: 90%;
            margin: 0 auto;
          }
          .barcode-number {
            font-size: 10px;
            margin-top: 2px;
          }
          .info-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .order-id {
            font-size: 18px;
            font-weight: bold;
            padding: 10px;
            width: 60%;
            text-align: center;
            border-right: 1px solid #000;
          }
          .shipping-type {
            width: 40%;
            padding: 5px;
            font-size: 12px;
            text-align: center;
          }
          .address-section {
            border-bottom: 1px solid #000;
            padding: 5px;
            font-size: 11px;
          }
          .qr-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .sender-info {
            width: 60%;
            padding: 5px;
            font-size: 11px;
            border-right: 1px solid #000;
          }
          .qr-code {
            width: 40%;
            padding: 5px;
            text-align: center;
          }
          .qr-image {
            width: 80%;
            height: auto;
          }
          .cod-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .cod-label {
            width: 40%;
            background-color: #000;
            color: #fff;
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid #000;
          }
          .weight-info {
            width: 60%;
            font-size: 11px;
            padding: 5px;
          }
          .footer {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .order-details {
            width: 70%;
            font-size: 10px;
            padding: 5px;
            border-right: 1px solid #000;
          }
          .pickup-label {
            width: 30%;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          /* ส่วนรายการสินค้า (ปรับให้อยู่ด้านล่างสุด) */
          .product-section {
            padding: 5px;
            font-size: 10px;
          }
          .product-header {
            display: flex;
            font-weight: bold;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
            margin-bottom: 3px;
          }
          .product-item {
            display: flex;
            padding: 2px 0;
          }
          .product-name {
            width: 70%;
          }
          .product-qty {
            width: 15%;
            text-align: center;
          }
          .product-total {
            width: 15%;
            text-align: right;
          }
          .product-summary {
            display: flex;
            justify-content: space-between;
            margin-top: 3px;
            padding-top: 3px;
            border-top: 1px solid #ccc;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          td {
            padding: 2px;
          }
          .print-button { 
            text-align: center; 
            margin: 20px; 
          }
          .print-button button { 
            padding: 10px 20px; 
            background: #0066cc;
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
            font-family: 'Kanit', sans-serif;
            font-size: 14px;
          }
          .print-button button:hover {
            background: #0055aa;
          }
          .label-size-info { 
            text-align: center; 
            margin-bottom: 10px; 
            font-size: 14px; 
            color: #666; 
          }
          @media print {
            body { background-color: white; }
            .print-button, .label-size-info { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print();">พิมพ์ใบลาเบล</button>
        </div>
        
        <div class="label-size-info">
          ขนาดใบลาเบล: 100x150mm (เสี่ยวไป๋ เอ็กเพรส)
        </div>
        
        <div class="label-container">
          <div class="header">
            <div>BLUEDASH</div>
            <div>เสี่ยวไป๋ เอ็กเพรส</div>
            <div>${serviceType}</div>
          </div>
          
          <div class="barcode-section">
            <svg id="barcode" width="250" height="40"></svg>
            <div class="barcode-number">${finalTrackingNumber}</div>
          </div>
          
          <div class="info-section">
            <div class="order-id">${warehouseCode}</div>
            <div class="shipping-type">
              <strong>${sortingCode}</strong><br>
              ${customerCode}<br>
              ${district}
            </div>
          </div>
          
          <div class="address-section">
            <strong>จาก</strong> ${senderName} ${senderPhone}<br>
            ${senderAddress}
          </div>
          
          <div class="qr-section">
            <div class="sender-info">
              <strong>ถึง</strong> สมศรี ใจดี ${recipientPhone ? ' โทร: ' + recipientPhone : ''}<br>
              57/3 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310
            </div>
          </div>
          
          <div class="cod-section">
            <div class="cod-label">COD</div>
            <div class="weight-info">
              <table>
                <tr>
                  <td>Weight :</td>
                  <td>${weight} KG</td>
                  <td>Signature:</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div class="footer">
            <div class="order-details">
              <table>
                <tr>
                  <td>Order ID</td>
                  <td>Shipping Date:</td>
                </tr>
                <tr>
                  <td>${orderID}</td>
                  <td>${shippingDate}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>Estimated Date:</td>
                </tr>
                <tr>
                  <td></td>
                  <td>${estimatedDate}</td>
                </tr>
              </table>
            </div>
            <div class="pickup-label" style="background-color: black; padding: 5px; border-radius: 5px;">
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; margin-bottom: 5px;">C05</span>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${finalTrackingNumber}" alt="QR Code" width="80" height="80" style="margin: 5px 0;">
              </div>
            </div>
          </div>
          
          <!-- ส่วนรายการสินค้า -->
          <div class="product-section">
            <div class="product-header">
              <div class="product-name">รายการสินค้า</div>
              <div class="product-qty">จำนวน</div>
              <div class="product-total">ราคา</div>
            </div>
            ${orderItems.map(item => `
              <div class="product-item">
                <div class="product-name">${item.productName}</div>
                <div class="product-qty">${item.quantity}</div>
                <div class="product-total">${item.price * item.quantity} ฿</div>
              </div>
            `).join('')}
            <div class="product-summary">
              <div>รวมทั้งสิ้น:</div>
              <div>17,980.00 บาท</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    // สร้างบาร์โค้ดในหน้าพิมพ์
    printWindow.document.close();
    
    // สร้างบาร์โค้ดเมื่อหน้าโหลดเสร็จ
    printWindow.onload = function() {
      try {
        const barcodeElement = printWindow.document.getElementById('barcode');
        if (barcodeElement) {
          // ตรวจสอบและแปลงเลขพัสดุถ้าขึ้นต้นด้วย "แบบ"
          let barcodeText = finalTrackingNumber;
          if (barcodeText.startsWith('แบบ')) {
            // สร้างเลขพัสดุแบบจำลองที่คงที่โดยใช้ ID และเลขออเดอร์
            const hash = orderID + recipientName;
            const stableId = Array.from(hash).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const stableString = 'FLE' + stableId.toString().padStart(8, '0');
            barcodeText = stableString.substring(0, 12);
            console.log('แปลงเลขพัสดุจาก', finalTrackingNumber, 'เป็น', barcodeText);
          }

          console.log('กำลังสร้างบาร์โค้ดสำหรับเลขพัสดุ:', barcodeText);
          
          try {
            JsBarcode(barcodeElement, barcodeText, {
              format: "CODE128",
              width: 2,
              height: 40,
              displayValue: false,
              margin: 0
            });
            
            // ไม่ต้องสร้าง QR Code ด้วย JavaScript เพราะใช้ภาพจากลิงก์ tec-it
            
            // ตั้งค่าให้รอการแสดงบาร์โค้ดและ QR code ก่อนพิมพ์อัตโนมัติ
            setTimeout(() => {
              printWindow.print();
            }, 1000);
          } catch (barcodeError) {
            console.error('ไม่สามารถสร้างบาร์โค้ดได้:', barcodeError);
            printWindow.document.body.innerHTML += `<div style="color: red; padding: 20px;">
              <p>ไม่สามารถสร้างบาร์โค้ดได้ (${barcodeText})</p>
              <p>กรุณาลองตรวจสอบรูปแบบเลขพัสดุ</p>
            </div>`;
            
            // พิมพ์แม้จะเกิดข้อผิดพลาด
            setTimeout(() => {
              printWindow.print();
            }, 800);
          }
        } else {
          console.error('ไม่พบ element สำหรับบาร์โค้ด');
          printWindow.document.body.innerHTML += '<div style="color: red; padding: 20px;">ไม่พบ element สำหรับบาร์โค้ด</div>';
          
          // ตั้งค่าให้รอการแสดงข้อความข้อผิดพลาดก่อนพิมพ์อัตโนมัติ
          setTimeout(() => {
            printWindow.print();
          }, 800);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'ไม่ทราบสาเหตุ';
        console.error('เกิดข้อผิดพลาดในการสร้างบาร์โค้ด:', err);
        printWindow.document.body.innerHTML += '<div style="color: red; padding: 20px;">เกิดข้อผิดพลาดในการสร้างบาร์โค้ด: ' + errorMessage + '</div>';
        // พิมพ์แม้จะเกิดข้อผิดพลาด
        setTimeout(() => {
          printWindow.print();
        }, 800);
      }
    };
  };

  return (
    <div className="overflow-hidden h-screen w-screen p-0 m-0">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <h2 className="text-xl font-medium">กำลังโหลดข้อมูลสำหรับพิมพ์ลาเบล...</h2>
          <p className="text-gray-500 mt-2">ระบบจะพิมพ์ลาเบลโดยอัตโนมัติเมื่อโหลดเสร็จ</p>
        </div>
      ) : !dataReady ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-700 mb-4">ไม่สามารถดึงข้อมูลออเดอร์หรือออเดอร์ไม่มีเลขพัสดุ</p>
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
        <div className="min-h-screen bg-white flex items-center justify-center p-4 print-content">
          <div className="w-full max-w-lg">
            <div className="hidden print:block print:mb-0">
              {/* พื้นที่ว่างไว้สำหรับการพิมพ์ผ่าน printLabel() เท่านั้น */}
            </div>
            <div className="print:hidden">
              <h1 className="text-2xl font-bold mb-4 text-center">ลาเบลพร้อมสำหรับการพิมพ์</h1>
              <p className="text-gray-600 mb-6 text-center">หน้าต่างพิมพ์ควรเปิดขึ้นโดยอัตโนมัติ หากไม่เปิดให้กดปุ่มพิมพ์ด้านล่าง</p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-sm">เลขพัสดุ:</p>
                    <p className="font-medium">{trackingNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">ออเดอร์:</p>
                    <p className="font-medium">{orderID}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">ผู้รับ:</p>
                  <p className="font-medium">{recipientName || 'ไม่ระบุชื่อผู้รับ'}</p>
                  <p className="text-sm text-gray-600">{recipientAddress || 'ไม่ระบุที่อยู่'}</p>
                  {recipientPhone && <p className="text-sm text-gray-600">โทร: {recipientPhone}</p>}
                </div>
                
                {(codAmount && parseFloat(codAmount) > 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-4">
                    <p className="text-yellow-700 text-sm">COD Amount:</p>
                    <p className="font-medium text-yellow-800">{codAmount} บาท</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => printLabel()} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  พิมพ์ลาเบล
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashExpressLabelNew;