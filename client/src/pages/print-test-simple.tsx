import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';

const PrintTestSimple: React.FC = () => {
  const printBarcode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    const trackingNumber = "TMP5079863352"; // ตัวอย่างเลขติดตาม
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ทดสอบการพิมพ์บาร์โค้ด</title>
        <meta charset="UTF-8">
        <script src="https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page { 
            size: 100mm 75mm; 
            margin: 0; 
          }
          body { 
            margin: 0; 
            padding: 0;
            background-color: white;
            font-family: 'Kanit', 'Prompt', sans-serif;
          }
          .print-container {
            width: 100mm;
            height: 75mm;
            margin: 0;
            padding: 5mm;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            margin-bottom: 3mm;
            font-size: 14px;
            font-weight: bold;
            color: #8A2BE2;
          }
          .tracking-container {
            border: 1px solid #8A2BE2;
            text-align: center;
            padding: 2mm;
            margin-bottom: 3mm;
            border-radius: 2px;
            background-color: #faf5ff;
          }
          .barcode-container {
            text-align: center;
            margin-top: 5mm;
            margin-bottom: 5mm;
          }
          .tracking-text {
            font-size: 12px;
            font-family: monospace;
            margin-top: 2mm;
          }
          .print-button {
            margin: 20px;
            text-align: center;
          }
          .print-button button {
            padding: 10px 20px;
            background-color: #8A2BE2;
            color: white;
            border: none;
            border-radius: 5px;
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
        
        <div class="print-container">
          <div class="header">PURPLEDASH</div>
          
          <div class="tracking-container">
            <div style="font-weight: bold;">${trackingNumber}</div>
          </div>
          
          <div class="barcode-container">
            <svg id="barcode"></svg>
            <div class="tracking-text">${trackingNumber}</div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            try {
              JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                width: 2,
                height: 40,
                displayValue: false,
                margin: 0
              });
              console.log("บาร์โค้ดถูกสร้างสำเร็จ");
              
              // พิมพ์อัตโนมัติหลังจากโหลดเสร็จ 0.5 วินาที
              setTimeout(function() {
                window.print();
              }, 500);
            } catch (error) {
              console.error("เกิดข้อผิดพลาดในการสร้างบาร์โค้ด:", error);
              document.body.innerHTML += '<div style="color:red; text-align:center; margin-top:20px;">เกิดข้อผิดพลาดในการสร้างบาร์โค้ด: ' + error.message + '</div>';
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
        <h1 className="text-2xl font-bold mb-6">ทดสอบพิมพ์บาร์โค้ดอย่างง่าย</h1>
        <p className="mb-4">คลิกปุ่มด้านล่างเพื่อเปิดหน้าต่างพิมพ์บาร์โค้ดตัวอย่าง</p>
        
        <Button onClick={printBarcode} className="bg-purple-600 hover:bg-purple-700">
          พิมพ์บาร์โค้ดทดสอบ
        </Button>
      </div>
    </Layout>
  );
};

export default PrintTestSimple;
