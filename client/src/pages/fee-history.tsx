import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { parseISO, format } from "date-fns";
import { th } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { FeeHistory } from "@shared/schema";

export default function FeeHistoryPage() {
  const { toast } = useToast();

  // ใช้ TanStack Query ดึงข้อมูลประวัติค่าธรรมเนียม
  const {
    data: feeHistoryData,
    isLoading,
    isError,
  } = useQuery<{ success: boolean; data: FeeHistory[] }>({
    queryKey: ["/api/fee-history"],
  });

  // ฟังก์ชันสำหรับแปลงวันที่
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    try {
      const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
      return format(date, "dd MMM yyyy HH:mm:ss", { locale: th });
    } catch (error) {
      console.error("Invalid date format:", error);
      return "-";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-lg">กำลังโหลดข้อมูลประวัติค่าธรรมเนียม...</p>
        </div>
      </Layout>
    );
  }

  if (isError || !feeHistoryData?.success) {
    return (
      <Layout>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">ประวัติค่าธรรมเนียม</CardTitle>
            <CardDescription>
              ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง
            </CardDescription>
          </CardHeader>
        </Card>
      </Layout>
    );
  }

  const feeHistory = feeHistoryData.data || [];

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">ประวัติค่าธรรมเนียม</CardTitle>
          <CardDescription>
            แสดงประวัติการหักค่าธรรมเนียมสำหรับการสร้างออเดอร์
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feeHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">ไม่พบข้อมูลประวัติค่าธรรมเนียม</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                    <TableHead className="text-right">ก่อนหัก</TableHead>
                    <TableHead className="text-right">หลังหัก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeHistory.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>{formatDate(fee.createdAt)}</TableCell>
                      <TableCell>{fee.description || "-"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={fee.feeType === 'order' ? "default" : "outline"}
                          className={fee.feeType === 'order' ? "bg-blue-500" : ""}
                        >
                          {fee.feeType === 'order' ? 'ค่าออเดอร์' : fee.feeType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-500">
                        -{parseFloat(fee.amount).toFixed(2)}฿
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(fee.balanceBefore).toFixed(2)}฿
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(fee.balanceAfter).toFixed(2)}฿
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}