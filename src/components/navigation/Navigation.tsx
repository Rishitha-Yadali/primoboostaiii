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
      <nav className="hidden md:flex items-center space-x-8">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handlePageChange(item.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-blue-100 text-blue-700 shadow-md'
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden p-2 text-gray-700"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-12 left-0 right-0 bg-white border-t border-gray-200 shadow-md md:hidden">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
                currentPage === item.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </button>
          ))}

          {/* Sign In / Sign Out Button */}
          <button
            onClick={handleAuthAction}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {user ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span className="ml-2">{user ? 'Sign Out' : 'Sign In'}</span>
          </button>
        </div>
      )}
    </>
  );
};
