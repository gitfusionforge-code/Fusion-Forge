import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import UserSidebar from "./user-sidebar";
import { ReactNode } from "react";

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <UserSidebar />
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}