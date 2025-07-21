import React, { useState } from 'react';
import { X, Menu, Home, Info, Phone, BookOpen, FileText, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigationItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'about', label: 'About Us', icon: <Info className="w-4 h-4" /> },
    { id: 'tutorials', label: 'Tutorials', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact', icon: <Phone className="w-4 h-4" /> },
  ];

  const handlePageChange = (pageId: string) => {
    onPageChange(pageId);
    setIsMobileMenuOpen(false);
  };

  const handleAuthAction = () => {
    if (user) {
      logout();
    } else {
      onPageChange('signin');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-4 xl:space-x-8">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handlePageChange(item.id)}
            className={`flex items-center space-x-2 px-3 py-2 xl:px-4 xl:py-2 rounded-lg font-medium transition-all duration-200 min-h-touch ${
              currentPage === item.id
                ? 'bg-primary-100 text-primary-700 shadow-md'
                : 'text-secondary-700 hover:text-primary-600 hover:bg-primary-50'
            }`}
          >
            {item.icon}
            <span className="hidden xl:inline">{item.label}</span>
            <span className="xl:hidden">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden min-w-touch min-h-touch p-2 text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-12 left-0 right-0 bg-white border-t border-secondary-200 shadow-md lg:hidden rounded-b-xl mx-4 overflow-hidden">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium min-h-touch transition-colors ${
                currentPage === item.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-700 hover:bg-secondary-100'
              }`}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </button>
          ))}

          {/* Sign In / Sign Out Button */}
          <button
            onClick={handleAuthAction}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-secondary-700 hover:bg-secondary-100 min-h-touch transition-colors"
          >
            {user ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span className="ml-2">{user ? 'Sign Out' : 'Sign In'}</span>
          </button>
        </div>
      )}
    </>
  );
};
