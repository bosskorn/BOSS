import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import CategoryManage from "@/pages/category-manage";
import ProductCreate from "@/pages/product-create";
import ProductList from "@/pages/product-list";
import Dashboard from "@/pages/dashboard";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/category-manage" component={CategoryManage} />
      <Route path="/product-create" component={ProductCreate} />
      <Route path="/product-list" component={ProductList} />
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
