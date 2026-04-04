import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import kavachLogo from 'figma:asset/2a4372773a3b5a42d85c8677296ad91523020f1f.png';

interface HeaderProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function Header({ currentScreen, onNavigate }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'about', label: 'ABOUT US' },
    { id: 'services', label: 'SERVICES' },
  ];

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <img 
              src={kavachLogo} 
              alt="Kavach - Farm Protection" 
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-colors ${
                  currentScreen === item.id
                    ? 'text-white bg-primary shadow-lg'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => onNavigate('register')}
              className="border-2 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 rounded-full px-6"
            >
              Register
            </Button>
            <Button 
              onClick={() => onNavigate('login')}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-lg transition-colors duration-150"
            >
              Login
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors ${
                    currentScreen === item.id
                      ? 'text-white bg-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 flex flex-col space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onNavigate('register');
                    setIsMobileMenuOpen(false);
                  }}
                  className="border-2 border-primary/20 text-primary hover:bg-primary/10 rounded-full"
                >
                  Register
                </Button>
                <Button 
                  onClick={() => {
                    onNavigate('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-primary hover:bg-primary/90 text-white rounded-full"
                >
                  Login
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}