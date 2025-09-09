import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export function FirebaseAdminLogin() {
  const [, setLocation] = useLocation();
  const { login, user, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError("Access denied. Only authorized admin accounts can access this panel.");
      return;
    }

    setIsLoggingIn(true);

    try {
      // Step 1: Firebase authentication
      await login(email, password);
      
      // Step 2: Create backend admin session
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include' // Important for cookie handling
      });
      
      if (!response.ok) {
        throw new Error('Failed to create admin session');
      }
      
      toast({
        title: "Admin Login Successful",
        description: "Welcome to the Fusion Forge PCs admin panel",
      });
      setLocation('/admin');
    } catch (error: any) {
      setError(error.message || 'Login failed');
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-grey flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    setLocation('/admin');
    return null;
  }

  return (
    <div className="min-h-screen bg-light-grey flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 fusion-gradient rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold fusion-text-gradient">
            Admin Access
          </CardTitle>
          <p className="text-gray-600">
            Fusion Forge PCs Management Dashboard
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium mb-1">Authorized Admin Email:</p>
            <p className="text-sm text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">
              {ADMIN_EMAIL}
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoggingIn}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Authenticating..." : "Login as Admin"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2">Security Notice</h4>
            <div className="text-sm text-amber-800 space-y-1">
              <p>Only the authorized admin email can access this panel.</p>
              <p>Admin access is verified through Firebase Authentication.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}