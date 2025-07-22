import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Briefcase, 
  User, 
  Users, 
  MapPin, 
  Target, 
  ArrowRight, 
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  Linkedin,
  Github,
  FileText,
  BarChart3,
  Sparkles,
  Zap
} from 'lucide-react';
import { UserType } from '../types/resume';
import { FileUpload } from './FileUpload';

interface RoleEntry {
  id: string;
  jobDescription: string;
  targetRole: string;
  linkedinUrl: string;
  githubUrl: string;
  location: string;
}

interface CarouselData {
  userType: UserType;
  resumeText: string;
  roles: RoleEntry[];
  currentRoleIndex: number;
}

interface ResumeFlowCarouselProps {
  onOptimize: (data: {
    resumeText: string;
    jobDescription: string;
    userType: UserType;
    targetRole: string;
    linkedinUrl: string;
    githubUrl: string;
    location: string;
  }) => void;
  isOptimizing: boolean;
  optimizationError: string | null;
  canOptimize: boolean;
  remainingOptimizations: number;
  onShowSubscriptionPlans: () => void;
  isAuthenticated: boolean;
}

export const ResumeFlowCarousel: React.FC<ResumeFlowCarouselProps> = ({
  onOptimize,
  isOptimizing,
  optimizationError,
  canOptimize,
  remainingOptimizations,
  onShowSubscriptionPlans,
  isAuthenticated
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [animationClass, setAnimationClass] = useState('animate-slideIn');
  const [carouselData, setCarouselData] = useState<CarouselData>({
    userType: 'fresher',
    resumeText: '',
    roles: [],
    currentRoleIndex: 0
  });

  const totalSteps = 5;

  // Initialize with first role when needed
  useEffect(() => {
    if (carouselData.roles.length === 0 && currentStep >= 2) {
      setCarouselData(prev => ({
        ...prev,
        roles: [{
          id: Date.now().toString(),
          jobDescription: '',
          targetRole: '',
          linkedinUrl: '',
          githubUrl: '',
          location: ''
        }]
      }));
    }
  }, [currentStep, carouselData.roles.length]);

  const currentRole = carouselData.roles[carouselData.currentRoleIndex];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return carouselData.resumeText.trim() !== '';
      case 2:
        return currentRole?.jobDescription.trim() !== '';
      case 3:
        return currentRole?.targetRole.trim() !== '';
      case 4:
        return carouselData.roles.length > 0 && carouselData.roles.every(role => 
          role.jobDescription.trim() !== '' && role.targetRole.trim() !== ''
        );
      case 5:
        return carouselData.resumeText.trim() !== '' && carouselData.roles.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    
    if (currentStep < totalSteps) {
      setAnimationClass('animate-slideOutLeft');
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setAnimationClass('animate-slideIn');
      }, 150);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setAnimationClass('animate-slideOutRight');
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setAnimationClass('animate-slideIn');
      }, 150);
    }
  };

  const addNewRole = () => {
    const newRole: RoleEntry = {
      id: Date.now().toString(),
      jobDescription: '',
      targetRole: '',
      linkedinUrl: '',
      githubUrl: '',
      location: ''
    };
    
    setCarouselData(prev => ({
      ...prev,
      roles: [...prev.roles, newRole],
      currentRoleIndex: prev.roles.length
    }));
    
    setCurrentStep(2); // Go to job description step for new role
  };

  const editRole = (index: number) => {
    setCarouselData(prev => ({
      ...prev,
      currentRoleIndex: index
    }));
    setCurrentStep(2);
  };

  const deleteRole = (index: number) => {
    if (carouselData.roles.length <= 1) return; // Keep at least one role
    
    setCarouselData(prev => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index),
      currentRoleIndex: 0
    }));
  };

  const updateCurrentRole = (updates: Partial<RoleEntry>) => {
    setCarouselData(prev => ({
      ...prev,
      roles: prev.roles.map((role, index) => 
        index === prev.currentRoleIndex ? { ...role, ...updates } : role
      )
    }));
  };

  const handleOptimizeClick = () => {
    if (!isAuthenticated) {
      alert('Please sign in to optimize your resume');
      return;
    }

    if (!canOptimize) {
      onShowSubscriptionPlans();
      return;
    }

    // Use the first role for optimization (can be extended for multiple roles)
    const primaryRole = carouselData.roles[0];
    if (primaryRole) {
      onOptimize({
        resumeText: carouselData.resumeText,
        jobDescription: primaryRole.jobDescription,
        userType: carouselData.userType,
        targetRole: primaryRole.targetRole,
        linkedinUrl: primaryRole.linkedinUrl,
        githubUrl: primaryRole.githubUrl,
        location: primaryRole.location
      });
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6 sm:mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
            step <= currentStep 
              ? 'bg-primary-600 text-white' 
              : 'bg-secondary-200 text-secondary-500'
          }`}>
            {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
          </div>
          {step < totalSteps && (
            <div className={`w-8 sm:w-16 h-1 transition-all duration-300 ${
              step < currentStep ? 'bg-primary-600' : 'bg-secondary-200'
            }`}></div>
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-primary-600 to-accent-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">Let's Start with Your Resume</h2>
              <p className="text-secondary-600 mb-6">First, tell us about yourself and upload your resume</p>
            </div>

            {/* User Type Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-600" />
                I am a...
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setCarouselData(prev => ({ ...prev, userType: 'fresher' }))}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    carouselData.userType === 'fresher'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 hover:border-primary-300 text-secondary-700'
                  }`}
                >
                  <Users className="w-8 h-8 mx-auto mb-3" />
                  <div className="font-semibold">Fresher/Graduate</div>
                  <div className="text-sm opacity-75">0-2 years experience</div>
                </button>
                <button
                  onClick={() => setCarouselData(prev => ({ ...prev, userType: 'experienced' }))}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    carouselData.userType === 'experienced'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 hover:border-primary-300 text-secondary-700'
                  }`}
                >
                  <Briefcase className="w-8 h-8 mx-auto mb-3" />
                  <div className="font-semibold">Experienced</div>
                  <div className="text-sm opacity-75">2+ years experience</div>
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Upload Your Resume</h3>
              <FileUpload onFileUpload={(text) => setCarouselData(prev => ({ ...prev, resumeText: text }))} />
              
              {carouselData.resumeText && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Resume uploaded successfully!</span>
                  </div>
                  <div className="text-green-700 text-sm mt-1">
                    {carouselData.resumeText.length} characters loaded
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">Target Job Description</h2>
              <p className="text-secondary-600 mb-6">
                {carouselData.roles.length > 1 
                  ? `Role ${carouselData.currentRoleIndex + 1} of ${carouselData.roles.length}`
                  : 'Paste the job description you want to target'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                Job Description *
              </label>
              <textarea
                value={currentRole?.jobDescription || ''}
                onChange={(e) => updateCurrentRole({ jobDescription: e.target.value })}
                placeholder="Paste the complete job description here. Include requirements, responsibilities, and qualifications for best optimization results..."
                className="w-full h-48 px-4 py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-secondary-900 placeholder-secondary-400 resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-secondary-500">
                  {currentRole?.jobDescription.length || 0} characters
                </div>
                {currentRole?.jobDescription && (
                  <div className="flex items-center text-green-600 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Job details added
                  </div>
                )}
              </div>
            </div>

            {/* Help tip */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-8">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-900 mb-2">💡 Tips for better optimization:</p>
                  <ul className="text-green-800 space-y-1 list-disc list-inside">
                    <li>Include the complete job posting with requirements</li>
                    <li>Make sure to include specific skills and technologies</li>
                    <li>Add qualifications and experience requirements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">Additional Information</h2>
              <p className="text-secondary-600 mb-6">Provide additional details to enhance your resume optimization</p>
            </div>

            <div className="space-y-4">
              {/* Target Role */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Target Role *
                </label>
                <input
                  type="text"
                  value={currentRole?.targetRole || ''}
                  onChange={(e) => updateCurrentRole({ targetRole: e.target.value })}
                  placeholder="e.g., Software Developer, Data Analyst, Frontend Engineer"
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-secondary-900 placeholder-secondary-400"
                />
              </div>

              {/* LinkedIn URL */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Linkedin className="w-4 h-4 inline mr-1" />
                  LinkedIn URL (Optional)
                </label>
                <input
                  type="url"
                  value={currentRole?.linkedinUrl || ''}
                  onChange={(e) => updateCurrentRole({ linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-secondary-900 placeholder-secondary-400"
                />
              </div>

              {/* GitHub URL */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Github className="w-4 h-4 inline mr-1" />
                  GitHub URL (Optional)
                </label>
                <input
                  type="url"
                  value={currentRole?.githubUrl || ''}
                  onChange={(e) => updateCurrentRole({ githubUrl: e.target.value })}
                  placeholder="https://github.com/yourusername"
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-secondary-900 placeholder-secondary-400"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={currentRole?.location || ''}
                  onChange={(e) => updateCurrentRole({ location: e.target.value })}
                  placeholder="City, State, India"
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-secondary-900 placeholder-secondary-400"
                />
              </div>
            </div>

            {/* Required field notice */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-1">Target Role is Required</p>
                  <p>This helps our AI better optimize your resume for the specific position you're targeting.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">Manage Your Roles</h2>
              <p className="text-secondary-600 mb-6">Review, edit, or add more target roles for optimization</p>
            </div>

            {/* Existing Roles */}
            <div className="space-y-4">
              {carouselData.roles.map((role, index) => (
                <div key={role.id} className="border border-secondary-200 rounded-xl p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900 mb-2">
                        {role.targetRole || `Role ${index + 1}`}
                      </h3>
                      <p className="text-sm text-secondary-600 mb-2 line-clamp-2">
                        {role.jobDescription.substring(0, 100)}...
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500">
                        {role.linkedinUrl && <span>LinkedIn ✓</span>}
                        {role.githubUrl && <span>GitHub ✓</span>}
                        {role.location && <span>Location ✓</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => editRole(index)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {carouselData.roles.length > 1 && (
                        <button
                          onClick={() => deleteRole(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Role */}
            <button
              onClick={addNewRole}
              className="w-full border-2 border-dashed border-secondary-300 rounded-xl p-6 text-secondary-600 hover:text-secondary-800 hover:border-secondary-400 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Another Target Role</span>
            </button>

            {/* Info */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Multiple Roles Support</p>
                  <p>You can optimize your resume for multiple positions. The first role will be used for the primary optimization.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">Review & Optimize</h2>
              <p className="text-secondary-600 mb-6">
                {isAuthenticated 
                  ? canOptimize 
                    ? `You have ${remainingOptimizations} optimization${remainingOptimizations !== 1 ? 's' : ''} remaining`
                    : 'You need an active subscription to optimize resumes'
                  : 'Sign in to start optimizing your resume with AI'
                }
              </p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-secondary-900 mb-4">Optimization Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-secondary-600 mb-1">User Type</div>
                  <div className="font-medium capitalize">{carouselData.userType}</div>
                </div>
                <div>
                  <div className="text-sm text-secondary-600 mb-1">Resume Length</div>
                  <div className="font-medium">{carouselData.resumeText.length} characters</div>
                </div>
                <div>
                  <div className="text-sm text-secondary-600 mb-1">Target Roles</div>
                  <div className="font-medium">{carouselData.roles.length} role(s)</div>
                </div>
                <div>
                  <div className="text-sm text-secondary-600 mb-1">Primary Role</div>
                  <div className="font-medium">{carouselData.roles[0]?.targetRole || 'Not specified'}</div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {optimizationError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-medium">{optimizationError}</p>
                </div>
              </div>
            )}

            {/* Optimize Button */}
            <button
              onClick={handleOptimizeClick}
              disabled={isOptimizing || !validateStep(5)}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-3 ${
                isOptimizing || !validateStep(5)
                  ? 'bg-secondary-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl active:scale-[0.98]'
              }`}
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Optimizing Resume...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Optimize My Resume with AI</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {!isAuthenticated && (
              <p className="text-secondary-500 text-sm text-center mt-4">
                Please sign in to start optimizing your resume
              </p>
            )}

            {isAuthenticated && !canOptimize && (
              <button
                onClick={onShowSubscriptionPlans}
                className="w-full mt-4 py-3 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Choose Subscription Plan</span>
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Upload Resume';
      case 2: return 'Job Description';
      case 3: return 'Additional Info';
      case 4: return 'Manage Roles';
      case 5: return 'Review & Optimize';
      default: return '';
    }
  };

  return (
    <div className="container-responsive py-6 lg:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
            AI-Powered Resume Optimizer
          </h1>
          <p className="text-lg text-secondary-600 mb-6">
            Step {currentStep} of {totalSteps}: {getStepTitle()}
          </p>
          
          {/* Step Indicator */}
          {renderStepIndicator()}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 overflow-hidden flex flex-col h-[calc(100vh-300px)] sm:h-auto">
          <div className={`p-6 lg:p-8 ${animationClass} flex-1 overflow-y-auto`}>
            {renderStepContent()}
          </div>

          {/* Navigation Footer */}
          <div className="bg-gray-50 px-6 py-4 lg:px-8 lg:py-6 border-t border-secondary-200 flex justify-between items-center flex-shrink-0">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentStep === 1
                  ? 'text-secondary-400 cursor-not-allowed'
                  : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="text-sm text-secondary-500">
              Step {currentStep} of {totalSteps}
            </div>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  validateStep(currentStep)
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
                    : 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-20"></div> // Spacer for alignment
            )}
          </div>
        </div>
      </div>
    </div>
  );
};