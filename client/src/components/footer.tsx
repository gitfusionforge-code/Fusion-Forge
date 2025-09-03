import { Link } from "wouter";
import fusionForgeLogo from "@assets/Fusion Forge Logo bgremoved_1750750872227.png";
import { useBusinessSettings } from "@/hooks/use-business-settings";

export default function Footer() {
  const { settings } = useBusinessSettings();
  
  return (
    <footer className="bg-dark-slate text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={fusionForgeLogo} 
                alt="Fusion Forge PCs" 
                className="h-8 w-8 object-contain"
              />
              <h3 className="text-2xl font-bold text-white">
                Fusion Forge PCs
              </h3>
            </div>
            <p className="text-white mb-4">
              Building premium custom computers since 2020 with the latest components and professional service.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-tech-orange transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-white hover:text-tech-orange transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-white hover:text-tech-orange transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-white hover:text-tech-orange transition-colors">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-white">
              <li>
                <Link to="/builds" className="hover:text-tech-orange transition-colors">
                  Gaming PCs
                </Link>
              </li>
              <li>
                <Link to="/builds" className="hover:text-tech-orange transition-colors">
                  Workstations
                </Link>
              </li>
              <li>
                <Link to="/builds" className="hover:text-tech-orange transition-colors">
                  Budget Builds
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-tech-orange transition-colors">
                  Custom Orders
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-white">
              <li>
                <Link to="/about" className="hover:text-tech-orange transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-tech-orange transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-tech-orange transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-tech-orange transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact Information</h4>
            <div className="space-y-2">
              <p className="text-white">📧 {settings.businessEmail}</p>
              <p className="text-white">📞 {settings.businessPhone}</p>
              <p className="text-white">📍 {settings.businessAddress}</p>
              <p className="text-white">⏰ {settings.businessHours}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-8 text-center">
          <p className="text-white">&copy; 2024 Fusion Forge PCs. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}
