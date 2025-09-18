import { useState } from "react";
import { Link } from "wouter";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3" data-testid="logo">
            <div className="gradient-bg p-2 rounded-lg">
              <i className="fas fa-download text-primary-foreground text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MediaHub</h1>
              <p className="text-xs text-muted-foreground">Download. Share. Impact.</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">
              Features
            </a>
            <a href="#charity" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-charity">
              Charity
            </a>
            <Link href="/donate" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-donate">
              Donate
            </Link>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">
              About
            </a>
          </nav>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            <i className="fas fa-bars text-foreground"></i>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border" data-testid="mobile-menu">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#charity" className="text-muted-foreground hover:text-foreground transition-colors">
                Charity
              </a>
              <Link href="/donate" className="text-muted-foreground hover:text-foreground transition-colors">
                Donate
              </Link>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
