import React from 'react';
import { Link } from 'wouter';
import { ShoppingBag, Search } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  username?: string;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-bg-main transition-colors duration-300">
      {/* Public Header */}
      <header className="sticky top-0 z-50 w-full bg-bg-main/70 backdrop-blur-xl border-b border-glass-border/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {/* <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl font-bold text-lg gradient-text group-hover:scale-110 transition-transform duration-300">
            </div> */}
            <div className="flex flex-col">
              <img src="/logo.png" alt="Logo" className="w-40" />
              {/* <span className="font-black text-xl text-text-main tracking-tight leading-none">RateHonk</span> */}
              <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black opacity-60">Storefront</span>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-10 relative group">
            <input 
              type="text" 
              placeholder={`Search in store...`}
              className="w-full h-11 pl-12 pr-4 rounded-xl bg-white/5 border border-glass-border/50 text-sm text-text-main outline-none focus:border-primary/50 transition-all font-medium placeholder:text-text-muted/50 group-hover:bg-white/10"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors" size={18} />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center border border-glass-border/50 rounded-xl text-text-main hover:bg-glass-bg transition-all cursor-pointer relative group">
              <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20 animate-bounce">0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 pt-10 pb-32">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-glass-border/50 py-12 bg-bg-main/50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 mb-6 opacity-40 grayscale hover:opacity-100 transition-all duration-500 hover:grayscale-0">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">Powered by</span>
                <img src="/logo.png" alt="RateHonk Logo" className="h-4 opacity-70" />
            </div>
            <p className="text-xs text-text-muted font-medium opacity-50">
              © 2026 RateHonk Marketplace. All rights reserved. 
              <br />
              Secure payments powered by RH Gateway.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
