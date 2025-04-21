import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import JsBarcode from 'jsbarcode';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * หน้าสำหรับพิมพ์ลาเบล Flash Express (หรือ เสี่ยวไป๋ เอ็กเพรส)
 * ฉบับที่แก้ไขให้พิมพ์หลายลาเบลในหน้าเดียว
 */
const FlashExpressLabelSimple = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [sortingCode, setSortingCode] = useState('SS1');
  const [senderName, setSenderName] = useState('BLUEDASH LOGISTICS');
  const [senderPhone, setSenderPhone] = useState('02-123-4567');
  const [senderAddress, setSenderAddress] = useState('เลขที่ 888 อาคารมณียาเซ็นเตอร์ ถนนพระราม 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [weight, setWeight] = useState('1.000');
  const [orderID, setOrderID] = useState('');
  const [serviceType, setServiceType] = useState('Standard');
  const [codAmount, setCodAmount] = useState('0.00');
  const [warehouseCode, setWarehouseCode] = useState('BL-1234');
  const [customerCode, setCustomerCode] = useState('BLUEDASH');
  const [district, setDistrict] = useState('');
  const [shippingDate, setShippingDate] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<Array<{productName: string, quantity: number, price: number}>>([]);
  
  // Reference สำหรับบาร์โค้ด
  const barcodeRef = useRef(null);
  
  // State สำหรับเก็บข้อมูลหลายออเดอร์
  const [multipleOrders, setMultipleOrders] = useState<any[]>([]);

  // ดึงข้อมูลออเดอร์จาก URL parameter และเรียกใช้ฟังก์ชันพิมพ์อัตโนมัติ
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('order');
        const ordersParam = params.get('orders');
        
        // ถ้ามีการส่งค่า orders มาแสดงว่าเป็นการพิมพ์หลายรายการ
        if (ordersParam) {
          const orderIds = ordersParam.split(',');
          if (orderIds.length > 0) {
            console.log('พิมพ์ลาเบลสำหรับหลายออเดอร์:', orderIds);
            
            // ดึงข้อมูลทุกออเดอร์
            const token = localStorage.getItem('auth_token');
            const allOrders = [];
            
            for (const id of orderIds) {
              try {
                const response = await fetch(`/api/orders/${id}`, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                  },
                  credentials: 'include'
                });
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.order) {
                    // ดึงข้อมูลลูกค้าสำหรับแต่ละออเดอร์
                    if (data.order.customerId) {
                      try {
                        const customerResponse = await fetch(`/api/customers/${data.order.customerId}`, {
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : '',
                          },
                          credentials: 'include'
                        });
                        
                        if (customerResponse.ok) {
                          const customerData = await customerResponse.json();
                          if (customerData.success && customerData.customer) {
                            data.order.customer = customerData.customer;
                          }
                        }
                      } catch (error) {
                        console.error('Error fetching customer data:', error);
                      }
                    }
                    
                    allOrders.push(data.order);
                  }
                }
              } catch (error) {
                console.error(`Error fetching order ${id}:`, error);
              }
            }
            
            console.log('ดึงข้อมูลออเดอร์ทั้งหมดสำเร็จ:', allOrders.length, 'รายการ');
            
            // บันทึกข้อมูลทุกออเดอร์
            setMultipleOrders(allOrders);
            
            // เลือกออเดอร์แรกเพื่อแสดงผล
            if (allOrders.length > 0) {
              const firstOrder = allOrders[0];
              setOrder(firstOrder);
              
              // แปลงเลขพัสดุถ้าขึ้นต้นด้วย "แบบ"
              let trackingNo = firstOrder.trackingNumber;
              if (trackingNo && trackingNo.startsWith('แบบ')) {
                const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
                trackingNo = 'FLE' + randomPart;
              }
              
              setTrackingNumber(trackingNo);
              setOrderID(firstOrder.orderNumber || '');
              
              // กำหนดยอดเงิน COD
              const totalAmount = firstOrder.totalAmount || '0.00';
              setCodAmount(firstOrder.paymentMethod === 'cod' || firstOrder.paymentMethod === 'cash_on_delivery' ? 
                totalAmount : '0.00');
              
              // ข้อมูลลูกค้า
              let cusName = firstOrder.customerName || 'ไม่ระบุชื่อผู้รับ';
              let cusPhone = '';
              let cusAddress = 'ไม่ระบุที่อยู่ผู้รับ';
              
              if (firstOrder.customer) {
                const customer = firstOrder.customer;
                cusName = customer.name || cusName;
                cusPhone = customer.phone || '';
                
                // ประกอบที่อยู่
                const addressParts = [];
                if (customer.address) addressParts.push(customer.address);
                if (customer.addressNumber) addressParts.push(`เลขที่ ${customer.addressNumber}`);
                if (customer.road) addressParts.push(`ถนน${customer.road}`);
                if (customer.subDistrict) addressParts.push(`แขวง/ตำบล ${customer.subDistrict}`);
                if (customer.district) addressParts.push(`เขต/อำเภอ ${customer.district}`);
                if (customer.province) addressParts.push(`${customer.province}`);
                if (customer.postalCode) addressParts.push(`${customer.postalCode}`);
                
                if (addressParts.length > 0) {
                  cusAddress = addressParts.join(' ');
                }
                
                // หาเขต/อำเภอจากที่อยู่
                const districtParts = cusAddress.split(' ');
                const possibleDistrict = districtParts.find(part => 
                  part.includes('อ.') || part.includes('อำเภอ') || part.includes('เขต')
                );
                
                if (possibleDistrict) {
                  setDistrict(possibleDistrict.replace('อ.', '').replace('อำเภอ', '').replace('เขต', ''));
                }
              }
              
              setRecipientName(cusName);
              setRecipientPhone(cusPhone);
              setRecipientAddress(cusAddress);
              
              // กำหนดวันที่
              const today = new Date();
              setShippingDate(today.toLocaleString('th-TH', { 
                day: '2-digit', month: '2-digit', year: 'numeric', 
                hour: '2-digit', minute: '2-digit'
              }));
              
              // วันที่คาดว่าจะถึง (เพิ่ม 2 วัน)
              const estimatedDelivery = new Date(today);
              estimatedDelivery.setDate(today.getDate() + 2);
              setEstimatedDate(estimatedDelivery.toLocaleDateString('th-TH', {
                day: '2-digit', month: '2-digit', year: 'numeric'
              }));
              
              setDataReady(true);
              setIsLoading(false);
            }
            
            return;
          }
        }
        
        // กรณีพิมพ์ลาเบลเดียว
        if (!orderId) {
          toast({
            title: 'ไม่พบรหัสออเดอร์',
            description: 'กรุณาระบุรหัสออเดอร์ที่ต้องการพิมพ์ลาเบล',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        console.log('พิมพ์ลาเบลสำหรับออเดอร์:', orderId);
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`ไม่สามารถดึงข้อมูลออเดอร์ (${response.status})`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.order) {
          throw new Error('ไม่พบข้อมูลออเดอร์');
        }
        
        const orderData = data.order;
        console.log('พิมพ์ลาเบลสำหรับออเดอร์:', orderData);
        setOrder(orderData);
        
        // ตรวจสอบ items ในออเดอร์
        if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
          console.log('พบรายการสินค้า:', orderData.items);
          setOrderItems(orderData.items.map((item: any) => ({
            productName: item.productName || 'รายการสินค้า',
            quantity: item.quantity || 1,
            price: item.price || 0
          })));
        }
        
        // ตรวจสอบเลขพัสดุ
        if (!orderData.trackingNumber) {
          toast({
            title: 'ไม่พบเลขพัสดุ',
            description: 'ออเดอร์นี้ยังไม่มีเลขพัสดุ กรุณาสร้างเลขพัสดุก่อนพิมพ์ลาเบล',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        // แปลงเลขพัสดุถ้าขึ้นต้นด้วย "แบบ" 
        let trackingNo = orderData.trackingNumber;
        if (trackingNo.startsWith('แบบ')) {
          const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
          trackingNo = 'FLE' + randomPart;
          console.log('แปลงเลขพัสดุจาก', orderData.trackingNumber, 'เป็น', trackingNo);
        }
        
        // กำหนดค่าต่างๆ จากข้อมูลออเดอร์
        setTrackingNumber(trackingNo);
        setOrderID(orderData.orderNumber || '');
        
        // กำหนดยอดเงิน COD
        const totalAmountValue = orderData.totalAmount || '0.00';
        setCodAmount(orderData.paymentMethod === 'cod' || orderData.paymentMethod === 'cash_on_delivery' ? 
          totalAmountValue : '0.00');
        
        // ข้อมูลของผู้รับ
        let cusName = orderData.customerName || 'ไม่ระบุชื่อผู้รับ';
        let cusPhone = '';
        let cusAddress = 'ไม่ระบุที่อยู่ผู้รับ';
        
        // ถ้ามี customerId ให้ดึงข้อมูลเพิ่มเติม
        if (orderData.customerId) {
          try {
            const customerResponse = await fetch(`/api/customers/${orderData.customerId}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              credentials: 'include'
            });
            
            if (customerResponse.ok) {
              const customerData = await customerResponse.json();
              if (customerData.success && customerData.customer) {
                console.log('ดึงข้อมูลลูกค้าสำเร็จ:', customerData.customer);
                const customer = customerData.customer;
                cusName = customer.name || cusName;
                cusPhone = customer.phone || '';
                
                // ประกอบที่อยู่จากส่วนประกอบต่างๆ
                const addressParts = [];
                if (customer.address) addressParts.push(customer.address);
                if (customer.addressNumber) addressParts.push(`เลขที่ ${customer.addressNumber}`);
                if (customer.road) addressParts.push(`ถนน${customer.road}`);
                if (customer.subDistrict) addressParts.push(`แขวง/ตำบล ${customer.subDistrict}`);
                if (customer.district) addressParts.push(`เขต/อำเภอ ${customer.district}`);
                if (customer.province) addressParts.push(`${customer.province}`);
                if (customer.postalCode) addressParts.push(`${customer.postalCode}`);
                
                if (addressParts.length > 0) {
                  cusAddress = addressParts.join(' ');
                }
              }
            }
          } catch (customerError) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า:', customerError);
          }
        }
        
        setRecipientName(cusName);
        setRecipientPhone(cusPhone);
        setRecipientAddress(cusAddress);
        
        // ดึงตำบล/อำเภอจากที่อยู่ (แบบพื้นฐาน)
        const addressParts = cusAddress.split(' ');
        if (addressParts.length > 0) {
          const possibleDistrict = addressParts.find(part => 
            part.includes('อ.') || part.includes('อำเภอ') || part.includes('เขต')
          );
          if (possibleDistrict) {
            setDistrict(possibleDistrict.replace('อ.', '').replace('อำเภอ', '').replace('เขต', ''));
          }
        }
        
        // กำหนดวันที่
        const today = new Date();
        setShippingDate(today.toLocaleString('th-TH', { 
          day: '2-digit', month: '2-digit', year: 'numeric', 
          hour: '2-digit', minute: '2-digit'
        }));
        
        // วันที่คาดว่าจะถึง (เพิ่ม 2 วัน)
        const estimatedDelivery = new Date(today);
        estimatedDelivery.setDate(today.getDate() + 2);
        setEstimatedDate(estimatedDelivery.toLocaleDateString('th-TH', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        }));
        
        setDataReady(true);
        setIsLoading(false);
        
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลออเดอร์ได้',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };
    
    fetchOrderData();
  }, []);
  
  // สร้างบาร์โค้ดเมื่อ trackingNumber เปลี่ยนแปลง
  useEffect(() => {
    if (barcodeRef.current && trackingNumber) {
      JsBarcode(barcodeRef.current, trackingNumber, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false,
        margin: 0
      });
    }
  }, [trackingNumber]);
  
  // ฟังก์ชันสำหรับเตรียมข้อมูลออเดอร์แต่ละรายการ
  const prepareOrderData = (orderData: any) => {
    // แปลงเลขพัสดุถ้าขึ้นต้นด้วย "แบบ"
    let trackingNo = orderData.trackingNumber;
    if (trackingNo && trackingNo.startsWith('แบบ')) {
      const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
      trackingNo = 'FLE' + randomPart;
    }
    
    // ข้อมูลพื้นฐาน
    const totalAmountValue = orderData.totalAmount || '0.00';
    const isCOD = orderData.paymentMethod === 'cod' || orderData.paymentMethod === 'cash_on_delivery';
    const codAmount = isCOD ? totalAmountValue : '0.00';
    
    // ข้อมูลลูกค้า
    let cusName = orderData.customerName || 'ไม่ระบุชื่อผู้รับ';
    let cusPhone = '';
    let cusAddress = 'ไม่ระบุที่อยู่ผู้รับ';
    
    // ถ้ามีข้อมูลลูกค้าเพิ่มเติม
    if (orderData.customer) {
      const customer = orderData.customer;
      cusName = customer.name || cusName;
      cusPhone = customer.phone || '';
      
      // ประกอบที่อยู่
      const addressParts = [];
      if (customer.address) addressParts.push(customer.address);
      if (customer.addressNumber) addressParts.push(`เลขที่ ${customer.addressNumber}`);
      if (customer.road) addressParts.push(`ถนน${customer.road}`);
      if (customer.subDistrict) addressParts.push(`แขวง/ตำบล ${customer.subDistrict}`);
      if (customer.district) addressParts.push(`เขต/อำเภอ ${customer.district}`);
      if (customer.province) addressParts.push(`${customer.province}`);
      if (customer.postalCode) addressParts.push(`${customer.postalCode}`);
      
      if (addressParts.length > 0) {
        cusAddress = addressParts.join(' ');
      }
    }
    
    // สร้างวันที่
    const today = new Date();
    const shippingDateText = today.toLocaleString('th-TH', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    });
    
    // วันที่คาดว่าจะถึง (เพิ่ม 2 วัน)
    const estimatedDelivery = new Date(today);
    estimatedDelivery.setDate(today.getDate() + 2);
    const estimatedDateText = estimatedDelivery.toLocaleDateString('th-TH', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    
    // หาเขต/อำเภอ จากที่อยู่
    let districtText = '';
    const addressParts = cusAddress.split(' ');
    const possibleDistrict = addressParts.find((part: string) => 
      part.includes('อ.') || part.includes('อำเภอ') || part.includes('เขต')
    );
    if (possibleDistrict) {
      districtText = possibleDistrict.replace('อ.', '').replace('อำเภอ', '').replace('เขต', '');
    }
    
    return {
      trackingNumber: trackingNo,
      orderNumber: orderData.orderNumber || '',
      codAmount,
      recipientName: cusName,
      recipientPhone: cusPhone,
      recipientAddress: cusAddress,
      shippingDate: shippingDateText,
      estimatedDate: estimatedDateText,
      district: districtText
    };
  };
  
  // ฟังก์ชันสำหรับพิมพ์ลาเบล
  const printLabel = () => {
    window.print();
  };
  
  // แสดงผลบนหน้าเว็บ
  return (
    <div className="overflow-hidden h-screen w-screen p-0 m-0">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <h2 className="text-xl font-medium">กำลังโหลดข้อมูลสำหรับพิมพ์ลาเบล...</h2>
          <p className="text-gray-500 mt-2">ระบบจะพิมพ์ลาเบลโดยอัตโนมัติเมื่อโหลดเสร็จ</p>
        </div>
      ) : !dataReady ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-700 mb-4">ไม่สามารถดึงข้อมูลออเดอร์หรือออเดอร์ไม่มีเลขพัสดุ</p>
            <p className="text-gray-600 mb-6">กรุณาตรวจสอบว่ารหัสออเดอร์ถูกต้องและมีการสร้างเลขพัสดุแล้ว</p>
            <Button 
              onClick={() => window.close()} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              ปิดหน้านี้
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full">
          {/* หน้าจอสำหรับพิมพ์หลายลาเบล */}
          {multipleOrders.length > 1 ? (
            <div>
              {/* ส่วนที่แสดงเฉพาะบนหน้าจอ ไม่พิมพ์ */}
              <div className="print:hidden p-4">
                <h1 className="text-2xl font-bold mb-4 text-center">ลาเบลพร้อมสำหรับการพิมพ์</h1>
                <p className="text-gray-600 mb-6 text-center">
                  กำลังพิมพ์ {multipleOrders.length} ลาเบล ระบบจะพิมพ์ลาเบลโดยอัตโนมัติ
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-800 mb-2">รายการลาเบลที่จะพิมพ์ ({multipleOrders.length})</h3>
                  <ul className="text-sm text-blue-700 list-disc ml-5 mb-3">
                    {multipleOrders.map((order, index) => (
                      <li key={index} className="mb-1">
                        <span className="text-gray-700">#{order.orderNumber || 'N/A'}</span>
                        {' - '}
                        <span className="font-medium">{order.customerName || (order.customer && order.customer.name) || 'ไม่ระบุชื่อผู้รับ'}</span>
                        {' - '}
                        <span>{order.trackingNumber}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-center mt-4">
                    <Button 
                      onClick={printLabel} 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      พิมพ์ลาเบลทั้งหมด
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* ส่วนที่จะพิมพ์ */}
              <div className="hidden print:block w-full">
                {multipleOrders.map((order, index) => {
                  const orderData = prepareOrderData(order);
                  return (
                    <div 
                      key={index} 
                      className="w-[100mm] h-[150mm] border border-dashed border-gray-400 mx-auto my-4 p-2 relative page-break-after-always"
                    >
                      <div className="flex justify-between text-xs border-b border-gray-800 pb-1 mb-2">
                        <div>วันที่: {orderData.shippingDate}</div>
                        <div>{orderData.district || ''} ({sortingCode})</div>
                      </div>
                      
                      <div className="text-center border-b border-gray-800 py-2">
                        <div className="text-xs mb-1 tracking-widest">{orderData.trackingNumber}</div>
                      </div>
                      
                      <div className="flex border-b border-gray-800">
                        <div className="w-2/3 p-2 border-r border-gray-800 text-center font-bold">
                          {orderData.orderNumber || 'N/A'}
                        </div>
                        <div className="w-1/3 p-2 text-xs">
                          <div>บริการ: {serviceType}</div>
                          <div>น้ำหนัก: {weight} kg</div>
                        </div>
                      </div>
                      
                      <div className="border-b border-gray-800 p-2 text-xs">
                        <div className="font-bold">ผู้รับ: {orderData.recipientName}</div>
                        <div>โทร: {orderData.recipientPhone}</div>
                        <div>{orderData.recipientAddress}</div>
                      </div>
                      
                      <div className="flex border-b border-gray-800">
                        <div className="w-2/3 p-2 text-xs border-r border-gray-800">
                          <div className="font-bold">ผู้ส่ง: {senderName}</div>
                          <div>โทร: {senderPhone}</div>
                          <div>{senderAddress}</div>
                        </div>
                        <div className="w-1/3 p-2 flex items-center justify-center">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${orderData.trackingNumber}`} 
                            alt="QR Code" 
                            className="w-16 h-16"
                          />
                        </div>
                      </div>
                      
                      {parseFloat(orderData.codAmount) > 0 && (
                        <div className="flex border-b border-gray-800">
                          <div className="w-2/5 bg-black text-white p-2 font-bold text-center border-r border-gray-800">
                            เก็บเงินปลายทาง
                          </div>
                          <div className="w-3/5 p-2 text-center font-bold">
                            ฿ {parseFloat(orderData.codAmount).toLocaleString('th-TH', {minimumFractionDigits: 2})}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex text-xs p-2">
                        <div className="w-1/2">
                          <div>คาดว่าจะถึงวันที่:</div>
                          <div className="font-bold">{orderData.estimatedDate}</div>
                        </div>
                        <div className="w-1/2 text-right">
                          <div>รหัสลูกค้า: {customerCode}</div>
                          <div>รหัสคลัง: {warehouseCode}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // หน้าจอสำหรับพิมพ์ลาเบลเดียว
            <div className="min-h-screen bg-white flex items-center justify-center p-4 print-content">
              <div className="w-full max-w-lg">
                <div className="hidden print:block print:mb-0">
                  {/* พื้นที่ว่างไว้สำหรับการพิมพ์ผ่าน printLabel() เท่านั้น */}
                </div>
                <div className="print:hidden">
                  <h1 className="text-2xl font-bold mb-4 text-center">ลาเบลพร้อมสำหรับการพิมพ์</h1>
                  <p className="text-gray-600 mb-6 text-center">หน้าต่างพิมพ์ควรเปิดขึ้นโดยอัตโนมัติ หากไม่เปิดให้กดปุ่มพิมพ์ด้านล่าง</p>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-500 text-sm">เลขพัสดุ:</p>
                        <p className="font-medium">{trackingNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">ออเดอร์:</p>
                        <p className="font-medium">{orderID}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-500 text-sm">ผู้รับ:</p>
                      <p className="font-medium">{recipientName || 'ไม่ระบุชื่อผู้รับ'}</p>
                      <p className="text-sm text-gray-600">{recipientAddress || 'ไม่ระบุที่อยู่'}</p>
                      {recipientPhone && <p className="text-sm text-gray-600">โทร: {recipientPhone}</p>}
                    </div>
                    
                    {(codAmount && parseFloat(codAmount) > 0) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-4">
                        <p className="text-yellow-700 text-sm">COD Amount:</p>
                        <p className="font-medium text-yellow-800">{codAmount} บาท</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      onClick={printLabel} 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      พิมพ์ลาเบล
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlashExpressLabelSimple;