import React, { useRef, useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

/**
 * หน้าพิมพ์ลาเบล Flash Express
 * รองรับการพิมพ์ลาเบลของ Flash Express ทั้งแบบเดี่ยวและแบบหลายรายการ
 */
const FlashExpressLabelNew: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  
  useEffect(() => {
    // ดึงพารามิเตอร์จาก URL
    const fetchOrderData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const orderIds = params.get('orders') || params.get('order') || '';
        
        if (!orderIds) {
          setError('ไม่พบรหัสออเดอร์ กรุณาระบุรหัสออเดอร์ที่ต้องการพิมพ์ลาเบล');
          setLoading(false);
          return;
        }
        
        console.log("พิมพ์ลาเบลสำหรับ:", orderIds);
        
        // ดึงข้อมูลออร์เดอร์
        const response = await axios.get(`/api/orders?ids=${orderIds}`);
        
        if (response.data.success && response.data.orders) {
          // กรองเฉพาะออเดอร์ที่มีเลขพัสดุ (ตรวจสอบทั้ง trackingNumber และ tracking_number)
          const ordersWithTracking = response.data.orders.filter((order: any) => 
            order.trackingNumber || order.tracking_number
          );
          
          if (ordersWithTracking.length === 0) {
            setError('ไม่พบออเดอร์ที่มีเลขพัสดุ กรุณาตรวจสอบว่าได้สร้างเลขพัสดุแล้ว');
            setLoading(false);
            return;
          }
          
          setOrders(ordersWithTracking);
          
          // พิมพ์อัตโนมัติเมื่อโหลดข้อมูลเสร็จ
          setTimeout(() => {
            printFlashExpressLabels(ordersWithTracking);
            setLoading(false);
          }, 1000);
        } else {
          setError('ไม่สามารถดึงข้อมูลออเดอร์ได้');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, []);
  
  // ฟังก์ชันสำหรับการพิมพ์ลาเบล Flash Express
  const printFlashExpressLabels = (ordersToPrint: any[]) => {
    // เปิดหน้าต่างใหม่สำหรับการพิมพ์
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    // สร้าง HTML สำหรับหัวเอกสาร
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Flash Express Labels</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700&display=swap');
          
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Kanit', sans-serif;
          }
          .print-container {
            font-family: 'Kanit', sans-serif;
          }
          .flash-express-label {
            width: 100mm;
            height: 150mm;
            border: 1px solid #ddd;
            margin: 0 auto;
            padding: 5mm;
            box-sizing: border-box;
            background-color: white;
            page-break-after: always;
            position: relative;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #000;
            padding-bottom: 5mm;
            margin-bottom: 5mm;
          }
          .logo {
            font-size: 20px;
            font-weight: bold;
            color: #F76600;
          }
          .tracking-section {
            text-align: center;
            margin-bottom: 5mm;
          }
          .tracking-number {
            font-size: 18px;
            font-weight: bold;
            padding: 2mm;
            border: 1px solid #000;
            display: inline-block;
            margin-bottom: 3mm;
          }
          .barcode-container {
            text-align: center;
            margin-bottom: 5mm;
          }
          .address-section {
            margin-bottom: 5mm;
          }
          .address-label {
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 1mm;
            margin-bottom: 2mm;
          }
          .address-content {
            font-size: 12px;
            line-height: 1.3;
          }
          .footer {
            position: absolute;
            bottom: 5mm;
            left: 5mm;
            right: 5mm;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          .print-info {
            margin-bottom: 10mm;
            padding: 5mm;
            text-align: center;
          }
          @media print {
            .print-info {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-info">
          <h1>Flash Express Labels (${ordersToPrint.length} รายการ)</h1>
          <p>กำลังพิมพ์ลาเบลอัตโนมัติ หากไม่พิมพ์อัตโนมัติ กรุณาคลิกที่ปุ่ม "พิมพ์" ด้านล่าง</p>
          <button onclick="window.print();" style="padding: 10px 20px; background-color: #F76600; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Kanit', sans-serif;">พิมพ์</button>
        </div>
    `;
    
    // สร้าง HTML สำหรับแต่ละลาเบล
    ordersToPrint.forEach((order, index) => {
      // ใช้ tracking_number หรือ trackingNumber (ให้ความสำคัญกับ tracking_number ก่อน)
      const trackingNumber = order.tracking_number || order.trackingNumber;
      // ใช้ customer_name หรือ customerName
      const customerName = order.customer_name || order.customerName || "ลูกค้า";
      // ใช้ customer_phone หรือ customerPhone
      const customerPhone = order.customer_phone || order.customerPhone || "-";
      // ที่อยู่ลูกค้า
      const customerAddress = order.customer_address || order.customerAddress || "-";
      const customerProvince = order.customer_province || order.customerProvince || "-";
      const customerDistrict = order.customer_district || order.customerDistrict || "-";
      const customerSubdistrict = order.customer_subdistrict || order.customerSubdistrict || "-";
      const customerZipcode = order.customer_zipcode || order.customerZipcode || "-";
      
      // ข้อมูลการชำระเงินปลายทาง
      const codAmount = order.cod_amount || order.codAmount || 0;
      const hasCOD = codAmount > 0;
      
      htmlContent += `
        <div class="flash-express-label">
          <div class="header">
            <div class="logo">Flash Express</div>
            <div>Order #${order.id}</div>
          </div>
          
          <div class="tracking-section">
            <div class="tracking-number">${trackingNumber}</div>
            <div class="barcode-container">
              <svg id="barcode-${index}"></svg>
            </div>
          </div>
          
          <div class="address-section">
            <div class="address-label">ผู้ส่ง:</div>
            <div class="address-content">
              บริษัท PurpleDash<br>
              เลขที่ 123 ถนนพระราม 9 แขวงบางกะปิ<br>
              เขตห้วยขวาง กรุงเทพฯ 10310<br>
              โทรศัพท์: 02-123-4567
            </div>
          </div>
          
          <div class="address-section">
            <div class="address-label">ผู้รับ:</div>
            <div class="address-content">
              ${customerName}<br>
              ${customerAddress}<br>
              ${customerSubdistrict} ${customerDistrict}<br>
              ${customerProvince} ${customerZipcode}<br>
              โทรศัพท์: ${customerPhone}
            </div>
          </div>
          
          ${hasCOD ? `
          <div style="border: 2px solid #F76600; padding: 2mm; text-align: center; font-weight: bold; margin-top: 5mm;">
            เก็บเงินปลายทาง: ${parseFloat(codAmount).toFixed(2)} บาท
          </div>
          ` : ''}
          
          <div class="footer">
            พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}
          </div>
        </div>
      `;
    });
    
    // สร้าง script สำหรับการพิมพ์และการสร้างบาร์โค้ด
    htmlContent += `
        <script>
          window.onload = function() {
            try {
              // สร้างบาร์โค้ดสำหรับแต่ละลาเบล
              ${ordersToPrint.map((order, index) => {
                const trackingNumber = order.tracking_number || order.trackingNumber;
                return `
                  JsBarcode("#barcode-${index}", "${trackingNumber}", {
                    format: "CODE128",
                    width: 2,
                    height: 40,
                    displayValue: true,
                    fontSize: 12,
                    margin: 5
                  });
                `;
              }).join('')}
              
              // พิมพ์อัตโนมัติหลังจากสร้างบาร์โค้ดเสร็จ
              setTimeout(function() {
                window.print();
              }, 1000);
            } catch (error) {
              console.error("Error generating barcodes:", error);
              document.body.innerHTML += '<div style="color:red;text-align:center;margin:20px;">เกิดข้อผิดพลาดในการสร้างบาร์โค้ด: ' + error + '</div>';
            }
          };
        </script>
      </body>
      </html>
    `;
    
    // เขียน HTML ลงในหน้าต่างที่เปิด
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Flash Express Labels</h1>
        
        {loading ? (
          <div className="text-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-lg">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="text-red-500 text-xl font-medium mb-4">{error}</div>
                <Button onClick={() => window.history.back()} className="bg-blue-600 hover:bg-blue-700">
                  กลับไปหน้าก่อนหน้า
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="text-green-600 text-xl font-medium mb-4">
                  กำลังเตรียมพิมพ์ลาเบล {orders.length} รายการ
                </div>
                <p className="mb-4 text-gray-600">ระบบกำลังเปิดหน้าต่างใหม่สำหรับการพิมพ์</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => window.history.back()} variant="outline">
                    กลับไปหน้ารายการออเดอร์
                  </Button>
                  <Button onClick={() => printFlashExpressLabels(orders)} className="bg-blue-600 hover:bg-blue-700">
                    พิมพ์ลาเบลอีกครั้ง
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default FlashExpressLabelNew;