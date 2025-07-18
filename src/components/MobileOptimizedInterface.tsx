import React, { useState, useRef, useEffect } from 'react';
import { FileText, BarChart3, ChevronDown, ChevronUp, ArrowUp, RefreshCw, Download, TrendingUp, Share2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { exportToPDF, exportToWord } from '../utils/exportUtils';
import { ResumeData } from '../types/resume';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  resumeData?: ResumeData;
}

interface MobileOptimizedInterfaceProps {
  sections: Section[];
}

export const MobileOptimizedInterface: React.FC<MobileOptimizedInterfaceProps> = ({ sections }) => {
  const [activeSection, setActiveSection] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'pdf' | 'word' | null;
    status: 'success' | 'error' | null;
    message: string;
  }>({ type: null, status: null, message: '' });

  // Handle scroll for pull-to-refresh and floating button
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu && !event.target) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const navigateToSection = (index: number) => {
    setActiveSection(index);
    // Smooth scroll to section
    const element = document.getElementById(`section-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh action
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExportMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowExportMenu(!showExportMenu);
  };

  const handleExportPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isExportingPDF || isExportingWord) return; // Prevent double clicks
    
    const currentSection = sections[activeSection];
    if (!currentSection?.resumeData) {
      setExportStatus({
        type: 'pdf',
        status: 'error',
        message: 'No resume data available to export'
      });
      
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 3000);
      return;
    }
    
    setIsExportingPDF(true);
    setExportStatus({ type: null, status: null, message: '' });
    
    try {
      await exportToPDF(currentSection.resumeData);
      setExportStatus({
        type: 'pdf',
        status: 'success',
        message: 'PDF exported successfully!'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 3000);
    } catch (error) {
      console.error('PDF export failed:', error);
      setExportStatus({
        type: 'pdf',
        status: 'error',
        message: 'PDF export failed. Please try again.'
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 5000);
    } finally {
      setIsExportingPDF(false);
      setShowExportMenu(false);
    }
  };

  const handleExportWord = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isExportingWord || isExportingPDF) return; // Prevent double clicks
    
    const currentSection = sections[activeSection];
    if (!currentSection?.resumeData) {
      setExportStatus({
        type: 'word',
        status: 'error',
        message: 'No resume data available to export'
      });
      
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 3000);
      return;
    }
    
    setIsExportingWord(true);
    setExportStatus({ type: null, status: null, message: '' });
    
    try {
      exportToWord(currentSection.resumeData);
      setExportStatus({
        type: 'word',
        status: 'success',
        message: 'Word document exported successfully!'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 3000);
    } catch (error) {
      console.error('Word export failed:', error);
      setExportStatus({
        type: 'word',
        status: 'error',
        message: 'Word export failed. Please try again.'
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 5000);
    } finally {
      setIsExportingWord(false);
      setShowExportMenu(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentSection = sections[activeSection];
    if (!currentSection?.resumeData) {
      setExportStatus({
        type: 'pdf',
        status: 'error',
        message: 'No resume data available to share'
      });
      
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 3000);
      return;
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentSection.resumeData.name}'s Resume`,
          text: 'Check out my optimized resume!',
        });
        
        setExportStatus({
          type: 'pdf',
          status: 'success',
          message: 'Shared successfully!'
        });
        
        setTimeout(() => {
          setExportStatus({ type: null, status: null, message: '' });
        }, 3000);
      } catch (error) {
        console.error('Error sharing:', error);
        
        // Don't show error for user cancellation
        if (error instanceof Error && error.name !== 'AbortError') {
          setExportStatus({
            type: 'pdf',
            status: 'error',
            message: 'Sharing failed. Please try again.'
          });
          
          setTimeout(() => {
            setExportStatus({ type: null, status: null, message: '' });
          }, 5000);
        }
      }
    } else {
      setExportStatus({
        type: 'pdf',
        status: 'error',
        message: 'Sharing not supported on this device'
      });
      
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 5000);
    }
    
    setShowExportMenu(false);
  };

  const currentSection = sections[activeSection];

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-gray-50 pb-20">
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-3 px-6 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm font-medium">Refreshing content...</span>
        </div>
      )}

      {/* Sticky Navigation Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        {/* Section Tabs */}
        <div className="flex">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => navigateToSection(index)}
              className={`flex-1 flex flex-col items-center justify-center py-4 px-3 min-h-[44px] transition-all duration-200 ${
                index === activeSection
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
              }`}
              style={{ minHeight: '44px', minWidth: '44px', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              <div className={`w-6 h-6 mb-1 ${index === activeSection ? 'text-blue-600' : 'text-gray-500'}`}>
                {section.icon}
              </div>
              <span className="text-xs font-medium leading-tight text-center">
                {section.title}
              </span>
            </button>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-300"
            style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Floating Export Button */}
      <div className="fixed top-20 right-4 z-40">
        <div className="relative">
          <button
            onClick={toggleExportMenu}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Export Resume"
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          >
            <Download className="w-6 h-6" />
          </button>
          
          {/* Export Menu Dropdown */}
          {showExportMenu && (
            <div className="absolute top-14 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-48 animate-fadeIn">
              <div className="text-sm font-medium text-gray-700 mb-2">Export Options:</div>
              <div className="space-y-2">
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF || isExportingWord}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                    isExportingPDF || isExportingWord
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                  {isExportingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span>{isExportingPDF ? 'Exporting...' : 'Export as PDF'}</span>
                </button>
                
                <button
                  onClick={handleExportWord}
                  disabled={isExportingWord || isExportingPDF}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                    isExportingWord || isExportingPDF
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                  {isExportingWord ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span>{isExportingWord ? 'Exporting...' : 'Export as Word'}</span>
                </button>
                
                {navigator.share && (
                  <button
                    onClick={handleShare}
                    disabled={isExportingPDF || isExportingWord}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                      isExportingPDF || isExportingWord
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                )}
              </div>
              
              {/* Export Status Message */}
              {exportStatus.status && (
                <div className={`mt-3 p-2 rounded-lg border text-xs ${
                  exportStatus.status === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center">
                    {exportStatus.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    )}
                    <span>{exportStatus.message}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-24">
        {sections.map((section, index) => (
          <div
            key={section.id}
            id={`section-${index}`}
            className={`transition-all duration-300 ${
              index === activeSection ? 'block' : 'hidden'
            }`}
          >
            {/* Section Header */}
            <div className="bg-white border-b border-gray-200" style={{ margin: '24px', marginBottom: '16px', borderRadius: '12px', padding: '24px' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {section.icon}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900" style={{ fontSize: '20px', lineHeight: '1.2' }}>
                      {section.title}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontSize: '14px' }}>
                      {index === 0 
                        ? 'Your optimized resume with professional formatting'
                        : 'Detailed analysis of improvements and scoring'
                      }
                    </p>
                  </div>
                </div>

                {/* Section Counter */}
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-xs font-medium text-gray-700">
                    {index + 1}/{sections.length}
                  </span>
                </div>
              </div>

              {/* Quick Stats for Analysis Section */}
              {index === 1 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-700">92%</div>
                    <div className="text-xs text-green-600">Score</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-700">+35</div>
                    <div className="text-xs text-blue-600">Improved</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-purple-700">ATS</div>
                    <div className="text-xs text-purple-600">Ready</div>
                  </div>
                </div>
              )}
            </div>

            {/* Section Content */}
            <div style={{ margin: '24px' }}>
              {index === 0 ? (
                // Resume Preview with Collapsible Sections
                <ResumePreviewMobile component={section.component} />
              ) : (
                // Analysis View with Progressive Disclosure
                <AnalysisViewMobile component={section.component} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button - Scroll to Top */}
      {scrollY > 200 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 min-h-[44px] min-w-[44px]"
          style={{ 
            transform: scrollY > 400 ? 'scale(1)' : 'scale(0.9)',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
      
      {/* Export Status Toast (Fixed at bottom) */}
      {exportStatus.status && (
        <div 
          className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 max-w-[90%] animate-fadeIn ${
            exportStatus.status === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center">
            {exportStatus.status === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            <span className="font-medium">{exportStatus.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Resume Preview Component with Collapsible Sections
const ResumePreviewMobile: React.FC<{ component: React.ReactNode }> = ({ component }) => {
  return (
    <div className="space-y-4">
      {/* Resume Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {component}
      </div>
    </div>
  );
};

// Analysis View Component with Progressive Disclosure
const AnalysisViewMobile: React.FC<{ component: React.ReactNode }> = ({ component }) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['overview']));

  const toggleCard = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const analysisCards = [
    { 
      id: 'overview', 
      title: 'Score Overview', 
      icon: <TrendingUp className="w-5 h-5" />,
      summary: 'Your resume improved by 35 points',
      defaultExpanded: true 
    },
    { 
      id: 'strengths', 
      title: 'Key Strengths', 
      icon: <TrendingUp className="w-5 h-5" />,
      summary: '5 areas where you excel',
      defaultExpanded: false 
    },
    { 
      id: 'improvements', 
      title: 'Improvements Made', 
      icon: <TrendingUp className="w-5 h-5" />,
      summary: '8 optimizations applied',
      defaultExpanded: false 
    },
  ];

  return (
    <div className="space-y-4">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="text-2xl font-bold text-green-700">92%</div>
          <div className="text-sm text-green-600 mt-1">Final Score</div>
          <div className="text-xs text-green-500 mt-2">+35 points improved</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">ATS</div>
          <div className="text-sm text-blue-600 mt-1">Optimized</div>
          <div className="text-xs text-blue-500 mt-2">Ready for systems</div>
        </div>
      </div>

      {/* Progressive Disclosure Cards */}
      <div className="space-y-3">
        {analysisCards.map((card) => (
          <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleCard(card.id)}
              className={`w-full flex items-center justify-between p-4 text-left transition-all duration-200 min-h-[44px] ${
                expandedCards.has(card.id) ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600">{card.summary}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                expandedCards.has(card.id) ? 'rotate-180' : ''
              }`} />
            </button>
            
            {expandedCards.has(card.id) && (
              <div className="px-4 pb-4 transition-all duration-200">
                <div className="pt-3 border-t border-gray-100">
                  {card.id === 'overview' && component}
                  {card.id !== 'overview' && (
                    <div className="text-sm text-gray-700 leading-relaxed" style={{ fontSize: '16px', lineHeight: '1.5' }}>
                      Detailed content for {card.title} would appear here with proper spacing and readability.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};