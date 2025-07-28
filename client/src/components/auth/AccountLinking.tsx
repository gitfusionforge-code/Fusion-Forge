import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Mail, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Link,
  Unlink
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AccountLinkingProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountLinking({ isOpen, onClose }: AccountLinkingProps) {
  const { user, linkPasswordToAccount, checkAccountLinkingStatus } = useAuth();
  const { toast } = useToast();
  
  const [linkingStatus, setLinkingStatus] = useState({
    hasPassword: false,
    hasGoogle: false,
    providers: [] as string[]
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && user?.email) {
      checkLinkingStatus();
    }
  }, [isOpen, user?.email]);

  const checkLinkingStatus = async () => {
    if (!user?.email) return;
    
    try {
      setIsLoading(true);
      const status = await checkAccountLinkingStatus(user.email);
      setLinkingStatus(status);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkPassword = async () => {
    if (!password || password !== confirmPassword) {
      setError("Passwords must match and not be empty");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      await linkPasswordToAccount(password);
      
      toast({
        title: "Password linked successfully!",
        description: "You can now sign in with both Google and password.",
      });
      
      // Refresh linking status
      await checkLinkingStatus();
      setPassword("");
      setConfirmPassword("");
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Account Security</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </div>
          <CardDescription>
            Manage your authentication methods for enhanced security
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Authentication Status */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Connected Methods
            </h4>
            
            <div className="space-y-2">
              {/* Email Display */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <span className="text-sm text-muted-foreground">{user?.email}</span>
              </div>

              {/* Google Authentication */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FcGoogle className="h-4 w-4" />
                  <span className="text-sm font-medium">Google</span>
                </div>
                {linkingStatus.hasGoogle ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Connected</Badge>
                )}
              </div>

              {/* Password Authentication */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Password</span>
                </div>
                {linkingStatus.hasPassword ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Connected</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Link Password Account (only show if user doesn't have password auth) */}
          {!linkingStatus.hasPassword && linkingStatus.hasGoogle && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Add Password Authentication</h4>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter a new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleLinkPassword}
                  disabled={isLoading || !password || !confirmPassword}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Link Password to Account
                </Button>
              </div>
            </div>
          )}

          {/* Account Linking Benefits */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Why link multiple authentication methods?
            </h5>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Access your account even if one method is unavailable</li>
              <li>• Enhanced security with multiple verification options</li>
              <li>• Seamless login experience across different devices</li>
              <li>• All your data stays together in one account</li>
            </ul>
          </div>

          {/* Account Status Summary */}
          {linkingStatus.hasPassword && linkingStatus.hasGoogle && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Perfect! Your account is fully secured with both Google and password authentication.
                You can sign in using either method.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}