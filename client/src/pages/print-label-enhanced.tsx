import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const PrintLabelEnhanced: React.FC = () => {
  const [labelSize, setLabelSize] = useState<'100x100mm' | '100x75mm'>('100x75mm');
  const [showPrintDialog, setShowPrintDialog] = useState(false);

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
        <title>ทดสอบการพิมพ์ลาเบล</title>
        <meta charset="UTF-8">
        <script src="https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          body, html { 
            margin: 0;
            padding: 0;
            font-family: 'Kanit', sans-serif;
            -webkit-print-color-adjust: exact;
            background-color: #f0f0f0;
          }
          
          @media print {
            body {
              background-color: white;
              margin: 0;
              padding: 0;
            }
            @page {
              size: ${labelSize};
              margin: 0;
            }
          }
          
          .page {
            ${labelSize === '100x75mm' 
              ? 'width: 377px; height: 283px;' /* ~100mm x 75mm at 96dpi */
              : 'width: 377px; height: 377px;' /* ~100mm x 100mm at 96dpi */}
            background-color: white;
            margin: 20px auto;
            padding: 0;
            box-shadow: 0 1px 5px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
          }
          
          .label-container { 
            width: 100%; 
            height: 100%; 
            box-sizing: border-box;
            padding: 5mm;
            position: relative;
          }
          
          .logo { 
            text-align: center; 
            margin-bottom: 2mm; 
            font-size: 16px; 
            font-weight: bold; 
            color: #8A2BE2; 
          }
          
          .tracking { 
            text-align: center; 
            margin-bottom: 2mm; 
            padding: 1.5mm; 
            border: 1px solid #8A2BE2; 
            border-radius: 3px; 
            background-color: #faf6ff;
          }
          
          .tracking-number {
            font-weight: bold;
          }
          
          .flex-container {
            display: flex;
            margin-top: 2mm;
          }
          
          .box {
            flex: 1;
            border: 1px solid #e0e0e0;
            padding: 1.5mm;
            border-radius: 3px;
            margin-bottom: 2mm;
          }
          
          .title {
            font-weight: bold;
            font-size: 9px;
            background-color: #f7f7f7;
            padding: 1px 3px;
            border-radius: 2px;
          }
          
          .address {
            font-size: 8px;
            line-height: 1.2;
          }
          
          .barcode-box {
            margin-top: 1mm;
            text-align: center;
            background-color: #f9f9f9;
            padding: 2mm 0;
            border-radius: 2px;
            border: 1px solid #ddd;
          }
          
          .barcode-title {
            font-size: 9px;
            color: #666;
            margin-bottom: 3px;
          }
          
          .tracking-text {
            font-size: 9px;
            margin-top: 3px;
          }
          
          .print-button {
            text-align: center;
            margin: 20px 0;
          }
          
          .print-button button {
            background-color: #8A2BE2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print();">พิมพ์ลาเบล</button>
        </div>
        
        <div class="page">
          <div class="label-container">
            <div class="logo">PURPLEDASH</div>
            
            <div class="tracking">
              <div class="tracking-number">${trackingNumber}</div>
            </div>
            
            <div class="flex-container">
              <div style="flex: 1; padding-right: 2mm;">
                <div class="title">ผู้ส่ง</div>
                <div class="box address">
                  <strong>PURPLEDASH</strong><br />
                  เลขที่ 888 อาคารมณียาเซ็นเตอร์<br />
                  ถนนพระราม 4 แขวงลุมพินี<br />
                  เขตปทุมวัน กรุงเทพฯ 10330<br />
                  โทร: 02-123-4567
                </div>
              </div>
              
              <div style="flex: 1; border-left: 1px solid #ddd; padding-left: 2mm;">
                <div class="title">ผู้รับ</div>
                <div class="box address">
                  <strong>ทดสอบ ผู้รับ</strong><br />
                  123 หมู่ 4 ถนนลาซาล แขวงบางนา<br />
                  เขตบางนา กรุงเทพมหานคร<br />
                  10260<br />
                  โทร: 081-234-5678
                </div>
              </div>
            </div>
            
            <div class="barcode-box">
              <div class="barcode-title">บาร์โค้ด</div>
              <svg id="barcode" width="95%" height="35px"></svg>
              <div class="tracking-text">${trackingNumber}</div>
            </div>
            
            <div style="text-align: center; font-size: 9px; margin-top: 2mm; background-color: #fff6f6; padding: 1mm; border-radius: 2px;">
              เก็บเงินปลายทาง: 500.00 บาท
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            try {
              JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                lineColor: "#000",
                width: 1.5,
                height: 30,
                displayValue: false,
                margin: 0
              });
              console.log("บาร์โค้ดถูกสร้างสำเร็จ");
              
              // พิมพ์อัตโนมัติหลังจากสร้างบาร์โค้ดเสร็จ
              setTimeout(function() {
                window.print();
              }, 500);
            } catch (error) {
              console.error("เกิดข้อผิดพลาดในการสร้างบาร์โค้ด:", error);
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">ทดสอบพิมพ์ลาเบลที่ปรับปรุงใหม่</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>เลือกขนาดลาเบล</CardTitle>
              <CardDescription>
                กำหนดขนาดกระดาษที่ต้องการพิมพ์ลาเบล
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ขนาดลาเบล</label>
                  <Select value={labelSize} onValueChange={(value: any) => setLabelSize(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกขนาดลาเบล" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100x100mm">ขนาด 100 x 100 มม.</SelectItem>
                      <SelectItem value="100x75mm">ขนาด 100 x 75 มม.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={printBarcode} className="bg-purple-600 hover:bg-purple-700 w-full">
                พิมพ์ลาเบลและบาร์โค้ด
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ตัวอย่างลาเบล</CardTitle>
              <CardDescription>
                ลักษณะของลาเบลที่จะพิมพ์ (รูปแบบอาจแตกต่างเล็กน้อย)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="bg-white p-4 rounded border border-gray-200 shadow-sm text-center">
                  <div className="text-purple-700 font-bold mb-2">PURPLEDASH</div>
                  <div className="border border-purple-200 bg-purple-50 py-1 px-2 rounded text-sm mb-3">
                    TMP5079863352
                  </div>
                  <div className="flex text-xs mb-2">
                    <div className="w-1/2 border-r border-gray-200 pr-2 text-left">
                      <div className="font-semibold mb-1">ผู้ส่ง:</div>
                      <div className="text-gray-600">
                        PURPLEDASH<br />
                        กรุงเทพฯ 10330
                      </div>
                    </div>
                    <div className="w-1/2 pl-2 text-left">
                      <div className="font-semibold mb-1">ผู้รับ:</div>
                      <div className="text-gray-600">
                        ทดสอบ ผู้รับ<br />
                        กรุงเทพมหานคร 10260
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 bg-gray-50 py-2 px-1 rounded text-xs">
                    <div className="text-gray-500 mb-1">บาร์โค้ด</div>
                    <div className="h-6 bg-gray-800 mx-auto w-3/4"></div>
                    <div className="mt-1 font-mono text-xs">TMP5079863352</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PrintLabelEnhanced;
