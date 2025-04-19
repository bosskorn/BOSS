import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// สถานะการเคลม
enum ClaimStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
  CLOSED = 'closed'
}

// ประเภทของการเคลม
enum ClaimType {
  LOST = 'lost',
  DAMAGED = 'damaged',
  DELAYED = 'delayed',
  RETURNED = 'returned',
  WRONG_ITEM = 'wrong_item',
  OTHER = 'other'
}

// อินเตอร์เฟซสำหรับข้อมูลการเคลม
interface Claim {
  id: string;
  claimNumber: string;
  orderId: string;
  trackingNumber: string;
  customerName: string;
  claimType: ClaimType;
  status: ClaimStatus;
  amount: number;
  createdAt: string;
  updatedAt: string;
  description: string;
  courierName: string;
  evidence: string[];
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  resolution?: string;
}

// สคีมาสำหรับฟอร์มการตอบกลับการเคลม
const replyClaimSchema = z.object({
  resolution: z.string().min(10, {
    message: "กรุณาระบุรายละเอียดการตอบกลับอย่างน้อย 10 ตัวอักษร",
  }),
  status: z.nativeEnum(ClaimStatus, {
    required_error: "กรุณาเลือกสถานะ",
  }),
  refundAmount: z.string().optional(),
  notes: z.string().optional(),
});

