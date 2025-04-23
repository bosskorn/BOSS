import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import Layout from "@/components/Layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/api";

// สถานะสำหรับคำขอเรียกรถ
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500 hover:bg-yellow-600",
  requested: "bg-blue-500 hover:bg-blue-600",
  completed: "bg-green-500 hover:bg-green-600",
  failed: "bg-red-500 hover:bg-red-600",
};

const statusNames: Record<string, string> = {
  pending: "รอดำเนินการ",
  requested: "ร้องขอแล้ว",
  completed: "สำเร็จ",
  failed: "ล้มเหลว/ยกเลิก",
};

// ส่วนแสดงประวัติการเรียกรถ
export default function PickupRequestHistory() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // ดึงข้อมูลประวัติการเรียกรถทั้งหมด
  const {
    data: pickupData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["/api/pickup-requests"],
    retry: 1,
  });

  // กรองข้อมูลตาม Tab ที่เลือก
  const filteredData = React.useMemo(() => {
    if (!pickupData?.pickupRequests) return [];

    if (activeTab === "all") {
      return pickupData.pickupRequests;
    }

    return pickupData.pickupRequests.filter(
      (request: any) => request.status === activeTab
    );
  }, [pickupData, activeTab]);

  // ฟังก์ชันแสดงรายละเอียด
  const showDetails = (request: any) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  // ฟังก์ชันยกเลิกคำขอเรียกรถ
  const cancelRequest = async (requestId: string) => {
    try {
      const response = await apiRequest({
        url: `/api/pickup-requests/${requestId}/cancel`,
        method: "POST",
      });

      if (response.success) {
        toast({
          title: "ยกเลิกคำขอเรียกรถสำเร็จ",
          description: "คำขอเรียกรถถูกยกเลิกเรียบร้อยแล้ว",
        });
        refetch(); // รีเฟรชข้อมูล
        setDetailsOpen(false);
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: response.message || "ไม่สามารถยกเลิกคำขอเรียกรถได้",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถยกเลิกคำขอเรียกรถได้",
        variant: "destructive",
      });
    }
  };

  // แปลงวันที่ให้อยู่ในรูปแบบไทย
  const formatThaiDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return format(parseISO(dateString), "d MMMM yyyy HH:mm", {
        locale: th,
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">ประวัติการเรียกรถเข้ารับพัสดุ</h1>

        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
            <TabsTrigger value="pending">รอดำเนินการ</TabsTrigger>
            <TabsTrigger value="requested">ร้องขอแล้ว</TabsTrigger>
            <TabsTrigger value="completed">สำเร็จ</TabsTrigger>
            <TabsTrigger value="failed">ล้มเหลว/ยกเลิก</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>รายการเรียกรถเข้ารับพัสดุ</CardTitle>
                <CardDescription>
                  {activeTab === "all"
                    ? "แสดงรายการคำขอเรียกรถทั้งหมด"
                    : `แสดงรายการคำขอเรียกรถที่มีสถานะ "${statusNames[activeTab]}"`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center p-4">กำลังโหลดข้อมูล...</div>
                ) : isError ? (
                  <div className="text-center text-red-500 p-4">
                    เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center p-4">ไม่พบข้อมูลคำขอเรียกรถ</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>รหัสคำขอ</TableHead>
                          <TableHead>วันที่ขอให้เข้ารับ</TableHead>
                          <TableHead>เวลาเข้ารับ</TableHead>
                          <TableHead>จำนวนพัสดุ</TableHead>
                          <TableHead>สถานะ</TableHead>
                          <TableHead>วันที่สร้าง</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((request: any) => (
                          <TableRow key={request.id}>
                            <TableCell>{request.requestId}</TableCell>
                            <TableCell>
                              {formatThaiDate(request.requestDate)}
                            </TableCell>
                            <TableCell>{request.requestTimeSlot}</TableCell>
                            <TableCell>
                              {request.trackingNumbers?.length || 0} รายการ
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  statusColors[request.status] || "bg-gray-500"
                                }
                              >
                                {statusNames[request.status] ||
                                  request.status ||
                                  "ไม่ทราบสถานะ"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatThaiDate(request.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => showDetails(request)}
                                variant="outline"
                                size="sm"
                              >
                                รายละเอียด
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog แสดงรายละเอียดคำขอเรียกรถ */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>รายละเอียดคำขอเรียกรถ</DialogTitle>
              <DialogDescription>
                รหัสคำขอ: {selectedRequest?.requestId}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h3 className="font-medium">ข้อมูลทั่วไป</h3>
                    <div className="space-y-1 mt-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">ผู้ให้บริการ:</span>{" "}
                        {selectedRequest.provider}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">สถานะ:</span>{" "}
                        <Badge
                          className={
                            statusColors[selectedRequest.status] ||
                            "bg-gray-500"
                          }
                        >
                          {statusNames[selectedRequest.status] ||
                            selectedRequest.status ||
                            "ไม่ทราบสถานะ"}
                        </Badge>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">วันที่ขอให้เข้ารับ:</span>{" "}
                        {formatThaiDate(selectedRequest.requestDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">ช่วงเวลาเข้ารับ:</span>{" "}
                        {selectedRequest.requestTimeSlot || "-"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">วันที่ส่งคำขอจริง:</span>{" "}
                        {selectedRequest.requestedAt
                          ? formatThaiDate(selectedRequest.requestedAt)
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium">ข้อมูลผู้ติดต่อและที่อยู่</h3>
                    <div className="space-y-1 mt-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">ชื่อผู้ติดต่อ:</span>{" "}
                        {selectedRequest.contactName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">เบอร์โทรศัพท์:</span>{" "}
                        {selectedRequest.contactPhone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">ที่อยู่:</span>{" "}
                        {selectedRequest.pickupAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">รายการพัสดุ</h3>
                  <div className="mt-2 border rounded p-2">
                    {selectedRequest.trackingNumbers?.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedRequest.trackingNumbers.map(
                          (trackingNumber: string, index: number) => (
                            <li
                              key={index}
                              className="text-sm text-muted-foreground"
                            >
                              {index + 1}. {trackingNumber}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        ไม่มีรายการพัสดุ
                      </p>
                    )}
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <h3 className="font-medium">หมายเหตุ</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedRequest.notes}
                    </p>
                  </div>
                )}

                {selectedRequest.responseData && (
                  <div>
                    <h3 className="font-medium">ข้อมูลตอบกลับจาก API</h3>
                    <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-x-auto">
                      {JSON.stringify(selectedRequest.responseData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex justify-between">
              <div>
                {selectedRequest &&
                  (selectedRequest.status === "pending" ||
                    selectedRequest.status === "requested") && (
                    <Button
                      variant="destructive"
                      onClick={() => cancelRequest(selectedRequest.requestId)}
                    >
                      ยกเลิกคำขอนี้
                    </Button>
                  )}
              </div>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  ปิด
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}