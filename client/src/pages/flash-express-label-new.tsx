import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JsBarcode from 'jsbarcode';

/**
 * หน้าสำหรับพิมพ์ลาเบล Flash Express
 * ลาเบลถูกออกแบบตามตัวอย่างที่ผู้ใช้แนบมา (HTML ใหม่)
 */
const FlashExpressLabelNew: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('THT64141T9NYG7Z');
  const [sortingCode, setSortingCode] = useState('SS1');
  const [senderName, setSenderName] = useState('JSB Candy');
  const [senderPhone, setSenderPhone] = useState('(+66)0836087712');
  const [senderAddress, setSenderAddress] = useState('24 ซอยนาคนิวาส ซอย 8 แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพ 10160');
  const [recipientName, setRecipientName] = useState('สิริรัตน์ ดำเกิด');
  const [recipientPhone, setRecipientPhone] = useState('(+66)09******25');
  const [recipientAddress, setRecipientAddress] = useState('ร้านสามสุข 101/3 ม.1 ตำบลสิชล อ.สิชล จ.นครศรีธรรมราช, สิชล, นครศรีธรรมราช, 80120');
  const [weight, setWeight] = useState('4.000');
  const [orderID, setOrderID] = useState('5785159668395229951');
  const [serviceType, setServiceType] = useState('Standard');
  const [codAmount, setCodAmount] = useState('840.00');
  const [warehouseCode, setWarehouseCode] = useState('21S-38041-02');
  const [customerCode, setCustomerCode] = useState('2TPY_BDC-หน');
  const [district, setDistrict] = useState('พะยอม');
  const [shippingDate, setShippingDate] = useState('21/04/2025 23:39');
  const [estimatedDate, setEstimatedDate] = useState('23/04/2025');
  const [cashless, setCashless] = useState(false);
  const [pickupPackage, setPickupPackage] = useState(true);
  
  // Reference สำหรับใช้ในการสร้างบาร์โค้ด
  const barcodeRef = useRef(null);
  
  // สร้างบาร์โค้ดเมื่อ trackingNumber เปลี่ยนแปลง
  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, trackingNumber, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false,
        margin: 0
      });
    }
  }, [trackingNumber]);
  
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
        <title>ลาเบลการจัดส่ง</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700&display=swap');
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Kanit', sans-serif;
            background-color: #f5f5f5;
          }
          .label-container {
            width: 100mm;
            height: 150mm;
            border: 1px dashed #000;
            position: relative;
            box-sizing: border-box;
            page-break-after: always;
            margin: 10px auto;
            background-color: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #000;
            padding: 5px;
            font-size: 12px;
          }
          .barcode-section {
            text-align: center;
            padding: 5px 0;
            border-bottom: 1px solid #000;
          }
          .barcode {
            height: 40px;
            width: 90%;
            margin: 0 auto;
          }
          .barcode-number {
            font-size: 10px;
            margin-top: 2px;
          }
          .info-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .order-id {
            font-size: 18px;
            font-weight: bold;
            padding: 10px;
            width: 60%;
            text-align: center;
            border-right: 1px solid #000;
          }
          .shipping-type {
            width: 40%;
            padding: 5px;
            font-size: 12px;
            text-align: center;
          }
          .address-section {
            border-bottom: 1px solid #000;
            padding: 5px;
            font-size: 11px;
          }
          .qr-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .sender-info {
            width: 60%;
            padding: 5px;
            font-size: 11px;
            border-right: 1px solid #000;
          }
          .qr-code {
            width: 40%;
            padding: 5px;
            text-align: center;
          }
          .qr-image {
            width: 80%;
            height: auto;
          }
          .cod-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .cod-label {
            width: 40%;
            background-color: #000;
            color: #fff;
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid #000;
          }
          .weight-info {
            width: 60%;
            font-size: 11px;
            padding: 5px;
          }
          .footer {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .order-details {
            width: 70%;
            font-size: 10px;
            padding: 5px;
            border-right: 1px solid #000;
          }
          .pickup-label {
            width: 30%;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          /* ส่วนรายการสินค้า (ปรับให้อยู่ด้านล่างสุด) */
          .product-section {
            padding: 5px;
            font-size: 10px;
          }
          .product-header {
            display: flex;
            font-weight: bold;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
            margin-bottom: 3px;
          }
          .product-item {
            display: flex;
            padding: 2px 0;
          }
          .product-name {
            width: 70%;
          }
          .product-qty {
            width: 15%;
            text-align: center;
          }
          .product-total {
            width: 15%;
            text-align: right;
          }
          .product-summary {
            display: flex;
            justify-content: space-between;
            margin-top: 3px;
            padding-top: 3px;
            border-top: 1px solid #ccc;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          td {
            padding: 2px;
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
        
        <div class="label-container">
          <div class="header">
            <div>TikTok Shop</div>
            <div>FLASH</div>
            <div>${serviceType}</div>
          </div>
          
          <div class="barcode-section">
            <svg id="barcode" width="250" height="40"></svg>
            <div class="barcode-number">${trackingNumber}</div>
          </div>
          
          <div class="info-section">
            <div class="order-id">${warehouseCode}</div>
            <div class="shipping-type">
              <strong>${sortingCode}</strong><br>
              ${customerCode}<br>
              ${district}
            </div>
          </div>
          
          <div class="address-section">
            <strong>จาก</strong> ${senderName} ${senderPhone}<br>
            ${senderAddress}
          </div>
          
          <div class="qr-section">
            <div class="sender-info">
              <strong>ถึง</strong> ${recipientName} ${recipientPhone}<br>
              ${recipientAddress}
            </div>
            <div class="qr-code">
              <img class="qr-image" src="https://chart.googleapis.com/chart?cht=qr&chl=${trackingNumber}&chs=200x200&choe=UTF-8" alt="QR Code">
            </div>
          </div>
          
          <div class="cod-section">
            <div class="cod-label">COD</div>
            <div class="weight-info">
              <table>
                <tr>
                  <td>Weight :</td>
                  <td>${weight} KG</td>
                  <td>Signature:</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div class="footer">
            <div class="order-details">
              <table>
                <tr>
                  <td>Order ID</td>
                  <td>Shipping Date:</td>
                </tr>
                <tr>
                  <td>${orderID}</td>
                  <td>${shippingDate}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>Estimated Date:</td>
                </tr>
                <tr>
                  <td></td>
                  <td>${estimatedDate}</td>
                </tr>
              </table>
            </div>
            <div class="pickup-label">${pickupPackage ? 'PICK-UP' : 'SELF-DROP'}</div>
          </div>
          
          <!-- ส่วนรายการสินค้า -->
          <div class="product-section">
            <div class="product-header">
              <div class="product-name">รายการสินค้า</div>
              <div class="product-qty">จำนวน</div>
              <div class="product-total">ราคา</div>
            </div>
            <div class="product-item">
              <div class="product-name">เค้กช็อคโกแลต Red Velvet</div>
              <div class="product-qty">2</div>
              <div class="product-total">590</div>
            </div>
            <div class="product-item">
              <div class="product-name">คุกกี้เนยสด</div>
              <div class="product-qty">1</div>
              <div class="product-total">250</div>
            </div>
            <div class="product-summary">
              <div>รวมทั้งสิ้น:</div>
              <div>${codAmount} บาท</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    // สร้างบาร์โค้ดในหน้าพิมพ์
    printWindow.document.close();
    
    // สร้างบาร์โค้ดเมื่อหน้าโหลดเสร็จ
    printWindow.onload = function() {
      const barcodeElement = printWindow.document.getElementById('barcode');
      if (barcodeElement) {
        JsBarcode(barcodeElement, trackingNumber, {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: false,
          margin: 0
        });
      }
      
      // ตั้งค่าให้รอการแสดงบาร์โค้ดก่อนพิมพ์อัตโนมัติ
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <Card className="mb-8">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-4">พิมพ์ใบลาเบล Flash Express (แบบใหม่)</h1>
            <p className="text-gray-600 mb-6">กรอกข้อมูลด้านล่างเพื่อสร้างใบลาเบลขนส่ง Flash Express ตามรูปแบบใหม่</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">ข้อมูลการจัดส่ง</h2>
                
                <div className="mb-4">
                  <Label htmlFor="tracking-number">เลขพัสดุ</Label>
                  <Input 
                    id="tracking-number" 
                    value={trackingNumber} 
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="เลขพัสดุ"
                    className="mt-1"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="warehouse-code">รหัสคลังสินค้า</Label>
                  <Input 
                    id="warehouse-code" 
                    value={warehouseCode} 
                    onChange={(e) => setWarehouseCode(e.target.value)}
                    placeholder="รหัสคลังสินค้า"
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="sorting-code">รหัสคัดแยก</Label>
                    <Input 
                      id="sorting-code" 
                      value={sortingCode} 
                      onChange={(e) => setSortingCode(e.target.value)}
                      placeholder="รหัสคัดแยก"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-code">รหัสลูกค้า</Label>
                    <Input 
                      id="customer-code" 
                      value={customerCode} 
                      onChange={(e) => setCustomerCode(e.target.value)}
                      placeholder="รหัสลูกค้า"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="district">เขต/อำเภอ</Label>
                  <Input 
                    id="district" 
                    value={district} 
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="เขต/อำเภอ"
                    className="mt-1"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="order-id">รหัสออร์เดอร์</Label>
                  <Input 
                    id="order-id" 
                    value={orderID} 
                    onChange={(e) => setOrderID(e.target.value)}
                    placeholder="รหัสออร์เดอร์"
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <Label htmlFor="service-type">ประเภทบริการ</Label>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger id="service-type" className="mt-1">
                        <SelectValue placeholder="เลือกประเภทบริการ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Express">Express</SelectItem>
                        <SelectItem value="Same Day">Same Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="weight">น้ำหนัก (กก.)</Label>
                    <Input 
                      id="weight" 
                      value={weight} 
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="น้ำหนัก (กก.)"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="cod-amount">จำนวนเงิน COD (บาท)</Label>
                  <Input 
                    id="cod-amount" 
                    value={codAmount} 
                    onChange={(e) => setCodAmount(e.target.value)}
                    placeholder="จำนวนเงิน COD"
                    className="mt-1"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="shipping-date">วันที่จัดส่ง</Label>
                  <Input 
                    id="shipping-date" 
                    value={shippingDate} 
                    onChange={(e) => setShippingDate(e.target.value)}
                    placeholder="วันที่จัดส่ง"
                    className="mt-1"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="estimated-date">วันที่คาดว่าจะถึง</Label>
                  <Input 
                    id="estimated-date" 
                    value={estimatedDate} 
                    onChange={(e) => setEstimatedDate(e.target.value)}
                    placeholder="วันที่คาดว่าจะถึง"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-4">ข้อมูลผู้ส่งและผู้รับ</h2>
                
                <div className="mb-4">
                  <Label htmlFor="sender-name">ชื่อผู้ส่ง</Label>
                  <Input 
                    id="sender-name" 
                    value={senderName} 
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="ชื่อผู้ส่ง"
                    className="mt-1"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="sender-phone">เบอร์โทรผู้ส่ง</Label>
                  <Input 
                    id="sender-phone" 
                    value={senderPhone} 
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="เบอร์โทรผู้ส่ง"
                    className="mt-1"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="sender-address">ที่อยู่ผู้ส่ง</Label>
                  <Input 
                    id="sender-address" 
                    value={senderAddress} 
                    onChange={(e) => setSenderAddress(e.target.value)}
                    placeholder="ที่อยู่ผู้ส่ง"
                    className="mt-1"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="recipient-name">ชื่อผู้รับ</Label>
                  <Input 
                    id="recipient-name" 
                    value={recipientName} 
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="ชื่อผู้รับ"
                    className="mt-1"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="recipient-phone">เบอร์โทรผู้รับ</Label>
                  <Input 
                    id="recipient-phone" 
                    value={recipientPhone} 
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="เบอร์โทรผู้รับ"
                    className="mt-1"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="recipient-address">ที่อยู่ผู้รับ</Label>
                  <Input 
                    id="recipient-address" 
                    value={recipientAddress} 
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="ที่อยู่ผู้รับ"
                    className="mt-1"
                  />
                </div>
                
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cash-less"
                      checked={cashless}
                      onChange={(e) => setCashless(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="cash-less" className="text-sm font-normal">การชำระเงินแบบ Cashless</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="pickup-package"
                      checked={pickupPackage}
                      onChange={(e) => setPickupPackage(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="pickup-package" className="text-sm font-normal">รับพัสดุที่บ้าน (PICK-UP)</Label>
                  </div>
                </div>
                
                <div className="mt-6">
                  <svg ref={barcodeRef} className="w-full h-16 mb-2"></svg>
                  <div className="text-center text-gray-700 mb-4">{trackingNumber}</div>
                  <Button 
                    onClick={printLabel} 
                    className="w-full bg-orange-500 hover:bg-orange-600 font-semibold"
                  >
                    พิมพ์ใบลาเบล
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FlashExpressLabelNew;