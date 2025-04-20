import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * หน้าสำหรับพิมพ์ลาเบล J&T Express
 * ลาเบลถูกออกแบบให้คล้ายกับลาเบลจริงของ J&T
 */
const JTExpressLabel: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('JT20250420001');
  const [codAmount, setCodAmount] = useState('599.00');
  const [recipientName, setRecipientName] = useState('คุณสมชาย ใจดี');
  const [recipientPhone, setRecipientPhone] = useState('0812345678');
  const [recipientAddress, setRecipientAddress] = useState('123/45 หมู่ 6 ถ.สุขุมวิท');
  const [recipientDistrict, setRecipientDistrict] = useState('คลองเตย');
  const [recipientProvince, setRecipientProvince] = useState('กรุงเทพมหานคร');
  const [recipientZipcode, setRecipientZipcode] = useState('10110');
  const [senderName, setSenderName] = useState('BLUEDASH');
  const [senderPhone, setSenderPhone] = useState('021234567');
  const [senderAddress, setSenderAddress] = useState('888 อาคารมณียาเซ็นเตอร์ ถ.พระราม 4');
  const [senderDistrict, setSenderDistrict] = useState('ลุมพินี');
  const [senderProvince, setSenderProvince] = useState('กรุงเทพมหานคร');
  const [senderZipcode, setSenderZipcode] = useState('10330');
  const [sortingCode, setSortingCode] = useState('BKK-01A');
  
  // พื้นที่สำหรับการคัดแยกพัสดุ J&T Express
  const sortingAreas = [
    { code: 'BKK-01A', name: 'กรุงเทพฯ เขตเหนือ' },
    { code: 'BKK-01B', name: 'กรุงเทพฯ เขตใต้' },
    { code: 'BKK-01C', name: 'กรุงเทพฯ เขตตะวันออก' },
    { code: 'BKK-01D', name: 'กรุงเทพฯ เขตตะวันตก' },
    { code: 'BKK-01E', name: 'กรุงเทพฯ เขตกลาง' },
    { code: 'CTI-02A', name: 'ปริมณฑล นนทบุรี' },
    { code: 'CTI-02B', name: 'ปริมณฑล ปทุมธานี' },
    { code: 'CTI-02C', name: 'ปริมณฑล สมุทรปราการ' },
    { code: 'NRT-03A', name: 'ภาคเหนือ เชียงใหม่' },
    { code: 'NRT-03B', name: 'ภาคเหนือ เชียงราย' },
    { code: 'EST-04A', name: 'ภาคตะวันออก ชลบุรี' },
    { code: 'EST-04B', name: 'ภาคตะวันออก ระยอง' },
    { code: 'NEA-05A', name: 'ภาคอีสาน นครราชสีมา' },
    { code: 'NEA-05B', name: 'ภาคอีสาน ขอนแก่น' },
    { code: 'NEA-05C', name: 'ภาคอีสาน อุบลราชธานี' },
    { code: 'STH-06A', name: 'ภาคใต้ สุราษฎร์ธานี' },
    { code: 'STH-06B', name: 'ภาคใต้ สงขลา' },
    { code: 'STH-06C', name: 'ภาคใต้ ภูเก็ต' },
  ];
  
  // ฟังก์ชันสำหรับพิมพ์ลาเบล
  const printLabel = () => {
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
        <title>ใบลาเบลพัสดุ J&T Express - ${trackingNumber}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
        <style>
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          body { 
            font-family: 'Kanit', sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .page {
            width: 100mm;
            height: 150mm;
            background-color: white;
            margin: 10px auto;
            padding: 0;
            box-shadow: 0 1px 5px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
          }
          .label-container { 
            width: 100%; 
            height: 100%; 
            box-sizing: border-box;
            padding: 2mm;
            position: relative;
          }
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 2mm;
            border-bottom: 1px solid #ddd;
            padding-bottom: 2mm;
          }
          .logo {
            width: 20mm;
            height: 10mm;
            background-color: #e61e25; /* J&T สีแดง */
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            border-radius: 2px;
          }
          .logo-text {
            font-size: 18px;
            font-weight: bold;
          }
          .header-text {
            flex: 1;
            margin-left: 3mm;
          }
          .tracking-label {
            font-size: 8px;
            color: #666;
          }
          .tracking-number {
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .barcode-container {
            margin: 2mm 0;
            text-align: center;
            padding: 2mm 0;
            background-color: #fff;
          }
          .section {
            margin-bottom: 2mm;
          }
          .section-title {
            font-size: 9px;
            font-weight: bold;
            background-color: #f8f8f8;
            padding: 1mm;
            border-radius: 2px;
            margin-bottom: 1mm;
          }
          .section-content {
            font-size: 11px;
            line-height: 1.3;
            padding: 0 1mm;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2mm;
          }
          .recipient-box, .sender-box {
            border: 1px solid #ddd;
            border-radius: 2px;
            padding: 2mm;
            min-height: 20mm;
          }
          .recipient-box {
            border-width: 2px;
          }
          .name {
            font-weight: bold;
          }
          .cod-section {
            background-color: #ffe6e6;
            border: 1px dashed #e61e25;
            padding: 2mm;
            margin-top: 2mm;
            border-radius: 2px;
            text-align: center;
            font-weight: bold;
          }
          .cod-text {
            color: #e61e25;
            font-size: 14px;
          }
          .footer {
            font-size: 8px;
            text-align: center;
            margin-top: 2mm;
            color: #666;
          }
          .print-button { 
            text-align: center; 
            margin: 20px; 
          }
          .print-button button { 
            padding: 10px 20px; 
            background: #e61e25;
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
            font-family: 'Kanit', sans-serif;
            font-size: 14px;
          }
          .print-button button:hover {
            background: #d91c22;
          }
          .label-size-info { 
            text-align: center; 
            margin-bottom: 10px; 
            font-size: 14px; 
            color: #666; 
          }
          @media print {
            body { background-color: white; }
            .page { box-shadow: none; margin: 0; }
            .print-button, .label-size-info { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print();">พิมพ์ใบลาเบล</button>
        </div>
        
        <div class="label-size-info">
          ขนาดใบลาเบล: 100x150mm (J&T Express)
        </div>
        
        <div class="page">
          <div class="label-container">
            <div class="header">
              <div class="logo">J&T</div>
              <div class="header-text">
                <div class="tracking-label">เลขพัสดุ / Tracking No.</div>
                <div class="tracking-number">${trackingNumber}</div>
              </div>
            </div>
            
            <div class="barcode-container">
              <svg id="barcode"></svg>
            </div>

            <div class="sorting-code-container">
              <div style="font-size: 14px; text-align: center; font-weight: bold; background-color: #eee; padding: 3mm; margin: 2mm 0; border-radius: 2px;">
                รหัสพื้นที่คัดแยก: <span style="color: #e61e25;">${sortingCode}</span>
              </div>
            </div>

            <div class="grid-2">
              <div class="qr-code-container">
                <div id="qrcode"></div>
              </div>
              
              <div>
              <div class="section">
                <div class="section-title">ผู้รับ / RECIPIENT</div>
                <div class="recipient-box">
                  <div class="name">${recipientName}</div>
                  <div>${recipientPhone}</div>
                  <div>${recipientAddress}</div>
                  <div>${recipientDistrict} ${recipientProvince} ${recipientZipcode}</div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">ผู้ส่ง / SENDER</div>
                <div class="sender-box">
                  <div class="name">${senderName}</div>
                  <div>${senderPhone}</div>
                  <div>${senderAddress}</div>
                  <div>${senderDistrict} ${senderProvince} ${senderZipcode}</div>
                </div>
              </div>
            </div>
            
            <div class="cod-section">
              <div style="font-size: 10px; margin-bottom: 2px;">เก็บเงินปลายทาง / Cash on Delivery</div>
              <div class="cod-text">฿ ${codAmount}</div>
            </div>
            
            <div class="footer">
              J&T Express Thailand • สายด่วน 1625 • www.jtexpress.co.th
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            try {
              // สร้างบาร์โค้ดด้วยขนาดใหญ่ขึ้น
              JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                width: 3,
                height: 60,
                displayValue: true,
                fontSize: 14,
                margin: 0
              });
              
              // สร้าง QR code
              QRCode.toCanvas(document.getElementById('qrcode'), "${trackingNumber}", {
                width: 100,
                margin: 1,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                }
              }, function(error) {
                if (error) console.error('Error generating QR Code:', error);
              });
              
              console.log("Generated barcode and QR code successfully");
              
              // หลังจากสร้างบาร์โค้ดเสร็จ 500ms ให้พิมพ์อัตโนมัติ
              setTimeout(function() {
                // window.print(); // ไม่เปิดใช้งานเพื่อให้ผู้ใช้กดปุ่มพิมพ์เอง
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
        <h1 className="text-2xl font-bold mb-6">ออกแบบลาเบล J&T Express</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <CardContent className="p-0 space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-4">ข้อมูลการจัดส่ง</h2>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="trackingNumber">เลขพัสดุ</Label>
                    <Input
                      id="trackingNumber"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="ระบุเลขพัสดุ"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sortingCode">รหัสพื้นที่คัดแยกพัสดุ</Label>
                    <Select
                      value={sortingCode}
                      onValueChange={setSortingCode}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกพื้นที่คัดแยก" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortingAreas.map((area) => (
                          <SelectItem key={area.code} value={area.code}>
                            {area.code} - {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="codAmount">จำนวนเงิน COD (บาท)</Label>
                    <Input
                      id="codAmount"
                      value={codAmount}
                      onChange={(e) => setCodAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-2">ข้อมูลผู้รับ</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="recipientName">ชื่อผู้รับ</Label>
                    <Input
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="ชื่อ-นามสกุล"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="recipientPhone">เบอร์โทรผู้รับ</Label>
                    <Input
                      id="recipientPhone"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="เบอร์โทรศัพท์"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="recipientAddress">ที่อยู่</Label>
                    <Input
                      id="recipientAddress"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="บ้านเลขที่ หมู่บ้าน ถนน..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="recipientDistrict">เขต/อำเภอ</Label>
                      <Input
                        id="recipientDistrict"
                        value={recipientDistrict}
                        onChange={(e) => setRecipientDistrict(e.target.value)}
                        placeholder="เขต/อำเภอ"
                      />
                    </div>
                    <div>
                      <Label htmlFor="recipientProvince">จังหวัด</Label>
                      <Input
                        id="recipientProvince"
                        value={recipientProvince}
                        onChange={(e) => setRecipientProvince(e.target.value)}
                        placeholder="จังหวัด"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="recipientZipcode">รหัสไปรษณีย์</Label>
                    <Input
                      id="recipientZipcode"
                      value={recipientZipcode}
                      onChange={(e) => setRecipientZipcode(e.target.value)}
                      placeholder="รหัสไปรษณีย์"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-4">
            <CardContent className="p-0 space-y-4">
              <div>
                <h3 className="text-md font-semibold mb-2">ข้อมูลผู้ส่ง</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="senderName">ชื่อผู้ส่ง</Label>
                    <Input
                      id="senderName"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="ชื่อ-นามสกุล หรือ ชื่อบริษัท"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="senderPhone">เบอร์โทรผู้ส่ง</Label>
                    <Input
                      id="senderPhone"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="เบอร์โทรศัพท์"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="senderAddress">ที่อยู่</Label>
                    <Input
                      id="senderAddress"
                      value={senderAddress}
                      onChange={(e) => setSenderAddress(e.target.value)}
                      placeholder="บ้านเลขที่ หมู่บ้าน ถนน..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="senderDistrict">เขต/อำเภอ</Label>
                      <Input
                        id="senderDistrict"
                        value={senderDistrict}
                        onChange={(e) => setSenderDistrict(e.target.value)}
                        placeholder="เขต/อำเภอ"
                      />
                    </div>
                    <div>
                      <Label htmlFor="senderProvince">จังหวัด</Label>
                      <Input
                        id="senderProvince"
                        value={senderProvince}
                        onChange={(e) => setSenderProvince(e.target.value)}
                        placeholder="จังหวัด"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="senderZipcode">รหัสไปรษณีย์</Label>
                    <Input
                      id="senderZipcode"
                      value={senderZipcode}
                      onChange={(e) => setSenderZipcode(e.target.value)}
                      placeholder="รหัสไปรษณีย์"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={printLabel} className="w-full bg-red-600 hover:bg-red-700">
                  สร้างและพิมพ์ลาเบล J&T Express
                </Button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  ขนาดลาเบล: 100x150mm (ขนาดมาตรฐานของ J&T Express)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default JTExpressLabel;