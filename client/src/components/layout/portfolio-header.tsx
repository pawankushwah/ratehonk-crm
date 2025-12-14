import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Rocket } from "lucide-react";
import Logo from "../../assets/Logo-sidebar.svg";

interface PortfolioHeaderProps {
  showSignUpButton?: boolean;
  showSignInButton?: boolean;
}

export function PortfolioHeader({ 
  showSignUpButton = true, 
  showSignInButton = false 
}: PortfolioHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/portfolio" className="flex items-center cursor-pointer">
            <div className="relative">
              <img src={Logo} alt="RateHonk" className="h-10 w-auto mr-3 drop-shadow-sm" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                RateHonk
              </span>
              <div className="text-xs text-gray-500 font-medium tracking-wide">
                TRAVEL TECHNOLOGY
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {[
              { href: "/portfolio#features", label: "Features" },
              { href: "/portfolio#services", label: "Solutions" },
              { href: "/portfolio#testimonials", label: "Success Stories" },
              { href: "/portfolio#pricing", label: "Pricing" },
            ].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-gray-600 hover:text-gray-900 font-medium transition-all duration-200 hover:scale-105"
              >
                {item.label}
              </Link>
            ))}
            {showSignUpButton && (
              <Link to="/register">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
            )}
            {showSignInButton && (
              <Link to="/login">
                <Button variant="outline" className="border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-105">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50">
          <div className="px-4 py-6 space-y-4">
            {[
              { href: "/portfolio#features", label: "Features" },
              { href: "/portfolio#services", label: "Solutions" },
              { href: "/portfolio#testimonials", label: "Success Stories" },
              { href: "/portfolio#pricing", label: "Pricing" },
            ].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block text-gray-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {showSignUpButton && (
              <Link to="/register">
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white mt-4">
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
            )}
            {showSignInButton && (
              <Link to="/login">
                <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50 mt-4">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

