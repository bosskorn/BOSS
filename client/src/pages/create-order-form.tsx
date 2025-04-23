
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from '../hooks/use-toast';
import { useAuth } from '../hooks/use-auth';
import axios from 'axios';

type AddressInfo = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  province: string;
  district: string;
  subdistrict?: string;
  zipcode: string;
};

type OrderFormData = {
  outTradeNo: string;
  expressCategory: number;
  warehouseNo?: string;
  srcName: string;
  srcPhone: string;
  srcProvinceName: string;
  srcCityName: string;
  srcDistrictName?: string;
  srcPostalCode: string;
  srcDetailAddress: string;
  dstName: string;
  dstPhone: string;
  dstHomePhone?: string;
  dstProvinceName: string;
  dstCityName: string;
  dstDistrictName?: string;
  dstPostalCode: string;
  dstDetailAddress: string;
  returnName?: string;
  returnPhone?: string;
  codEnabled?: boolean;
  codAmount?: number;
  remark?: string;
  items: {
    name: string;
    quantity: number;
    price?: number;
  }[];
};

export default function CreateOrderForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [senderInfo, setSenderInfo] = useState<AddressInfo | null>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    outTradeNo: generateOrderNumber(),
    expressCategory: 1,
    srcName: '',
    srcPhone: '',
    srcProvinceName: '',
    srcCityName: '',
    srcPostalCode: '',
    srcDetailAddress: '',
    dstName: '',
    dstPhone: '',
    dstProvinceName: '',
    dstCityName: '',
    dstPostalCode: '',
    dstDetailAddress: '',
    items: [{ name: '', quantity: 1 }]
  });

  useEffect(() => {
    // ดึงข้อมูลผู้ส่งจากโปรไฟล์ผู้ใช้
    if (user) {
      console.log("กำลังดึงข้อมูลผู้ส่งจากโปรไฟล์:", user);
      const senderData: AddressInfo = {
        name: user.fullname || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
        province: user.province || '',
        district: user.district || '',
        subdistrict: user.subdistrict || '',
        zipcode: user.zipcode || ''
      };
      
      setSenderInfo(senderData);
      
      // อัปเดตฟอร์มด้วยข้อมูลผู้ส่ง
      setFormData(prev => ({
        ...prev,
        srcName: senderData.name,
        srcPhone: senderData.phone,
        srcProvinceName: senderData.province,
        srcCityName: senderData.district,
        srcDistrictName: senderData.subdistrict,
        srcPostalCode: senderData.zipcode,
        srcDetailAddress: senderData.address
      }));
    }
  }, [user]);

  // สร้างเลขออเดอร์อัตโนมัติ
  function generateOrderNumber() {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'price' ? Number(value) : value
    };
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // เตรียมข้อมูลสำหรับการส่ง API
      const orderData = {
        ...formData,
        // เพิ่มข้อมูลอื่นๆ ตามต้องการ
      };

      const response = await axios.post('/api/orders/create', orderData);

      if (response.data.success) {
        toast({
          title: "สร้างออเดอร์สำเร็จ",
          description: `เลขออเดอร์: ${response.data.order.outTradeNo}`,
        });

        // รีเซ็ตฟอร์ม หรือ นำทางไปยังหน้าถัดไป
        setFormData({
          outTradeNo: generateOrderNumber(),
          expressCategory: 1,
          srcName: senderInfo?.name || '',
          srcPhone: senderInfo?.phone || '',
          srcProvinceName: senderInfo?.province || '',
          srcCityName: senderInfo?.district || '',
          srcDistrictName: senderInfo?.subdistrict || '',
          srcPostalCode: senderInfo?.zipcode || '',
          srcDetailAddress: senderInfo?.address || '',
          dstName: '',
          dstPhone: '',
          dstProvinceName: '',
          dstCityName: '',
          dstPostalCode: '',
          dstDetailAddress: '',
          items: [{ name: '', quantity: 1 }]
        });
      } else {
        throw new Error(response.data.message || 'ไม่สามารถสร้างออเดอร์ได้');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        variant: 'destructive',
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : 'ไม่สามารถสร้างออเดอร์ได้ โปรดลองอีกครั้ง',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">สร้างออเดอร์ใหม่</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ส่วนข้อมูลการจัดส่ง */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>ข้อมูลผู้ส่ง</CardTitle>
                <CardDescription>ข้อมูลต้นทางการจัดส่ง</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="srcName" className="text-sm font-medium">ชื่อผู้ส่ง</label>
                    <Input 
                      id="srcName" 
                      name="srcName" 
                      value={formData.srcName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="srcPhone" className="text-sm font-medium">เบอร์โทรผู้ส่ง</label>
                    <Input 
                      id="srcPhone" 
                      name="srcPhone" 
                      value={formData.srcPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="srcDetailAddress" className="text-sm font-medium">ที่อยู่โดยละเอียด</label>
                  <Textarea 
                    id="srcDetailAddress" 
                    name="srcDetailAddress" 
                    value={formData.srcDetailAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="srcProvinceName" className="text-sm font-medium">จังหวัด</label>
                    <Input 
                      id="srcProvinceName" 
                      name="srcProvinceName" 
                      value={formData.srcProvinceName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="srcCityName" className="text-sm font-medium">อำเภอ</label>
                    <Input 
                      id="srcCityName" 
                      name="srcCityName" 
                      value={formData.srcCityName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="srcDistrictName" className="text-sm font-medium">ตำบล</label>
                    <Input 
                      id="srcDistrictName" 
                      name="srcDistrictName" 
                      value={formData.srcDistrictName || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="srcPostalCode" className="text-sm font-medium">รหัสไปรษณีย์</label>
                    <Input 
                      id="srcPostalCode" 
                      name="srcPostalCode" 
                      value={formData.srcPostalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ส่วนข้อมูลผู้รับ */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>ข้อมูลผู้รับ</CardTitle>
                <CardDescription>ข้อมูลปลายทางการจัดส่ง</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="dstName" className="text-sm font-medium">ชื่อผู้รับ</label>
                    <Input 
                      id="dstName" 
                      name="dstName" 
                      value={formData.dstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="dstPhone" className="text-sm font-medium">เบอร์โทรผู้รับ</label>
                    <Input 
                      id="dstPhone" 
                      name="dstPhone" 
                      value={formData.dstPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="dstDetailAddress" className="text-sm font-medium">ที่อยู่โดยละเอียด</label>
                  <Textarea 
                    id="dstDetailAddress" 
                    name="dstDetailAddress" 
                    value={formData.dstDetailAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="dstProvinceName" className="text-sm font-medium">จังหวัด</label>
                    <Input 
                      id="dstProvinceName" 
                      name="dstProvinceName" 
                      value={formData.dstProvinceName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="dstCityName" className="text-sm font-medium">อำเภอ</label>
                    <Input 
                      id="dstCityName" 
                      name="dstCityName" 
                      value={formData.dstCityName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="dstDistrictName" className="text-sm font-medium">ตำบล</label>
                    <Input 
                      id="dstDistrictName" 
                      name="dstDistrictName" 
                      value={formData.dstDistrictName || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="dstPostalCode" className="text-sm font-medium">รหัสไปรษณีย์</label>
                    <Input 
                      id="dstPostalCode" 
                      name="dstPostalCode" 
                      value={formData.dstPostalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ส่วนข้อมูลสินค้า */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>ข้อมูลสินค้า</CardTitle>
              <CardDescription>รายละเอียดสินค้าที่ต้องการจัดส่ง</CardDescription>
            </CardHeader>
            <CardContent>
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <label htmlFor={`item-${index}-name`} className="text-sm font-medium">ชื่อสินค้า</label>
                    <Input 
                      id={`item-${index}-name`}
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-20">
                    <label htmlFor={`item-${index}-quantity`} className="text-sm font-medium">จำนวน</label>
                    <Input 
                      id={`item-${index}-quantity`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-24">
                    <label htmlFor={`item-${index}-price`} className="text-sm font-medium">ราคา</label>
                    <Input 
                      id={`item-${index}-price`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price || ''}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon"
                    className="mt-6"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length <= 1}
                  >
                    <span className="sr-only">ลบรายการ</span>
                    ✕
                  </Button>
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                onClick={addItem}
                className="mt-2"
              >
                + เพิ่มสินค้า
              </Button>
            </CardContent>
          </Card>

          {/* ส่วนข้อมูลการจัดส่ง */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>ข้อมูลการจัดส่ง</CardTitle>
              <CardDescription>เลือกประเภทการจัดส่งและบริการเสริม</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="expressCategory" className="text-sm font-medium">ประเภทการจัดส่ง</label>
                <Select
                  value={formData.expressCategory.toString()}
                  onValueChange={(value) => handleSelectChange('expressCategory', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทการจัดส่ง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ส่งด่วน (1-2 วัน)</SelectItem>
                    <SelectItem value="2">ส่งธรรมดา (2-3 วัน)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="codEnabled"
                  checked={formData.codEnabled || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    codEnabled: e.target.checked,
                    codAmount: e.target.checked ? (prev.codAmount || 0) : undefined
                  }))}
                  className="h-4 w-4"
                />
                <label htmlFor="codEnabled" className="text-sm font-medium">เก็บเงินปลายทาง (COD)</label>
              </div>

              {formData.codEnabled && (
                <div className="space-y-2">
                  <label htmlFor="codAmount" className="text-sm font-medium">จำนวนเงิน COD (บาท)</label>
                  <Input 
                    id="codAmount" 
                    name="codAmount" 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.codAmount || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      codAmount: Number(e.target.value)
                    }))}
                    required={formData.codEnabled}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="remark" className="text-sm font-medium">หมายเหตุ</label>
                <Textarea 
                  id="remark" 
                  name="remark" 
                  value={formData.remark || ''}
                  onChange={handleChange}
                  placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังสร้างออเดอร์...' : 'สร้างออเดอร์'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
