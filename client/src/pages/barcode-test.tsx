import React, { useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import JsBarcode from 'jsbarcode';

interface BarcodeTestProps {}

const BarcodeTest: React.FC<BarcodeTestProps> = () => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const trackingNumber = "TMP5079863352";
  
  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, trackingNumber, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 40,
          displayValue: false
        });
        console.log("Barcode generated successfully!");
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, []);
  
  const printBarcodeOnly = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>พิมพ์บาร์โค้ด</title>
        <script src="https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page { size: auto; margin: 10mm; }
          body { margin: 0; padding: 0; }
          .barcode-container { text-align: center; margin: 20px; }
          .print-button { text-align: center; margin: 20px; }
          .print-button button { 
            padding: 10px 20px; 
            background: #8A2BE2; 
            color: white; 
            border: none; 
            border-radius: 4px;
            cursor: pointer;
          }
          @media print {
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print();">พิมพ์บาร์โค้ด</button>
        </div>
        <div class="barcode-container">
          <svg id="barcode"></svg>
          <div style="font-family: monospace; margin-top: 5px;">${trackingNumber}</div>
        </div>
        <script>
          window.onload = function() {
            try {
              JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: false
              });
              console.log("Barcode generated successfully");
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
  
  const printShippingLabel = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>พิมพ์ลาเบลจัดส่ง</title>
        <script src="https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page { size: 100mm 75mm; margin: 0; }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif;
          }
          .label-container {
            width: 100mm;
            height: 75mm;
            padding: 5mm;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #8A2BE2;
            margin-bottom: 3mm;
          }
          .tracking-box {
            border: 1px solid #8A2BE2;
            background-color: #f5f0ff;
            padding: 2mm;
            margin-bottom: 3mm;
            text-align: center;
            font-weight: bold;
          }
          .flex-row {
            display: flex;
            margin-bottom: 3mm;
          }
          .col {
            flex: 1;
          }
          .col-right {
            border-left: 1px solid #eee;
            padding-left: 2mm;
          }
          .label {
            font-size: 9px;
            font-weight: bold;
            background-color: #f5f5f5;
            padding: 1mm;
          }
          .address-box {
            border: 1px solid #eee;
            padding: 1.5mm;
            font-size: 9px;
            line-height: 1.2;
          }
          .barcode-box {
            background-color: #f9f9f9;
            border: 1px solid #eee;
            padding: 2mm;
            margin-top: 2mm;
            text-align: center;
          }
          .cod-box {
            background-color: #fff5f5;
            text-align: center;
            padding: 1mm;
            font-size: 9px;
            margin-top: 2mm;
          }
          .print-button {
            text-align: center;
            margin: 20px;
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
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print();">พิมพ์ลาเบล</button>
        </div>
        
        <div class="label-container">
          <div class="header">PURPLEDASH</div>
          
          <div class="tracking-box">${trackingNumber}</div>
          
          <div class="flex-row">
            <div class="col">
              <div class="label">ผู้ส่ง</div>
              <div class="address-box">
                <strong>PURPLEDASH</strong><br>
                123 ถนนพระราม 9<br>
                แขวงบางกะปิ เขตห้วยขวาง<br>
                กรุงเทพฯ 10310<br>
                โทร: 02-123-4567
              </div>
            </div>
            
            <div class="col col-right">
              <div class="label">ผู้รับ</div>
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
            <div style="font-size: 8px; color: #555; margin-bottom: 1mm;">บาร์โค้ด</div>
            <svg id="barcode" width="90%" height="30px"></svg>
            <div style="font-size: 9px; font-family: monospace; margin-top: 1mm;">${trackingNumber}</div>
          </div>
          
          <div class="cod-box">
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
                displayValue: false,
                margin: 0
              });
              console.log("Barcode generated successfully");
              
              // พิมพ์อัตโนมัติหลังจากสร้างบาร์โค้ดเสร็จ 1 วินาที
              setTimeout(function() {
                window.print();
              }, 1000);
              
            } catch (error) {
              console.error("Error generating barcode:", error);
              document.body.innerHTML += '<div style="color:red;text-align:center;margin:20px;">Error generating barcode: ' + error + '</div>';
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
        <h1 className="text-2xl font-bold mb-6">ทดสอบการทำงานของบาร์โค้ด</h1>
        
        <div className="flex flex-col items-center mb-10 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">บาร์โค้ดตัวอย่าง</h2>
          <svg ref={barcodeRef} className="w-64 h-16 mb-2"></svg>
          <p className="font-mono">{trackingNumber}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">ทดสอบ 1: พิมพ์บาร์โค้ดอย่างเดียว</h2>
            <p className="mb-4 text-sm text-gray-600">
              พิมพ์เฉพาะบาร์โค้ดโดยใช้ JsBarcode ที่โหลดจาก CDN
            </p>
            <Button 
              onClick={printBarcodeOnly} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              พิมพ์บาร์โค้ด
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">ทดสอบ 2: พิมพ์ลาเบลจัดส่ง</h2>
            <p className="mb-4 text-sm text-gray-600">
              พิมพ์ลาเบลจัดส่งที่มีบาร์โค้ดพร้อมข้อมูลอื่นๆ
            </p>
            <Button 
              onClick={printShippingLabel} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              พิมพ์ลาเบลจัดส่ง
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BarcodeTest;
