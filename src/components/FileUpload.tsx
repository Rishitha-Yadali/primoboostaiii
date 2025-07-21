import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { parseFile } from '../utils/fileParser';

interface FileUploadProps {
  onFileUpload: (text: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    try {
      const text = await parseFile(file);
      onFileUpload(text);
      setUploadedFile(file.name);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error parsing file. Please try a different format or check if the file is corrupted.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files[0];
    if (!file) return;

    await processFile(file);
  };

  const clearFile = () => {
    setUploadedFile(null);
    onFileUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-primary-400 bg-primary-50 scale-105'
            : uploadedFile
            ? 'border-green-400 bg-green-50'
            : 'border-secondary-300 bg-secondary-50 hover:border-primary-400 hover:bg-primary-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="spinner h-10 w-10 sm:h-12 sm:w-12 mb-4"></div>
            <p className="text-fluid-lg font-medium text-secondary-900 mb-2">Processing your file...</p>
            <p className="text-fluid-sm text-secondary-600">Please wait while we extract the content</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-fluid-lg font-medium text-green-900 mb-2">File uploaded successfully!</p>
            <p className="text-fluid-sm text-green-700 mb-4 text-truncate-1">{uploadedFile}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium text-fluid-sm transition-colors min-h-touch px-2"
            >
              <X className="w-4 h-4" />
              <span>Remove file</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`p-3 sm:p-4 rounded-full mb-4 transition-colors ${
              isDragging ? 'bg-blue-200' : 'bg-gray-200'
            }`}>
              <Upload className={`w-6 h-6 sm:w-8 sm:h-8 transition-colors ${
                isDragging ? 'text-primary-600' : 'text-secondary-400'
              }`} />
            </div>
            <p className="text-fluid-lg font-medium text-secondary-900 mb-2">
              {isDragging ? 'Drop your file here' : 'Upload your resume'}
            </p>
            <p className="text-fluid-sm text-secondary-600 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <div className="flex items-center space-x-2 text-fluid-xs text-secondary-500">
              <FileText className="w-4 h-4" />
              <span>Supports PDF, DOCX, and TXT files</span>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* File Format Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
          <div className="text-fluid-sm">
            <p className="font-medium text-primary-900 mb-2">Supported file formats:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-primary-800">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>PDF files (.pdf)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span>Word documents (.docx)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                <span>Text files (.txt)</span>
              </div>
            </div>
            <p className="text-primary-700 mt-2 text-fluid-xs">
              Maximum file size: 10MB. For best results, ensure your resume is well-formatted and readable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};