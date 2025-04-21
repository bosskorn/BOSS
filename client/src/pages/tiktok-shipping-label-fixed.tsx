import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

/**
 * หน้านี้เป็นเวอร์ชันแก้ไขของ TikTok Shipping Label ที่แสดงลาเบลทันทีโดยไม่ต้องแสดงรายละเอียดก่อน
 * และไม่พึ่งพาการยืนยันตัวตน
 */
const TikTokShippingLabelFixed: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // ตั้งค่าเริ่มต้น
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [sortCode, setSortCode] = useState('SS1');
  const [senderName, setSenderName] = useState('JSB Candy');
  const [senderPhone, setSenderPhone] = useState('(+66)0836087712');
  const [senderAddress, setSenderAddress] = useState('24 ซอยนาคนิวาส ซอย 8 แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพ 10160');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [weight, setWeight] = useState('4.000');
  const [orderIdFull, setOrderIdFull] = useState('');
  const [shippingDate, setShippingDate] = useState((new Date()).toLocaleDateString('th-TH') + ' ' + (new Date()).toLocaleTimeString('th-TH'));
  const [products, setProducts] = useState<OrderItem[]>([
    { name: 'คุกกี้เนยสด', quantity: 1, price: 250 }
  ]);
  const [codAmount, setCodAmount] = useState(0);

  // โหลดข้อมูลออเดอร์จาก URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('order');
    
    if (orderParam) {
      // เมื่อมีการเรียกโดยใช้ parameter order ให้โหลดข้อมูลและพิมพ์ลาเบลทันที
      loadOrderData(orderParam).then((success) => {
        // ถ้าโหลดข้อมูลสำเร็จ ให้พิมพ์ทันที
        if (success) {
          setTimeout(() => {
            printLabel();
          }, 500);
        }
      });
    }
  }, []);

  // ฟังก์ชันโหลดข้อมูลออเดอร์โดยไม่ใช้ตรวจสอบ Authentication
  const loadOrderData = async (orderId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // มี token หรือไม่ก็ได้
      const token = localStorage.getItem('auth_token') || '';
      
      // ทดลองเรียกข้อมูลออเดอร์
      let orderResponse;
      try {
        orderResponse = await fetch(`/api/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          credentials: 'include'
        });
      } catch (error) {
        console.log('Failed to fetch order data, using default values', error);
      }
      
      // ถ้าเรียกข้อมูลสำเร็จ
      if (orderResponse && orderResponse.ok) {
        const data = await orderResponse.json();
        
        if (data.success && (data.order || data.data)) {
          const order = data.order || data.data;
          
          if (order) {
            // ตั้งค่าข้อมูลลาเบลจากข้อมูลออเดอร์
            console.log('Loaded order data:', order);
            
            if (order.trackingNumber) setTrackingNumber(order.trackingNumber);
            if (order.orderNumber) setOrderId(order.orderNumber);
            setOrderIdFull(order.id.toString());
            
            // ตั้งค่ายอด COD
            if (order.totalAmount && order.paymentMethod === 'cash_on_delivery') {
              setCodAmount(parseFloat(order.totalAmount));
            }
            
            // ดึงข้อมูลลูกค้า
            let customerResponse;
            try {
              if (order.customerId) {
                customerResponse = await fetch(`/api/customers/${order.customerId}`, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                  },
                  credentials: 'include'
                });
              }
            } catch (error) {
              console.log('Failed to fetch customer data, using order data instead', error);
            }
            
            if (customerResponse && customerResponse.ok) {
              const customerData = await customerResponse.json();
              
              if (customerData.success && customerData.customer) {
                const customer = customerData.customer;
                
                // ใช้ข้อมูลลูกค้าที่ดึงมาได้
                if (customer.name) setRecipientName(customer.name);
                if (customer.phone) setRecipientPhone(customer.phone);
                
                // สร้างที่อยู่ลูกค้า
                const addressParts = [];
                if (customer.address) addressParts.push(customer.address);
                if (customer.subdistrict) addressParts.push(customer.subdistrict);
                if (customer.district) addressParts.push(customer.district);
                if (customer.province) addressParts.push(customer.province);
                if (customer.zipcode) addressParts.push(customer.zipcode);
                
                setRecipientAddress(addressParts.join(', '));
              }
            } else {
              // ใช้ข้อมูลจากออเดอร์แทน
              if (order.recipientName || order.customerName) {
                setRecipientName(order.recipientName || order.customerName);
              }
              
              if (order.recipientPhone || order.customerPhone) {
                setRecipientPhone(order.recipientPhone || order.customerPhone);
              }
              
              // สร้างที่อยู่ผู้รับ
              const addressParts = [];
              if (order.recipientAddress || order.customerAddress) {
                addressParts.push(order.recipientAddress || order.customerAddress);
              }
              if (order.recipientSubdistrict || order.customerSubdistrict) {
                addressParts.push(order.recipientSubdistrict || order.customerSubdistrict);
              }
              if (order.recipientDistrict || order.customerDistrict) {
                addressParts.push(order.recipientDistrict || order.customerDistrict);
              }
              if (order.recipientProvince || order.customerProvince) {
                addressParts.push(order.recipientProvince || order.customerProvince);
              }
              if (order.recipientZipCode || order.customerZipcode) {
                addressParts.push(order.recipientZipCode || order.customerZipcode);
              }
              
              setRecipientAddress(addressParts.join(', '));
            }
            
            // วันที่สร้างออเดอร์
            if (order.createdAt) {
              const date = new Date(order.createdAt);
              setShippingDate(date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH'));
            }
            
            // น้ำหนัก
            if (order.weight) setWeight(order.weight.toString());
            
            // ดึงข้อมูลสินค้า
            try {
              const itemsResponse = await fetch(`/api/orders/${orderId}/items`, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Authorization': token ? `Bearer ${token}` : '',
                },
                credentials: 'include'
              });
              
              if (itemsResponse.ok) {
                const itemsData = await itemsResponse.json();
                if (itemsData.success && itemsData.items && itemsData.items.length > 0) {
                  // แปลงข้อมูลสินค้าเป็นรูปแบบที่ต้องการ
                  const formattedItems = itemsData.items.map((item: any) => ({
                    name: item.productName || 'คุกกี้เนยสด',
                    quantity: item.quantity || 1,
                    price: parseFloat(item.price) || 250
                  }));
                  
                  setProducts(formattedItems);
                } else {
                  // ไม่พบข้อมูลสินค้า ใช้ข้อมูลตั้งต้น
                  setProducts([
                    { name: 'คุกกี้เนยสด', quantity: 1, price: 250 }
                  ]);
                }
              }
            } catch (error) {
              console.log('Failed to fetch item data, using default values', error);
              // เซ็ตข้อมูลสินค้าเริ่มต้น
              setProducts([
                { name: 'คุกกี้เนยสด', quantity: 1, price: 250 }
              ]);
            }
            
            // แสดงข้อความสำเร็จ
            toast({
              title: 'โหลดข้อมูลสำเร็จ',
              description: `โหลดข้อมูลออเดอร์ ${order.orderNumber} เรียบร้อยแล้ว`,
            });
            
            setIsLoading(false);
            return true;
          }
        }
      } else {
        // ถ้าไม่สามารถโหลดข้อมูลได้ ใช้ข้อมูลเริ่มต้น
        console.log('Using default order data');
        setTrackingNumber('THT64141T9NYG7Z');
        setOrderId('21S-38041-02');
        setOrderIdFull('5785159668395229951');
        setRecipientName('สิริรัตน์ ดำเกิด');
        setRecipientPhone('(+66)9*******25');
        setRecipientAddress('ร้านสามสุข 101/3 ม.1 ตำบลสิชล อ.สิชล จ.นครศรีธรรมราช, สิชล, นครศรีธรรมราช, 80120');
        setProducts([
          { name: 'คุกกี้เนยสด', quantity: 1, price: 250 }
        ]);
        setCodAmount(250);
        
        toast({
          title: 'ใช้ข้อมูลเริ่มต้น',
          description: 'ไม่สามารถโหลดข้อมูลออเดอร์ได้ ใช้ข้อมูลเริ่มต้นแทน',
        });
      }
    } catch (error) {
      console.error('Error loading order data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลออเดอร์ได้',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
    return false;
  };

  // คำนวณยอดรวม
  const totalAmount = products.reduce((sum, product) => sum + product.price * product.quantity, 0);

  // พิมพ์ลาเบล
  const printLabel = () => {
    // เปิดหน้าต่างใหม่สำหรับพิมพ์ลาเบล
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('โปรดอนุญาตให้เปิดหน้าต่างป๊อปอัพเพื่อพิมพ์ลาเบล');
      return;
    }

    // ตั้งค่า HTML และ CSS สำหรับการพิมพ์
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ลาเบลการจัดส่ง TikTok Shop - ${orderId || 'ไม่ระบุ'}</title>
        <style>
          @page {
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Kanit', 'Sarabun', Arial, sans-serif;
          }
          .label-container {
            border: 1px solid #000;
            position: relative;
            box-sizing: border-box;
            page-break-after: always;
            font-size: 10px;
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
          .barcode-element-container {
            width: 100%;
            height: 40px;
            margin: 0 auto;
          }
          .tracking-number {
            font-size: 14px;
            text-align: center;
            margin-top: 3px;
            font-family: monospace;
            letter-spacing: 1px;
          }
          .info-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .order-id {
            font-size: 16px;
            font-weight: bold;
            padding: 5px;
            width: 60%;
            text-align: center;
            border-right: 1px solid #000;
          }
          .shipping-type {
            width: 40%;
            padding: 5px;
            font-size: 11px;
            text-align: center;
          }
          .sender-section {
            border-bottom: 1px solid #000;
            padding: 5px;
            font-size: 11px;
          }
          .recipient-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .recipient-info {
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
          .cod-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .cod-label {
            width: 25%;
            background-color: #000;
            color: #fff;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid #000;
          }
          .weight-info {
            width: 75%;
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
          .product-section {
            padding: 5px;
            font-size: 10px;
          }
          .product-header {
            font-weight: bold;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
            margin-bottom: 3px;
          }
          .product-item {
            padding: 2px 0;
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
            margin: 20px 0;
          }
          .print-button button {
            padding: 10px 20px;
            background: #0078D7;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            font-family: 'Kanit', 'Sarabun', Arial, sans-serif;
          }
          @media print {
            body { margin: 0; }
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print();">พิมพ์ลาเบล</button>
        </div>

        <div class="label-container">
          <div class="header">
            <div>TikTok Shop</div>
            <div>FLASH</div>
            <div>Standard</div>
          </div>

          <div class="barcode-section">
            <div class="barcode-element-container">
              <svg class="barcode-element" id="barcode"></svg>
            </div>
            <div class="tracking-number">${trackingNumber || 'THT64141T9NYG7Z'}</div>
          </div>

          <div class="info-section">
            <div class="order-id">${orderId || '21S-38041-02'}</div>
            <div class="shipping-type">
              <strong>${sortCode}</strong><br>
              2TPY_BDC-หน<br>
              พร้อม
            </div>
          </div>

          <div class="sender-section">
            <strong>จาก</strong> ${senderName} ${senderPhone}<br>
            ${senderAddress}
          </div>

          <div class="recipient-section">
            <div class="recipient-info">
              <strong>ถึง</strong> ${recipientName || 'สิริรัตน์ ดำเกิด'} ${recipientPhone || '(+66)9*******25'}<br>
              ${recipientAddress || 'ร้านสามสุข 101/3 ม.1 ตำบลสิชล อ.สิชล จ.นครศรีธรรมราช, สิชล, นครศรีธรรมราช, 80120'}
            </div>
            <div class="qr-code">
              <div id="qrcode"></div>
            </div>
          </div>

          <div class="cod-section">
            <div class="cod-label">COD</div>
            <div class="weight-info">
              <table>
                <tr>
                  <td>Weight :</td>
                  <td>${weight} KG</td>
                  <td>COD Amount :</td>
                  <td>${codAmount || totalAmount || '250'} บาท</td>
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
                  <td>${orderIdFull || '5785159668395229951'}</td>
                  <td>${shippingDate}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>Estimated Date:</td>
                </tr>
              </table>
            </div>
            <div class="pickup-label">PICK-UP</div>
          </div>

          <div class="product-section">
            <div class="product-header">รายการสินค้า / จำนวน / ราคา</div>
            ${products.map(product => `
              <div class="product-item">
                ${product.name || 'คุกกี้เนยสด'} x${product.quantity || 1} (${product.price || 250} บาท)
              </div>
            `).join('')}
            <div class="product-summary">
              <div>รวมทั้งสิ้น:</div>
              <div>${totalAmount || 250} บาท</div>
            </div>
          </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
        <script type="text/javascript">
          // ฟังก์ชันสร้างบาร์โค้ด
          window.onload = function() {
            try {
              // สร้างบาร์โค้ด
              JsBarcode("#barcode", "${trackingNumber || 'THT64141T9NYG7Z'}", {
                format: "CODE128",
                lineColor: "#000",
                width: 1.3,
                height: 40,
                displayValue: false,
                margin: 0
              });
              
              // สร้าง QR Code
              new QRCode(document.getElementById("qrcode"), {
                text: "${trackingNumber || 'THT64141T9NYG7Z'}",
                width: 80,
                height: 80
              });
              
              // พิมพ์อัตโนมัติหลังจากโหลดเสร็จและสร้างบาร์โค้ดเสร็จ
              setTimeout(function() {
                window.print();
              }, 800);
            } catch(error) {
              console.error("Error generating barcode:", error);
              alert("เกิดข้อผิดพลาดในการสร้างบาร์โค้ด: " + error.message);
            }
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  // เนื่องจากเป็นหน้าที่แสดงลาเบลทันที จึงไม่ต้องมี UI ให้แสดง
  return (
    <div className="hidden">
      {/* ไม่ต้องแสดง UI เนื่องจากจะแสดงลาเบลทันที */}
    </div>
  );
};

export default TikTokShippingLabelFixed;