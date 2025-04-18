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
import CreateOrder from "@/pages/create-order-new";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/category-manage" component={CategoryManage} />
      <Route path="/product-create" component={ProductCreate} />
      <Route path="/product-list" component={ProductList} />
      <Route path="/create-order" component={CreateOrder} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
