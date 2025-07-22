import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BarChart3, 
  Upload, 
  Briefcase, 
  User, 
  Users, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ArrowRight,
  Github,
  Linkedin,
  MapPin,
  Target,
  Sparkles,
  Crown,
  Clock,
  Star
} from 'lucide-react';
import { ResumeData, MatchScore, UserType } from '../types/resume';
import { optimizeResume } from '../services/geminiService';
import { getMatchScore, generateBeforeScore, generateAfterScore } from '../services/scoringService';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import { FileUpload } from './FileUpload';
import { InputSection } from './InputSection';
import { ResumePreview } from './ResumePreview';
import { ComprehensiveAnalysis } from './ComprehensiveAnalysis';
import { MobileOptimizedInterface } from './MobileOptimizedInterface';
import { MissingSectionsModal } from './MissingSectionsModal';
import { SubscriptionPlans } from './payment/SubscriptionPlans';
import { SubscriptionStatus } from './payment/SubscriptionStatus';

interface MissingSectionsData {
  workExperience?: any[];
  projects?: any[];
  certifications?: string[];
}

export default function ResumeOptimizer() {
  const { user, isAuthenticated } = useAuth();
  
  // Form states
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [location, setLocation] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [userType, setUserType] = useState<UserType>('fresher');
  
  // Resume states
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [beforeScore, setBeforeScore] = useState<MatchScore | null>(null);
  const [afterScore, setAfterScore] = useState<MatchScore | null>(null);
  const [changedSections, setChangedSections] = useState<string[]>([]);
  
  // UI states
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [showMissingSections, setShowMissingSections] = useState(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [canOptimize, setCanOptimize] = useState(false);
  const [remainingOptimizations, setRemainingOptimizations] = useState(0);
  
  // Check subscription status
  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) {
      setCanOptimize(false);
      setRemainingOptimizations(0);
      return;
    }

    try {
      const result = await paymentService.canOptimize(user.id);
      setCanOptimize(result.canOptimize);
      setRemainingOptimizations(result.remaining);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setCanOptimize(false);
      setRemainingOptimizations(0);
    }
  };

  const handleOptimizeResume = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setOptimizationError('Please provide both resume content and job description');
      return;
    }

    if (!isAuthenticated) {
      setOptimizationError('Please sign in to optimize your resume');
      return;
    }

    if (!canOptimize) {
      setShowSubscriptionPlans(true);
      return;
    }

    setIsOptimizing(true);
    setOptimizationError(null);

    try {
      // Generate before score
      const beforeScoreData = generateBeforeScore(resumeText);
      setBeforeScore(beforeScoreData);

      // Optimize resume
      const optimized = await optimizeResume(
        resumeText, 
        jobDescription, 
        userType,
        linkedinUrl,
        githubUrl,
        targetRole
      );

      // Add additional fields
      optimized.targetRole = targetRole;
      optimized.linkedin = linkedinUrl;
      optimized.github = githubUrl;

      // Check for missing critical sections
      const missing = checkMissingSections(optimized);
      if (missing.length > 0) {
        setMissingSections(missing);
        setOptimizedResume(optimized);
        setShowMissingSections(true);
        return;
      }

      // Generate after score
      const afterScoreData = generateAfterScore(JSON.stringify(optimized));
      setAfterScore(afterScoreData);

      // Determine changed sections
      const changed = getChangedSections(optimized);
      setChangedSections(changed);

      setOptimizedResume(optimized);

      // Use optimization from subscription
      if (user) {
        await paymentService.useOptimization(user.id);
        await checkSubscriptionStatus(); // Refresh subscription status
      }

    } catch (error) {
      console.error('Optimization error:', error);
      setOptimizationError(error instanceof Error ? error.message : 'Optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const checkMissingSections = (resumeData: ResumeData): string[] => {
    const missing: string[] = [];
    
    if (userType === 'fresher') {
      // For freshers, check for work experience (internships) and projects
      if (!resumeData.workExperience || resumeData.workExperience.length === 0) {
        missing.push('workExperience');
      }
      if (!resumeData.projects || resumeData.projects.length === 0) {
        missing.push('projects');
      }
    } else {
      // For experienced professionals
      if (!resumeData.workExperience || resumeData.workExperience.length < 2) {
        missing.push('workExperience');
      }
      if (!resumeData.projects || resumeData.projects.length === 0) {
        missing.push('projects');
      }
    }
    
    if (!resumeData.certifications || resumeData.certifications.length === 0) {
      missing.push('certifications');
    }
    
    return missing;
  };

  const getChangedSections = (resumeData: ResumeData): string[] => {
    const sections: string[] = [];
    
    if (resumeData.summary) sections.push('summary');
    if (resumeData.workExperience?.length) sections.push('workExperience');
    if (resumeData.projects?.length) sections.push('projects');
    if (resumeData.skills?.length) sections.push('skills');
    if (resumeData.certifications?.length) sections.push('certifications');
    if (resumeData.education?.length) sections.push('education');
    
    if (userType === 'fresher') {
      if (resumeData.achievements?.length) sections.push('achievements');
      if (resumeData.extraCurricularActivities?.length) sections.push('extraCurricularActivities');
      if (resumeData.languagesKnown?.length) sections.push('languagesKnown');
      if (resumeData.personalDetails) sections.push('personalDetails');
    }
    
    return sections;
  };

  const handleMissingSectionsProvided = async (data: MissingSectionsData) => {
    if (!optimizedResume) return;

    // Merge missing sections data with optimized resume
    const updatedResume = {
      ...optimizedResume,
      workExperience: [
        ...(optimizedResume.workExperience || []),
        ...(data.workExperience || [])
      ],
      projects: [
        ...(optimizedResume.projects || []),
        ...(data.projects || [])
      ],
      certifications: [
        ...(optimizedResume.certifications || []),
        ...(data.certifications || [])
      ]
    };

    setOptimizedResume(updatedResume);
    setShowMissingSections(false);

    // Generate after score with complete data
    const afterScoreData = generateAfterScore(JSON.stringify(updatedResume));
    setAfterScore(afterScoreData);

    // Update changed sections
    const changed = getChangedSections(updatedResume);
    setChangedSections(changed);
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionPlans(false);
    checkSubscriptionStatus();
  };

  // Prepare sections for MobileOptimizedInterface
  const sections = [];

  // Always include preview section if we have optimized resume
  if (optimizedResume) {
    sections.push({
      id: 'preview',
      title: 'Preview',
      icon: <FileText className="w-5 h-5" />,
      component: <ResumePreview resumeData={optimizedResume} userType={userType} />,
      resumeData: optimizedResume,
    });
  }

  // Add score section if we have both scores
  if (beforeScore && afterScore && optimizedResume) {
    sections.push({
      id: 'analysis',
      title: 'Analysis',
      icon: <BarChart3 className="w-5 h-5" />,
      component: (
        <ComprehensiveAnalysis
          beforeScore={beforeScore}
          afterScore={afterScore}
          changedSections={changedSections}
          resumeData={optimizedResume}
          jobDescription={jobDescription}
          targetRole={targetRole}
        />
      ),
      resumeData: optimizedResume,
    });
  }

  // If we have sections to show, render MobileOptimizedInterface
  if (sections.length > 0) {
    return <MobileOptimizedInterface sections={sections} />;
  }

  // Otherwise, render the main form
  return (
    <div className="container-responsive py-6 lg:py-12">
      {/* Header */}
      <div className="text-center mb-8 lg:mb-12">
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-lg">
          <Sparkles className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
        </div>
        <h1 className="text-fluid-3xl lg:text-fluid-4xl font-bold text-secondary-900 mb-4">
          AI-Powered Resume Optimizer
        </h1>
        <p className="text-fluid-lg text-secondary-600 max-w-3xl mx-auto leading-relaxed">
          Transform your resume with AI to match job requirements and pass ATS systems
        </p>
      </div>

      {/* Subscription Status */}
      {isAuthenticated && (
        <div className="mb-8">
          <SubscriptionStatus onUpgrade={() => setShowSubscriptionPlans(true)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* Left Column - Input */}
        <div className="space-y-6 lg:space-y-8">
          {/* User Type Selection */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-fluid-lg font-semibold text-secondary-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary-600" />
              I am a...
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setUserType('fresher')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  userType === 'fresher'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-200 hover:border-primary-300 text-secondary-700'
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Fresher/Graduate</div>
                <div className="text-xs opacity-75">0-2 years experience</div>
              </button>
              <button
                onClick={() => setUserType('experienced')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  userType === 'experienced'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-200 hover:border-primary-300 text-secondary-700'
                }`}
              >
                <Briefcase className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Experienced</div>
                <div className="text-xs opacity-75">2+ years experience</div>
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-fluid-lg font-semibold text-secondary-900 mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-primary-600" />
              Upload Resume
            </h3>
            <FileUpload onFileUpload={setResumeText} />
          </div>

          {/* Input Section */}
          <div className="card p-4 sm:p-6">
            <InputSection
              resumeText={resumeText}
              jobDescription={jobDescription}
              onResumeChange={setResumeText}
              onJobDescriptionChange={setJobDescription}
            />
          </div>

          {/* Additional Information */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-fluid-lg font-semibold text-secondary-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-600" />
              Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Target Role (Optional)
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Software Developer, Data Analyst"
                  className="input-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Linkedin className="w-4 h-4 inline mr-1" />
                    LinkedIn URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Github className="w-4 h-4 inline mr-1" />
                    GitHub URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State, India"
                  className="input-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Action */}
        <div className="space-y-6 lg:space-y-8">
          {/* Optimization Button */}
          <div className="card p-6 lg:p-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-100 to-primary-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="text-fluid-xl font-bold text-secondary-900 mb-4">
                Ready to Optimize?
              </h3>
              <p className="text-secondary-600 mb-6 leading-relaxed">
                {isAuthenticated 
                  ? canOptimize 
                    ? `You have ${remainingOptimizations} optimization${remainingOptimizations !== 1 ? 's' : ''} remaining`
                    : 'You need an active subscription to optimize resumes'
                  : 'Sign in to start optimizing your resume with AI'
                }
              </p>

              {optimizationError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-medium">{optimizationError}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleOptimizeResume}
                disabled={isOptimizing || !resumeText.trim() || !jobDescription.trim()}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-3 ${
                  isOptimizing || !resumeText.trim() || !jobDescription.trim()
                    ? 'bg-secondary-400 cursor-not-allowed'
                    : 'btn-primary shadow-lg hover:shadow-xl active:scale-[0.98]'
                }`}
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Optimizing Resume...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Optimize My Resume</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {!isAuthenticated && (
                <p className="text-secondary-500 text-sm mt-4">
                  Please sign in to start optimizing your resume
                </p>
              )}

              {isAuthenticated && !canOptimize && (
                <button
                  onClick={() => setShowSubscriptionPlans(true)}
                  className="w-full mt-4 py-3 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Crown className="w-5 h-5" />
                  <span>Choose Subscription Plan</span>
                </button>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="card p-6">
            <h3 className="text-fluid-lg font-semibold text-secondary-900 mb-4">
              ✨ What You Get
            </h3>
            <ul className="space-y-3">
              {[
                'ATS-friendly formatting',
                'Keyword optimization',
                'Professional structure',
                'Industry-specific content',
                'Quantified achievements',
                'Multiple export formats'
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-secondary-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Highlight */}
          <div className="card p-6 bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <h3 className="text-fluid-lg font-semibold text-secondary-900">
                  Affordable Pricing
                </h3>
              </div>
              <p className="text-secondary-700 mb-4">
                Starting at just ₹19/hour - India's most affordable AI resume optimizer
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-primary-600 mr-1" />
                  <span>1 Hour: ₹19</span>
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-green-600 mr-1" />
                  <span>1 Week: ₹129</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MissingSectionsModal
        isOpen={showMissingSections}
        onClose={() => setShowMissingSections(false)}
        missingSections={missingSections}
        onSectionsProvided={handleMissingSectionsProvided}
      />

      <SubscriptionPlans
        isOpen={showSubscriptionPlans}
        onClose={() => setShowSubscriptionPlans(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
}