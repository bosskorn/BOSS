import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * หน้าสำหรับพิมพ์ลาเบล Flash Express
 * ลาเบลถูกออกแบบตามตัวอย่างที่ผู้ใช้แนบมา
 */
const FlashExpressLabel: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('THT64141T9NYG7Z');
  const [sortingCode, setSortingCode] = useState('SS1');
  const [senderName, setSenderName] = useState('JSB Candy');
  const [senderPhone, setSenderPhone] = useState('(+66)0836087712');
  const [senderAddress, setSenderAddress] = useState('24 ซอยกาญจนาภิเษก 008 แยก 10, แขวงบางแค, บางแค, กรุงเทพ, 10160');
  const [recipientName, setRecipientName] = useState('ศริขวัญ ดําแกว');
  const [recipientPhone, setRecipientPhone] = useState('(+66)09******25');
  const [recipientAddress, setRecipientAddress] = useState('ร้านสามสุข 101/3 ม.1 ตำบลสิชล อ.สิชล จ.นครศรีฯ, สิชล, นครศรีธรรมราช, 80120');
  const [weight, setWeight] = useState('4.000');
  const [orderID, setOrderID] = useState('578515966839522951');
  const [serviceType, setServiceType] = useState('Standard');
  const [codAmount, setCodAmount] = useState('0.00');
  const [warehouseCode, setWarehouseCode] = useState('21S-38041-02');
  const [customerCode, setCustomerCode] = useState('2TPY_BDC-ต้น');
  const [district, setDistrict] = useState('พะยอม');
  const [shippingDate, setShippingDate] = useState('21/04/2025 23:59');
  const [cashless, setCashless] = useState(true);
  const [pickupPackage, setPickupPackage] = useState(true);
  
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
        <title>ใบลาเบล Flash Express - ${trackingNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700&display=swap');
          
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          body { 
            font-family: 'Kanit', sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
            box-sizing: border-box;
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
            border: 1px solid #ddd;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3mm 5mm;
            border-bottom: 1px solid #ddd;
            background-color: #fff;
          }
          .tiktok-logo {
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
          }
          .tiktok-logo:before {
            content: "♪";
            font-size: 18px;
            margin-right: 2px;
          }
          .flash-logo {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
          }
          .flash-logo:after {
            content: "";
            display: inline-block;
            width: 5mm;
            height: 5mm;
            background-color: #FFCC00;
            margin-left: 2px;
            clip-path: polygon(0 0, 100% 50%, 0 100%);
          }
          .service-type {
            font-size: 14px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .tracking-number-box {
            position: relative;
            width: 100%;
            text-align: center;
            margin-top: 3mm;
            padding: 0 5mm;
            box-sizing: border-box;
          }
          .barcode-container {
            width: 100%;
            height: 20mm;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 2mm;
          }
          .barcode {
            width: 90%;
            height: 16mm;
          }
          .tracking-number-text {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin-top: 1mm;
          }
          .info-row {
            display: flex;
            border-bottom: 1px solid #eee;
            margin: 0;
          }
          .warehouse-box {
            flex: 1;
            padding: 2mm 3mm;
            border-right: 1px solid #eee;
            font-weight: bold;
            font-size: 12px;
          }
          .sorting-box {
            width: 40%;
            padding: 2mm 3mm;
            font-weight: bold;
            text-align: right;
            font-size: 12px;
          }
          .customer-code {
            display: block;
            text-align: right;
            font-size: 10px;
          }
          .district-text {
            display: block;
            text-align: right;
            font-size: 10px;
          }
          .shipper-info {
            padding: 2mm 3mm;
            border-bottom: 1px solid #eee;
            font-size: 12px;
            line-height: 1.2;
          }
          .recipient-info {
            padding: 2mm 3mm;
            border-bottom: 1px solid #eee;
            font-size: 12px;
            line-height: 1.2;
          }
          .qr-section {
            position: absolute;
            right: 3mm;
            top: 70mm;
            width: 30mm;
            height: 30mm;
          }
          .qr-code {
            width: 100%;
            height: 100%;
          }
          .cod-row {
            display: flex;
            border-bottom: 1px solid #eee;
          }
          .cod-box {
            flex: 2;
            background-color: #000;
            color: #fff;
            padding: 2mm 3mm;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 16px;
          }
          .cod-text {
            font-size: 12px;
            padding-top: 1mm;
          }
          .weight-box {
            flex: 1;
            padding: 2mm 3mm;
            display: flex;
            flex-direction: column;
            font-size: 12px;
          }
          .signature-label {
            margin-bottom: 2mm;
          }
          .weight-info {
            font-size: 11px;
          }
          .order-row {
            display: flex;
            border-bottom: 1px dashed #eee;
          }
          .order-id-box {
            flex: 1;
            padding: 2mm 3mm;
            font-size: 10px;
          }
          .date-box {
            flex: 1;
            padding: 2mm 3mm;
            font-size: 10px;
          }
          .pickup-badge {
            position: absolute;
            bottom: 10mm;
            right: 5mm;
            padding: 1mm 3mm;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .tracking-side {
            position: absolute;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            transform-origin: 0 0;
          }
          .tracking-left-1 {
            transform: rotate(90deg) translate(20mm, -10mm);
            left: 0;
            top: 0;
          }
          .tracking-left-2 {
            transform: rotate(90deg) translate(50mm, -10mm);
            left: 0;
            top: 0;
          }
          .tracking-left-3 {
            transform: rotate(90deg) translate(80mm, -10mm);
            left: 0;
            top: 0;
          }
          .tracking-left-4 {
            transform: rotate(90deg) translate(110mm, -10mm);
            left: 0;
            top: 0;
          }
          .tracking-right-1 {
            transform: rotate(-90deg) translate(-20mm, 99mm);
            right: 0;
            top: 0;
          }
          .tracking-right-2 {
            transform: rotate(-90deg) translate(-50mm, 99mm);
            right: 0;
            top: 0;
          }
          .tracking-right-3 {
            transform: rotate(-90deg) translate(-80mm, 99mm);
            right: 0;
            top: 0;
          }
          .tracking-right-4 {
            transform: rotate(-90deg) translate(-110mm, 99mm);
            right: 0;
            top: 0;
          }
          .tracking-number-top {
            position: absolute;
            top: 5mm;
            right: 5mm;
            font-size: 9px;
            font-weight: bold;
          }
          .print-button { 
            text-align: center; 
            margin: 20px; 
          }
          .print-button button { 
            padding: 10px 20px; 
            background: #ff9900;
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
            font-family: 'Kanit', sans-serif;
            font-size: 14px;
          }
          .print-button button:hover {
            background: #e68a00;
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
          ขนาดใบลาเบล: 100x150mm (Flash Express)
        </div>
        
        <div class="page">
          <!-- ส่วนข้อมูลหัวกระดาษ -->
          <div class="header">
            <div class="tiktok-logo">TikTok Shop</div>
            <div class="flash-logo">FLASH Express</div>
            <div class="service-type">${serviceType}</div>
          </div>
          
          <!-- เลขติดตามด้านข้าง -->
          <div class="tracking-side tracking-left-1">${trackingNumber}</div>
          <div class="tracking-side tracking-left-2">${trackingNumber}</div>
          <div class="tracking-side tracking-left-3">${trackingNumber}</div>
          <div class="tracking-side tracking-left-4">${trackingNumber}</div>
          
          <div class="tracking-side tracking-right-1">${trackingNumber}</div>
          <div class="tracking-side tracking-right-2">${trackingNumber}</div>
          <div class="tracking-side tracking-right-3">${trackingNumber}</div>
          <div class="tracking-side tracking-right-4">${trackingNumber}</div>
          
          <!-- บาร์โค้ดและเลขติดตาม -->
          <div class="tracking-number-box">
            <div class="barcode-container">
              <img src="data:image/png;base64,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mc/7UvXj0KUAAA6XaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA0LjQuMC1FeGl2MiI+CiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpHSU1QPSJodHRwOi8vd3d3LmdpbXAub3JnL3htcC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjk1YjlkMzJhLTk0ZjgtNDAyNy05MzM5LTc5Y2U4ZWIzNjkzMiIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpmOTI5YWQ5ZC03NTBmLTQwZTYtODI5Yi1jMDYwYzUyNzQyNzkiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpmNTE0MmE0Zi1kMDYyLTQ5ZWYtOTBkNy1mMDE0YWRiOGVmMjgiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBHSU1QOkFQST0iMi4wIgogICBHSU1QOlBsYXRmb3JtPSJMaW51eCIKICAgR0lNUDpUaW1lU3RhbXA9IjE2ODIwNzI5MjYxMDk3NzYiCiAgIEdJTVA6VmVyc2lvbj0iMi4xMC4zMiIKICAgdGlmZjpPcmllbnRhdGlvbj0iMSIKICAgeG1wOkNyZWF0b3JUb29sPSJHSU1QIDIuMTAiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDphZjM1ZmEwMC02MmY2LTRmYjMtOTc2OS0zNTBkYWI4N2E3ZDMiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoTGludXgpIgogICAgICBzdEV2dDp3aGVuPSIyMDIzLTA0LTIxVDE3OjI4OjQ2KzA3OjAwIi8+CiAgICA8L3JkZjpTZXE+CiAgIDwveG1wTU06SGlzdG9yeT4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/Pq3f/X0AAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfnBRZKHC7kUH5mAAACr3pUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHja7VdbciMpDP1nFbMER+KB3I7nvKvw8mfZuCrVcbo71V2Ti7HLBgkJ6dxL0PTpz4/0Ax+8IUXT5EJs8YaadZXJXm5vGO2K8Xra3gSavuA0bvl26Iy3Ak/+hxz8/jjt+Q478A33BtFwkCMy6HrIPYB7yCLlBmnrj0C1LkKkbU8n4zcIdZ3LrnfY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" alt="Barcode" class="barcode">
            </div>
            <div class="tracking-number-text">${trackingNumber}</div>
          </div>
          
          <!-- ข้อมูลคลังสินค้าและรหัสพื้นที่คัดแยก -->
          <div class="info-row">
            <div class="warehouse-box">
              ${warehouseCode}
            </div>
            <div class="sorting-box">
              ${sortingCode}
              <span class="customer-code">${customerCode}</span>
              <span class="district-text">${district}</span>
            </div>
          </div>
          
          <!-- ข้อมูลผู้ส่ง -->
          <div class="shipper-info">
            <div>จาก ${senderName}</div>
            <div>${senderPhone}</div>
            <div>${senderAddress}</div>
          </div>
          
          <!-- ข้อมูลผู้รับ -->
          <div class="recipient-info">
            <div>ถึง ${recipientName}</div>
            <div>${recipientPhone}</div>
            <div>${recipientAddress}</div>
          </div>
          
          <!-- QR Code -->
          <div class="qr-section">
            <img src="data:image/png;base64,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" alt="QR Code" class="qr-code">
          </div>
          
          <!-- ส่วนคอด / น้ำหนัก -->
          <div class="cod-row">
            <div class="cod-box">
              COD
              <div class="cod-text">${cashless ? 'ชําระโดยไมใชเงินสด ผูซื้อไมตองชําระเงินกับพนักงานขนสง' : `฿ ${codAmount}`}</div>
            </div>
            <div class="weight-box">
              <div class="signature-label">Signature:</div>
              <div class="weight-info">Weight : ${weight} KG</div>
            </div>
          </div>
          
          <!-- ข้อมูลออเดอร์ -->
          <div class="order-row">
            <div class="order-id-box">
              <div>Order ID</div>
              <div>${orderID}</div>
            </div>
            <div class="date-box">
              <div>Shipping Date:    ${shippingDate}</div>
              <div>Estimated Date:</div>
            </div>
          </div>
          
          <!-- PICK-UP badge -->
          ${pickupPackage ? '<div class="pickup-badge">PICK-UP</div>' : ''}
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">ออกแบบลาเบล Flash Express</h1>
        
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
                    <Label htmlFor="sortingCode">รหัสพื้นที่คัดแยก</Label>
                    <Input
                      id="sortingCode"
                      value={sortingCode}
                      onChange={(e) => setSortingCode(e.target.value)}
                      placeholder="รหัสพื้นที่คัดแยก"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="serviceType">ประเภทบริการ</Label>
                    <Select
                      value={serviceType}
                      onValueChange={setServiceType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกประเภทบริการ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">มาตรฐาน (Standard)</SelectItem>
                        <SelectItem value="Express">ด่วน (Express)</SelectItem>
                        <SelectItem value="Same Day">ส่งวันนี้ถึงวันนี้ (Same Day)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="warehouseCode">รหัสคลังสินค้า</Label>
                    <Input
                      id="warehouseCode"
                      value={warehouseCode}
                      onChange={(e) => setWarehouseCode(e.target.value)}
                      placeholder="รหัสคลังสินค้า"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="customerCode">รหัสลูกค้า</Label>
                    <Input
                      id="customerCode"
                      value={customerCode}
                      onChange={(e) => setCustomerCode(e.target.value)}
                      placeholder="รหัสลูกค้า"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="district">อำเภอ/เขต</Label>
                    <Input
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="อำเภอ/เขต"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="weight">น้ำหนัก (KG)</Label>
                    <Input
                      id="weight"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="น้ำหนักพัสดุ"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="orderID">หมายเลขคำสั่งซื้อ</Label>
                    <Input
                      id="orderID"
                      value={orderID}
                      onChange={(e) => setOrderID(e.target.value)}
                      placeholder="หมายเลขคำสั่งซื้อ"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shippingDate">วันที่ส่งพัสดุ</Label>
                    <Input
                      id="shippingDate"
                      value={shippingDate}
                      onChange={(e) => setShippingDate(e.target.value)}
                      placeholder="วันที่ส่งพัสดุ"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="cashless"
                        checked={cashless}
                        onChange={(e) => setCashless(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="cashless">ชำระโดยไม่ใช้เงินสด</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <input
                        type="checkbox"
                        id="pickupPackage"
                        checked={pickupPackage}
                        onChange={(e) => setPickupPackage(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="pickupPackage">รับพัสดุ (PICK-UP)</Label>
                    </div>
                  </div>
                  
                  {!cashless && (
                    <div>
                      <Label htmlFor="codAmount">จำนวนเงิน COD (บาท)</Label>
                      <Input
                        id="codAmount"
                        value={codAmount}
                        onChange={(e) => setCodAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  )}
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
                    <Label htmlFor="senderAddress">ที่อยู่ผู้ส่ง</Label>
                    <Input
                      id="senderAddress"
                      value={senderAddress}
                      onChange={(e) => setSenderAddress(e.target.value)}
                      placeholder="ที่อยู่ผู้ส่ง"
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
                    <Label htmlFor="recipientAddress">ที่อยู่ผู้รับ</Label>
                    <Input
                      id="recipientAddress"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="ที่อยู่ผู้รับ"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600" 
                  onClick={printLabel}
                >
                  พิมพ์ลาเบล Flash Express
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default FlashExpressLabel;