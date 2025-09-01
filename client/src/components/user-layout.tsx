import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import UserSidebar from "./user-sidebar";
import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    setLocation("/");
    return null;
  }

  if (isMobile) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Account</h1>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <UserSidebar onNavigate={() => setIsOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Mobile Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <UserSidebar />
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}