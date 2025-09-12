import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Mail, Shield } from "lucide-react";
import CartIcon from "@/components/cart-icon";
import UserMenu from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import fusionForgeLogo from "@assets/Fusion Forge Logo bgremoved_1750750872227.png";

// Hook to get admin email from server (fallback to env var)
function useAdminEmail() {
  const [adminEmail, setAdminEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL || "");

  useEffect(() => {
    // If no env var set, fetch from server
    if (!adminEmail) {
      fetch('/api/admin/config')
        .then(res => res.json())
        .then(data => setAdminEmail(data.adminEmail || ""))
        .catch(() => {
          // Fallback to hardcoded value if API fails
          setAdminEmail("fusionforgepc@gmail.com");
        });
    }
  }, [adminEmail]);

  return adminEmail;
}

export default function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const adminEmail = useAdminEmail();


  const isAdmin = user?.email?.toLowerCase() === adminEmail.toLowerCase();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/builds", label: "PC Builds" },
    { href: "/configurator", label: "Configurator" },
    { href: "/subscription-plans", label: "Subscriptions" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const adminNavItem = { href: "/admin", label: "Admin", icon: Shield };

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <img 
                src={fusionForgeLogo} 
                alt="Fusion Forge PCs Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-gray-800">
                Fusion Forge PCs
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <span
                  className={`text-sm font-medium transition-colors hover:text-tech-orange cursor-pointer ${
                    isActive(item.href)
                      ? "text-tech-orange border-b-2 border-tech-orange pb-1"
                      : "text-dark-slate"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
            
            {/* Admin Navigation - Only visible to admin users */}
            {isAdmin && (
              <Link to={adminNavItem.href}>
                <span
                  className={`text-sm font-medium transition-colors hover:text-tech-orange cursor-pointer flex items-center gap-1 relative ${
                    isActive(adminNavItem.href)
                      ? "text-tech-orange border-b-2 border-tech-orange pb-1"
                      : "text-dark-slate"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  {adminNavItem.label}
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                </span>
              </Link>
            )}
          </div>

          {/* Desktop Cart & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <CartIcon />
            <Button asChild className="fusion-gradient text-white hover:opacity-90 px-6 border-0">
              <Link href="/contact">
                <Mail className="mr-2 h-4 w-4" />
                Get Quote
              </Link>
            </Button>
            <UserMenu />
          </div>

          {/* Mobile Cart & Menu */}
          <div className="md:hidden flex items-center space-x-2">
            <CartIcon />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-6 mt-8">
                  {/* Mobile Logo */}
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center space-x-3 cursor-pointer">
                      <img 
                        src={fusionForgeLogo} 
                        alt="Fusion Forge PCs Logo" 
                        className="h-8 w-8 object-contain"
                      />
                      <span className="text-lg font-bold text-gray-800">
                        Fusion Forge PCs
                      </span>
                    </div>
                  </Link>

                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col space-y-4">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                        <span
                          className={`text-lg font-medium transition-colors hover:text-tech-orange cursor-pointer ${
                            isActive(item.href) ? "text-tech-orange" : "text-gray-700"
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    ))}
                    
                    {/* Mobile Admin Navigation */}
                    {isAdmin && (
                      <Link href={adminNavItem.href} onClick={() => setIsOpen(false)}>
                        <span
                          className={`text-lg font-medium transition-colors hover:text-tech-orange cursor-pointer flex items-center gap-2 relative ${
                            isActive(adminNavItem.href) ? "text-tech-orange" : "text-gray-700"
                          }`}
                        >
                          <Shield className="h-5 w-5" />
                          {adminNavItem.label}
                          <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                        </span>
                      </Link>
                    )}
                  </div>

                  {/* Mobile CTA Button */}
                  <Button asChild className="fusion-gradient text-white hover:opacity-90 w-full border-0">
                    <Link href="/contact" onClick={() => setIsOpen(false)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Get Quote
                    </Link>
                  </Button>

                  {/* Mobile User Menu */}
                  <div className="pt-4 border-t">
                    <UserMenu />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}