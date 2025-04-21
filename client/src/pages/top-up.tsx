import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import stripeService from '@/services/stripe-service';
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
// Removed Tabs imports as requested
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
  Users,
  ExternalLink
} from 'lucide-react';
import { useLocation } from 'wouter';

// สร้าง schema สำหรับการตรวจสอบฟอร์มเติมเงิน
const topUpSchema = z.object({
  amount: z.string()
    .refine(val => !isNaN(Number(val)), {
      message: "กรุณาระบุจำนวนเงินเป็นตัวเลข"
    })
    .refine(val => Number(val) >= 20, {
      message: "จำนวนเงินขั้นต่ำ 20 บาท"
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
  // เมื่อลบแท็บบัตรเครดิต/เดบิตออกไป ไม่จำเป็นต้องมี state activeTab อีกต่อไป
  const [history, setHistory] = useState<TopUpHistory[]>([]);
  const [paymentStep, setPaymentStep] = useState(1);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string>('');
  const [stripeSessionId, setStripeSessionId] = useState<string>('');
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(15 * 60); // 15 นาที เป็นวินาที
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
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
      console.log("เริ่มการทำงานของ onSubmit กับจำนวนเงิน:", data.amount);
      
      // ใช้การชำระเงินด้วย PromptPay เป็นหลัก
      // ใช้ฟังก์ชัน createPromptPayQRCode จาก stripeService
      const result = await stripeService.createPromptPayQRCode(parseFloat(data.amount));
      console.log("ผลลัพธ์จาก createPromptPayQRCode:", result);
      
      if (result.success && result.qrCodeUrl) {
        console.log("การสร้าง QR Code สำเร็จ, QR URL:", result.qrCodeUrl);
        // เก็บค่า reference และ QR Code URL
        setReferenceId(result.topup?.referenceId || '');
        setQrCodeUrl(result.qrCodeUrl);
        
        // เริ่มการจับเวลาถอยหลัง
        setIsTimerActive(true);
        
        // ไปยังขั้นตอนการชำระเงิน
        setPaymentStep(2);
        
        console.log("การทำงานเสร็จสิ้น, paymentStep:", 2);
      } else {
        console.error("ไม่พบ QR Code URL ในผลลัพธ์:", result);
        throw new Error('ไม่สามารถสร้างรายการเติมเงินได้');
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการสร้างรายการเติมเงิน:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างรายการเติมเงินได้ กรุณาลองใหม่อีกครั้ง',
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
      
      if (!referenceId) {
        throw new Error('ไม่พบข้อมูลอ้างอิงการชำระเงิน');
      }
      
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
          await refreshTopupHistory();
          
          // ไปยังขั้นตอนเสร็จสิ้น
          setPaymentStep(3);
        } else {
          // ยังไม่มีการชำระเงิน - ใช้ Stripe API ตรวจสอบเพิ่มเติม
          if (responseData.data?.stripeSessionId) {
            // ถ้ามี Stripe Session ID ให้เช็คสถานะผ่าน Stripe โดยตรง
            try {
              const stripeResult = await stripeService.getCheckoutSession(responseData.data.stripeSessionId);
              
              if (stripeResult.success && stripeResult.session?.payment_status === 'paid') {
                toast({
                  title: 'เติมเงินสำเร็จ',
                  description: `เติมเงินเข้าบัญชีเรียบร้อยแล้ว`,
                });
                
                // อัพเดตข้อมูลผู้ใช้และประวัติ
                if (stripeResult.topup?.user) {
                  setUser(stripeResult.topup.user);
                }
                
                // อัพเดตประวัติการเติมเงิน
                await refreshTopupHistory();
                
                // ไปยังขั้นตอนเสร็จสิ้น
                setPaymentStep(3);
                return;
              }
            } catch (stripeError) {
              console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะ Stripe:', stripeError);
              // ไม่แจ้งเตือนผู้ใช้ เพื่อให้ฟังก์ชันทำงานต่อไปได้
            }
          }
          
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

  // ชำระเงินด้วยบัตรเครดิต/เดบิต ผ่าน Stripe
  const handleStripePayment = async (amount: number) => {
    try {
      setProcessing(true);
      
      // สร้าง Stripe Checkout Session
      const result = await stripeService.createCheckoutSession(amount);
      
      if (result.success && result.url) {
        // เก็บ sessionId ไว้ใช้สำหรับตรวจสอบสถานะการชำระเงินภายหลัง
        setStripeSessionId(result.sessionId || '');
        setStripeCheckoutUrl(result.url);
        
        // เปิดหน้า Stripe Checkout ในหน้าต่างใหม่
        window.open(result.url, '_blank');
        
        // ไปยังขั้นตอนการรอตรวจสอบการชำระเงิน
        setPaymentStep(2);
      } else {
        throw new Error(result.error || 'ไม่สามารถสร้าง Checkout Session ได้');
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการสร้าง Stripe Checkout Session:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถเชื่อมต่อกับระบบชำระเงินได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // ตรวจสอบสถานะการชำระเงินผ่าน Stripe
  const checkStripePaymentStatus = async () => {
    try {
      setProcessing(true);
      
      if (!stripeSessionId) {
        throw new Error('ไม่พบข้อมูล Session การชำระเงิน');
      }
      
      // ตรวจสอบสถานะกับ API
      const result = await stripeService.getCheckoutSession(stripeSessionId);
      
      if (result.success) {
        // ถ้าชำระเงินสำเร็จแล้ว
        if (result.session && result.session.payment_status === 'paid') {
          toast({
            title: 'เติมเงินสำเร็จ',
            description: 'ยอดเงินได้ถูกเพิ่มเข้าบัญชีของคุณเรียบร้อยแล้ว',
          });
          
          // อัพเดตข้อมูลผู้ใช้ถ้ามี
          if (result.topup && result.topup.user) {
            setUser(result.topup.user);
          }
          
          // อัพเดตประวัติการเติมเงิน
          await refreshTopupHistory();
          
          // ไปยังขั้นตอนเสร็จสิ้น
          setPaymentStep(3);
        } else {
          // ยังไม่ได้ชำระเงิน
          toast({
            title: 'ยังไม่พบการชำระเงิน',
            description: 'กรุณาทำรายการชำระเงินในหน้าต่าง Stripe Checkout หรือลองตรวจสอบอีกครั้งในภายหลัง',
            variant: 'destructive',
          });
        }
      } else {
        throw new Error(result.error || 'ไม่สามารถตรวจสอบสถานะการชำระเงินได้');
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะ Stripe Checkout:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถตรวจสอบสถานะการชำระเงินได้ กรุณาลองใหม่อีกครั้ง',
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
      setStripeSessionId('');
      setStripeCheckoutUrl('');
      
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
      setStripeSessionId('');
      setStripeCheckoutUrl('');
    } finally {
      setProcessing(false);
    }
  };

  // อัพเดตประวัติการเติมเงิน
  const refreshTopupHistory = async () => {
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
    } catch (error) {
      console.error('ไม่สามารถดึงประวัติการเติมเงินได้:', error);
    }
  };

  // อัพเดตการนับถอยหลัง
  useEffect(() => {
    // ตั้งเวลานับถอยหลังเมื่อแสดง QR code
    if (paymentStep === 2) {
      setCountdown(15 * 60); // 15 นาที
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
  }, [paymentStep]);

  // นับถอยหลัง
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isTimerActive && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && isTimerActive) {
      // เมื่อหมดเวลา
      setIsTimerActive(false);
      toast({
        title: 'หมดเวลาชำระเงิน',
        description: 'กรุณาสร้างรายการเติมเงินใหม่เพื่อดำเนินการต่อ',
        variant: 'destructive',
      });
      cancelTopUp();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, isTimerActive, toast]);

  // แปลงวินาทีเป็นรูปแบบ นาที:วินาที
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // เริ่มเติมเงินใหม่
  const startNewTopUp = () => {
    setPaymentStep(1);
    setQrCodeUrl(null);
    setReferenceId('');
    setStripeSessionId('');
    setStripeCheckoutUrl('');
    setIsTimerActive(false);
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
        // กรณีหน้าเริ่มต้นแสดงในหน้าหลักแล้ว
        return null;
      
      case 2:
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-4 px-6 text-white">
                <h3 className="font-bold text-xl flex items-center justify-center">
                  <QrCode className="mr-2 h-5 w-5" />
                  สแกน QR Code เพื่อชำระเงิน
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-center">
                  {qrCodeUrl ? (
                    <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-md">
                      <div className="w-64 h-64 flex items-center justify-center overflow-hidden">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code สำหรับจ่ายเงิน" 
                          width={230} 
                          height={230} 
                          className="object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-64 h-64 border-2 border-blue-100 rounded-xl flex items-center justify-center bg-white shadow-md">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-3" />
                        <p className="text-gray-500">กำลังสร้าง QR Code...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                    <span className="text-gray-700 font-medium">จำนวนเงิน:</span>
                    <span className="text-xl font-bold text-blue-700">฿{form.getValues().amount}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                    <span className="text-gray-700 font-medium">รหัสอ้างอิง:</span>
                    <span className="font-mono text-gray-900">{referenceId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">เวลาที่เหลือ:</span>
                    <span className="font-medium text-orange-600 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTime(countdown)} นาที
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-center text-gray-500 mb-2">
                    เมื่อชำระเงินแล้ว กรุณากดปุ่มตรวจสอบสถานะเพื่อยืนยันการเติมเงิน
                  </p>
                  <Button
                    onClick={checkPaymentStatus}
                    disabled={processing}
                    className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg shadow-md transition-all"
                  >
                    {processing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    <span className="text-lg">ตรวจสอบสถานะการชำระเงิน</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelTopUp}
                    disabled={processing}
                    className="w-full border-2 border-gray-300 text-gray-700"
                  >
                    <span className="text-md">ยกเลิกการชำระเงิน</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-500 py-4 px-6 text-white">
                <h3 className="font-bold text-xl flex items-center justify-center">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  การชำระเงินสำเร็จ
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">เติมเงินสำเร็จ!</h3>
                  <p className="text-gray-600 text-center">
                    คุณได้เติมเงินจำนวน <span className="font-bold text-blue-600">฿{form.getValues().amount}</span> เข้าบัญชีเรียบร้อยแล้ว
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                    <span className="text-gray-700">ยอดเงินคงเหลือ:</span>
                    <span className="text-xl font-bold text-blue-600">฿{parseFloat(user?.balance || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">รหัสอ้างอิง:</span>
                    <span className="font-mono text-sm text-gray-600">{referenceId}</span>
                  </div>
                </div>
                
                <Button
                  onClick={startNewTopUp}
                  className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg shadow-md transition-all"
                >
                  <span className="text-lg">กลับสู่หน้าเติมเงิน</span>
                </Button>
              </div>
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
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-5xl font-kanit bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b pb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center shadow-lg">
              <ChevronsUp className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-800">เติมเงินเข้าระบบ</h1>
              <p className="text-gray-500">เติมเงินเพื่อใช้บริการขนส่งได้อย่างต่อเนื่อง</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 bg-white shadow-md rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">ยอดเงินปัจจุบัน</span>
              <span className="text-2xl font-bold text-blue-600 ml-4">฿{parseFloat(user?.balance || '0').toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ส่วนข้อมูลผู้ใช้และตัวเลือกการเติมเงิน */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white shadow-md border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-4 px-6 flex items-center">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 text-2xl font-bold shadow-md">
                  {user ? user.fullname.charAt(0) : '?'}
                </div>
                <div className="ml-4 text-white">
                  <h3 className="font-bold text-lg">{user?.fullname || 'กำลังโหลด...'}</h3>
                  <p className="text-blue-100 text-sm">{user?.username || ''}</p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold text-gray-700">จำนวนเงินที่ต้องการเติม</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-600 text-lg font-bold">฿</span>
                                <Input 
                                  {...field} 
                                  className="pl-8 py-6 text-lg font-medium border-2 border-blue-200 focus:border-blue-500 rounded-lg" 
                                  placeholder="100" 
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-blue-600 font-medium">
                              จำนวนเงินขั้นต่ำ 20 บาท สูงสุด 50,000 บาท
                            </FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-3 pt-2">
                        <p className="font-semibold text-gray-700 mb-2">เลือกวิธีการชำระเงิน</p>
                        <Button 
                          type="submit" 
                          disabled={processing}
                          className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg shadow-md transition-all"
                        >
                          {processing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <QrCode className="mr-2 h-5 w-5" />}
                          <span className="text-lg">ชำระผ่าน PromptPay</span>
                        </Button>
                        
                        <Button 
                          type="button" 
                          onClick={() => handleStripePayment(parseFloat(form.getValues().amount))}
                          disabled={processing}
                          variant="outline"
                          className="w-full py-6 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg shadow-sm transition-all"
                        >
                          {processing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                          <span className="text-lg">ชำระผ่านบัตรเครดิต / เดบิต</span>
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ส่วนแสดงประวัติการเติมเงิน */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-md border-0 h-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-4 px-6">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <Receipt className="mr-2 h-5 w-5" />
                  ประวัติการเติมเงิน
                </h2>
              </div>
              <CardContent className="p-6">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Clock className="h-16 w-16 text-blue-200 mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">ไม่พบประวัติการเติมเงิน</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      เมื่อคุณเติมเงินสำเร็จ รายการจะปรากฏที่นี่
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">วันที่</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วิธีการ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">รหัสอ้างอิง</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-gray-800">฿{item.amount.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.method === 'prompt_pay' ? 'PromptPay' : 
                                 item.method === 'credit_card' ? 'บัตรเครดิต/เดบิต' : 'โอนเงิน'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {renderStatus(item.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                              {item.reference || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TopUpPage;