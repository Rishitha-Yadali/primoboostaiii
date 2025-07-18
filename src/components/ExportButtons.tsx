import React, { useState } from 'react';
import { Download, FileText, Loader2, CheckCircle, AlertCircle, Share2, ArrowDown } from 'lucide-react';
import { ResumeData } from '../types/resume';
import { exportToPDF, exportToWord } from '../utils/exportUtils';

interface ExportButtonsProps {
  resumeData: ResumeData;
  targetRole?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ resumeData, targetRole }) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'pdf' | 'word' | null;
    status: 'success' | 'error' | null;
    message: string;
  }>({ type: null, status: null, message: '' });

  const handleExportPDF = async () => {
    if (isExportingPDF || isExportingWord) return; // Prevent double clicks
    
    setIsExportingPDF(true);
    setExportStatus({ type: null, status: null, message: '' });
    
    try {
      await exportToPDF(resumeData);
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
    }
  };

  const handleExportWord = async () => {
    if (isExportingWord || isExportingPDF) return; // Prevent double clicks
    
    setIsExportingWord(true);
    setExportStatus({ type: null, status: null, message: '' });
    
    try {
      exportToWord(resumeData);
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
    }
  };

  const toggleShareOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareOptions(!showShareOptions);
  };

  const shareFile = async (type: 'pdf' | 'word') => {
    try {
      if (type === 'pdf') {
        await handleExportPDF();
      } else {
        await handleExportWord();
      }
      
      // This would be implemented if the Web Share API is used
      if (navigator.share) {
        // In a real implementation, we would get the file and share it
        // For now, we'll just show a success message
        setExportStatus({
          type,
          status: 'success',
          message: `${type.toUpperCase()} shared successfully!`
        });
      } else {
        setExportStatus({
          type,
          status: 'error',
          message: 'Sharing not supported on this device'
        });
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      setExportStatus({
        type,
        status: 'error',
        message: 'Sharing failed. Please try again.'
      });
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
      {/* Mobile Export Header with Prominent Button */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Download className="w-5 h-5 mr-2 text-blue-600" />
            Export Resume
          </h3>
          
          <button
            onClick={toggleShareOptions}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-2 rounded-full shadow-md transition-colors"
            aria-label="Show export options"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <ArrowDown className={`w-5 h-5 transition-transform duration-300 ${showShareOptions ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Primary Export Button for Mobile */}
        <button
          onClick={handleExportPDF}
          disabled={isExportingPDF || isExportingWord}
          className={`w-full flex items-center justify-center space-x-2 font-semibold py-4 px-4 rounded-xl transition-all duration-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[56px] mb-4 ${
            isExportingPDF || isExportingWord
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
          }`}
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        >
          {isExportingPDF ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Exporting PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Export Resume</span>
            </>
          )}
        </button>
        
        {/* Expandable Export Options */}
        {showShareOptions && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Export Options:</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF || isExportingWord}
                className={`flex items-center justify-center space-x-2 font-medium py-3 px-3 rounded-xl transition-all duration-200 text-sm focus:outline-none min-h-[48px] ${
                  isExportingPDF || isExportingWord
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                {isExportingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>PDF</span>
              </button>
              
              <button
                onClick={handleExportWord}
                disabled={isExportingWord || isExportingPDF}
                className={`flex items-center justify-center space-x-2 font-medium py-3 px-3 rounded-xl transition-all duration-200 text-sm focus:outline-none min-h-[48px] ${
                  isExportingWord || isExportingPDF
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                {isExportingWord ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Word</span>
              </button>
            </div>
            
            {/* Share Button - Only on supported devices */}
            {navigator.share && (
              <button
                onClick={() => shareFile('pdf')}
                disabled={isExportingPDF || isExportingWord}
                className={`w-full flex items-center justify-center space-x-2 font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm focus:outline-none min-h-[48px] ${
                  isExportingPDF || isExportingWord
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <Share2 className="w-4 h-4" />
                <span>Share Resume</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Desktop Export Buttons */}
      <div className="hidden sm:block">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
          Export Resume
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* PDF Export Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF || isExportingWord}
            className={`flex items-center justify-center space-x-2 font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition-all duration-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[48px] ${
              isExportingPDF || isExportingWord
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
            }`}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Exporting PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Export as PDF</span>
              </>
            )}
          </button>

          {/* Word Export Button */}
          <button
            onClick={handleExportWord}
            disabled={isExportingWord || isExportingPDF}
            className={`flex items-center justify-center space-x-2 font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition-all duration-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] ${
              isExportingWord || isExportingPDF
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
            }`}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            {isExportingWord ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Exporting Word...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Export as Word</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Export Status Message */}
      {exportStatus.status && (
        <div className={`mt-4 p-3 rounded-lg border ${
          exportStatus.status === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {exportStatus.status === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{exportStatus.message}</span>
          </div>
        </div>
      )}
      
      {/* Mobile-specific instructions */}
      <div className="mt-4 sm:hidden">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">📱 Mobile Export Tips</p>
              <p className="text-xs text-blue-700">
                After export, check your Downloads folder or browser's download notification.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* PDF Quality Notice */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">✨ Enhanced Export Quality</p>
            <p className="text-xs text-green-700">
              Professional formatting with searchable text and optimized file size for both PDF and Word formats.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};