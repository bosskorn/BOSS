
import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import { Loader2, Search, Filter, ChevronDown, ChevronUp, FileText, Truck, Package, CheckCircle, XCircle, Printer, RefreshCw, X, Check, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

// อินเทอร์เฟซสำหรับข้อมูลคำสั่งซื้อ
interface Order {
  id: number;
  orderNumber: string;
  customerName?: string;
  customerId?: number;
  total?: number;
  totalAmount?: string;
  shippingFee?: number;
  discount?: number;
  subtotal?: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingMethod: string;
  shippingMethodId?: number;
  shippingServiceId?: number;
  items: number;
  trackingNumber?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  recipientProvince?: string;
  recipientDistrict?: string;
  recipientSubdistrict?: string;
  recipientZipCode?: string;
  notes?: string;
  isPrinted?: boolean;
}

const OrderListEnhanced: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [shippingFilter, setShippingFilter] = useState<string>('all');
  const [isPrintingLabel, setIsPrintingLabel] = useState<boolean>(false);
  const [currentPrintingOrder, setCurrentPrintingOrder] = useState<number | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: keyof Order, direction: 'asc' | 'desc'}>({
    key: 'date',
    direction: 'desc'
  });
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });
  const [availableShippingMethods, setAvailableShippingMethods] = useState<string[]>([]);

  // ฟังก์ชันพิมพ์ใบลาเบลสำหรับรายการที่เลือก
  const printSelectedLabels = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'ไม่มีรายการที่เลือก',
        description: 'กรุณาเลือกรายการที่ต้องการพิมพ์ใบลาเบล',
        variant: 'destructive',
      });
      return;
    }
    
    setIsPrintingLabel(true);
    
    try {
      // สร้างหน้าต่างใหม่สำหรับพิมพ์
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ',
          variant: 'destructive',
        });
        return;
      }

      // ตั้งค่า HTML และ CSS สำหรับการพิมพ์
      printWindow.document.write(`
        <html>
        <head>
          <title>พิมพ์ใบลาเบล - รายการที่เลือก</title>
          <style>
            @page {
              margin: 0;
            }
            body { 
              font-family: 'Kanit', sans-serif; 
              margin: 0; 
              padding: 0; 
              background-color: #f5f5f5;
            }
            .page {
              background-color: white;
              margin: 20px auto;
              padding: 0;
              box-shadow: 0 1px 5px rgba(0,0,0,0.1);
              position: relative;
              overflow: hidden;
              page-break-after: always;
            }
            .label-container { 
              box-sizing: border-box;
              padding: 8mm;
            }
          </style>
        </head>
        <body>
          
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Error printing selected labels:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถพิมพ์ใบลาเบลได้',
        variant: 'destructive',
      });
    } finally {
      setIsPrintingLabel(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายการคำสั่งซื้อทั้งหมด</h1>
            <p className="text-gray-500">จัดการและติดตามคำสั่งซื้อทั้งหมดของคุณได้ที่นี่</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/create-order">
                <Package className="mr-2 h-4 w-4" />
                สร้างคำสั่งซื้อใหม่
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center">
                <Printer className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-medium">รายการคำสั่งซื้อทั้งหมด</span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={printSelectedLabels}
                  disabled={isPrintingLabel}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isPrintingLabel ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-1" />
                      ไปยังหน้าพิมพ์ใบลาเบล
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderListEnhanced;
