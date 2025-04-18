import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminRegisterPage from "@/pages/admin-register";
import Dashboard from "@/pages/dashboard-with-layout";
import CategoryManage from "@/pages/category-manage-enhanced";
import ProductCreate from "@/pages/product-create-enhanced";
import ProductList from "@/pages/product-list";
import ProductListEnhanced from "@/pages/product-list-enhanced";
import CreateOrder from "@/pages/create-order";
import LogoDisplay from "@/pages/logo-display";
import CategoryManagement from "@/pages/category-management";
import ProductManagement from "@/pages/product-management";
import AdminDashboard from "@/pages/admin-dashboard";
import OrderList from "@/pages/order-list";
import OrderDetail from "@/pages/order-detail";
import ShipmentList from "@/pages/shipment-list";
import { AuthProvider } from "@/hooks/use-auth";

// รายงาน
import ReportsOverview from "@/pages/reports/overview";
import ReportsByCourier from "@/pages/reports/by-courier";
import ReportsByArea from "@/pages/reports/by-area";
import ReportsCOD from "@/pages/reports/cod";
import ReportsReturns from "@/pages/reports/returns";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin-register" component={AdminRegisterPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/category-manage" component={CategoryManage} />
      <Route path="/category-management" component={CategoryManagement} />
      <Route path="/product-create" component={ProductCreate} />
      <Route path="/products/create" component={ProductCreate} />
      <Route path="/product-list" component={ProductListEnhanced} />
      <Route path="/product-list-old" component={ProductList} />
      <Route path="/product-management" component={ProductManagement} />
      <Route path="/create-order" component={CreateOrder} />
      <Route path="/logo" component={LogoDisplay} />
      
      {/* คำสั่งซื้อ */}
      <Route path="/orders-all" component={OrderList} />
      <Route path="/order-detail/:id" component={OrderDetail} />
      
      {/* พัสดุและการจัดส่ง */}
      <Route path="/parcel-list" component={ShipmentList} />
      
      {/* รายงาน */}
      <Route path="/reports/overview" component={ReportsOverview} />
      <Route path="/reports/by-courier" component={ReportsByCourier} />
      <Route path="/reports/by-area" component={ReportsByArea} />
      <Route path="/reports/cod" component={ReportsCOD} />
      <Route path="/reports/returns" component={ReportsReturns} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
