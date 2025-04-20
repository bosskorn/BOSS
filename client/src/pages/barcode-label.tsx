import React, { useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import JsBarcode from 'jsbarcode';

const BarcodeLabel: React.FC = () => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const trackingNumber = "TMP5079863352"; // ตัวอย่างเลขติดตาม
  
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

  const printBarcode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>บาร์โค้ดสำหรับพิมพ์</title>
        <script src="https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 20px; }
          .container { 
            width: 100mm; 
            height: 75mm; 
            margin: 0 auto; 
            padding: 5mm;
            border: 1px solid #ccc;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            margin-bottom: 5mm;
            font-size: 16px;
            font-weight: bold;
            color: #8A2BE2;
          }
          .barcode-container {
            text-align: center;
            margin: 10mm 0;
          }
          .tracking-number {
            text-align: center;
            font-family: monospace;
            font-size: 14px;
            margin-top: 3mm;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .container { border: none; }
            @page { size: 100mm 75mm; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">PURPLEDASH</div>
          <div class="barcode-container">
            <svg id="barcode" width="90%" height="40px"></svg>
          </div>
          <div class="tracking-number">${trackingNumber}</div>
        </div>
        
        <script>
          window.onload = function() {
            JsBarcode("#barcode", "${trackingNumber}", {
              format: "CODE128",
              lineColor: "#000",
              width: 2,
              height: 40,
              displayValue: false,
              margin: 0
            });
            
            // พิมพ์อัตโนมัติหลังจากสร้างบาร์โค้ดเสร็จ
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">ทดสอบพิมพ์บาร์โค้ดลาเบล</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">บาร์โค้ดตัวอย่าง</h2>
          <div className="flex flex-col items-center">
            <svg ref={barcodeRef} className="w-full max-w-md h-20"></svg>
            <div className="mt-2 font-mono">{trackingNumber}</div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button onClick={printBarcode} className="bg-purple-600 hover:bg-purple-700">
            พิมพ์บาร์โค้ด (ขนาด 100x75mm)
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default BarcodeLabel;
