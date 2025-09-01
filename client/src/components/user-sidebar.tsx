import { Link, useLocation } from "wouter";
import { User, Package, ShoppingBag, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    icon: User,
    label: "Profile",
    href: "/profile"
  },
  {
    icon: Package,
    label: "My Builds",
    href: "/profile/builds"
  },
  {
    icon: ShoppingBag,
    label: "Order History",
    href: "/profile/orders"
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/profile/settings"
  }
];

interface UserSidebarProps {
  onNavigate?: () => void;
}

export default function UserSidebar({ onNavigate }: UserSidebarProps = {}) {
  const [location] = useLocation();

  return (
    <div className="w-full md:w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-orange-50 text-orange-600 border border-orange-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}