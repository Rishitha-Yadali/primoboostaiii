import React from 'react';
import { FileText, Briefcase, AlertCircle, X } from 'lucide-react';

interface InputSectionProps {
  resumeText: string;
  jobDescription: string;
  onResumeChange: (value: string) => void;
  onJobDescriptionChange: (value: string) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  resumeText,
  jobDescription,
  onResumeChange,
  onJobDescriptionChange,
}) => {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Resume Text Section */}
      <div className="relative">
        <div className="flex items-center mb-3">
          <FileText className="w-5 h-5 mr-2 text-primary-600" />
          <h3 className="text-fluid-lg font-semibold text-secondary-900">Resume Content</h3>
          <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-fluid-xs rounded-full font-medium">
            Required
          </span>
        </div>
        <textarea
          value={resumeText}
          onChange={(e) => onResumeChange(e.target.value)}
          placeholder="Your resume content will appear here after uploading a file, or you can type/paste it directly..."
          className="input-base h-32 sm:h-40 lg:h-48 resize-none bg-secondary-50 focus:bg-white text-fluid-base"
        />
        <div className="flex justify-between items-center mt-2">
          <div className="text-fluid-xs text-secondary-500">
            {resumeText.length} characters
          </div>
          {resumeText.length > 0 && (
            <div className="flex items-center text-green-600 text-fluid-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Content loaded
            </div>
          )}
        </div>
      </div>

      {/* Job Description Section */}
      <div className="relative">
        <div className="flex items-center mb-3">
          <Briefcase className="w-5 h-5 mr-2 text-green-600" />
          <h3 className="text-fluid-lg font-semibold text-secondary-900">Target Job Description</h3>
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-fluid-xs rounded-full font-medium">
            Required
          </span>
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste the complete job description here. Include requirements, responsibilities, and preferred qualifications for best optimization results..."
          className="input-base h-32 sm:h-40 lg:h-48 resize-none bg-secondary-50 focus:bg-white focus:ring-green-500 focus:border-green-500 text-fluid-base"
        />
        <div className="flex justify-between items-center mt-2">
          <div className="text-fluid-xs text-secondary-500">
            {jobDescription.length} characters
          </div>
          {jobDescription.length > 0 && (
            <div className="flex items-center text-green-600 text-fluid-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Job details added
            </div>
          )}
        </div>
      </div>

      {/* Help Tips */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
          <div className="text-fluid-sm">
            <p className="font-medium text-primary-900 mb-2">💡 Tips for better optimization:</p>
            <ul className="text-primary-800 space-y-1 list-disc list-inside">
              <li>Include the complete job posting with requirements and responsibilities</li>
              <li>Make sure your resume content is comprehensive and up-to-date</li>
              <li className="hidden lg:list-item">The more detailed the job description, the better the optimization</li>
              <li className="hidden lg:list-item">Include specific skills, technologies, and qualifications mentioned in the job</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};