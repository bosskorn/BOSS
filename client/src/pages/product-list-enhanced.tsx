import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Package, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash, 
  Tag,
  BarChart3,
  ShoppingCart,
  AlertTriangle,
  ClipboardList,
  Eye,
  PackageOpen,
  PackageCheck
} from 'lucide-react';
import { Link } from 'wouter';
import { ColumnDef } from '@tanstack/react-table';

// ประเภทข้อมูลสินค้า
interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  cost?: number;
  stock: number;
  category: string;
  categoryId: number;
  status: string;
  imageUrl?: string;
  createdAt: string;
}

// สำหรับ 'blank state' เมื่อไม่มีข้อมูล
const emptyProducts: Product[] = [];

const ProductListPage: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [productSummary, setProductSummary] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // ดึงข้อมูลสินค้า
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // ดึงข้อมูลจริงจาก API
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (data && data.success && (Array.isArray(data.data) || Array.isArray(data.products))) {
        // แปลงข้อมูลจาก API ให้อยู่ในรูปแบบที่ใช้งานได้
        const productsArray = data.data || data.products || [];
        const formattedProducts = productsArray.map((item: any) => ({
          id: item.id,
          sku: item.sku || '-',
          name: item.name || 'ไม่มีชื่อ',
          price: typeof item.price === 'string' ? parseFloat(item.price) : 0,
          cost: typeof item.cost === 'string' ? parseFloat(item.cost) : 0,
          stock: item.stock || 0,
          category: item.category?.name || 'ไม่มีหมวดหมู่',
          categoryId: item.categoryId || 0,
          status: item.status || 'active',
          imageUrl: item.imageUrl || undefined,
          createdAt: item.createdAt || new Date().toISOString()
        }));
        
        // คำนวณค่าสรุปข้อมูลสินค้า
        const totalProducts = formattedProducts.length;
        const activeProducts = formattedProducts.filter((p: Product) => p.status === 'active').length;
        const outOfStockProducts = formattedProducts.filter((p: Product) => p.stock === 0 || p.status === 'out_of_stock').length;
        
        // คำนวณมูลค่าสินค้าคงคลังจากต้นทุนสินค้า (cost) คูณจำนวนสินค้าคงเหลือ (stock)
        const totalValue = formattedProducts.reduce((sum: number, product: Product) => {
          // ตรวจสอบว่า cost เป็นตัวเลขหรือไม่
          const cost = typeof product.cost === 'number' ? product.cost : 0;
          // ตรวจสอบว่า stock เป็นตัวเลขหรือไม่
          const stock = typeof product.stock === 'number' ? product.stock : 0;
          
          return sum + (cost * stock);
        }, 0);
        
        setProducts(formattedProducts);
        setProductSummary({
          totalProducts,
          activeProducts,
          outOfStockProducts,
          totalValue
        });
        console.log('Loaded products:', formattedProducts);
      } else {
        console.error('Invalid data format from API:', data);
        // เมื่อไม่พบข้อมูล ให้แสดงข้อมูลว่าง
        setProducts([]);
        setProductSummary({
          totalProducts: 0,
          activeProducts: 0,
          outOfStockProducts: 0,
          totalValue: 0
        });
        toast({
          title: 'ไม่พบข้อมูลสินค้า',
          description: 'กรุณาเพิ่มสินค้าเพื่อแสดงในรายการ',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setProductSummary({
        totalProducts: 0,
        activeProducts: 0,
        outOfStockProducts: 0,
        totalValue: 0
      });
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลสินค้าได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // นิยามคอลัมน์สำหรับตาราง
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'id',
      header: 'รหัส',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.original.sku}</span>,
    },
    {
      accessorKey: 'name',
      header: 'ชื่อสินค้า',
      cell: ({ row }) => {
        // แสดงตัวอักษรแรกของชื่อสินค้าแทนรูปภาพ
        const productInitial = row.original.name.charAt(0);
        const bgColors = [
          'bg-red-100 text-red-600', 
          'bg-blue-100 text-blue-600', 
          'bg-green-100 text-green-600',
          'bg-purple-100 text-purple-600',
          'bg-amber-100 text-amber-600',
          'bg-indigo-100 text-indigo-600'
        ];
        
        // เลือกสีตามตัวอักษรแรกของชื่อสินค้า
        const colorIndex = row.original.name.charCodeAt(0) % bgColors.length;
        const colorClass = bgColors[colorIndex];
        
        return (
          <div className="flex items-center space-x-2">
            <div className={`h-8 w-8 rounded-md flex items-center justify-center font-bold ${colorClass}`}>
              {productInitial}
            </div>
            <span className="font-medium">{row.original.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'ราคาขาย',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
        </span>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'คงเหลือ',
      cell: ({ row }) => {
        const stock = row.original.stock;
        let stockClassName = 'text-green-600 bg-green-50 border-green-200';
        
        if (stock === 0) {
          stockClassName = 'text-red-600 bg-red-50 border-red-200';
        } else if (stock < 10) {
          stockClassName = 'text-amber-600 bg-amber-50 border-amber-200';
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${stockClassName}`}>
            {stock} ชิ้น
          </span>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'หมวดหมู่',
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
          <Tag className="h-3 w-3 mr-1" />
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'สถานะ',
      cell: ({ row }) => {
        const status = row.original.status;
        let statusText = 'พร้อมขาย';
        let statusClassName = 'text-green-600 bg-green-50 border-green-200';
        
        if (status === 'out_of_stock') {
          statusText = 'สินค้าหมด';
          statusClassName = 'text-red-600 bg-red-50 border-red-200';
        } else if (status === 'inactive') {
          statusText = 'ไม่ใช้งาน';
          statusClassName = 'text-gray-600 bg-gray-50 border-gray-200';
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusClassName}`}>
            {statusText}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'จัดการ',
      cell: ({ row }) => {
        const product = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>จัดการสินค้า</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>ดูรายละเอียด</span>
              </DropdownMenuItem>
              <Link href={`/product-create?id=${row.original.id}`}>
                <DropdownMenuItem className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4 text-blue-500" />
                  <span>แก้ไขสินค้า</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => {
                  setProductToDelete(product);
                  setShowDeleteDialog(true);
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>ลบสินค้า</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    
    // ในตัวอย่างนี้ใช้การลบข้อมูลจาก state แทนการเรียก API
    setProducts(products.filter(p => p.id !== productToDelete.id));
    
    toast({
      title: "ลบสินค้าสำเร็จ",
      description: `สินค้า "${productToDelete.name}" ถูกลบออกจากระบบแล้ว`,
    });
    
    setShowDeleteDialog(false);
    setProductToDelete(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* ส่วนหัวหน้า */}
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">จัดการสินค้า</h1>
            <p className="text-muted-foreground">
              จัดการข้อมูลสินค้า เพิ่ม แก้ไข และลบรายการสินค้าในระบบ
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProducts}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </Button>
            <Link href="/product-create">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มสินค้าใหม่
              </Button>
            </Link>
          </div>
        </div>

        {/* แผงสรุปข้อมูล */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">จำนวนสินค้า</CardTitle>
              <PackageOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productSummary.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                มีสินค้าทั้งหมด {productSummary.totalProducts} รายการ
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สินค้าพร้อมขาย</CardTitle>
              <PackageCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productSummary.activeProducts}</div>
              <p className="text-xs text-muted-foreground">
                {((productSummary.activeProducts / productSummary.totalProducts) * 100).toFixed(0)}% ของสินค้าทั้งหมด
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สินค้าหมด</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productSummary.outOfStockProducts}</div>
              <p className="text-xs text-muted-foreground">
                {productSummary.outOfStockProducts} รายการที่ต้องเติมสต็อก
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">มูลค่าสินค้าคงคลัง</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {productSummary.totalValue.toLocaleString('th-TH')} ฿
              </div>
              <p className="text-xs text-muted-foreground">
                มูลค่าตามต้นทุนสินค้าทั้งหมด
              </p>
            </CardContent>
          </Card>
        </div>

        {/* แท็บสำหรับมุมมองต่างๆ */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all" className="flex-1 md:flex-none">
              <Package className="h-4 w-4 mr-2" />
              ทั้งหมด
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1 md:flex-none">
              <PackageCheck className="h-4 w-4 mr-2" />
              พร้อมขาย
            </TabsTrigger>
            <TabsTrigger value="out-of-stock" className="flex-1 md:flex-none">
              <AlertTriangle className="h-4 w-4 mr-2" />
              สินค้าหมด
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <DataTable 
              columns={columns} 
              data={products} 
              searchColumn="name"
              searchPlaceholder="ค้นหาสินค้าตามชื่อ..."
            />
          </TabsContent>
          <TabsContent value="active" className="mt-4">
            <DataTable 
              columns={columns} 
              data={products.filter(p => p.status === 'active')} 
              searchColumn="name"
              searchPlaceholder="ค้นหาสินค้าตามชื่อ..."
            />
          </TabsContent>
          <TabsContent value="out-of-stock" className="mt-4">
            <DataTable 
              columns={columns} 
              data={products.filter(p => p.status === 'out_of_stock' || p.stock === 0)} 
              searchColumn="name"
              searchPlaceholder="ค้นหาสินค้าตามชื่อ..."
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog ยืนยันการลบสินค้า */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบสินค้า</DialogTitle>
            <DialogDescription>
              คุณต้องการลบสินค้า "{productToDelete?.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduct}
            >
              ลบสินค้า
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ProductListPage;