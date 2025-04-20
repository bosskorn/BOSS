import React, { useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import JsBarcode from 'jsbarcode';

const BarcodeTestImproved: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('svg');
  const [trackingNumber, setTrackingNumber] = useState('TMP5079863352');
  const [svgUrl, setSvgUrl] = useState<string>('');
  const barcodeRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // สร้างบาร์โค้ดเมื่อเปลี่ยนเลขพัสดุหรือประเภท
  useEffect(() => {
    generateBarcode();
  }, [trackingNumber, selectedTab]);
  
  // สร้างบาร์โค้ดตามประเภทที่เลือก
  const generateBarcode = () => {
    if (!trackingNumber) return;
    
    try {
      // ลบข้อมูลผิดพลาดเดิม
      const errorElement = document.getElementById('barcode-error');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
      
      // สร้างบาร์โค้ดตามประเภทที่เลือก
      if (selectedTab === 'svg' && barcodeRef.current) {
        JsBarcode(barcodeRef.current, trackingNumber, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 16,
          margin: 10
        });
        
        // สร้าง Data URL จาก SVG สำหรับใช้พิมพ์
        const svgContent = new XMLSerializer().serializeToString(barcodeRef.current);
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        setSvgUrl(svgUrl);
      } 
      else if (selectedTab === 'canvas' && canvasRef.current) {
        JsBarcode(canvasRef.current, trackingNumber, {
          format: "CODE128", 
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 16,
          margin: 10
        });
      }
      else if (selectedTab === 'img' && imgRef.current) {
        JsBarcode(imgRef.current, trackingNumber, {
          format: "CODE128",
          width: 2, 
          height: 80,
          displayValue: true,
          fontSize: 16,
          margin: 10
        });
      }
      
      console.log('บาร์โค้ดถูกสร้างสำเร็จ:', selectedTab);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการสร้างบาร์โค้ด:', error);
      
      // แสดงข้อผิดพลาด
      const errorElement = document.getElementById('barcode-error');
      if (errorElement) {
        errorElement.textContent = `เกิดข้อผิดพลาดในการสร้างบาร์โค้ด: ${error.message}`;
        errorElement.style.display = 'block';
      }
    }
  };
  
  // พิมพ์ลาเบลขนาด 100x75mm
  const printLabelSmall = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    // สร้าง HTML สำหรับพิมพ์
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์ลาเบล - ${trackingNumber}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: 100mm 75mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
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
          .col {
            flex: 1;
            padding: 0 1mm;
          }
          .col-right {
            border-left: 1px solid #eee;
          }
          .section-title {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 1mm;
            background-color: #f5f5f5;
            padding: 1mm;
          }
          .address-box {
            border: 1px solid #eee;
            padding: 1.5mm;
            font-size: 9px;
            line-height: 1.2;
            height: 18mm;
            overflow: hidden;
          }
          .barcode-box {
            background-color: #f9f9f9;
            border: 1px solid #eee;
            padding: 2mm;
            text-align: center;
            margin-top: 2mm;
          }
          .cod-box {
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
            margin: 10mm 0;
            display: block;
          }
          .print-button button {
            padding: 5mm 10mm;
            background-color: #8A2BE2;
            color: white;
            border: none;
            border-radius: 2mm;
            font-size: 16px;
            cursor: pointer;
          }
          @media print {
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print();">พิมพ์ลาเบล</button>
        
        <div class="label-container">
          <div class="header">PURPLEDASH</div>
          
          <div class="tracking-number">${trackingNumber}</div>
          
          <div class="flex-container">
            <div class="col">
              <div class="section-title">ผู้ส่ง:</div>
              <div class="address-box">
                <strong>PURPLEDASH</strong><br>
                123 ถนนพระราม 9<br>
                แขวงบางกะปิ เขตห้วยขวาง<br>
                กรุงเทพฯ 10310<br>
                โทร: 02-123-4567
              </div>
            </div>
            
            <div class="col col-right">
              <div class="section-title">ผู้รับ:</div>
              <div class="address-box">
                <strong>คุณลูกค้า ทดสอบ</strong><br>
                789 ถนนสุขุมวิท<br>
                แขวงคลองตัน เขตวัฒนา<br>
                กรุงเทพฯ 10110<br>
                โทร: 081-234-5678
              </div>
            </div>
          </div>
          
          <div class="barcode-box">
            <svg id="barcode"></svg>
          </div>
          
          <div class="cod-box">
            เก็บเงินปลายทาง: 500.00 บาท
          </div>
        </div>
        
        <script>
          // เมื่อหน้าโหลดเสร็จ สร้างบาร์โค้ด
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
              
              // พิมพ์อัตโนมัติหลังจากสร้างบาร์โค้ดเสร็จ 1 วินาที
              setTimeout(function() {
                window.print();
              }, 1000);
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
  
  // พิมพ์ลาเบลขนาด 100x100mm
  const printLabelLarge = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    // สร้าง HTML สำหรับพิมพ์
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์ลาเบล - ${trackingNumber}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: 100mm 100mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
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
            margin-bottom: 3mm;
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
          .address-box {
            border: 1px solid #eee;
            padding: 2mm;
            font-size: 11px;
            line-height: 1.3;
          }
          .barcode-box {
            text-align: center;
            margin-top: 3mm;
          }
          .cod-box {
            position: absolute;
            bottom: 5mm;
            left: 5mm;
            right: 5mm;
            text-align: center;
            padding: 2mm;
            background-color: #fff0f0;
            border: 1px dashed #ff9999;
            font-weight: bold;
          }
          .print-button {
            text-align: center;
            margin: 10mm 0;
            display: block;
          }
          .print-button button {
            padding: 5mm 10mm;
            background-color: #8A2BE2;
            color: white;
            border: none;
            border-radius: 2mm;
            font-size: 16px;
            cursor: pointer;
          }
          @media print {
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print();">พิมพ์ลาเบล</button>
        
        <div class="label-container">
          <div class="header">PURPLEDASH</div>
          
          <div class="tracking-number">${trackingNumber}</div>
          
          <div class="sender-section">
            <div class="section-title">ผู้ส่ง:</div>
            <div class="address-box">
              <strong>PURPLEDASH</strong><br>
              123 ถนนพระราม 9<br>
              แขวงบางกะปิ เขตห้วยขวาง<br>
              กรุงเทพฯ 10310<br>
              โทร: 02-123-4567
            </div>
          </div>
          
          <div class="recipient-section">
            <div class="section-title">ผู้รับ:</div>
            <div class="address-box">
              <strong>คุณลูกค้า ทดสอบ</strong><br>
              789 ถนนสุขุมวิท<br>
              แขวงคลองตัน เขตวัฒนา<br>
              กรุงเทพฯ 10110<br>
              โทร: 081-234-5678
            </div>
          </div>
          
          <div class="barcode-box">
            <svg id="barcode"></svg>
          </div>
          
          <div class="cod-box">
            เก็บเงินปลายทาง: 500.00 บาท
          </div>
        </div>
        
        <script>
          // เมื่อหน้าโหลดเสร็จ สร้างบาร์โค้ด
          window.onload = function() {
            try {
              JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                width: 2,
                height: 40,
                displayValue: true,
                fontSize: 14,
                margin: 5
              });
              console.log("Generated barcode successfully");
              
              // พิมพ์อัตโนมัติหลังจากสร้างบาร์โค้ดเสร็จ 1 วินาที
              setTimeout(function() {
                window.print();
              }, 1000);
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
  
  // พิมพ์เฉพาะบาร์โค้ด
  const printBarcodeOnly = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    // สร้าง HTML สำหรับพิมพ์
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>พิมพ์บาร์โค้ด - ${trackingNumber}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Kanit', 'Sarabun', sans-serif;
            text-align: center;
          }
          .barcode-container {
            margin: 20px auto;
            width: 90%;
            max-width: 400px;
          }
          .print-button {
            margin: 20px auto;
            display: block;
          }
          .print-button button {
            padding: 10px 20px;
            background-color: #8A2BE2;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
          }
          @media print {
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print();">พิมพ์บาร์โค้ด</button>
        
        <div class="barcode-container">
          <svg id="barcode"></svg>
          <div style="margin-top: 5px; font-family: monospace; font-size: 14px;">${trackingNumber}</div>
        </div>
        
        <script>
          // เมื่อหน้าโหลดเสร็จ สร้างบาร์โค้ด
          window.onload = function() {
            try {
              JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: false,
                margin: 0
              });
              console.log("Generated barcode successfully");
              
              // พิมพ์อัตโนมัติหลังจากสร้างบาร์โค้ดเสร็จ 1 วินาที
              setTimeout(function() {
                window.print();
              }, 1000);
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
        <h1 className="text-2xl font-bold mb-6">ทดสอบการทำงานของบาร์โค้ดแบบครบถ้วน</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <Label htmlFor="tracking-number" className="text-base font-medium">เลขพัสดุสำหรับทดสอบ</Label>
            <div className="flex mt-1 gap-2">
              <Input
                id="tracking-number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="flex-1"
                placeholder="ป้อนเลขพัสดุ"
              />
              <Button onClick={generateBarcode} className="bg-purple-600 hover:bg-purple-700">
                สร้างบาร์โค้ด
              </Button>
            </div>
          </div>
          
          <div id="barcode-error" className="text-red-500 mt-2 mb-2 hidden"></div>
          
          <Tabs defaultValue="svg" className="mt-6" onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="svg">SVG</TabsTrigger>
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="img">Image</TabsTrigger>
            </TabsList>
            
            <TabsContent value="svg" className="mt-4 flex justify-center items-center">
              <div className="text-center">
                <svg ref={barcodeRef} className="w-full max-w-md h-24 mb-2"></svg>
                <p className="text-gray-600 mt-2">สร้างบาร์โค้ดด้วย SVG Element</p>
              </div>
            </TabsContent>
            
            <TabsContent value="canvas" className="mt-4 flex justify-center items-center">
              <div className="text-center">
                <canvas ref={canvasRef} className="w-full max-w-md h-24 mb-2"></canvas>
                <p className="text-gray-600 mt-2">สร้างบาร์โค้ดด้วย Canvas Element</p>
              </div>
            </TabsContent>
            
            <TabsContent value="img" className="mt-4 flex justify-center items-center">
              <div className="text-center">
                <img ref={imgRef} className="w-full max-w-md h-24 mb-2" alt="Barcode" />
                <p className="text-gray-600 mt-2">สร้างบาร์โค้ดด้วย Image Element</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">พิมพ์เฉพาะบาร์โค้ด</h2>
              <p className="mb-4 text-gray-600">
                พิมพ์เฉพาะบาร์โค้ดพร้อมเลขพัสดุ ไม่มีข้อมูลอื่น
              </p>
              <Button onClick={printBarcodeOnly} className="w-full bg-purple-600 hover:bg-purple-700">
                พิมพ์บาร์โค้ด
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">พิมพ์ลาเบล 100x75mm</h2>
              <p className="mb-4 text-gray-600">
                พิมพ์ลาเบลขนาดเล็ก 100x75mm พร้อมข้อมูลผู้ส่ง ผู้รับ และบาร์โค้ด
              </p>
              <Button onClick={printLabelSmall} className="w-full bg-purple-600 hover:bg-purple-700">
                พิมพ์ลาเบล 100x75mm
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">พิมพ์ลาเบล 100x100mm</h2>
              <p className="mb-4 text-gray-600">
                พิมพ์ลาเบลขนาดใหญ่ 100x100mm พร้อมข้อมูลครบถ้วน
              </p>
              <Button onClick={printLabelLarge} className="w-full bg-purple-600 hover:bg-purple-700">
                พิมพ์ลาเบล 100x100mm
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                หน้านี้ใช้ JsBarcode เวอร์ชัน 3.11.5 สำหรับสร้างบาร์โค้ด<br/>
                ทดสอบการสร้างบาร์โค้ดด้วยองค์ประกอบต่างๆ: SVG, Canvas, และ Image<br/>
                การพิมพ์จะแยก HTML เฉพาะส่วนเพื่อการพิมพ์ที่มีประสิทธิภาพมากขึ้น
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BarcodeTestImproved;
