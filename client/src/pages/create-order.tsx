import Layout from "@/components/Layout";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CreateOrderPage: React.FC = () => {
  return (
    <Layout>
      <div className="container max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">สร้างออเดอร์แบบเดิม</h1>
          <p className="text-gray-600 text-lg mt-2">หน้านี้ถูกแทนที่ด้วยรูปแบบใหม่แล้ว</p>
          <div className="w-20 h-1 bg-gradient-to-r from-purple-600 to-indigo-500 mt-4 rounded-full"></div>
        </div>

        <div className="p-6 border border-purple-200 rounded-lg shadow-md bg-white">
          <h1 className="text-xl font-medium text-purple-800 mb-4">สร้างออเดอร์แบบง่าย</h1>
          <p className="text-gray-600 mb-6">กรุณาใช้เมนู "สร้างออเดอร์ใหม่ (แบบแท็บ)" แทน เพื่อความสะดวกในการใช้งาน</p>
          
          <div className="mt-4">
            <Link href="/create-order-tabs">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <ArrowRight className="w-4 h-4 mr-2" />
                ไปยังหน้าสร้างออเดอร์ใหม่
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateOrderPage;