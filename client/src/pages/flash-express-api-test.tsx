import React from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export default function FlashExpressAPITest() {
  return (
    <Layout>
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Flash Express API - บริการถูกลบไปแล้ว</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>บริการ Flash Express ถูกลบไปแล้ว</CardTitle>
            <CardDescription>หน้านี้ไม่สามารถใช้งานได้อีกต่อไป</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>ไม่พบบริการ</AlertTitle>
              <AlertDescription>
                บริการ Flash Express API ได้ถูกลบออกจากระบบแล้ว
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">กรุณาติดต่อผู้ดูแลระบบหากต้องการใช้บริการนี้</p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}