// ข้อมูลจำลองสำหรับการแสดงผล
const mockClaims: Claim[] = [
  {
    id: '1',
    claimNumber: 'CLM-20250419-001',
    orderId: 'ORD-20250418-001',
    trackingNumber: 'TH123456789',
    customerName: 'สมศักดิ์ รักสินค้า',
    claimType: ClaimType.LOST,
    status: ClaimStatus.PENDING,
    amount: 1250.00,
    createdAt: '2025-04-19T05:30:00.000Z',
    updatedAt: '2025-04-19T05:30:00.000Z',
    description: 'พัสดุไม่ถึงมือผู้รับ ติดตามกับขนส่งแล้วไม่พบข้อมูล',
    courierName: 'Flash Express',
    evidence: ['evidence-001.jpg', 'chat-log-001.pdf'],
    priority: 'high',
  },
  {
    id: '2',
    claimNumber: 'CLM-20250419-002',
    orderId: 'ORD-20250417-045',
    trackingNumber: 'TH987654321',
    customerName: 'วิภาดา เจริญสุข',
    claimType: ClaimType.DAMAGED,
    status: ClaimStatus.PROCESSING,
    amount: 850.00,
    createdAt: '2025-04-18T14:25:00.000Z',
    updatedAt: '2025-04-19T08:15:00.000Z',
    description: 'สินค้าเสียหายระหว่างการขนส่ง กล่องบุบและสินค้าภายในแตก',
    courierName: 'Kerry Express',
    evidence: ['damage-photo-002.jpg', 'package-photo-002.jpg'],
    priority: 'medium',
    assignedTo: 'พนักงานฝ่ายบริการลูกค้า',
  },
  {
    id: '3',
    claimNumber: 'CLM-20250418-015',
    orderId: 'ORD-20250415-102',
    trackingNumber: 'TH456789123',
    customerName: 'ธนพล รัตนาภรณ์',
    claimType: ClaimType.DELAYED,
    status: ClaimStatus.APPROVED,
    amount: 300.00,
    createdAt: '2025-04-18T09:15:00.000Z',
    updatedAt: '2025-04-19T10:45:00.000Z',
    description: 'จัดส่งล่าช้ากว่ากำหนด 5 วัน ลูกค้าต้องการค่าชดเชย',
    courierName: 'Thailand Post',
    evidence: ['tracking-status-003.pdf'],
    priority: 'low',
    assignedTo: 'ผู้จัดการฝ่ายขนส่ง',
    resolution: 'อนุมัติคืนค่าส่ง 300 บาท เนื่องจากส่งล่าช้ากว่ากำหนด',
  },
  {
    id: '4',
    claimNumber: 'CLM-20250417-008',
    orderId: 'ORD-20250414-078',
    trackingNumber: 'TH789123456',
    customerName: 'มานี มีทรัพย์',
    claimType: ClaimType.WRONG_ITEM,
    status: ClaimStatus.REFUNDED,
    amount: 1590.00,
    createdAt: '2025-04-17T16:30:00.000Z',
    updatedAt: '2025-04-19T13:20:00.000Z',
    description: 'ได้รับสินค้าผิดรายการ ได้รับเสื้อสีแดงแทนสีดำตามที่สั่ง',
    courierName: 'J&T Express',
    evidence: ['wrong-item-004.jpg', 'order-details-004.pdf'],
    priority: 'medium',
    assignedTo: 'เจ้าหน้าที่บัญชี',
    resolution: 'คืนเงินเต็มจำนวนและให้ลูกค้าเก็บสินค้าที่ผิด',
  },
  {
    id: '5',
    claimNumber: 'CLM-20250416-023',
    orderId: 'ORD-20250412-134',
    trackingNumber: 'TH321456789',
    customerName: 'วีระชัย เกษมสุข',
    claimType: ClaimType.RETURNED,
    status: ClaimStatus.CLOSED,
    amount: 2450.00,
    createdAt: '2025-04-16T11:10:00.000Z',
    updatedAt: '2025-04-19T09:05:00.000Z',
    description: 'ลูกค้าปฏิเสธรับพัสดุ แจ้งว่าสั่งซื้อผิด ต้องการคืนเงิน',
    courierName: 'Ninja Van',
    evidence: ['return-slip-005.pdf'],
    priority: 'low',
    assignedTo: 'ผู้จัดการฝ่ายคลังสินค้า',
    resolution: 'ได้รับสินค้าคืนแล้ว ดำเนินการคืนเงินเรียบร้อย',
  },
  {
    id: '6',
    claimNumber: 'CLM-20250419-003',
    orderId: 'ORD-20250418-056',
    trackingNumber: 'TH654321987',
    customerName: 'สุพรรณี สวัสดิกุล',
    claimType: ClaimType.OTHER,
    status: ClaimStatus.REJECTED,
    amount: 550.00,
    createdAt: '2025-04-19T07:45:00.000Z',
    updatedAt: '2025-04-19T14:30:00.000Z',
    description: 'คนขับพูดจาไม่สุภาพและโยนพัสดุ ต้องการให้บริษัทตักเตือน',
    courierName: 'Flash Express',
    evidence: ['complaint-006.pdf'],
    priority: 'high',
    assignedTo: 'ผู้จัดการฝ่ายบริการลูกค้า',
    resolution: 'ปฏิเสธการจ่ายค่าชดเชย แต่ได้ตักเตือนพนักงานและจัดอบรมเพิ่มเติม',
  }
];

// ฟังก์ชันสำหรับแสดงสีของแบดจ์ตามสถานะ
const getStatusColor = (status: ClaimStatus) => {
  switch (status) {
    case ClaimStatus.PENDING:
      return 'bg-yellow-500/90 hover:bg-yellow-500';
    case ClaimStatus.PROCESSING:
      return 'bg-blue-500/90 hover:bg-blue-500';
    case ClaimStatus.APPROVED:
      return 'bg-green-500/90 hover:bg-green-500';
    case ClaimStatus.REJECTED:
      return 'bg-red-500/90 hover:bg-red-500';
    case ClaimStatus.REFUNDED:
      return 'bg-purple-500/90 hover:bg-purple-500';
    case ClaimStatus.CLOSED:
      return 'bg-gray-500/90 hover:bg-gray-500';
    default:
      return 'bg-gray-500/90 hover:bg-gray-500';
  }
};

