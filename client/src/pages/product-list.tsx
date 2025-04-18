import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown, ShoppingBag } from 'lucide-react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';

// ข้อมูลตัวอย่าง (จะถูกแทนที่ด้วยข้อมูลจริงจาก API ในอนาคต)
const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: 'เสื้อยืดคอกลม',
    description: 'เสื้อยืดคอกลมสีขาว ผ้าคอตตอน 100% ไซส์ S-XXL',
    price: 250,
    stock: 45,
    category: 'เสื้อผ้า',
    image: null,
    isActive: true
  },
  {
    id: 2,
    name: 'กางเกงยีนส์ขายาว',
    description: 'กางเกงยีนส์ทรงตรง สีน้ำเงินเข้ม ไซส์ 28-36',
    price: 550,
    stock: 30,
    category: 'เสื้อผ้า',
    image: null,
    isActive: true
  },
  {
    id: 3,
    name: 'รองเท้าผ้าใบสีขาว',
    description: 'รองเท้าผ้าใบสีขาวล้วน ไซส์ 37-44',
    price: 890,
    stock: 25,
    category: 'รองเท้า',
    image: null,
    isActive: true
  },
  {
    id: 4,
    name: 'กระเป๋าสะพายข้าง',
    description: 'กระเป๋าสะพายข้าง ผ้าแคนวาส สีน้ำตาล',
    price: 490,
    stock: 15,
    category: 'กระเป๋า',
    image: null,
    isActive: true
  },
  {
    id: 5,
    name: 'หมวกแก๊ป',
    description: 'หมวกแก๊ป สีดำ ปรับขนาดได้',
    price: 290,
    stock: 20,
    category: 'เครื่องประดับ',
    image: null,
    isActive: true
  },
  {
    id: 6,
    name: 'ชุดเดรสแขนกุด',
    description: 'ชุดเดรสแขนกุด สีเบจ ทรงหลวม ไซส์ S-L',
    price: 690,
    stock: 10,
    category: 'เสื้อผ้า',
    image: null,
    isActive: false
  }
];

const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
  const [sortBy, setSortBy] = useState('name-asc');
  const { toast } = useToast();

  // หมวดหมู่ทั้งหมดของสินค้า
  const allCategories = SAMPLE_PRODUCTS.map(p => p.category);
  const uniqueCategories = Array.from(new Set(allCategories));
  const categories = ['ทั้งหมด', ...uniqueCategories];

  // กรองและเรียงลำดับสินค้า
  useEffect(() => {
    let filtered = [...SAMPLE_PRODUCTS];
    
    // กรองตามคำค้นหา
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // กรองตามหมวดหมู่
    if (categoryFilter !== 'ทั้งหมด') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    // เรียงลำดับ
    switch (sortBy) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }
    
    setProducts(filtered);
  }, [searchTerm, categoryFilter, sortBy]);

  const handleAddToCart = (productId: number) => {
    toast({
      title: "เพิ่มลงตะกร้าแล้ว",
      description: "สินค้าถูกเพิ่มลงในตะกร้าของคุณเรียบร้อยแล้ว",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 font-kanit">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">รายการสินค้าทั้งหมด</h1>
            <p className="text-gray-600">ค้นหาและเลือกซื้อสินค้าคุณภาพจาก PURPLEDASH</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button variant="outline">
              <ShoppingBag className="w-4 h-4 mr-2" />
              ตะกร้าสินค้า (0)
            </Button>
          </div>
        </div>

        {/* ส่วนกรองและค้นหา */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              className="pl-10"
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="หมวดหมู่: ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  หมวดหมู่: {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="เรียงตาม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">ชื่อ: A-Z</SelectItem>
              <SelectItem value="name-desc">ชื่อ: Z-A</SelectItem>
              <SelectItem value="price-asc">ราคา: น้อยไปมาก</SelectItem>
              <SelectItem value="price-desc">ราคา: มากไปน้อย</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* แสดงจำนวนผลลัพธ์ */}
        <div className="mb-6">
          <p className="text-gray-600">
            พบสินค้า {products.length} รายการ
          </p>
        </div>

        {/* รายการสินค้าแบบกริด */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-purple-500 text-5xl">
                    <ShoppingBag size={50} />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {!product.isActive && (
                    <Badge variant="outline" className="text-xs bg-gray-100">หมดสต็อก</Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2 h-10">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xl font-bold text-purple-600">฿{product.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">คงเหลือ: {product.stock} ชิ้น</p>
                  </div>
                  <Badge>{product.category}</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleAddToCart(product.id)}
                  disabled={!product.isActive || product.stock <= 0}
                >
                  เพิ่มลงตะกร้า
                </Button>
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  ซื้อเลย
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* สรุปคำแนะนำ */}
        <div className="bg-purple-50 rounded-lg p-6 mb-10">
          <h2 className="text-xl font-bold text-purple-800 mb-3">คำแนะนำในการสั่งซื้อ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">วิธีการสั่งซื้อ</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>1. เลือกสินค้าที่ต้องการและเพิ่มลงตะกร้า</li>
                <li>2. ตรวจสอบรายการสินค้าในตะกร้า</li>
                <li>3. กรอกข้อมูลการจัดส่งและเลือกวิธีชำระเงิน</li>
                <li>4. ยืนยันการสั่งซื้อและชำระเงิน</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">การจัดส่ง</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• จัดส่งฟรีสำหรับคำสั่งซื้อ 500 บาทขึ้นไป</li>
                <li>• ส่งด่วนภายใน 24 ชั่วโมงในเขตกรุงเทพฯ</li>
                <li>• ส่งทั่วประเทศภายใน 1-3 วันทำการ</li>
                <li>• บริการเก็บเงินปลายทาง (COD) ทั่วประเทศ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductListPage;