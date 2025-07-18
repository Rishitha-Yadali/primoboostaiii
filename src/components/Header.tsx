import React, { useState, useRef, useEffect } from 'react';
import { FileText, User, LogOut, Menu, X, Loader2, Sparkles, Shield, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './auth/AuthModal';
import { DeviceManagement } from './security/DeviceManagement';


interface HeaderProps {
  children?: React.ReactNode;
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  children, 
  onMobileMenuToggle,
  showMobileMenu 
}) => {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDeviceManagement, setShowDeviceManagement] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoggingOut(true);
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.name.split(' ')[0]; // First name only
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Only show loading spinner for initial load, not for every auth operation
  const showLoadingSpinner = isLoading && !isAuthenticated && !user;

  return (
    <>
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                <img 
                  src="https://res.cloudinary.com/dlkovvlud/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1751536902/a-modern-logo-design-featuring-primoboos_XhhkS8E_Q5iOwxbAXB4CqQ_HnpCsJn4S1yrhb826jmMDw_nmycqj.jpg" 
                  alt="PrimoBoost AI Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">PrimoBoost AI</h1>
                <p className="text-xs text-gray-500 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Upgrade Your Resume, Unlock Your Future
                </p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">PrimoBoost AI</h1>
              </div>
            </div>

            {/* Desktop Navigation and Auth */}
            <div className="hidden sm:flex items-center space-x-4">
              {children}
              
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 shadow-sm"
                  >
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {getUserInitials()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {getGreeting()}, {getUserDisplayName()}!
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">
                        {user.email}
                      </p>
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-br from-blue-600 to-blue-700 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                            {getUserInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Device Management Option */}
                      <button
                        onClick={() => {
                          setShowDeviceManagement(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Device & Security</span>
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3 disabled:opacity-50"
                      >
                        {isLoggingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                        <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  disabled={showLoadingSpinner}
                  className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl active:scale-[0.98] ${
                    showLoadingSpinner ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {showLoadingSpinner ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>{showLoadingSpinner ? 'Loading...' : 'Sign In'}</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <button
                onClick={onMobileMenuToggle}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Device Management Modal */}
      {showDeviceManagement && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Device & Security Management</h2>
              <button
                onClick={() => setShowDeviceManagement(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <DeviceManagement />
            </div>
          </div>
        </div>
      )}
    </>
  );
};