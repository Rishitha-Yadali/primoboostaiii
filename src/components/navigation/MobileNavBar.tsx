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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="flex items-center justify-around" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`flex flex-col items-center justify-center py-3 px-2 min-w-[64px] min-h-[64px] transition-colors ${
              currentPage === item.id
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={`p-1.5 rounded-full mb-1 ${
              currentPage === item.id ? 'bg-blue-100' : ''
            }`}>
              {item.icon}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}