// ฟังก์ชันสำหรับแสดงชื่อสถานะเป็นภาษาไทย
const getStatusThai = (status: ClaimStatus) => {
  switch (status) {
    case ClaimStatus.PENDING:
      return 'รอดำเนินการ';
    case ClaimStatus.PROCESSING:
      return 'กำลังดำเนินการ';
    case ClaimStatus.APPROVED:
      return 'อนุมัติแล้ว';
    case ClaimStatus.REJECTED:
      return 'ปฏิเสธการเคลม';
    case ClaimStatus.REFUNDED:
      return 'คืนเงินแล้ว';
    case ClaimStatus.CLOSED:
      return 'ปิดเคสแล้ว';
    default:
      return 'ไม่ทราบสถานะ';
  }
};

// ฟังก์ชันสำหรับแสดงชื่อประเภทการเคลมเป็นภาษาไทย
const getClaimTypeThai = (type: ClaimType) => {
  switch (type) {
    case ClaimType.LOST:
      return 'พัสดุสูญหาย';
    case ClaimType.DAMAGED:
      return 'พัสดุเสียหาย';
    case ClaimType.DELAYED:
      return 'จัดส่งล่าช้า';
    case ClaimType.RETURNED:
      return 'พัสดุถูกส่งคืน';
    case ClaimType.WRONG_ITEM:
      return 'ได้รับสินค้าผิด';
    case ClaimType.OTHER:
      return 'ปัญหาอื่นๆ';
    default:
      return 'ไม่ระบุประเภท';
  }
};

// ฟังก์ชันสำหรับแสดงความสำคัญเป็นภาษาไทย
const getPriorityThai = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'ต่ำ';
    case 'medium':
      return 'ปานกลาง';
    case 'high':
      return 'สูง';
    default:
      return 'ไม่ระบุ';
  }
};

// ฟังก์ชันสำหรับแสดงสีของความสำคัญ
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'bg-blue-100 text-blue-800';
    case 'medium':
      return 'bg-orange-100 text-orange-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// ฟังก์ชันสำหรับจัดรูปแบบวันที่
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// ฟังก์ชันสำหรับจัดรูปแบบจำนวนเงิน
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2
  }).format(amount);
};

