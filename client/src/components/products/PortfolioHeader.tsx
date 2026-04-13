import { Link } from 'wouter';
import Button from "./Button";
import { Menu, X, Rocket } from "lucide-react";
import { cn } from "@/utils/cn";
import { useState } from 'react';

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
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center group">
            <div className="relative">
              <img src="/logo.png" alt="RateHonk" className="h-10 w-auto mr-3 drop-shadow-sm" />
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {[
              { href: "/#features", label: "Features" },
              { href: "/#solutions", label: "Solutions" },
              { href: "/#pricing", label: "Pricing" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary font-semibold text-sm transition-all duration-200"
              >
                {item.label}
              </a>
            ))}
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
            
            {showSignInButton && (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="font-bold text-slate-700 dark:text-slate-300">
                  Sign In
                </Button>
              </Link>
            )}
            
            {showSignUpButton && (
                <Link href="/register">
                <Button size="sm" className="font-bold shadow-md shadow-primary/20">
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden absolute top-20 inset-x-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 ease-in-out",
        mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-4 py-8 space-y-6">
          {[
            { href: "/#features", label: "Features" },
            { href: "/#solutions", label: "Solutions" },
            { href: "/#pricing", label: "Pricing" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block text-lg font-bold text-slate-700 dark:text-slate-300 px-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-4 flex flex-col gap-4">
            {showSignInButton && (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
            )}
            {showSignUpButton && (
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center py-4">
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
