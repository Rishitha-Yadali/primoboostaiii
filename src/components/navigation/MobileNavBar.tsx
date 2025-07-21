import React from 'react';
import { Home, Info, BookOpen, Phone, Menu } from 'lucide-react';

interface MobileNavBarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'about', label: 'About', icon: <Info className="w-5 h-5" /> },
    { id: 'tutorials', label: 'Tutorials', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'contact', label: 'Contact', icon: <Phone className="w-5 h-5" /> },
    { id: 'menu', label: 'Menu', icon: <Menu className="w-5 h-5" /> }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-secondary-200 shadow-lg lg:hidden safe-area">
      <div className="flex items-center justify-around pb-safe-bottom">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`flex flex-col items-center justify-center py-2 sm:py-3 px-2 min-w-touch min-h-touch transition-colors touch-spacing ${
              currentPage === item.id
                ? 'text-primary-600'
                : 'text-secondary-600 hover:text-primary-600'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={`p-1.5 rounded-full mb-1 transition-colors ${
              currentPage === item.id ? 'bg-primary-100' : 'hover:bg-secondary-100'
            }`}>
              {item.icon}
            </div>
            <span className="text-xs font-medium leading-tight">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};