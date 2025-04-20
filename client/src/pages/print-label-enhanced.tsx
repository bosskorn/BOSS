import React, { useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * หน้าทดสอบการพิมพ์ลาเบลที่ปรับปรุงใหม่
 * รองรับการเลือกขนาดและรูปแบบการพิมพ์
 */
const PrintLabelEnhanced: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('100x100');
  
  // ฟังก์ชันสำหรับการพิมพ์ทดสอบขนาด 100x100mm
  const printLabel100x100 = () => {
    // เปิดหน้าต่างใหม่สำหรับการพิมพ์
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    // รหัสติดตามตัวอย่าง
    const trackingNumber = "TMP5079863352";
    
    // เขียน HTML สำหรับการพิมพ์
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์ลาเบล 100x100mm</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: 100mm 100mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Kanit', 'Sarabun', sans-serif;
          }
          .label-container {
            width: 100mm;
            height: 100mm;
            padding: 5mm;
            box-sizing: border-box;
            position: relative;
          }
          .header {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5mm;
            color: #8A2BE2;
          }
          .tracking-number {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 3mm;
            border: 1px solid #8A2BE2;
            padding: 2mm;
            background-color: #f9f0ff;
          }
          .sender-section, .recipient-section {
            margin-bottom: 3mm;
          }
          .section-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 1mm;
            background-color: #f5f5f5;
            padding: 1mm;
          }
          .address {
            font-size: 12px;
            line-height: 1.3;
            border: 1px solid #eee;
            padding: 2mm;
          }
          .address strong {
            font-weight: bold;
          }
          .barcode-section {
            text-align: center;
            margin-top: 3mm;
          }
          .cod-section {
            position: absolute;
            bottom: 5mm;
            left: 5mm;
            right: 5mm;
            text-align: center;
            padding: 2mm;
            background-color: #fff0f0;
            border: 1px dashed #ff9999;
            font-weight: bold;
            font-size: 12px;
          }
          .print-button {
            text-align: center;
            margin-top: 10mm;
          }
          .print-button button {
            padding: 5mm 10mm;
            background-color: #8A2BE2;
            color: white;
            border: none;
            border-radius: 2mm;
            font-size: 14px;
            cursor: pointer;
          }
          @media print {
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print();">พิมพ์ลาเบล</button>
        </div>
        
        <div class="label-container">
          <div class="header">PURPLEDASH</div>
          
          <div class="tracking-number">${trackingNumber}</div>
          
          <div class="sender-section">
            <div class="section-title">ผู้ส่ง:</div>
            <div class="address">
              <strong>PURPLEDASH</strong><br>
              123 ถนนพระราม 9<br>
              แขวงบางกะปิ เขตห้วยขวาง<br>
              กรุงเทพฯ 10310<br>
              โทร: 02-123-4567
            </div>
          </div>
          
          <div class="recipient-section">
            <div class="section-title">ผู้รับ:</div>
            <div class="address">
              <strong>คุณลูกค้า ทดสอบ</strong><br>
              789 ถนนสุขุมวิท<br>
              แขวงคลองตัน เขตวัฒนา<br>
              กรุงเทพฯ 10110<br>
              โทร: 081-234-5678
            </div>
          </div>
          
          <div class="barcode-section">
            <svg id="barcode"></svg>
          </div>
          
          <div class="cod-section">
            เก็บเงินปลายทาง: 500.00 บาท
          </div>
        </div>
        
        <script>
          window.onload = function() {
            try {
              JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                width: 2,
                height: 40,
                displayValue: true,
                fontSize: 12,
                margin: 5
              });
              console.log("Generated barcode successfully");
              
              // หลังจากสร้างบาร์โค้ดเสร็จ 500ms ให้พิมพ์อัตโนมัติ
              setTimeout(function() {
                window.print();
              }, 500);
            } catch (error) {
              console.error("Error generating barcode:", error);
              document.body.innerHTML += '<div style="color:red;text-align:center;margin:20px;">เกิดข้อผิดพลาดในการสร้างบาร์โค้ด: ' + error + '</div>';
            }
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  // ฟังก์ชันสำหรับการพิมพ์ทดสอบขนาด 100x75mm
  const printLabel100x75 = () => {
    // เปิดหน้าต่างใหม่สำหรับการพิมพ์
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    // รหัสติดตามตัวอย่าง
    const trackingNumber = "TMP5079863352";
    
    // เขียน HTML สำหรับการพิมพ์
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์ลาเบล 100x75mm</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: 100mm 75mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Kanit', 'Sarabun', sans-serif;
          }
          .label-container {
            width: 100mm;
            height: 75mm;
            padding: 3mm;
            box-sizing: border-box;
            position: relative;
          }
          .header {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2mm;
            color: #8A2BE2;
          }
          .tracking-number {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2mm;
            border: 1px solid #8A2BE2;
            padding: 1mm;
            background-color: #f9f0ff;
          }
          .flex-container {
            display: flex;
            margin-bottom: 2mm;
          }
          .sender-section, .recipient-section {
            flex: 1;
            padding: 0 1mm;
          }
          .recipient-section {
            border-left: 1px solid #eee;
          }
          .section-title {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 1mm;
            background-color: #f5f5f5;
            padding: 1mm;
          }
          .address {
            font-size: 9px;
            line-height: 1.2;
            border: 1px solid #eee;
            padding: 1mm;
            height: 20mm;
            overflow: hidden;
          }
          .address strong {
            font-weight: bold;
          }
          .barcode-section {
            text-align: center;
            margin-top: 2mm;
            padding: 1mm;
            background-color: #f9f9f9;
            border: 1px solid #eee;
          }
          .cod-section {
            margin-top: 1mm;
            text-align: center;
            padding: 1mm;
            background-color: #fff0f0;
            border: 1px dashed #ff9999;
            font-weight: bold;
            font-size: 9px;
          }
          .print-button {
            text-align: center;
            margin-top: 10mm;
          }
          .print-button button {
            padding: 5mm 10mm;
            background-color: #8A2BE2;
            color: white;
            border: none;
            border-radius: 2mm;
            font-size: 14px;
            cursor: pointer;
          }
          @media print {
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print();">พิมพ์ลาเบล</button>
        </div>
        
        <div class="label-container">
          <div class="header">PURPLEDASH</div>
          
          <div class="tracking-number">${trackingNumber}</div>
          
          <div class="flex-container">
            <div class="sender-section">
              <div class="section-title">ผู้ส่ง:</div>
              <div class="address">
                <strong>PURPLEDASH</strong><br>
                123 ถนนพระราม 9<br>
                แขวงบางกะปิ เขตห้วยขวาง<br>
                กรุงเทพฯ 10310<br>
                โทร: 02-123-4567
              </div>
            </div>
            
            <div class="recipient-section">
              <div class="section-title">ผู้รับ:</div>
              <div class="address">
                <strong>คุณลูกค้า ทดสอบ</strong><br>
                789 ถนนสุขุมวิท<br>
                แขวงคลองตัน เขตวัฒนา<br>
                กรุงเทพฯ 10110<br>
                โทร: 081-234-5678
              </div>
            </div>
          </div>
          
          <div class="barcode-section">
            <svg id="barcode"></svg>
          </div>
          
          <div class="cod-section">
            เก็บเงินปลายทาง: 500.00 บาท
          </div>
        </div>
        
        <script>
          window.onload = function() {
            try {
              JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                width: 1.5,
                height: 30,
                displayValue: true,
                fontSize: 10,
                margin: 0
              });
              console.log("Generated barcode successfully");
              
              // หลังจากสร้างบาร์โค้ดเสร็จ 500ms ให้พิมพ์อัตโนมัติ
              setTimeout(function() {
                window.print();
              }, 500);
            } catch (error) {
              console.error("Error generating barcode:", error);
              document.body.innerHTML += '<div style="color:red;text-align:center;margin:20px;">เกิดข้อผิดพลาดในการสร้างบาร์โค้ด: ' + error + '</div>';
            }
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  // ฟังก์ชันพิมพ์บาร์โค้ดอย่างเดียว
  const printBarcodeOnly = () => {
    // เปิดหน้าต่างใหม่สำหรับการพิมพ์
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    // รหัสติดตามตัวอย่าง
    const trackingNumber = "TMP5079863352";
    
    // เขียน HTML สำหรับการพิมพ์
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์บาร์โค้ด</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Kanit', 'Sarabun', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .barcode-container {
            text-align: center;
            padding: 20px;
          }
          .print-button {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-button button {
            padding: 10px 20px;
            background-color: #8A2BE2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          @media print {
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print();">พิมพ์บาร์โค้ด</button>
        </div>
        
        <div class="barcode-container">
          <svg id="barcode"></svg>
        </div>
        
        <script>
          window.onload = function() {
            try {
              JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: true,
                fontSize: 18,
                margin: 10
              });
              console.log("Generated barcode successfully");
              
              // หลังจากสร้างบาร์โค้ดเสร็จ 500ms ให้พิมพ์อัตโนมัติ
              setTimeout(function() {
                window.print();
              }, 500);
            } catch (error) {
              console.error("Error generating barcode:", error);
              document.body.innerHTML += '<div style="color:red;text-align:center;margin:20px;">เกิดข้อผิดพลาดในการสร้างบาร์โค้ด: ' + error + '</div>';
            }
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">ทดสอบการพิมพ์ลาเบลและบาร์โค้ด</h1>
        
        <Tabs defaultValue="100x100" className="mb-6" onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="100x100">ขนาด 100x100mm</TabsTrigger>
            <TabsTrigger value="100x75">ขนาด 100x75mm</TabsTrigger>
            <TabsTrigger value="barcode">บาร์โค้ดอย่างเดียว</TabsTrigger>
          </TabsList>
          
          <TabsContent value="100x100" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">ลาเบลขนาด 100x100mm</h2>
                <p className="mb-4 text-gray-600">
                  ขนาดมาตรฐานสำหรับพัสดุทั่วไป แสดงรายละเอียดผู้ส่ง ผู้รับ และบาร์โค้ดเต็มรูปแบบ
                </p>
                <div className="p-4 bg-gray-100 rounded-md mb-4">
                  <p className="font-medium">ข้อมูลตัวอย่าง:</p>
                  <ul className="list-disc list-inside text-sm ml-2 mt-1">
                    <li>เลขพัสดุ: TMP5079863352</li>
                    <li>COD: 500.00 บาท</li>
                  </ul>
                </div>
                <Button onClick={printLabel100x100} className="w-full bg-purple-600 hover:bg-purple-700">
                  พิมพ์ลาเบล 100x100mm
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="100x75" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">ลาเบลขนาด 100x75mm</h2>
                <p className="mb-4 text-gray-600">
                  ขนาดกะทัดรัดสำหรับพัสดุชิ้นเล็ก จัดวางข้อมูลในรูปแบบคอมแพคเพื่อให้อ่านง่ายแม้พื้นที่จำกัด
                </p>
                <div className="p-4 bg-gray-100 rounded-md mb-4">
                  <p className="font-medium">ข้อมูลตัวอย่าง:</p>
                  <ul className="list-disc list-inside text-sm ml-2 mt-1">
                    <li>เลขพัสดุ: TMP5079863352</li>
                    <li>COD: 500.00 บาท</li>
                  </ul>
                </div>
                <Button onClick={printLabel100x75} className="w-full bg-purple-600 hover:bg-purple-700">
                  พิมพ์ลาเบล 100x75mm
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="barcode" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">บาร์โค้ดเท่านั้น</h2>
                <p className="mb-4 text-gray-600">
                  พิมพ์เฉพาะบาร์โค้ดสำหรับติดบนพัสดุที่มีข้อมูลอื่นๆ แล้ว หรือใช้สำหรับการสแกนตรวจสอบสถานะ
                </p>
                <div className="p-4 bg-gray-100 rounded-md mb-4">
                  <p className="font-medium">ข้อมูลตัวอย่าง:</p>
                  <ul className="list-disc list-inside text-sm ml-2 mt-1">
                    <li>เลขพัสดุ: TMP5079863352</li>
                  </ul>
                </div>
                <Button onClick={printBarcodeOnly} className="w-full bg-purple-600 hover:bg-purple-700">
                  พิมพ์บาร์โค้ด
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                การทดสอบนี้ใช้ JsBarcode เวอร์ชัน 3.11.5 ที่โหลดจาก CDN โดยตรง<br/>
                การพิมพ์จะเปิดหน้าต่างใหม่ที่มีปุ่มสำหรับสั่งพิมพ์โดยตรง<br/>
                ระบบจะพิมพ์อัตโนมัติหลังจากสร้างบาร์โค้ดเสร็จสมบูรณ์
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrintLabelEnhanced;
