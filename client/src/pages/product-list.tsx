import React, { useState, useEffect, useMemo } from 'react';
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
import { Search, ArrowUpDown, ShoppingBag, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';

// ประเภทของสินค้าในระบบ
interface ProductType {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: string | number;
  cost: string | number;
  stock: number;
  weight: string | number;
  imageUrl: string | null;
  status: string; 
  categoryId: number;
  tags: string[];
  dimensions: any;
  createdAt: string;
  updatedAt: string;
  userId: number;
  category: {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    icon: string;
    parentId: number | null;
    createdAt: string;
    updatedAt: string;
    userId: number;
  } | null;
  
  // แปลงค่าให้ตรงกับที่ใช้ในหน้าจอ
  isActive?: boolean;
  image?: string | null;
}

const ProductListPage: React.FC = () => {
  const [apiProducts, setApiProducts] = useState<ProductType[]>([]);
  const [formattedProducts, setFormattedProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
  const [sortBy, setSortBy] = useState('name-asc');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // ดึงข้อมูลสินค้าจาก API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
        const axios = (await import('axios')).default;
        const response = await axios.get('/api/products', {
          withCredentials: true
        });
        
        if (response.data && response.data.success && Array.isArray(response.data.products)) {
          // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม
          setApiProducts(response.data.products);
          
          // แปลงข้อมูลให้ตรงกับรูปแบบที่ใช้ในหน้าจอ
          const products = response.data.products.map((product: ProductType) => ({
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            stock: product.stock || 0,
            category: product.category?.name || 'ไม่ระบุหมวดหมู่',
            image: product.imageUrl,
            isActive: product.status === 'active' && product.stock > 0
          }));
          setFormattedProducts(products);
        } else {
          console.error('ไม่พบข้อมูลสินค้าหรือข้อมูลไม่ถูกต้อง');
          toast({
            title: 'ไม่สามารถโหลดข้อมูลสินค้าได้',
            description: 'ไม่พบข้อมูลสินค้าหรือรูปแบบข้อมูลไม่ถูกต้อง',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [toast]);

  // หมวดหมู่ทั้งหมดของสินค้า
  const allCategories = formattedProducts.map(p => p.category);
  const uniqueCategories = Array.from(new Set(allCategories));
  const categories = ['ทั้งหมด', ...uniqueCategories];

  // กรองและเรียงลำดับสินค้า
  const filteredProducts = useMemo(() => {
    let filtered = [...formattedProducts];
    
    // กรองตามคำค้นหา
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
    
    return filtered;
  }, [formattedProducts, searchTerm, categoryFilter, sortBy]);

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
            พบสินค้า {filteredProducts.length} รายการ
          </p>
        </div>

        {/* รายการสินค้าแบบกริด */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-purple-800">กำลังโหลดข้อมูลสินค้า...</h3>
            <p className="text-gray-500">โปรดรอสักครู่</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">ไม่พบสินค้า</h3>
            <p className="text-gray-500">ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {filteredProducts.map((product: any) => (
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
        )}

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