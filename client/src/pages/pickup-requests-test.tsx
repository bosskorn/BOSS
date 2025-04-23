import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { addDays, format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// สคีมา Zod สำหรับการตรวจสอบข้อมูลฟอร์ม
const formSchema = z.object({
  trackingNumber: z.string().optional(),
  requestDate: z.string().min(1, "กรุณาระบุวันที่ต้องการให้เข้ารับพัสดุ"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PickupRequestsTest() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // วันที่ปัจจุบันและวันพรุ่งนี้
  const today = new Date();
  const tomorrow = addDays(today, 1);
  // ฟอร์มตัวจัดการ
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trackingNumber: "",
      requestDate: format(tomorrow, "yyyy-MM-dd"), // ค่าเริ่มต้นเป็นวันพรุ่งนี้
      notes: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/pickup-test/test-pickup-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingNumber: data.trackingNumber,
          requestDate: data.requestDate,
          notes: data.notes || "ทดสอบการเรียกรถ",
        }),
        credentials: "include",
      });

      const result = await response.json();
      setResult(result);

      if (result.success) {
        toast({
          title: "ส่งคำขอเรียกรถสำเร็จ",
          description: "ระบบได้ส่งคำขอเรียกรถเข้ารับพัสดุเรียบร้อยแล้ว",
        });
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.message || "ไม่สามารถส่งคำขอเรียกรถได้",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "เกิดข้อผิดพลาดในการส่งคำขอ",
      });

      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถส่งคำขอเรียกรถได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">ทดสอบการเรียกรถเข้ารับพัสดุ</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>ทดสอบระบบเรียกรถอัตโนมัติ</CardTitle>
              <CardDescription>
                กรอกข้อมูลสำหรับทดสอบการเรียกรถเข้ารับพัสดุจาก Flash Express
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="trackingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เลขพัสดุ (ไม่บังคับ)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ระบุเลขพัสดุที่ต้องการให้เข้ารับ (ถ้ามี)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          เลขพัสดุที่ต้องการเรียกรถเข้ารับ (สามารถเรียกรถได้โดยไม่ระบุเลขพัสดุ)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requestDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>วันที่ต้องการให้เข้ารับ</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          ระบุวันที่ต้องการให้เข้ารับพัสดุ
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
                        <FormLabel>หมายเหตุ (ไม่บังคับ)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="ระบุข้อมูลเพิ่มเติม (ถ้ามี)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "กำลังส่งคำขอ..." : "ส่งคำขอเรียกรถ"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ผลการทดสอบ</CardTitle>
              <CardDescription>แสดงผลการทดสอบการเรียกรถล่าสุด</CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <Alert
                    variant={result.success ? "default" : "destructive"}
                    className="mb-4"
                  >
                    <AlertTitle>
                      {result.success ? "สำเร็จ" : "เกิดข้อผิดพลาด"}
                    </AlertTitle>
                    <AlertDescription>{result.message}</AlertDescription>
                  </Alert>

                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">
                      ข้อมูลการตอบกลับ:
                    </h3>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500">
                  ยังไม่มีผลการทดสอบ กรุณากรอกข้อมูลและกดส่งคำขอเรียกรถ
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/pickup-requests";
                }}
              >
                ไปที่หน้าประวัติการเรียกรถ
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  form.reset();
                  setResult(null);
                }}
              >
                ล้างข้อมูล
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
}