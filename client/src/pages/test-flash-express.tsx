import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import api from "@/services/api";
import { useAuth } from "@/hooks/use-auth";

export default function TestFlashExpress() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const testCreateOrder = async () => {
    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณจำเป็นต้องเข้าสู่ระบบก่อนใช้ฟีเจอร์นี้",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // เรียกใช้ API ทดสอบ
      const response = await api.post('/api/flash-express-test/test-create-order');
      console.log("ผลการทดสอบ:", response.data);
      
      setResult(response.data);
      
      toast({
        title: "ทดสอบสำเร็จ",
        description: `เลขพัสดุ: ${response.data.trackingNumber || 'ไม่มีเลขพัสดุ'}`,
      });
    } catch (err: any) {
      console.error("เกิดข้อผิดพลาดในการทดสอบ:", err);
      
      setError(err);
      setIsAlertOpen(true);
      
      let errorMessage = "ไม่สามารถทดสอบการสร้างออเดอร์ได้";
      
      if (err.response) {
        errorMessage = err.response.data?.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ถ้ายังไม่ได้ล็อกอิน ให้แสดงข้อความแจ้ง
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-16 px-4">
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>กรุณาเข้าสู่ระบบ</CardTitle>
              <CardDescription>
                คุณจำเป็นต้องเข้าสู่ระบบก่อนใช้งานหน้าทดสอบระบบ
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <a href="/auth">ไปยังหน้าเข้าสู่ระบบ</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 font-kanit">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
          ทดสอบการสร้างออเดอร์ Flash Express
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
              <CardTitle>ทดสอบการสร้างออเดอร์</CardTitle>
              <CardDescription>
                ทดสอบการเชื่อมต่อกับ Flash Express API เพื่อสร้างเลขพัสดุ
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4 text-gray-600">
                การทดสอบนี้จะส่งข้อมูลตัวอย่างไปยัง Flash Express API โดยตรง โดยไม่ต้องกรอกฟอร์ม
              </p>
              <Button 
                onClick={testCreateOrder} 
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isLoading ? "กำลังทดสอบ..." : "ทดสอบการสร้างออเดอร์"}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className="border border-green-100 shadow-lg shadow-green-100/20">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                <CardTitle className="text-green-700">ผลการทดสอบ (สำเร็จ)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                  <p className="font-semibold mb-2">เลขพัสดุ: <span className="text-green-600">{result.trackingNumber || 'ไม่มีเลขพัสดุ'}</span></p>
                  <p className="font-semibold mb-2">รหัสศูนย์คัดแยก: <span className="text-green-600">{result.sortCode || '-'}</span></p>
                  <pre className="text-xs whitespace-pre-wrap mt-4">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>เกิดข้อผิดพลาด</AlertDialogTitle>
              <AlertDialogDescription>
                {error?.response?.data?.message || error?.message || "ไม่สามารถทดสอบการสร้างออเดอร์ได้"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96 my-4">
              <pre className="text-xs whitespace-pre-wrap">
                {error?.response?.data ? JSON.stringify(error.response.data, null, 2) : error?.toString()}
              </pre>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>ปิด</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}