// หน้าแสดงรายการเคลม
const ClaimsList = () => {
  // สถานะและตัวแปรสำหรับหน้าเคลม
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // รูปแบบสำหรับฟอร์มตอบกลับการเคลม
  type FormData = z.infer<typeof replyClaimSchema>;
  
  const form = useForm<FormData>({
    resolver: zodResolver(replyClaimSchema),
    defaultValues: {
      resolution: "",
      status: selectedClaim?.status || ClaimStatus.PROCESSING,
      refundAmount: selectedClaim ? selectedClaim.amount.toString() : "",
      notes: "",
    },
  });

  // จำลองการใช้ useQuery เพื่อดึงข้อมูลการเคลม
  const { data: claims, isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      // จำลองการดึงข้อมูลจาก API
      return new Promise<Claim[]>((resolve) => {
        setTimeout(() => {
          resolve(mockClaims);
        }, 500);
      });
    },
  });

  // ฟังก์ชันกรองรายการเคลม
  const filteredClaims = claims?.filter(claim => {
    // กรองตามคำค้นหา
    const searchMatch =
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // กรองตามสถานะ
    const statusMatch = statusFilter === 'all' || claim.status === statusFilter;
    
    // กรองตามประเภท
    const typeMatch = typeFilter === 'all' || claim.claimType === typeFilter;
    
    return searchMatch && statusMatch && typeMatch;
  }) || [];

  // ฟังก์ชันสำหรับการตอบกลับการเคลม
  const handleReplyClaim = (data: FormData) => {
    if (!selectedClaim) return;
    
    console.log('Submitting claim reply:', data);
    
    // จำลองการส่งข้อมูลไปยัง API
    toast({
      title: "บันทึกการตอบกลับสำเร็จ",
      description: `ตอบกลับเคลมหมายเลข ${selectedClaim.claimNumber} เรียบร้อยแล้ว`,
    });
    
    // ปิด dialog
    setReplyDialogOpen(false);
    form.reset();
  };

  // ฟังก์ชันสำหรับการเปิด dialog รายละเอียด
  const openDetailDialog = (claim: Claim) => {
    setSelectedClaim(claim);
    setDetailDialogOpen(true);
  };

  // ฟังก์ชันสำหรับการเปิด dialog ตอบกลับ
  const openReplyDialog = (claim: Claim) => {
    setSelectedClaim(claim);
    
    // กำหนดค่าเริ่มต้นสำหรับฟอร์มจากข้อมูลการเคลมที่เลือก
    form.reset({
      resolution: claim.resolution || "",
      status: claim.status,
      refundAmount: claim.amount.toString(),
      notes: "",
    });
    
    setReplyDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* ส่วนหัวหน้าเพจ */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-purple-900">รายการเคลมและปัญหาการจัดส่ง</h1>
              <p className="text-gray-500 mt-1">จัดการเรื่องร้องเรียน ปัญหาการจัดส่ง และการชดเชยจากขนส่ง</p>
            </div>
            <Button className="bg-purple-700 hover:bg-purple-800" size="sm">
              <span className="mr-2">+</span> สร้างรายการเคลมใหม่
            </Button>
          </div>

          {/* แสดงจำนวนรายการ */}
          <div className="bg-purple-50 border border-purple-100 rounded-md p-3 flex flex-wrap gap-3 justify-between">
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-yellow-500/90 hover:bg-yellow-500">รอดำเนินการ: {claims?.filter(c => c.status === ClaimStatus.PENDING).length || 0}</Badge>
              <Badge className="bg-blue-500/90 hover:bg-blue-500">กำลังดำเนินการ: {claims?.filter(c => c.status === ClaimStatus.PROCESSING).length || 0}</Badge>
              <Badge className="bg-green-500/90 hover:bg-green-500">อนุมัติแล้ว: {claims?.filter(c => c.status === ClaimStatus.APPROVED).length || 0}</Badge>
              <Badge className="bg-red-500/90 hover:bg-red-500">ปฏิเสธการเคลม: {claims?.filter(c => c.status === ClaimStatus.REJECTED).length || 0}</Badge>
              <Badge className="bg-purple-500/90 hover:bg-purple-500">คืนเงินแล้ว: {claims?.filter(c => c.status === ClaimStatus.REFUNDED).length || 0}</Badge>
              <Badge className="bg-gray-500/90 hover:bg-gray-500">ปิดเคสแล้ว: {claims?.filter(c => c.status === ClaimStatus.CLOSED).length || 0}</Badge>
            </div>
            <div>
              <Badge variant="outline" className="border-purple-200 text-purple-800">
                ทั้งหมด: {claims?.length || 0} รายการ
              </Badge>
            </div>
          </div>

          {/* ตัวกรองและการค้นหา */}
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="ค้นหาด้วยเลขพัสดุ, หมายเลขเคลม, หรือชื่อลูกค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:max-w-xs"
            />
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="สถานะทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                  <SelectItem value={ClaimStatus.PENDING}>รอดำเนินการ</SelectItem>
                  <SelectItem value={ClaimStatus.PROCESSING}>กำลังดำเนินการ</SelectItem>
                  <SelectItem value={ClaimStatus.APPROVED}>อนุมัติแล้ว</SelectItem>
                  <SelectItem value={ClaimStatus.REJECTED}>ปฏิเสธการเคลม</SelectItem>
                  <SelectItem value={ClaimStatus.REFUNDED}>คืนเงินแล้ว</SelectItem>
                  <SelectItem value={ClaimStatus.CLOSED}>ปิดเคสแล้ว</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="ประเภทปัญหาทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ประเภทปัญหาทั้งหมด</SelectItem>
                  <SelectItem value={ClaimType.LOST}>พัสดุสูญหาย</SelectItem>
                  <SelectItem value={ClaimType.DAMAGED}>พัสดุเสียหาย</SelectItem>
                  <SelectItem value={ClaimType.DELAYED}>จัดส่งล่าช้า</SelectItem>
                  <SelectItem value={ClaimType.RETURNED}>พัสดุถูกส่งคืน</SelectItem>
                  <SelectItem value={ClaimType.WRONG_ITEM}>ได้รับสินค้าผิด</SelectItem>
                  <SelectItem value={ClaimType.OTHER}>ปัญหาอื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* แท็บสำหรับกลุ่มรายการเคลม */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
              <TabsTrigger value="high">ความสำคัญสูง</TabsTrigger>
              <TabsTrigger value="recent">ล่าสุด</TabsTrigger>
              <TabsTrigger value="mine">งานของฉัน</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-500">กำลังโหลดข้อมูล...</p>
                </div>
              ) : filteredClaims.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">ไม่พบรายการเคลม</h3>
                  <p className="mt-1 text-sm text-gray-500">ไม่พบรายการเคลมที่ตรงกับเงื่อนไขการค้นหา</p>
                </div>
              ) : (
                // แสดงรายการเคลม
                <div className="space-y-4">
                  {filteredClaims.map(claim => (
                    <Card key={claim.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`h-1 ${getStatusColor(claim.status)}`}></div>
                      <CardContent className="p-0">
                        <div className="p-4 md:p-6">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-medium text-gray-900">
                                  เคลม #{claim.claimNumber}
                                </h3>
                                <Badge variant="outline" className={getPriorityColor(claim.priority)}>
                                  ความสำคัญ: {getPriorityThai(claim.priority)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                <span className="inline-block mr-2">
                                  คำสั่งซื้อ: <span className="font-medium">{claim.orderId}</span>
                                </span>
                                • 
                                <span className="inline-block mx-2">
                                  เลขพัสดุ: <span className="font-medium">{claim.trackingNumber}</span>
                                </span>
                                • 
                                <span className="inline-block ml-2">
                                  ขนส่ง: <span className="font-medium">{claim.courierName}</span>
                                </span>
                              </p>
                            </div>
                            <Badge className={getStatusColor(claim.status)}>
                              {getStatusThai(claim.status)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">ประเภทการเคลม</p>
                              <p className="font-medium">{getClaimTypeThai(claim.claimType)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">ลูกค้า</p>
                              <p className="font-medium">{claim.customerName}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">มูลค่าเคลม</p>
                              <p className="font-medium text-purple-700">{formatCurrency(claim.amount)}</p>
                            </div>
                          </div>

                          <div className="space-y-1 mb-4">
                            <p className="text-xs text-gray-500">รายละเอียดปัญหา</p>
                            <p className="text-sm line-clamp-2">{claim.description}</p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>สร้างเมื่อ {formatDate(claim.createdAt)}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openDetailDialog(claim)}>
                                ดูรายละเอียด
                              </Button>
                              <Button 
                                size="sm"
                                variant="default"
                                className="bg-purple-700 hover:bg-purple-800"
                                onClick={() => openReplyDialog(claim)}
                                disabled={claim.status === ClaimStatus.CLOSED}
                              >
                                ตอบกลับ
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="high" className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p>รายการที่มีความสำคัญสูง</p>
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p>รายการล่าสุด</p>
              </div>
            </TabsContent>
            
            <TabsContent value="mine" className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p>งานที่ได้รับมอบหมาย</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog แสดงรายละเอียดการเคลม */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedClaim && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle>รายละเอียดการเคลม #{selectedClaim.claimNumber}</DialogTitle>
                  <Badge className={getStatusColor(selectedClaim.status)}>
                    {getStatusThai(selectedClaim.status)}
                  </Badge>
                </div>
                <DialogDescription>
                  เลขพัสดุ: {selectedClaim.trackingNumber} • ขนส่ง: {selectedClaim.courierName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">ข้อมูลคำสั่งซื้อ</h4>
                    <p className="text-sm">คำสั่งซื้อ: <span className="font-medium">{selectedClaim.orderId}</span></p>
                    <p className="text-sm">ลูกค้า: <span className="font-medium">{selectedClaim.customerName}</span></p>
                    <p className="text-sm">มูลค่าเคลม: <span className="font-medium text-purple-700">{formatCurrency(selectedClaim.amount)}</span></p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">ข้อมูลปัญหา</h4>
                    <p className="text-sm">ประเภทปัญหา: <span className="font-medium">{getClaimTypeThai(selectedClaim.claimType)}</span></p>
                    <p className="text-sm">ความสำคัญ: <span className="font-medium">{getPriorityThai(selectedClaim.priority)}</span></p>
                    <p className="text-sm mt-2">รายละเอียด:</p>
                    <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedClaim.description}</p>
                  </div>
                  
                  {selectedClaim.resolution && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">การตอบกลับ</h4>
                      <p className="text-sm mt-1 p-3 bg-purple-50 rounded-md">{selectedClaim.resolution}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">สถานะและระยะเวลา</h4>
                    <p className="text-sm">สร้างเมื่อ: <span className="font-medium">{formatDate(selectedClaim.createdAt)}</span></p>
                    <p className="text-sm">อัพเดตล่าสุด: <span className="font-medium">{formatDate(selectedClaim.updatedAt)}</span></p>
                    {selectedClaim.assignedTo && (
                      <p className="text-sm">ผู้รับผิดชอบ: <span className="font-medium">{selectedClaim.assignedTo}</span></p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">หลักฐานประกอบ</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedClaim.evidence.map((item, index) => (
                        <div key={index} className="border rounded-md p-2 text-center">
                          <p className="text-xs text-gray-500 truncate">{item}</p>
                          <Button variant="link" size="sm" className="text-purple-700 h-auto p-0 mt-1">
                            ดูไฟล์
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <span>รหัสอ้างอิง: {selectedClaim.id}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                    ปิด
                  </Button>
                  {selectedClaim.status !== ClaimStatus.CLOSED && (
                    <Button 
                      className="bg-purple-700 hover:bg-purple-800"
                      onClick={() => {
                        setDetailDialogOpen(false);
                        openReplyDialog(selectedClaim);
                      }}
                    >
                      ตอบกลับ
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog สำหรับตอบกลับการเคลม */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-lg">
          {selectedClaim && (
            <>
              <DialogHeader>
                <DialogTitle>ตอบกลับการเคลม #{selectedClaim.claimNumber}</DialogTitle>
                <DialogDescription>
                  ลูกค้า: {selectedClaim.customerName} • ประเภท: {getClaimTypeThai(selectedClaim.claimType)}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleReplyClaim)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>สถานะการเคลม</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกสถานะ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={ClaimStatus.PROCESSING}>กำลังดำเนินการ</SelectItem>
                            <SelectItem value={ClaimStatus.APPROVED}>อนุมัติการเคลม</SelectItem>
                            <SelectItem value={ClaimStatus.REJECTED}>ปฏิเสธการเคลม</SelectItem>
                            <SelectItem value={ClaimStatus.REFUNDED}>คืนเงินแล้ว</SelectItem>
                            <SelectItem value={ClaimStatus.CLOSED}>ปิดเคสเรียบร้อย</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="resolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>การตอบกลับ</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="ระบุรายละเอียดการตอบกลับหรือการแก้ไขปัญหา..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="refundAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>จำนวนเงินชดเชย (ถ้ามี)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          ระบุจำนวนเงินที่ต้องการชดเชยให้ลูกค้า (หากมีการอนุมัติการชดเชย)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>บันทึกภายใน (ลูกค้าจะไม่เห็น)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="บันทึกภายในสำหรับทีม..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setReplyDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button type="submit" className="bg-purple-700 hover:bg-purple-800">
                      บันทึกการตอบกลับ
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ClaimsList;