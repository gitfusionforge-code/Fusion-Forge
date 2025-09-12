import { useEffect, useState, createContext, useContext } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";

// Hook to get admin email from server (same as navbar)
function useAdminEmail() {
  const [adminEmail, setAdminEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL || "");

  useEffect(() => {
    if (!adminEmail) {
      fetch('/api/admin/config')
        .then(res => res.json())
        .then(data => setAdminEmail(data.adminEmail || ""))
        .catch(() => setAdminEmail("fusionforgepc@gmail.com"));
    }
  }, [adminEmail]);

  return adminEmail;
}

interface AdminSessionContextType {
  adminSessionReady: boolean;
}

const AdminSessionContext = createContext<AdminSessionContextType | undefined>(undefined);

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (context === undefined) {
    throw new Error("useAdminSession must be used within an AdminAuthGuard");
  }
  return context;
}

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [adminSessionLoading, setAdminSessionLoading] = useState(false);
  const [adminSessionCreated, setAdminSessionCreated] = useState(false);
  const ADMIN_EMAIL = useAdminEmail();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/admin/login');
    }
  }, [user, loading, setLocation]);

  // Auto-create admin session when user is authenticated
  useEffect(() => {
    const createAdminSession = async () => {
      // Only proceed if we have both user and admin email loaded
      if (user && ADMIN_EMAIL && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && !adminSessionCreated) {
        setAdminSessionLoading(true);
        try {
          const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: user.email }),
            credentials: 'include'
          });
          
          if (response.ok) {
            // Add a small delay to ensure session cookie is set
            await new Promise(resolve => setTimeout(resolve, 100));
            setAdminSessionLoading(false); // Reset loading state
            setAdminSessionCreated(true);
          } else {
            const errorData = await response.text();
            console.error('Failed to create admin session:', errorData);
            setAdminSessionLoading(false); // Stop loading on error
          }
        } catch (error) {
          console.error('Error creating admin session:', error);
          setAdminSessionLoading(false); // Stop loading on error
        }
      }
    };

    createAdminSession();
  }, [user, ADMIN_EMAIL, adminSessionCreated]); // Add ADMIN_EMAIL to dependencies

  // Show loading while auth is loading, admin email is loading, or admin session is being created
  if (loading || !ADMIN_EMAIL || adminSessionLoading || (!adminSessionCreated && user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
    return (
      <div className="min-h-screen bg-light-grey flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">
                {loading ? "Verifying admin access..." : 
                 !ADMIN_EMAIL ? "Loading configuration..." :
                 "Setting up admin session..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="min-h-screen bg-light-grey flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-red-700">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                You are not authorized to access the admin panel. Only the designated admin account can access this area.
              </AlertDescription>
            </Alert>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Your Account:</strong> {user.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Required Admin Account:</strong> {ADMIN_EMAIL}
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => logout()} 
                variant="outline" 
                className="flex-1"
              >
                Logout
              </Button>
              <Button 
                onClick={() => setLocation('/')} 
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminSessionContext.Provider value={{ adminSessionReady: adminSessionCreated }}>
      <div className="min-h-screen bg-light-grey">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Admin Panel</span>
                <span className="text-sm text-gray-500">• {user.email}</span>
              </div>
              <Button onClick={() => logout()} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
        {children}
      </div>
    </AdminSessionContext.Provider>
  );
}