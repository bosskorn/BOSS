import React from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Button } from '../components/ui/button';
import { useLocation } from 'wouter';

export default function CreateFlashExpressOrder() {
  const [_, navigate] = useLocation();

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">บริการถูกลบออกจากระบบแล้ว</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>บริการสร้างออเดอร์ถูกลบออกจากระบบแล้ว</CardTitle>
            <CardDescription>หน้านี้ไม่สามารถใช้งานได้อีกต่อไป</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>บริการถูกยกเลิก</AlertTitle>
              <AlertDescription>
                บริการนี้ได้ถูกลบออกจากระบบแล้ว
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">กรุณาติดต่อผู้ดูแลระบบหากต้องการใช้บริการนี้</p>
            <Button variant="outline" onClick={() => navigate('/create-order')}>
              กลับไปยังหน้าสร้างออเดอร์
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}