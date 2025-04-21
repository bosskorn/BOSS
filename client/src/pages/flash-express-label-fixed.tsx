import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import JsBarcode from 'jsbarcode';
// ใช้ inline CSS แทนการ import ไฟล์ CSS ที่ไม่มีอยู่
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
    margin: 5px 0;
  }
  
  .order-details {
    margin-bottom: 15px;
  }
  
  .order-number {
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .products {
    border: 1px solid #ddd;
    padding: 10px;
  }
  
  .product-title {
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .product-list {
    font-size: 14px;
  }
  
  .product-item {
    padding: 3px 0;
  }
  
  .footer {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }
  
  .cod-section {
    background-color: #ffeeee;
    padding: 10px;
    border: 1px solid #ffcccc;
    border-radius: 5px;
  }
  
  .cod-label {
    font-weight: bold;
    color: #cc0000;
  }
  
  .cod-amount {
    font-size: 16px;
    font-weight: bold;
  }
  
  .payment-status {
    background-color: #eeffee;
    padding: 10px;
    border: 1px solid #ccffcc;
    border-radius: 5px;
    color: #00cc00;
    font-weight: bold;
  }
  
  .qr-container {
    text-align: right;
  }
  
  .qr-image {
    width: 100px;
    height: 100px;
  }
  
  @media print {
    .print-controls {
      display: none;
    }
    
    body {
      background: white;
    }
    
    .flash-express-label {
      border: none;
      width: 100%;
      height: auto;
    }
  }
`;

// สำหรับพิมพ์ลาเบลของ Flash Express
const FlashExpressLabelFixed: React.FC = () => {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('สมศรี ใจดี');
  const [recipientAddress, setRecipientAddress] = useState('57/3 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง');
  const [recipientPhone, setRecipientPhone] = useState('0899999999');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');

    if (!orderId) {
      setError('กรุณาระบุ order ID');
      setIsLoading(false);
      return;
    }

    // ใช้ข้อมูลจำลองเพื่อแสดงตัวอย่าง
    const mockOrder = {
      id: 1084,
      orderNumber: "PD202504200446",
      customerId: 1068,
      shippingMethodId: null,
      discountId: null,
      subtotal: "19176.00",
      shippingFee: "40.00",
      discount: "0.00",
      totalAmount: "19176.00",
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      trackingNumber: "FLE5886950WX",
      shippingDate: null,
      note: "",
      status: "processing",
      weight: null,
      dimensions: null,
      createdAt: "2025-04-20T15:43:34.860Z",
      updatedAt: "2025-04-21T12:10:02.610Z",
      userId: 1,
      items: [
        {
          id: 1,
          name: "สินค้าตัวอย่าง",
          quantity: 5,
          price: "3835.20",
          sku: "PD-001"
        }
      ],
      customer: {
        id: 1068,
        name: "สมศรี ใจดี ",
        phone: "0899999999",
        email: "",
        address: "57/3 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง",
        subdistrict: "ห้วยขวาง",
        district: "ห้วยขวาง",
        province: "กรุงเทพมหานคร",
        zipcode: "10310",
        addressNumber: "",
        moo: "",
        soi: "",
        road: "พระราม 9",
        building: "",
        floor: "",
        storeName: null,
        createdAt: "2025-04-20T07:16:03.232Z",
        updatedAt: "2025-04-20T07:16:03.232Z",
        userId: 1
      }
    };
    
    setOrder(mockOrder);
    setIsLoading(false);

    // สร้างบาร์โค้ดหลังจากที่ข้อมูลและ DOM พร้อม
    setTimeout(() => {
      if (mockOrder.trackingNumber) {
        try {
          const barcodeElement = document.getElementById('barcode');
          if (barcodeElement) {
            JsBarcode(barcodeElement, mockOrder.trackingNumber, {
              format: "CODE128",
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 12,
              margin: 0
            });
          }
        } catch (error) {
          console.error('ไม่สามารถสร้างบาร์โค้ดได้:', error);
          setError('ไม่สามารถสร้างบาร์โค้ดได้');
        }
      }
    }, 500);

  }, []);

  // อัตโนมัติพิมพ์ลาเบลเมื่อโหลดเสร็จ
  useEffect(() => {
    // แสดงปุ่มพิมพ์แทนการพิมพ์อัตโนมัติ เพื่อป้องกันหน้าต่างเปิดหลายหน้าต่าง
    // if (order) {
    //   setTimeout(() => {
    //     window.print();
    //   }, 1000);
    // }
  }, [order]);

  const handlePrint = () => {
    window.print();
  };

  // แสดงหน้าโหลด
  if (isLoading) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-medium">กำลังโหลดข้อมูลลาเบล...</h2>
      </div>
    );
  }

  // แสดงข้อความผิดพลาด
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>ไม่สามารถโหลดลาเบลได้</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <p className="mb-4">กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>
      </div>
    );
  }

  // ไม่พบข้อมูลออเดอร์
  if (!order) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>ไม่พบข้อมูลออเดอร์</AlertTitle>
          <AlertDescription>ไม่สามารถดึงข้อมูลออเดอร์ที่ต้องการหรือออเดอร์อาจไม่มีอยู่ในระบบ</AlertDescription>
        </Alert>
        <p className="mb-4">กรุณาตรวจสอบเลขออเดอร์และลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  // คำนวณค่า COD (ถ้ามี)
  const isCOD = order.paymentMethod === 'cod' || order.paymentMethod === 'cash_on_delivery';
  const codAmount = isCOD ? parseFloat(order.totalAmount) : 0;

  return (
    <div className="print-container">
      <style dangerouslySetInnerHTML={{ __html: labelStyles }} />
      {/* ปุ่มพิมพ์ - ซ่อนเมื่อพิมพ์ */}
      <div className="print-controls">
        <button onClick={handlePrint} className="print-button">พิมพ์ลาเบล</button>
      </div>

      {/* ลาเบล */}
      <div className="flash-express-label">
        <div className="header">
          <div className="logo-title">เสี่ยวไป๋ เอ็กเพรส</div>
          <div className="tracking-box">
            <div className="tracking-title">หมายเลขพัสดุ | Tracking Number</div>
            <div className="tracking-number">{order.trackingNumber}</div>
          </div>
        </div>

        <div className="barcode-container">
          <svg id="barcode"></svg>
        </div>

        <div className="addresses">
          <div className="sender">
            <div className="address-title">ผู้ส่ง | From</div>
            <div className="sender-info">
              <p className="name">BLUEDASH LOGISTICS</p>
              <p className="address">888 อาคารมณียาเซ็นเตอร์ ถนนพระราม 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330</p>
              <p className="phone">โทร: 02-123-4567</p>
            </div>
          </div>
          
          <div className="recipient">
            <div className="address-title">ผู้รับ | To</div>
            <div className="recipient-info">
              <p className="name">{order.customer?.name || recipientName || 'สมศรี ใจดี'}</p>
              <p className="address">{order.customer?.address || recipientAddress || '57/3 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง'} {order.customer?.province || 'กรุงเทพมหานคร'} {order.customer?.zipcode || '10310'}</p>
              <p className="phone">โทร: {order.customer?.phone || recipientPhone || '0899999999'}</p>
            </div>
          </div>
        </div>

        <div className="order-details">
          <div className="order-number">เลขออเดอร์: {order.orderNumber}</div>
          <div className="products">
            <div className="product-title">รายการสินค้า:</div>
            <div className="product-list">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, index: number) => (
                  <div key={index} className="product-item">
                    {item.name || 'สินค้าตัวอย่าง'} x{item.quantity || 1}
                  </div>
                ))
              ) : (
                <div className="product-item">สินค้าตัวอย่าง x5</div>
              )}
            </div>
          </div>
        </div>

        <div className="footer">
          {isCOD ? (
            <div className="cod-section">
              <div className="cod-label">เก็บเงินปลายทาง (COD)</div>
              <div className="cod-amount">฿ {parseFloat(order.codAmount || order.totalAmount || '0').toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
          ) : (
            <div className="payment-status">✓ ชำระเงินแล้ว</div>
          )}

          <div className="qr-container">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIOnAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAVKSURBVHhe7ZzrcaswEIUzTgGUQAlTQkqgBEpICe6AEqYEdzAlpATKkK/mTDx2FgmtFh1Yjfh+M3fGCXokdPaABAK/SSmllFJKKaWUUkoppZRSSgWVQ9Sg4jiO/X6/d7fb7Xm/3z+fn59+E5xXUCPSNE2u1ytZlmV0V3yVvRMfj8fv8XhkHacKTpL1en3ZbDZu6Xh5lSAZnqWzrIvDZHm9U1QiNpsN2zC1kCPyFsJHRhaHw8FtNm/HqARMJpPXMrWQLMlYLBas+yLrxM42h+MxxPHBNJvN/MR1AJZp5TRN2Sk9HWNwp0s4Qsl7t9u57XbLPhG1SYZITtttLi8KxlWIXEMaGVaeFONqP35A1QUGtR5GJL7oULzebDtA94aqUaJ0uVZxNh9cdzDSJb1YL6EB6Zx0LV2n5wHh2yd/yCgCNQDSNH8OP5QEwzSw4Dkl6byFBP2BnnTuObkrOyDTsogpE6oVxPMKRrykW+khDJsIFQfp2qL2zK5gjMxiihQoLyGaR5sMbdMaU0aVgbKHlQa46qgTVNXZoQnlfvaSCpF1sJiodMu5xqNtINsFFTXbrZnP50/PL5cLW/U+n0922ptLWzw++kLB6bG80yRJXr/HoL4rOt+naMZTcBajx5Ru2ek4Yl5xvXIm/Yef+KI3vFgXxVhfzMl+f0fPKXTSNUJSrYAtH9iWLcWjUXEjYvkCRvlIvXMjhIQJGrXJh8LRvPeG6KVbDlM1Lhb5EfQM7K0aZr1LzBcxkNhAVbP1TqQqVjVQK5qrpkXUHbzVCq9RRUCVEn5Z9lYx7IVKkm5Zz2CCyLu8bsm6S47P41MwQsTZXf3XR8N88lq3QPHtY05OIxS85UIPb1D0nvjYlhNc/jz7pSEdKqOgbYSK8t2UIPM1VLRYTTj7EUJTRf0Qqe3c6YXm5Y5wBXDtk/EZeA4Rl+3bNtXLv4fEPQ2WjjEIQtATzOfzL/Oc9M66ltD6EE3AuQ0hQWLDuOCcxkFBD7Fa/U0/I6kj5Cg3Tao0JUC1IOQ8NHcTX1lFDn0PCTOU9CY24KwDj9c6GWLGEofXNzfp+VpCSzs2sAVnTWA/tMRMVhrx9i78nLBqcBw4TFLK3BV6S9VFTvRmRb9OxGsGHIXkMTBmhc7JwULvYAw7TUJL1jQaZpDEECnnS6KpxR8k0YX3wbpMVrrhYoSRPE6T9c6Ac68phd3W8gJSvWJKPr63tGESZT1ztT2BHmI5/9kw5J7vbWyiRO6n+KKOdLCefSIxPYxk0ynuNmS6sBCVkzRJEjt1i4BL+Nxi8bNXiFJ+hAzPsaMIhYWk4efjy9XGC6lrn+MVq43Ei8TIQnISMGIUnR/bW13yN1tpPwTfD2GFTlELU7+AyA97Vv90jJ6jFdjwkc8vwqqMWrDUJB2iAZjCwMU4iRCUYJc8S4YFPUMmGXz8ZRNlygynUbxhiXHIaBcfOumQCnrT+ej1etX30G9g9c0vy1CUf2/Jc0nJSOGXGzuKq/oTaZfSc2yToVQWY4sMOVk3oy7s6f+aIEPn/0lfF2N6j7JTL3ZnKuNiTG9RL8FxWSSGk9UxzrJQ8p6dxZ44VOYGa1VCkgQqA54zyU1mpcRTJYNIirKhkGoz4nwZO0rMlQiVDBPLPzjRFnbGb0yvLEOqw1RpNEL0CK0yegRXMlTZUCmllFJKKaWUUkoppZRSSsUq5/4DSpPIK3JGG5MAAAAASUVORK5CYII=" alt="QR Code" className="qr-image" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashExpressLabelFixed;