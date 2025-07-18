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
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-blue-400 bg-blue-50 scale-105'
            : uploadedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-lg font-medium text-gray-900 mb-2">Processing your file...</p>
            <p className="text-sm text-gray-600">Please wait while we extract the content</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-green-900 mb-2">File uploaded successfully!</p>
            <p className="text-sm text-green-700 mb-4">{uploadedFile}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Remove file</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`p-4 rounded-full mb-4 transition-colors ${
              isDragging ? 'bg-blue-200' : 'bg-gray-200'
            }`}>
              <Upload className={`w-8 h-8 transition-colors ${
                isDragging ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragging ? 'Drop your file here' : 'Upload your resume'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
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
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-2">Supported file formats:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-blue-800">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>PDF files (.pdf)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Word documents (.docx)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>Text files (.txt)</span>
              </div>
            </div>
            <p className="text-blue-700 mt-2 text-xs">
              Maximum file size: 10MB. For best results, ensure your resume is well-formatted and readable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};