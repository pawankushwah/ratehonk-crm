import { Link, useLocation } from 'wouter';
import Button from './Button';

const Navbar = () => {
  const [location] = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot'].includes(location);

  return (
    <nav className='mx-10'>
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 w-[95%] z-50 py-3 glass px-10 transition-all duration-300 box-border`}>
        <div className={`flex justify-between items-center m-auto max-w-6xl ${isAuthPage ? 'max-w-2xl' : ''}`}>
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter gradient-text hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Logo" className="h-16" />
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            {!isAuthPage && (
              <div className="hidden md:flex items-center gap-6">
                <Link href="#" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">Features</Link>
                <Link href="#" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">Pricing</Link>
              </div>
            )}
            
            <div className="flex items-center gap-2 md:gap-4">
              {location !== '/login' && (
                <Link href="/login" className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors px-2">
                  Login
                </Link>
              )}
              {location !== '/register' && (
                <Link href="/register">
                  <Button size="sm" className="text-xs md:text-sm">Get Started</Button>
                </Link>
              )}
              {/* <ThemeToggle /> */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
