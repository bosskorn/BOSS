import React, { useRef, useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';

const TikTokShippingLabel: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('THT64141T9NYG7Z');
  const [orderId, setOrderId] = useState('21S-38041-02');
  const [sortCode, setSortCode] = useState('SS1');
  const [senderName, setSenderName] = useState('JSB Candy');
  const [senderPhone, setSenderPhone] = useState('(+66)0836087712');
  const [senderAddress, setSenderAddress] = useState('24 ซอยนาคนิวาส ซอย 8 แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพ 10160');
  const [recipientName, setRecipientName] = useState('สิริรัตน์ ดำเกิด');
  const [recipientPhone, setRecipientPhone] = useState('(+66)9*******25');
  const [recipientAddress, setRecipientAddress] = useState('ร้านสามสุข 101/3 ม.1 ตำบลสิชล อ.สิชล จ.นครศรีธรรมราช, สิชล, นครศรีธรรมราช, 80120');
  const [weight, setWeight] = useState('4.000');
  const [orderIdFull, setOrderIdFull] = useState('5785159668395229951');
  const [shippingDate, setShippingDate] = useState('21/04/2025 23:39');
  
  // โหลดข้อมูลออเดอร์จาก URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('order');
    
    if (orderParam) {
      loadOrderData(orderParam);
    }
  }, []);
  
  // ฟังก์ชันโหลดข้อมูลออเดอร์
  const loadOrderData = async (orderId: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const order = data.data || data.order;
        
        if (order) {
          // ตั้งค่าข้อมูลลาเบลจากข้อมูลออเดอร์
          if (order.trackingNumber) setTrackingNumber(order.trackingNumber);
          if (order.orderNumber) setOrderId(order.orderNumber);
          setOrderIdFull(order.id.toString());
          
          // ข้อมูลผู้รับ
          if (order.recipientName || order.customerName) setRecipientName(order.recipientName || order.customerName);
          if (order.recipientPhone || order.customerPhone) setRecipientPhone(order.recipientPhone || order.customerPhone);
          
          // สร้างที่อยู่ผู้รับ
          const addressParts = [];
          if (order.recipientAddress || order.customerAddress) addressParts.push(order.recipientAddress || order.customerAddress);
          if (order.recipientSubdistrict || order.customerSubdistrict) addressParts.push(order.recipientSubdistrict || order.customerSubdistrict);
          if (order.recipientDistrict || order.customerDistrict) addressParts.push(order.recipientDistrict || order.customerDistrict);
          if (order.recipientProvince || order.customerProvince) addressParts.push(order.recipientProvince || order.customerProvince);
          if (order.recipientZipCode || order.customerZipcode) addressParts.push(order.recipientZipCode || order.customerZipcode);
          
          setRecipientAddress(addressParts.join(', '));
          
          // วันที่สร้างออเดอร์
          if (order.createdAt) {
            const date = new Date(order.createdAt);
            setShippingDate(date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH'));
          }
          
          // น้ำหนัก
          if (order.weight) setWeight(order.weight.toString());
          
          toast({
            title: 'โหลดข้อมูลสำเร็จ',
            description: `โหลดข้อมูลออเดอร์ ${order.orderNumber} เรียบร้อยแล้ว`,
          });
        }
      } else {
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลออเดอร์ได้');
      }
    } catch (error) {
      console.error('Error loading order data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลออเดอร์ได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const barcodeRef = useRef<SVGSVGElement>(null);

  // สินค้าในคำสั่งซื้อ
  const [products, setProducts] = useState([
    { name: 'เค้กช็อคโกแลต Red Velvet', quantity: 2, price: 590 },
    { name: 'คุกกี้เนยสด', quantity: 1, price: 250 },
  ]);

  // คำนวณยอดรวม
  const totalAmount = products.reduce((sum, product) => sum + product.price * product.quantity, 0);

  // สร้างบาร์โค้ด
  React.useEffect(() => {
    if (barcodeRef.current && trackingNumber) {
      JsBarcode(barcodeRef.current, trackingNumber, {
        format: "CODE128",
        lineColor: "#000",
        width: 1.5,
        height: 40,
        displayValue: false
      });
    }
  }, [trackingNumber]);

  // พิมพ์ลาเบล
  const printLabel = () => {
    // ตรวจสอบว่ามีการอัพโหลดไฟล์หรือไม่
    const labelFileInput = document.getElementById('labelFile') as HTMLInputElement;
    const uploadedFile = labelFileInput?.files?.[0];

    if (uploadedFile) {
      // หากมีการอัพโหลดไฟล์ ให้เปิดไฟล์นั้นเพื่อพิมพ์
      const fileUrl = URL.createObjectURL(uploadedFile);
      const printWindow = window.open(fileUrl, '_blank');

      if (!printWindow) {
        alert('โปรดอนุญาตให้เปิดหน้าต่างป๊อปอัพเพื่อพิมพ์ลาเบล');
        return;
      }

      printWindow.onload = () => {
        printWindow.print();
      };

      return;
    }

    // หากไม่มีการอัพโหลดไฟล์ ให้สร้างลาเบลแบบเดิม
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('โปรดอนุญาตให้เปิดหน้าต่างป๊อปอัพเพื่อพิมพ์ลาเบล');
      return;
    }

    // ตั้งค่า HTML และ CSS สำหรับการพิมพ์
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ลาเบลการจัดส่ง TikTok Shop - ${orderId}</title>
        <style>
          @page {
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Kanit', 'Sarabun', Arial, sans-serif;
          }
          .label-container {
            border: 1px solid #000;
            position: relative;
            box-sizing: border-box;
            page-break-after: always;
            font-size: 10px;
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
            width: 95%;
            margin: 0 auto;
          }
          .barcode-element-container {
            width: 100%;
            height: 40px;
            margin: 0 auto;
          }
          .tracking-number {
            font-size: 14px;
            text-align: center;
            margin-top: 3px;
            font-family: monospace;
            letter-spacing: 1px;
          }
          .info-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .order-id {
            font-size: 16px;
            font-weight: bold;
            padding: 5px;
            width: 60%;
            text-align: center;
            border-right: 1px solid #000;
          }
          .shipping-type {
            width: 40%;
            padding: 5px;
            font-size: 11px;
            text-align: center;
          }
          .sender-section {
            border-bottom: 1px solid #000;
            padding: 5px;
            font-size: 11px;
          }
          .recipient-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .recipient-info {
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
          .cod-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .cod-label {
            width: 25%;
            background-color: #000;
            color: #fff;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid #000;
          }
          .weight-info {
            width: 75%;
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
          .product-section {
            padding: 5px;
            font-size: 10px;
          }
          .product-header {
            font-weight: bold;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
            margin-bottom: 3px;
          }
          .product-item {
            padding: 2px 0;
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
            margin: 20px 0;
          }
          .print-button button {
            padding: 10px 20px;
            background: #0078D7;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            font-family: 'Kanit', 'Sarabun', Arial, sans-serif;
          }
          @media print {
            body { margin: 0; }
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print();">พิมพ์ลาเบล</button>
        </div>

        <div class="label-container">
          <div class="header">
            <div>TikTok Shop</div>
            <div>FLASH</div>
            <div>Standard</div>
          </div>

          <div class="barcode-section">
            <div class="barcode-element-container">
              <svg class="barcode-element" id="barcode"></svg>
            </div>
            <div class="tracking-number">${trackingNumber}</div>
          </div>

          <div class="info-section">
            <div class="order-id">${orderId}</div>
            <div class="shipping-type">
              <strong>${sortCode}</strong><br>
              2TPY_BDC-หน<br>
              พร้อม
            </div>
          </div>

          <div class="sender-section">
            <strong>จาก</strong> ${senderName} ${senderPhone}<br>
            ${senderAddress}
          </div>

          <div class="recipient-section">
            <div class="recipient-info">
              <strong>ถึง</strong> ${recipientName || 'ไม่ระบุ'} ${recipientPhone || 'ไม่ระบุ'}<br>
              ${recipientAddress || 'ไม่ระบุ'}
            </div>
            <div class="qr-code">
              <div id="qrcode"></div>
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
                  <td>${orderIdFull}</td>
                  <td>${shippingDate}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>Estimated Date:</td>
                </tr>
              </table>
            </div>
            <div class="pickup-label">PICK-UP</div>
          </div>

          <div class="product-section">
            <div class="product-header">รายการสินค้าจำนวนราคา</div>
            ${products.map(product => `
              <div class="product-item">
                ${product.name} ${product.quantity} ${product.price}
              </div>
            `).join('')}
            <div class="product-summary">
              <div>รวมทั้งสิ้น:</div>
              <div>${totalAmount} บาท</div>
            </div>
          </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
        <script type="text/javascript">
          // ฟังก์ชันสร้างบาร์โค้ด
          window.onload = function() {
            try {
              // สร้างบาร์โค้ด
              JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                lineColor: "#000",
                width: 1.3,
                height: 40,
                displayValue: false,
                margin: 0
              });
              
              // สร้าง QR Code
              new QRCode(document.getElementById("qrcode"), {
                text: "${trackingNumber}",
                width: 80,
                height: 80
              });
              
              // พิมพ์อัตโนมัติหลังจากโหลดเสร็จและสร้างบาร์โค้ดเสร็จ
              setTimeout(function() {
                window.print();
              }, 800);
            } catch(error) {
              console.error("Error generating barcode:", error);
              alert("เกิดข้อผิดพลาดในการสร้างบาร์โค้ด: " + error.message);
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
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">พิมพ์ลาเบล TikTok Shop</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">ข้อมูลการจัดส่ง</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="trackingNumber">เลขพัสดุ</Label>
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="เลขติดตามพัสดุ"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="orderId">รหัสคำสั่งซื้อย่อ</Label>
                    <Input
                      id="orderId"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="รหัสคำสั่งซื้อย่อ"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sortCode">รหัสคัดแยก</Label>
                    <Input
                      id="sortCode"
                      value={sortCode}
                      onChange={(e) => setSortCode(e.target.value)}
                      placeholder="รหัสคัดแยก"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="orderIdFull">รหัสคำสั่งซื้อเต็ม</Label>
                  <Input
                    id="orderIdFull"
                    value={orderIdFull}
                    onChange={(e) => setOrderIdFull(e.target.value)}
                    placeholder="รหัสคำสั่งซื้อเต็ม"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingDate">วันที่จัดส่ง</Label>
                  <Input
                    id="shippingDate"
                    value={shippingDate}
                    onChange={(e) => setShippingDate(e.target.value)}
                    placeholder="วันที่จัดส่ง"
                  />
                </div>

                <div>
                  <Label htmlFor="weight">น้ำหนัก (กิโลกรัม)</Label>
                  <Input
                    id="weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="น้ำหนัก"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">ข้อมูลผู้ส่ง/ผู้รับ</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="senderName">ชื่อผู้ส่ง</Label>
                  <Input
                    id="senderName"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="ชื่อผู้ส่ง"
                  />
                </div>

                <div>
                  <Label htmlFor="senderPhone">เบอร์โทรผู้ส่ง</Label>
                  <Input
                    id="senderPhone"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="เบอร์โทรผู้ส่ง"
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

                <div>
                  <Label htmlFor="recipientName">ชื่อผู้รับ</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="ชื่อผู้รับ"
                  />
                </div>

                <div>
                  <Label htmlFor="recipientPhone">เบอร์โทรผู้รับ</Label>
                  <Input
                    id="recipientPhone"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="เบอร์โทรผู้รับ"
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

                <div className="mt-4 border-t pt-4">
                  <Label htmlFor="labelFile">อัพโหลดไฟล์ลาเบล (ไฟล์ PDF หรือรูปภาพ)</Label>
                  <Input
                    id="labelFile"
                    type="file"
                    className="mt-2"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // สามารถเพิ่มโค้ดสำหรับจัดการไฟล์ที่อัพโหลดได้ตรงนี้
                        console.log("ไฟล์ที่อัพโหลด:", file.name);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">อัพโหลดไฟล์ลาเบลสำเร็จรูปแทนการสร้างลาเบลใหม่</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">รายการสินค้า</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">ชื่อสินค้า</th>
                    <th className="p-2 text-center">จำนวน</th>
                    <th className="p-2 text-right">ราคา (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        <Input
                          value={product.name}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].name = e.target.value;
                            setProducts(newProducts);
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          className="text-center"
                          value={product.quantity}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].quantity = parseInt(e.target.value) || 0;
                            setProducts(newProducts);
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          className="text-right"
                          value={product.price}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].price = parseInt(e.target.value) || 0;
                            setProducts(newProducts);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="p-2 text-right font-semibold">รวมทั้งสิ้น:</td>
                    <td className="p-2 text-right font-semibold">{totalAmount} บาท</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProducts([...products, { name: '', quantity: 1, price: 0 }])}
              >
                เพิ่มสินค้า
              </Button>

              {products.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setProducts(products.slice(0, -1))}
                >
                  ลบสินค้ารายการสุดท้าย
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <div className="border border-dashed border-gray-400 p-2 bg-white">
            <div className="text-center text-xs text-gray-500 mb-2">ใบลาเบลมาตรฐาน สำหรับ TikTok Shop</div>

            <div className="relative" style={{ border: '1px solid #000' }}>
              <div className="flex justify-between border-b border-black p-1 text-xs">
                <div>TikTok Shop</div>
                <div>FLASH</div>
                <div>Standard</div>
              </div>

              <div className="text-center border-b border-black p-1">
                <svg ref={barcodeRef} className="mx-auto"></svg>
                <div className="text-xs mt-1">{trackingNumber}</div>
              </div>

              <div className="flex border-b border-black">
                <div className="w-3/5 text-center p-2 border-r border-black font-bold">
                  {orderId}
                </div>
                <div className="w-2/5 text-center p-1 text-xs">
                  <div className="font-bold">{sortCode}</div>
                  <div>2TPY_BDC-หน</div>
                  <div>พร้อม</div>
                </div>
              </div>

              <div className="p-1 text-xs border-b border-black">
                <strong>จาก</strong> {senderName} {senderPhone}<br />
                {senderAddress}
              </div>

              <div className="flex border-b border-black">
                <div className="w-3/5 p-1 text-xs border-r border-black">
                  <strong>ถึง</strong> {recipientName} {recipientPhone}<br />
                  {recipientAddress}
                </div>
                <div className="w-2/5 flex items-center justify-center p-1">
                  <QRCodeSVG value={trackingNumber} size={80} />
                </div>
              </div>

              <div className="flex border-b border-black">
                <div className="w-2/5 bg-black text-white text-center p-1 flex items-center justify-center font-bold text-xl border-r border-black">
                  COD
                </div>
                <div className="w-3/5 text-xs p-1">
                  <table className="w-full text-xs">
                    <tr>
                      <td>Weight :</td>
                      <td>{weight} KG</td>
                      <td>Signature:</td>
                    </tr>
                  </table>
                </div>
              </div>

              <div className="flex border-b border-black">
                <div className="w-7/10 p-1 text-xs border-r border-black">
                  <table className="w-full text-xs">
                    <tr>
                      <td>Order ID</td>
                      <td>Shipping Date:</td>
                    </tr>
                    <tr>
                      <td>{orderIdFull}</td>
                      <td>{shippingDate}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td>Estimated Date:</td>
                    </tr>
                  </table>
                </div>
                <div className="w-3/10 flex items-center justify-center p-1 font-bold">
                  PICK-UP
                </div>
              </div>

              <div className="p-1 text-xs">
                <div className="flex font-bold border-b border-gray-300 pb-1 mb-1">
                  <div className="w-7/10">รายการสินค้า</div>
                  <div className="w-1.5/10 text-center">จำนวน</div>
                  <div className="w-1.5/10 text-right">ราคา</div>
                </div>

                {products.map((product, index) => (
                  <div key={index} className="flex py-0.5">
                    <div className="w-7/10 truncate">{product.name}</div>
                    <div className="w-1.5/10 text-center">{product.quantity}</div>
                    <div className="w-1.5/10 text-right">{product.price}</div>
                  </div>
                ))}

                <div className="flex justify-between font-bold mt-1 pt-1 border-t border-gray-300">
                  <div>รวมทั้งสิ้น:</div>
                  <div>{totalAmount} บาท</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={printLabel}>
            <i className="fa-solid fa-print mr-2"></i>พิมพ์ลาเบล
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default TikTokShippingLabel;