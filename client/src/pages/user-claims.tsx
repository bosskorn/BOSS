import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

// UI components
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// Enum สำหรับประเภทการเคลม
enum ClaimType {
  LOST = 'lost',
  DAMAGED = 'damaged',
  DELAYED = 'delayed',
  RETURNED = 'returned',
  WRONG_ITEM = 'wrong_item',
  OTHER = 'other',
}

// Enum สำหรับสถานะการเคลม
enum ClaimStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
  CLOSED = 'closed',
}

// ประเภทข้อมูลสำหรับการเคลม
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
  priority: string;
  assignedTo?: string;
  resolution?: string;
}

// สคีมาสำหรับสร้างการเคลมใหม่
const createClaimSchema = z.object({
  orderId: z.string().min(1, {
    message: "กรุณาระบุหมายเลขคำสั่งซื้อ",
  }),
  trackingNumber: z.string().min(1, {
    message: "กรุณาระบุหมายเลขพัสดุ",
  }),
  claimType: z.nativeEnum(ClaimType, {
    required_error: "กรุณาเลือกประเภทการเคลม",
  }),
  description: z.string().min(10, {
    message: "กรุณาระบุรายละเอียดปัญหาอย่างน้อย 10 ตัวอักษร",
  }),
  amount: z.string().optional(),
  evidence: z.array(z.string()).optional(),
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

// หน้าแสดงรายการเคลมสำหรับผู้ใช้
const UserClaims = () => {
  // สถานะและตัวแปรสำหรับหน้าเคลม
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // รูปแบบสำหรับฟอร์มสร้างการเคลมใหม่
  type CreateFormData = z.infer<typeof createClaimSchema>;
  
  const form = useForm<CreateFormData>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: {
      orderId: "",
      trackingNumber: "",
      claimType: undefined,
      description: "",
      amount: "",
      evidence: [],
    },
  });

  // จำลองการใช้ useQuery เพื่อดึงข้อมูลการเคลม
  const { data: claims, isLoading } = useQuery({
    queryKey: ['user-claims'],
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
      claim.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    // กรองตามสถานะ
    const statusMatch = statusFilter === 'all' || claim.status === statusFilter;
    
    return searchMatch && statusMatch;
  }) || [];

  // ฟังก์ชันสำหรับการสร้างการเคลมใหม่
  const handleCreateClaim = (data: CreateFormData) => {
    console.log('Creating new claim:', data);
    
    // จำลองการส่งข้อมูลไปยัง API
    toast({
      title: "สร้างรายการเคลมสำเร็จ",
      description: `บันทึกรายการเคลมสำหรับคำสั่งซื้อ ${data.orderId} เรียบร้อยแล้ว`,
    });
    
    // ปิด dialog
    setCreateDialogOpen(false);
    form.reset();
  };

  // ฟังก์ชันสำหรับการเปิด dialog รายละเอียด
  const openDetailDialog = (claim: Claim) => {
    setSelectedClaim(claim);
    setDetailDialogOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* ส่วนหัวหน้าเพจ */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-purple-900">รายการเคลมและปัญหาการจัดส่ง</h1>
              <p className="text-gray-500 mt-1">แจ้งปัญหาการจัดส่งและติดตามรายการเคลมของคุณ</p>
            </div>
            <Button 
              className="bg-purple-700 hover:bg-purple-800" 
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
            >
              <span className="mr-2">+</span> แจ้งปัญหาการจัดส่ง
            </Button>
          </div>

          {/* แสดงจำนวนรายการ */}
          <div className="bg-purple-50 border border-purple-100 rounded-md p-3 flex flex-wrap gap-3 justify-between">
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-yellow-500/90 hover:bg-yellow-500">รอดำเนินการ: {claims?.filter(c => c.status === ClaimStatus.PENDING).length || 0}</Badge>
              <Badge className="bg-blue-500/90 hover:bg-blue-500">กำลังดำเนินการ: {claims?.filter(c => c.status === ClaimStatus.PROCESSING).length || 0}</Badge>
              <Badge className="bg-green-500/90 hover:bg-green-500">อนุมัติแล้ว: {claims?.filter(c => c.status === ClaimStatus.APPROVED).length || 0}</Badge>
              <Badge className="bg-purple-500/90 hover:bg-purple-500">คืนเงินแล้ว: {claims?.filter(c => c.status === ClaimStatus.REFUNDED).length || 0}</Badge>
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
              placeholder="ค้นหาด้วยเลขพัสดุ หมายเลขเคลม หรือหมายเลขคำสั่งซื้อ..."
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
            </div>
          </div>

          {/* แท็บสำหรับกลุ่มรายการเคลม */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
              <TabsTrigger value="active">กำลังดำเนินการ</TabsTrigger>
              <TabsTrigger value="completed">เสร็จสิ้น</TabsTrigger>
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
                  <p className="mt-1 text-sm text-gray-500">
                    คุณยังไม่มีรายการเคลมหรือการแจ้งปัญหาการจัดส่ง
                  </p>
                  <Button 
                    className="mt-4 bg-purple-700 hover:bg-purple-800" 
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <span className="mr-2">+</span> แจ้งปัญหาการจัดส่ง
                  </Button>
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
                                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                  {getClaimTypeThai(claim.claimType)}
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

                          <div className="space-y-1 mb-4">
                            <p className="text-xs text-gray-500">รายละเอียดปัญหา</p>
                            <p className="text-sm line-clamp-2">{claim.description}</p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>แจ้งเมื่อ {formatDate(claim.createdAt)}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openDetailDialog(claim)}
                              >
                                ดูรายละเอียด
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
            
            <TabsContent value="active" className="space-y-4">
              {/* เนื้อหาสำหรับรายการที่กำลังดำเนินการ */}
              {/* (ใช้คอมโพเนนต์จาก "all" โดยเพิ่มตัวกรองสถานะ) */}
              <p className="text-gray-500">แสดงเฉพาะรายการที่อยู่ระหว่างการดำเนินการ</p>
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {/* เนื้อหาสำหรับรายการที่เสร็จสิ้น */}
              {/* (ใช้คอมโพเนนต์จาก "all" โดยเพิ่มตัวกรองสถานะ) */}
              <p className="text-gray-500">แสดงเฉพาะรายการที่ดำเนินการเสร็จสิ้นแล้ว</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog สำหรับแสดงรายละเอียดการเคลม */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedClaim && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-3">
                  <span>รายละเอียดการเคลม #{selectedClaim.claimNumber}</span>
                  <Badge className={getStatusColor(selectedClaim.status)}>
                    {getStatusThai(selectedClaim.status)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  แจ้งเมื่อ {formatDate(selectedClaim.createdAt)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">หมายเลขคำสั่งซื้อ</p>
                  <p className="font-medium">{selectedClaim.orderId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">หมายเลขพัสดุ</p>
                  <p className="font-medium">{selectedClaim.trackingNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">ประเภทการเคลม</p>
                  <p className="font-medium">{getClaimTypeThai(selectedClaim.claimType)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">ขนส่ง</p>
                  <p className="font-medium">{selectedClaim.courierName}</p>
                </div>
              </div>
              
              <div className="space-y-1 mb-4">
                <p className="text-xs text-gray-500">รายละเอียดปัญหา</p>
                <div className="p-3 bg-gray-50 rounded-md text-sm">{selectedClaim.description}</div>
              </div>
              
              {selectedClaim.evidence && selectedClaim.evidence.length > 0 && (
                <div className="space-y-1 mb-4">
                  <p className="text-xs text-gray-500">หลักฐานที่แนบ</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedClaim.evidence.map((file, index) => (
                      <div key={index} className="px-3 py-1 bg-gray-100 rounded-md text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedClaim.resolution && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">การตอบกลับจากเจ้าหน้าที่</p>
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-md text-sm">{selectedClaim.resolution}</div>
                  </div>
                </>
              )}
              
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setDetailDialogOpen(false)}>
                  ปิด
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog สำหรับสร้างการเคลมใหม่ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">แจ้งปัญหาการจัดส่ง</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลเพื่อแจ้งปัญหาการจัดส่งหรือขอเคลมสินค้า
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateClaim)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>หมายเลขคำสั่งซื้อ *</FormLabel>
                      <FormControl>
                        <Input placeholder="ORD-XXXXXXX-XXX" {...field} />
                      </FormControl>
                      <FormDescription>
                        ระบุหมายเลขคำสั่งซื้อที่มีปัญหา
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="trackingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>หมายเลขพัสดุ *</FormLabel>
                      <FormControl>
                        <Input placeholder="THxxxxxxxxx" {...field} />
                      </FormControl>
                      <FormDescription>
                        ระบุหมายเลขพัสดุที่มีปัญหา
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="claimType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภทปัญหา *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกประเภทปัญหา" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ClaimType.LOST}>พัสดุสูญหาย</SelectItem>
                        <SelectItem value={ClaimType.DAMAGED}>พัสดุเสียหาย</SelectItem>
                        <SelectItem value={ClaimType.DELAYED}>จัดส่งล่าช้า</SelectItem>
                        <SelectItem value={ClaimType.RETURNED}>พัสดุถูกส่งคืน</SelectItem>
                        <SelectItem value={ClaimType.WRONG_ITEM}>ได้รับสินค้าผิด</SelectItem>
                        <SelectItem value={ClaimType.OTHER}>ปัญหาอื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      เลือกประเภทปัญหาที่ตรงกับสถานการณ์ของคุณ
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รายละเอียดปัญหา *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="โปรดอธิบายรายละเอียดปัญหาที่เกิดขึ้น..." 
                        className="min-h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      อธิบายรายละเอียดปัญหาให้ชัดเจน เพื่อให้เจ้าหน้าที่สามารถช่วยเหลือได้อย่างรวดเร็ว
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>มูลค่าความเสียหาย (บาท)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      ระบุมูลค่าความเสียหายหรือมูลค่าที่ต้องการเคลม (ถ้ามี)
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              {/* อนาคตจะเพิ่มการอัพโหลดไฟล์ */}
              
              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button 
                  type="submit"
                  className="bg-purple-700 hover:bg-purple-800">
                  ส่งรายการเคลม
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default UserClaims;