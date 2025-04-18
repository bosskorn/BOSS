import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard-with-layout";
import CategoryManage from "@/pages/category-manage-enhanced";
import ProductCreate from "@/pages/product-create-enhanced";
import ProductList from "@/pages/product-list";
import ProductListEnhanced from "@/pages/product-list-enhanced";
import CreateOrder from "@/pages/create-order";
import LogoDisplay from "@/pages/logo-display";
import CategoryManagement from "@/pages/category-management";
import ProductManagement from "@/pages/product-management";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/category-manage" component={CategoryManage} />
      <Route path="/category-management" component={CategoryManagement} />
      <Route path="/product-create" component={ProductCreate} />
      <Route path="/product-list" component={ProductListEnhanced} />
      <Route path="/product-list-old" component={ProductList} />
      <Route path="/product-management" component={ProductManagement} />
      <Route path="/create-order" component={CreateOrder} />
      <Route path="/logo" component={LogoDisplay} />
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
