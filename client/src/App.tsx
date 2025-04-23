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
import CreateOrderTabs from "@/pages/create-order-tabs";
import BulkOrderImport from "@/pages/bulk-order-import";
import LogoDisplay from "@/pages/logo-display";
import LogoShowcase from "@/pages/logo-showcase";
import CategoryManagement from "@/pages/category-management";
import ProductManagement from "@/pages/product-management";
import AdminDashboard from "@/pages/admin-dashboard";
import OrderList from "@/pages/order-list-enhanced";
import OrderDetail from "@/pages/order-detail";
import ShipmentList from "@/pages/shipment-list";
import Settings from "@/pages/settings";
import TopUp from "@/pages/top-up";
import ClaimsList from "@/pages/claims-list";
import UserClaims from "@/pages/user-claims";
import PrintTestSimple from "@/pages/print-test-simple";
import BarcodeTest from "@/pages/barcode-test";
import PrintLabelEnhanced from "@/pages/print-label-enhanced";
import BarcodeTestImproved from "@/pages/barcode-test-improved";
import JTExpressLabel from "@/pages/jt-express-label";
import FlashExpressLabel from "@/pages/flash-express-label";
import FlashExpressLabelNew from "@/pages/flash-express-label-new";
import FlashExpressLabelSimple from "@/pages/flash-express-label-simple";
import PrintLabelsFullPage from "@/pages/print-labels-full";
import PrintLabelsFullFixedPage from "@/pages/print-labels-full-fixed";
import TikTokStyleLabelPage from "@/pages/tiktok-style-label";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import TikTokFlashLabel from './pages/tiktok-flash-label';
import TikTokShippingLabel from './pages/tiktok-shipping-label';
import TikTokShippingLabelFixed from './pages/tiktok-shipping-label-fixed';
import PrintMultipleLabels from './pages/print-multiple-labels';
import PrintMultipleLabelsFixed from './pages/print-multiple-labels-fixed';
import FlashExpressLabelFixed from './pages/flash-express-label-fixed';
import JntExpressLabel from './pages/jnt-express-label';
import FeeHistory from './pages/fee-history';
import LandingPage from './pages/landing';
import FlashExpressAPITest from './pages/flash-express-api-test';
import CreateFlashExpressOrder from './pages/create-flash-express-order';
import FindByMerchantTracking from './pages/orders/find-by-merchant-tracking';

// รายงาน
import ReportsOverview from "@/pages/reports/overview";
import ReportsByCourier from "@/pages/reports/by-courier";
import ReportsByArea from "@/pages/reports/by-area";
import ReportsCOD from "@/pages/reports/cod";
import ReportsReturns from "@/pages/reports/returns";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/logo" component={LogoDisplay} />
      <Route path="/logo-showcase" component={LogoShowcase} />
      <Route path="/admin-register" component={AdminRegisterPage} />
      <Route path="/print-test" component={PrintTestSimple} />
      <Route path="/barcode-test" component={BarcodeTest} />
      <Route path="/print-label-enhanced" component={PrintLabelEnhanced} />
      <Route path="/barcode-test-improved" component={BarcodeTestImproved} />
      <Route path="/jt-express-label" component={JTExpressLabel} />
      <Route path="/flash-express-label" component={FlashExpressLabel} />
      <Route path="/flash-express-label-new" component={FlashExpressLabelNew} />
      <Route path="/jnt-express-label" component={JntExpressLabel} />
      <Route path="/tiktok-flash-label" component={TikTokFlashLabel} />
      <Route path="/tiktok-shipping-label" component={TikTokShippingLabel} />
      <Route path="/tiktok-shipping-label-fixed" component={TikTokShippingLabelFixed} />
      <Route path="/print-multiple-labels" component={PrintMultipleLabels} />
      <Route path="/print-multiple-labels-fixed" component={PrintMultipleLabelsFixed} />
      <Route path="/flash-express-label-fixed" component={FlashExpressLabelFixed} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/flash-express-api-test" component={FlashExpressAPITest} />
      {/* Flash Express routes have been removed */}

      {/* Protected routes - require authentication */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/admin-dashboard" component={AdminDashboard} />
      <ProtectedRoute path="/category-manage" component={CategoryManage} />
      <ProtectedRoute path="/category-management" component={CategoryManagement} />
      <ProtectedRoute path="/product-create" component={ProductCreate} />
      <ProtectedRoute path="/products/create" component={ProductCreate} />
      <ProtectedRoute path="/product-list" component={ProductListEnhanced} />
      <ProtectedRoute path="/product-list-old" component={ProductList} />
      <ProtectedRoute path="/product-management" component={ProductManagement} />
      <ProtectedRoute path="/create-order" component={CreateOrderTabs} />
      <ProtectedRoute path="/create-order-old" component={CreateOrder} />
      <ProtectedRoute path="/bulk-order-import" component={BulkOrderImport} />

      {/* คำสั่งซื้อ - protected */}
      <ProtectedRoute path="/orders-all" component={OrderList} />
      <ProtectedRoute path="/order-detail/:id" component={OrderDetail} />
      <ProtectedRoute path="/orders/find-by-merchant-tracking" component={FindByMerchantTracking} />

      {/* พัสดุและการจัดส่ง - protected */}
      <ProtectedRoute path="/parcel-list" component={ShipmentList} />

      {/* รายงาน - protected */}
      <ProtectedRoute path="/reports/overview" component={ReportsOverview} />
      <ProtectedRoute path="/reports/by-courier" component={ReportsByCourier} />
      <ProtectedRoute path="/reports/by-area" component={ReportsByArea} />
      <ProtectedRoute path="/reports/cod" component={ReportsCOD} />
      <ProtectedRoute path="/reports/returns" component={ReportsReturns} />

      {/* ตั้งค่า - protected */}
      <ProtectedRoute path="/settings" component={Settings} />

      {/* เติมเงิน - protected */}
      <ProtectedRoute path="/top-up" component={TopUp} />
      <ProtectedRoute path="/fee-history" component={FeeHistory} />

      {/* การเคลม - protected */}
      <ProtectedRoute path="/claims-list" component={ClaimsList} />
      <ProtectedRoute path="/user-claims" component={UserClaims} />

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