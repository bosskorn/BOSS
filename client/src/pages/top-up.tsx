import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Loader2, 
  CreditCard, 
  QrCode, 
  Wallet, 
  Receipt, 
  Landmark, 
  AlertCircle,
  ChevronsUp,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useLocation } from 'wouter';

// สร้าง schema สำหรับการตรวจสอบฟอร์มเติมเงิน
const topUpSchema = z.object({
  amount: z.string()
    .refine(val => !isNaN(Number(val)), {
      message: "กรุณาระบุจำนวนเงินเป็นตัวเลข"
    })
    .refine(val => Number(val) >= 100, {
      message: "จำนวนเงินขั้นต่ำ 100 บาท"
    })
    .refine(val => Number(val) <= 50000, {
      message: "จำนวนเงินสูงสุด 50,000 บาท"
    }),
});

// ประวัติการเติมเงิน
interface TopUpHistory {
  id: number;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  reference?: string;
}

// ประเภทข้อมูลผู้ใช้
interface UserProfile {
  id: number;
  username: string;
  fullname: string;
  role: string;
  balance: string;
  email: string | null;
  phone: string | null;
}

const TopUpPage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('promptpay');
  const [history, setHistory] = useState<TopUpHistory[]>([]);
  const [paymentStep, setPaymentStep] = useState(1);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string>('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof topUpSchema>>({
    resolver: zodResolver(topUpSchema),
    defaultValues: {
      amount: '100',
    },
  });

  // ดึงข้อมูลผู้ใช้และประวัติการเติมเงิน
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // ดึงข้อมูลผู้ใช้
        const userResponse = await axios.get('/api/user', {
          withCredentials: true
        });

        if (userResponse.data && userResponse.data.success) {
          setUser(userResponse.data.user);
          
          // ดึงประวัติการเติมเงินจาก API
          try {
            const historyResponse = await axios.get('/api/topups/history', {
              withCredentials: true
            });
            
            if (historyResponse.data && historyResponse.data.success) {
              // แปลงข้อมูลให้ตรงกับ interface TopUpHistory
              const formattedHistory = historyResponse.data.data.map((item: any) => ({
                id: item.id,
                amount: parseFloat(item.amount),
                method: item.method === 'prompt_pay' ? 'PromptPay' : 
                         item.method === 'credit_card' ? 'บัตรเครดิต' : 'โอนเงิน',
                status: item.status,
                createdAt: item.createdAt,
                reference: item.referenceId
              }));
              
              setHistory(formattedHistory);
            }
          } catch (historyError) {
            console.error('ไม่สามารถดึงประวัติการเติมเงินได้:', historyError);
            // ไม่แจ้งเตือนผู้ใช้กรณีนี้ เพื่อให้สามารถใช้งานหน้าอื่นๆได้
            setHistory([]);
          }
        } else {
          toast({
            title: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้',
            description: 'กรุณาลองใหม่อีกครั้ง หรือ เข้าสู่ระบบใหม่',
            variant: 'destructive',
          });
          setLocation('/auth');
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
        setLocation('/auth');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [toast, setLocation]);

  // ดำเนินการเติมเงิน
  const onSubmit = async (data: z.infer<typeof topUpSchema>) => {
    try {
      setProcessing(true);
      
      // ส่งข้อมูลไปยัง API เพื่อสร้างรายการเติมเงิน
      const method = activeTab === 'promptpay' ? 'prompt_pay' : 'credit_card';
      
      const response = await axios.post('/api/topups/create', {
        amount: parseFloat(data.amount),
        method: method
      }, { withCredentials: true });
      
      if (response.data && response.data.success) {
        // ดึงข้อมูลจาก API response
        const topupData = response.data.data;
        
        // เก็บค่า reference และ QR Code URL
        setReferenceId(topupData.referenceId);
        setQrCodeUrl(topupData.qrCodeUrl);
        
        // ไปยังขั้นตอนการชำระเงิน
        setPaymentStep(2);
      } else {
        throw new Error('ไม่สามารถสร้างรายการเติมเงินได้');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการสร้างรายการเติมเงิน:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างรายการเติมเงินได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  // ตรวจสอบสถานะการชำระเงิน
  const checkPaymentStatus = async () => {
    try {
      setProcessing(true);
      
      // ส่งข้อมูลไปยัง API เพื่อตรวจสอบสถานะ
      const response = await axios.get(`/api/topups/check/${referenceId}`, { 
        withCredentials: true 
      });
      
      if (response.data && response.data.success) {
        const responseData = response.data;
        
        // ถ้าส่งข้อความกลับมาแสดงว่าชำระเงินสำเร็จ
        if (responseData.message === 'ชำระเงินสำเร็จ') {
          toast({
            title: 'เติมเงินสำเร็จ',
            description: `เติมเงินเข้าบัญชีเรียบร้อยแล้ว`,
          });
          
          // อัพเดตข้อมูลผู้ใช้และประวัติ
          if (responseData.data && responseData.data.user) {
            setUser(responseData.data.user);
          }
          
          // อัพเดตประวัติการเติมเงิน (ดึงข้อมูลใหม่)
          try {
            const historyResponse = await axios.get('/api/topups/history', { withCredentials: true });
            if (historyResponse.data && historyResponse.data.success) {
              const formattedHistory = historyResponse.data.data.map((item: any) => ({
                id: item.id,
                amount: parseFloat(item.amount),
                method: item.method === 'prompt_pay' ? 'PromptPay' : 
                         item.method === 'credit_card' ? 'บัตรเครดิต' : 'โอนเงิน',
                status: item.status,
                createdAt: item.createdAt,
                reference: item.referenceId
              }));
              
              setHistory(formattedHistory);
            }
          } catch (historyError) {
            console.error('ไม่สามารถดึงประวัติการเติมเงินได้:', historyError);
          }
          
          // ไปยังขั้นตอนเสร็จสิ้น
          setPaymentStep(3);
        } else {
          // ยังไม่มีการชำระเงิน
          toast({
            title: 'ยังไม่พบการชำระเงิน',
            description: 'กรุณารอสักครู่แล้วลองตรวจสอบอีกครั้ง หรือติดต่อฝ่ายสนับสนุน',
            variant: 'destructive',
          });
        }
      } else {
        throw new Error('ไม่สามารถตรวจสอบสถานะการชำระเงินได้');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถตรวจสอบสถานะการชำระเงินได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  // ยกเลิกการเติมเงิน
  const cancelTopUp = async () => {
    try {
      if (referenceId) {
        setProcessing(true);
        
        // ส่งคำขอไปยัง API เพื่อยกเลิกรายการ
        await axios.put(`/api/topups/cancel/${referenceId}`, {}, { 
          withCredentials: true 
        });
      }
      
      // รีเซ็ตค่าต่างๆ
      setPaymentStep(1);
      setQrCodeUrl(null);
      setReferenceId('');
      
      // แจ้งเตือนผู้ใช้
      toast({
        title: 'ยกเลิกรายการเติมเงิน',
        description: 'คุณได้ยกเลิกรายการเติมเงินเรียบร้อยแล้ว',
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการยกเลิกรายการเติมเงิน:', error);
      // ยังคงรีเซ็ตค่าต่างๆ ถึงแม้จะเกิดข้อผิดพลาด
      setPaymentStep(1);
      setQrCodeUrl(null);
      setReferenceId('');
    } finally {
      setProcessing(false);
    }
  };

  // เริ่มเติมเงินใหม่
  const startNewTopUp = () => {
    setPaymentStep(1);
    setQrCodeUrl(null);
    setReferenceId('');
    form.reset({ amount: '100' });
  };

  // แสดงสถานะการเติมเงิน
  const renderStatus = (status: 'pending' | 'completed' | 'failed') => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            รอดำเนินการ
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            สำเร็จ
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            ไม่สำเร็จ
          </span>
        );
    }
  };

  // แปลงเวลาเป็นรูปแบบที่อ่านง่าย
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // แสดงขั้นตอนการเติมเงิน
  const renderTopUpStep = () => {
    switch (paymentStep) {
      case 1:
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนเงิน (บาท)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">฿</span>
                        <Input {...field} className="pl-7" placeholder="100" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      จำนวนเงินขั้นต่ำ 100 บาท สูงสุด 50,000 บาท
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700">
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  ดำเนินการ
                </Button>
              </div>
            </form>
          </Form>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <h3 className="font-medium text-lg mb-4 text-center">สแกน QR Code เพื่อชำระเงิน</h3>
              
              <div className="flex justify-center mb-4">
                {qrCodeUrl ? (
                  <div className="bg-white p-4 rounded-lg">
                    <div className="w-48 h-48 border-2 border-gray-300 rounded flex items-center justify-center">
                      <QrCode size={160} className="text-purple-600" />
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2 text-center">
                <p className="text-sm text-gray-600">
                  จำนวนเงิน: <span className="font-medium text-black dark:text-white">฿{form.getValues().amount}</span>
                </p>
                <p className="text-sm text-gray-600">
                  รหัสอ้างอิง: <span className="font-medium text-black dark:text-white">{referenceId}</span>
                </p>
                <p className="text-sm text-gray-500">
                  กรุณาชำระเงินภายใน 15 นาที
                </p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={cancelTopUp}
                disabled={processing}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={checkPaymentStatus}
                disabled={processing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ตรวจสอบสถานะการชำระเงิน
              </Button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-medium text-lg mb-2">เติมเงินสำเร็จ</h3>
              <p className="text-gray-600 mb-4">
                คุณได้เติมเงินจำนวน <span className="font-medium text-black dark:text-white">฿{form.getValues().amount}</span> เข้าบัญชีเรียบร้อยแล้ว
              </p>
              <div className="bg-white p-3 rounded-lg inline-block mb-4">
                <p className="text-sm text-gray-600">
                  ยอดเงินคงเหลือ: <span className="font-medium text-black dark:text-white">฿{user?.balance || '0'}</span>
                </p>
                <p className="text-xs text-gray-500">
                  รหัสอ้างอิง: {referenceId}
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={startNewTopUp}
                className="bg-purple-600 hover:bg-purple-700"
              >
                เติมเงินอีกครั้ง
              </Button>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-4 max-w-4xl font-kanit">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl font-kanit">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <ChevronsUp className="mr-2 h-6 w-6 text-purple-600" />
          เติมเงิน
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* ข้อมูลผู้ใช้ */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">ข้อมูลบัญชี</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user ? user.fullname.charAt(0) : '?'}
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{user?.fullname || 'กำลังโหลด...'}</h3>
                    <p className="text-gray-500 text-sm">{user?.username || ''}</p>
                  </div>
                </div>
                
                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">ยอดเงินคงเหลือ</span>
                    <span className="text-xl font-bold text-purple-600">฿{parseFloat(user?.balance || '0').toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-1.5 mb-4">
                    <div className="bg-purple-600 h-1.5 rounded" style={{ width: '100%' }}></div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    อัพเดตล่าสุด: {new Date().toLocaleString('th-TH')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* แท็บเติมเงิน */}
          <div className="md:col-span-3">
            <Tabs defaultValue="promptpay" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="promptpay" className="flex items-center">
                  <QrCode className="mr-2 h-4 w-4" />
                  PromptPay
                </TabsTrigger>
                <TabsTrigger value="credit" className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  บัตรเครดิต/เดบิต
                </TabsTrigger>
              </TabsList>
              
              {/* แท็บ PromptPay */}
              <TabsContent value="promptpay">
                <Card>
                  <CardHeader>
                    <CardTitle>เติมเงินด้วย PromptPay</CardTitle>
                    <CardDescription>เติมเงินด้วยการสแกน QR Code ผ่านแอพธนาคารของคุณ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderTopUpStep()}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* แท็บบัตรเครดิต/เดบิต */}
              <TabsContent value="credit">
                <Card>
                  <CardHeader>
                    <CardTitle>เติมเงินด้วยบัตรเครดิต/เดบิต</CardTitle>
                    <CardDescription>เติมเงินด้วยบัตรเครดิตหรือบัตรเดบิต</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {paymentStep === 1 && (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>จำนวนเงิน (บาท)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">฿</span>
                                    <Input {...field} className="pl-7" placeholder="100" />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  จำนวนเงินขั้นต่ำ 100 บาท สูงสุด 50,000 บาท
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex mt-6 items-center">
                            <CreditCard className="h-6 w-6 text-purple-600 mr-2" />
                            <div className="text-sm">
                              <div className="font-medium">การชำระเงินที่ปลอดภัย</div>
                              <div className="text-gray-500">ดำเนินการโดย Stripe - รองรับทุกธนาคาร</div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700">
                              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              ดำเนินการ
                            </Button>
                          </div>
                        </form>
                      </Form>
                    )}
                    
                    {paymentStep === 2 && (
                      <div className="space-y-6">
                        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 text-center">
                          <h3 className="font-medium text-lg mb-4">กรุณาชำระเงินด้วยบัตรเครดิต/เดบิต</h3>
                          
                          <div className="bg-white p-5 rounded-lg mb-4">
                            {/* ที่นี่จะใช้ Stripe Elements สำหรับฟอร์มบัตรเครดิต */}
                            <div className="border rounded-lg p-4 mb-4">
                              <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-500">Stripe Payment Form</span>
                                <CreditCard className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="h-10 bg-gray-100 rounded mb-2"></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="h-10 bg-gray-100 rounded"></div>
                                <div className="h-10 bg-gray-100 rounded"></div>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              จำนวนเงิน: <span className="font-medium text-black dark:text-white">฿{form.getValues().amount}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              รหัสอ้างอิง: {referenceId}
                            </div>
                          </div>
                          
                          <Button 
                            onClick={checkPaymentStatus}
                            disabled={processing}
                            className="bg-purple-600 hover:bg-purple-700 w-full"
                          >
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            ชำระเงิน
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={cancelTopUp}
                            disabled={processing}
                            className="mt-2 w-full"
                          >
                            ยกเลิกการชำระเงิน
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {paymentStep === 3 && (
                      <div className="space-y-6">
                        <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900 text-center">
                          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          </div>
                          <h3 className="font-medium text-lg mb-2">เติมเงินสำเร็จ</h3>
                          <p className="text-gray-600 mb-4">
                            คุณได้เติมเงินจำนวน <span className="font-medium text-black dark:text-white">฿{form.getValues().amount}</span> เข้าบัญชีเรียบร้อยแล้ว
                          </p>
                          <div className="bg-white p-3 rounded-lg inline-block mb-4">
                            <p className="text-sm text-gray-600">
                              ยอดเงินคงเหลือ: <span className="font-medium text-black dark:text-white">฿{user?.balance || '0'}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              รหัสอ้างอิง: {referenceId}
                            </p>
                          </div>
                          
                          <Button
                            onClick={startNewTopUp}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            เติมเงินอีกครั้ง
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* ประวัติการเติมเงิน */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Receipt className="mr-2 h-5 w-5" />
                ประวัติการเติมเงิน
              </h2>
              
              {history.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-900">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium mb-1">ไม่พบประวัติการเติมเงิน</h3>
                  <p className="text-gray-500">
                    เมื่อคุณเติมเงินสำเร็จ รายการจะปรากฏที่นี่
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วิธีการ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสอ้างอิง</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                      {history.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            ฿{item.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {renderStatus(item.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.reference || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TopUpPage;