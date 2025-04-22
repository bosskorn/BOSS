import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { parseISO, format } from "date-fns";
import { th } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { FeeHistory } from "@shared/schema";

export default function FeeHistoryPage() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  const allFeeHistory = feeHistoryData.data || [];
  
  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(allFeeHistory.length / itemsPerPage);
  
  // ตัดเฉพาะข้อมูลที่ต้องแสดงในหน้าปัจจุบัน
  const currentItems = allFeeHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // ฟังก์ชั่นเปลี่ยนหน้า
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

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
          {allFeeHistory.length === 0 ? (
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
                  {currentItems.map((fee) => (
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
        
        {/* แสดงปุ่มเพจเนชันเมื่อมีข้อมูลมากกว่า 1 หน้า */}
        {totalPages > 1 && (
          <CardFooter className="flex justify-between items-center border-t px-6 py-4">
            <div className="text-sm text-muted-foreground">
              แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, allFeeHistory.length)} จาก {allFeeHistory.length} รายการ
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                ก่อนหน้า
              </Button>
              <div className="flex items-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="mx-1 min-w-[2rem]"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ถัดไป
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </Layout>
  );
}