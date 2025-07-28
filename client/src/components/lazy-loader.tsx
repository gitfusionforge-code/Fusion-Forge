import { Suspense, lazy } from 'react';
import LoadingSpinner from '@/components/loading-spinner';

// Lazy load pages for code splitting
export const LazyHome = lazy(() => import('@/pages/home'));
export const LazyBuilds = lazy(() => import('@/pages/builds'));
export const LazyBuildDetails = lazy(() => import('@/pages/build-details'));
export const LazyContact = lazy(() => import('@/pages/contact'));
export const LazyConfigurator = lazy(() => import('@/pages/configurator'));
export const LazyAbout = lazy(() => import('@/pages/about'));
export const LazyServices = lazy(() => import('@/pages/services'));
export const LazyFAQ = lazy(() => import('@/pages/faq'));
export const LazyAdmin = lazy(() => import('@/pages/admin'));
export const LazyAdminLogin = lazy(() => import('@/pages/admin-login'));
export const LazyLogin = lazy(() => import('@/pages/Login'));
export const LazyCheckout = lazy(() => import('@/pages/Checkout'));
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyProfile = lazy(() => import('@/pages/profile'));
export const LazyProfileBuilds = lazy(() => import('@/pages/profile-builds'));
export const LazyProfileOrders = lazy(() => import('@/pages/profile-orders'));
export const LazyProfileSettings = lazy(() => import('@/pages/profile-settings'));
export const LazyOrderSuccess = lazy(() => import('@/pages/order-success'));

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}