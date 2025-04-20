
import React, { useRef, useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import JsBarcode from 'jsbarcode';

const TikTokFlashLabel: React.FC = () => {
  // ข้อมูลลาเบล
  const [trackingNumber, setTrackingNumber] = useState('THT64141T9NYG7Z');
  const [warehouseCode, setWarehouseCode] = useState('21S-38041-02');
  const [sortingCode, setSortingCode] = useState('SS1');
  const [customerCode, setCustomerCode] = useState('2TPY_BDC-หน');
  const [senderName, setSenderName] = useState('JSB Candy');
  const [senderPhone, setSenderPhone] = useState('(+66)0836087712');
  const [senderAddress, setSenderAddress] = useState('24 ซอยกาญจนาภิเษก 008 แยก 10, แขวงบางแค, บางแค, กรุงเทพฯ, 10160');
  const [recipientName, setRecipientName] = useState('ศิริขวัญ ดำแก้ว');
  const [recipientPhone, setRecipientPhone] = useState('(+66)09******25');
  const [recipientAddress, setRecipientAddress] = useState('ร้านสามสุข 101/3 ม.1 ตำบลสิชล อ.สิชล จ.นครศรีฯ, สิชล, นครศรีธรรมราช, 80120');
  const [weight, setWeight] = useState('4.000');
  const [orderID, setOrderID] = useState('5785159668395229511');
  const [shippingDate, setShippingDate] = useState('21/04/2025 23:59');
  const [isCOD, setIsCOD] = useState(true);
  const [codAmount, setCodAmount] = useState('0.00');
  
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  // สร้างบาร์โค้ดเมื่อโหลดหน้า
  useEffect(() => {
    if (barcodeRef.current && trackingNumber) {
      try {
        JsBarcode(barcodeRef.current, trackingNumber, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: false
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
    
    // สร้าง QR Code (ใช้ library qrcode.js จาก CDN)
    if (qrCodeRef.current && window.QRCode) {
      qrCodeRef.current.innerHTML = '';
      new window.QRCode(qrCodeRef.current, {
        text: `https://track.flashexpress.com/tracking?billcode=${trackingNumber}`,
        width: 100,
        height: 100
      });
    }
  }, [trackingNumber]);

  // พิมพ์ลาเบล
  const printLabel = () => {
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
        <title>TikTok Shop-Flash Express Label</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.0/build/qrcode.min.js"></script>
        <style>
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 10px;
          }
          .label-container {
            width: 100mm;
            height: 150mm;
            box-sizing: border-box;
            position: relative;
            border: 1px dashed #000;
            page-break-after: always;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #000;
            padding: 5px;
          }
          .tiktok-logo {
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
          }
          .flash-logo {
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
          }
          .service-type {
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
            padding-right: 5px;
          }
          .barcode-section {
            text-align: center;
            border-bottom: 1px solid #000;
            padding: 10px 5px;
          }
          .tracking-number {
            font-weight: bold;
            font-size: 14px;
            margin-top: 5px;
            letter-spacing: 1px;
          }
          .sorting-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .warehouse-code {
            flex: 1;
            padding: 5px;
            border-right: 1px solid #000;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .sorting-code {
            flex: 1;
            padding: 5px;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .sorting-code-value {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .address-section {
            display: flex;
            flex-direction: column;
          }
          .sender, .recipient {
            padding: 5px;
            border-bottom: 1px solid #000;
          }
          .address-label {
            font-weight: bold;
            margin-bottom: 3px;
          }
          .address-content {
            display: flex;
          }
          .address-text {
            flex: 1;
          }
          .phone {
            margin-top: 3px;
          }
          .qrcode-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .cod-section {
            flex: 1;
            background-color: #000;
            color: #fff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border-right: 1px solid #000;
          }
          .cod-text {
            font-size: 24px;
            font-weight: bold;
          }
          .weight-section {
            flex: 1;
            padding: 5px;
            font-size: 10px;
          }
          .signature-section {
            flex: 0.5;
            padding: 5px;
            font-size: 10px;
            text-align: center;
          }
          .footer-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .order-id {
            flex: 1;
            padding: 5px;
            border-right: 1px solid #000;
          }
          .shipping-date {
            flex: 1;
            padding: 5px;
          }
          .pickup-section {
            display: flex;
            justify-content: flex-end;
            padding: 5px;
            font-weight: bold;
            font-size: 12px;
            align-items: center;
          }
          .side-text {
            position: absolute;
            transform: rotate(90deg);
            transform-origin: left top;
            font-size: 9px;
            white-space: nowrap;
          }
          .side-text-left {
            left: 0;
            top: 110mm;
          }
          .side-text-right {
            right: -150mm;
            top: 10mm;
            transform: rotate(-90deg);
            transform-origin: right top;
          }
          .print-button {
            text-align: center;
            margin: 20px;
          }
          .print-button button {
            padding: 10px 20px;
            background-color: #0078D7;
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
          <button onclick="window.print();">พิมพ์ลาเบล</button>
        </div>
        
        <div class="label-container">
          <!-- Side tracking number text -->
          <div class="side-text side-text-left">THT64141T9NYG7Z THT64141T9NYG7Z THT64141T9NYG7Z</div>
          <div class="side-text side-text-right">THT64141T9NYG7Z THT64141T9NYG7Z THT64141T9NYG7Z</div>
          
          <!-- Header section with logos -->
          <div class="header">
            <div class="tiktok-logo">TikTok Shop</div>
            <div class="flash-logo">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCA4MCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTQuMzQ2IDcuMjkxTDguNzkxIDBIMi44ODZsOC43OTEgMTEuNDYyTDE0LjM0NiA3LjI5MVoiIGZpbGw9IiNGRkEwMTAiLz48cGF0aCBkPSJNNS40MjMgMTkuOTk5TDExLjY3NyAxMS40NjNMMTQuMzQ2IDcuMjkxTDExLjY3NyAxMS40NjNMMTcuMjMyIDE5Ljk5OUgyMy4xMzdMMTQuMzQ2IDcuMjkxSDguNDQyTDAgMTkuOTk5SDUuNDIzWiIgZmlsbD0iI0ZGQTAXME9II2ZmZmZmZiIvPjxwYXRoIGQ9Ik0yNy4wOTcgNC4yMzFoMTAuOTg2djIuNTcyaC03Ljc0MXYyLjQzMWg2LjM1N3YyLjU3MmgtNi4zNTd2Mi42OTFoNy45NTh2Mi41NzJIMjcuMDk2VjQuMjMxaDAuMDAxWiIgZmlsbD0iI0ZGQTAXME9II2ZmZmZmZiIvPjxwYXRoIGQ9Ik0zOS41NTEgNC4yMzFoMy43MzRMMzguODA2IDE3LjA2OWgtMy40NjNMMzAuODYyIDQuMjMxaDMuODE0bDIuNDI1IDguMzgxIDIuNDUtOC4zODFaIiBmaWxsPSIjRkZBMDEwIi8+PCvzdmciPg==" alt="Flash Express">
            </div>
            <div class="service-type">Standard</div>
          </div>
          
          <!-- Barcode section -->
          <div class="barcode-section">
            <svg id="printBarcode"></svg>
            <div class="tracking-number">${trackingNumber}</div>
          </div>
          
          <!-- Sorting section -->
          <div class="sorting-section">
            <div class="warehouse-code">${warehouseCode}</div>
            <div class="sorting-code">
              <div class="sorting-code-value">${sortingCode}</div>
              <div>${customerCode}</div>
              <div>พระอุบน</div>
            </div>
          </div>
          
          <!-- Sender address -->
          <div class="address-section">
            <div class="sender">
              <div class="address-content">
                <div class="address-label">จาก</div>
                <div class="address-text">
                  ${senderName}
                  <div class="phone">${senderPhone}</div>
                  <div>${senderAddress}</div>
                </div>
              </div>
            </div>
            
            <!-- Recipient address -->
            <div class="recipient">
              <div class="address-content">
                <div class="address-label">ถึง</div>
                <div class="address-text">
                  ${recipientName}
                  <div class="phone">${recipientPhone}</div>
                  <div>${recipientAddress}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- QR code and COD section -->
          <div class="qrcode-section">
            <div class="cod-section">
              <div class="cod-text">COD</div>
            </div>
            <div class="weight-section">
              Weight : ${weight} KG
            </div>
            <div class="signature-section">
              Signature:
            </div>
            <div id="qrcode-container" style="position:absolute; right:10px; top:290px; width:100px; height:100px;"></div>
          </div>
          
          <!-- Footer information -->
          <div class="footer-section">
            <div class="order-id">
              Order ID:<br>
              ${orderID}
            </div>
            <div class="shipping-date">
              Shipping Date:<br>
              ${shippingDate}<br>
              Estimated Date:
            </div>
          </div>
          
          <!-- Pickup section -->
          <div class="pickup-section">
            PICK-UP
          </div>
          
          <!-- Scissors line -->
          <div style="position:absolute; bottom:0; left:0; right:0; border-bottom:1px dashed #000; height:1px;"></div>
          <div style="position:absolute; bottom:0; left:5px; font-size:16px;">✂</div>
        </div>
        
        <script>
          window.onload = function() {
            // Generate barcode
            JsBarcode("#printBarcode", "${trackingNumber}", {
              format: "CODE128",
              width: 2,
              height: 60,
              displayValue: false
            });
            
            // Generate QR code
            new QRCode(document.getElementById("qrcode-container"), {
              text: "https://track.flashexpress.com/tracking?billcode=${trackingNumber}",
              width: 100,
              height: 100
            });
            
            // Print automatically after 1 second
            setTimeout(function() {
              window.print();
            }, 1000);
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
        <h1 className="text-2xl font-bold mb-6">TikTok Shop - Flash Express Label</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6 flex justify-end">
                  <Button onClick={printLabel} className="bg-blue-600 hover:bg-blue-700">
                    <i className="fa-solid fa-print mr-2"></i> พิมพ์ลาเบล
                  </Button>
                </div>
                
                {/* ตัวอย่างลาเบล */}
                <div className="border border-gray-300 w-full h-auto aspect-[2/3] relative overflow-hidden bg-white">
                  {/* ข้อความด้านข้าง */}
                  <div className="absolute -left-32 top-80 rotate-90 text-[9px] whitespace-nowrap">
                    {trackingNumber} {trackingNumber} {trackingNumber}
                  </div>
                  <div className="absolute -right-32 top-32 -rotate-90 text-[9px] whitespace-nowrap">
                    {trackingNumber} {trackingNumber} {trackingNumber}
                  </div>
                  
                  {/* ส่วนหัว */}
                  <div className="flex justify-between border-b border-black p-1">
                    <div className="text-sm font-bold">TikTok Shop</div>
                    <div className="text-sm font-bold">FLASH express</div>
                    <div className="text-sm font-bold">Standard</div>
                  </div>
                  
                  {/* ส่วนบาร์โค้ด */}
                  <div className="text-center border-b border-black p-2">
                    <svg ref={barcodeRef} className="w-full h-16 mx-auto"></svg>
                    <div className="text-sm font-bold mt-1">{trackingNumber}</div>
                  </div>
                  
                  {/* ส่วนรหัสคลัง */}
                  <div className="flex border-b border-black">
                    <div className="flex-1 border-r border-black p-2 text-center font-bold text-lg flex items-center justify-center">
                      {warehouseCode}
                    </div>
                    <div className="flex-1 p-2 text-center flex flex-col justify-center">
                      <div className="font-bold text-lg">{sortingCode}</div>
                      <div className="text-xs">{customerCode}</div>
                      <div className="text-xs">พระอุบน</div>
                    </div>
                  </div>
                  
                  {/* ส่วนที่อยู่ผู้ส่ง */}
                  <div className="border-b border-black p-2 text-xs">
                    <div className="flex">
                      <div className="font-bold mr-1">จาก</div>
                      <div>
                        {senderName}
                        <div>{senderPhone}</div>
                        <div className="text-[9px]">{senderAddress}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* ส่วนที่อยู่ผู้รับ */}
                  <div className="border-b border-black p-2 text-xs">
                    <div className="flex">
                      <div className="font-bold mr-1">ถึง</div>
                      <div>
                        {recipientName}
                        <div>{recipientPhone}</div>
                        <div className="text-[9px]">{recipientAddress}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* ส่วน COD และ QR */}
                  <div className="flex border-b border-black relative">
                    <div className="flex-1 bg-black text-white p-2 text-center flex items-center justify-center border-r border-black">
                      <span className="text-xl font-bold">COD</span>
                    </div>
                    <div className="flex-1 p-1 text-xs">
                      Weight : {weight} KG
                    </div>
                    <div className="flex-[0.5] p-1 text-xs text-center">
                      Signature:
                    </div>
                    {/* QR Code */}
                    <div ref={qrCodeRef} className="absolute right-2 top-0 w-[100px] h-[100px]"></div>
                  </div>
                  
                  {/* ส่วนเลขออเดอร์และวันที่ */}
                  <div className="flex border-b border-black text-xs">
                    <div className="flex-1 p-2 border-r border-black">
                      Order ID:<br />
                      {orderID}
                    </div>
                    <div className="flex-1 p-2">
                      Shipping Date:<br />
                      {shippingDate}<br />
                      Estimated Date:
                    </div>
                  </div>
                  
                  {/* ส่วน PICK-UP */}
                  <div className="p-2 text-right font-bold">
                    PICK-UP
                  </div>
                  
                  {/* เส้นตัด */}
                  <div className="absolute bottom-0 left-0 right-0 border-b border-dashed border-black"></div>
                  <div className="absolute bottom-0 left-1 text-lg">✂</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* ฟอร์มแก้ไขข้อมูล */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">ข้อมูลลาเบล</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">เลขพัสดุ</label>
                    <Input 
                      value={trackingNumber} 
                      onChange={(e) => setTrackingNumber(e.target.value)} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">รหัสคลัง</label>
                      <Input 
                        value={warehouseCode} 
                        onChange={(e) => setWarehouseCode(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">รหัสคัดแยก</label>
                      <Input 
                        value={sortingCode} 
                        onChange={(e) => setSortingCode(e.target.value)} 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">รหัสลูกค้า</label>
                    <Input 
                      value={customerCode} 
                      onChange={(e) => setCustomerCode(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">ชื่อผู้ส่ง</label>
                    <Input 
                      value={senderName} 
                      onChange={(e) => setSenderName(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">เบอร์โทรผู้ส่ง</label>
                    <Input 
                      value={senderPhone} 
                      onChange={(e) => setSenderPhone(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">ที่อยู่ผู้ส่ง</label>
                    <Input 
                      value={senderAddress} 
                      onChange={(e) => setSenderAddress(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">ชื่อผู้รับ</label>
                    <Input 
                      value={recipientName} 
                      onChange={(e) => setRecipientName(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">เบอร์โทรผู้รับ</label>
                    <Input 
                      value={recipientPhone} 
                      onChange={(e) => setRecipientPhone(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">ที่อยู่ผู้รับ</label>
                    <Input 
                      value={recipientAddress} 
                      onChange={(e) => setRecipientAddress(e.target.value)} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">น้ำหนัก (KG)</label>
                      <Input 
                        value={weight} 
                        onChange={(e) => setWeight(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">วันที่จัดส่ง</label>
                      <Input 
                        value={shippingDate} 
                        onChange={(e) => setShippingDate(e.target.value)} 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">เลขออร์เดอร์</label>
                    <Input 
                      value={orderID} 
                      onChange={(e) => setOrderID(e.target.value)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TikTokFlashLabel;
