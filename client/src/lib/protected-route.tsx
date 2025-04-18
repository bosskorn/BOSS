import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect, Route } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  path,
  component: Component,
}) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-white">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-kanit">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
          </div>
        </div>
      </Route>
    );
  }
  
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  return <Route path={path} component={Component} />;
};