import React, { useState, useEffect } from 'react';
import { FileText, BarChart3 } from 'lucide-react';
import { ResumeData, MatchScore, UserType } from '../types/resume';
import { optimizeResume } from '../services/geminiService';
import { getMatchScore, generateBeforeScore, generateAfterScore } from '../services/scoringService';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import { ResumePreview } from './ResumePreview';
import { ComprehensiveAnalysis } from './ComprehensiveAnalysis';
import { MobileOptimizedInterface } from './MobileOptimizedInterface';
import { MissingSectionsModal } from './MissingSectionsModal';
import { ProjectAnalysisModal } from './ProjectAnalysisModal';
import { SubscriptionPlans } from './payment/SubscriptionPlans';
import { SubscriptionStatus } from './payment/SubscriptionStatus';
import { ResumeFlowCarousel } from './ResumeFlowCarousel';

interface MissingSectionsData {
  workExperience?: any[];
  projects?: any[];
  certifications?: string[];
}

export default function ResumeOptimizer({ onShowAuthModal }: ResumeOptimizerProps) {
  const { user, isAuthenticated } = useAuth();
  
  // Resume states
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [beforeScore, setBeforeScore] = useState<MatchScore | null>(null);
  const [afterScore, setAfterScore] = useState<MatchScore | null>(null);
  const [changedSections, setChangedSections] = useState<string[]>([]);
  const [currentUserType, setCurrentUserType] = useState<UserType>('fresher');
  const [currentJobDescription, setCurrentJobDescription] = useState('');
  const [currentTargetRole, setCurrentTargetRole] = useState('');
  
  // UI states
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
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

  const processPostOptimizationSteps = async (resumeData: ResumeData) => {
    try {
      // Check for missing critical sections
      const missing = checkMissingSections(resumeData, currentUserType);
      console.log('Missing sections detected by checkMissingSections:', missing);
      
      if (missing.length > 0) {
        setMissingSections(missing);
        setOptimizedResume(resumeData);
        setShowMissingSections(true);
        console.log('Missing sections found, setting state to show modal.');
        return;
      }

      // Generate after score
      const afterScoreData = generateAfterScore(JSON.stringify(resumeData));
      setAfterScore(afterScoreData);

      // Determine changed sections
      const changed = getChangedSections(resumeData, currentUserType);
      setChangedSections(changed);

      setOptimizedResume(resumeData);
      console.log('No missing sections, setting optimized resume and proceeding to analysis view.');

      // Use optimization from subscription
      if (user) {
        await paymentService.useOptimization(user.id);
        await checkSubscriptionStatus(); // Refresh subscription status
      }
    } catch (error) {
      console.error('Error in post-optimization steps:', error);
      setOptimizationError(error instanceof Error ? error.message : 'Post-optimization processing failed.');
    }
  };

  const handleOptimizeResume = async (data: {
    resumeText: string;
    jobDescription: string;
    userType: UserType;
    targetRole: string;
    linkedinUrl: string;
    githubUrl: string;
    location: string;
  }) => {
    if (!data.resumeText.trim() || !data.jobDescription.trim()) {
      setOptimizationError('Please provide both resume content and job description');
      return;
    }

    if (!isAuthenticated) {
      onShowAuthModal();
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
      const beforeScoreData = generateBeforeScore(data.resumeText);
      setBeforeScore(beforeScoreData);

      // Store current data for use in other functions
      setCurrentUserType(data.userType);
      setCurrentJobDescription(data.jobDescription);
      setCurrentTargetRole(data.targetRole);

      // Optimize resume
      console.log('Calling optimizeResume with data:', data);
      const optimized = await optimizeResume(
        data.resumeText,
        data.jobDescription,
        data.userType,
        data.linkedinUrl,
        data.githubUrl,
        data.targetRole
      );
      console.log('Optimized resume received from API:', optimized);

      // Add additional fields
      optimized.targetRole = data.targetRole;
      optimized.linkedin = data.linkedinUrl;
      optimized.github = data.githubUrl;

      // Store the optimized resume and trigger project analysis
      setOptimizedResume(optimized);
      setShowProjectAnalysis(true);
      console.log('Initial optimization complete, triggering project analysis modal.');

    } catch (error) {
      console.error('Optimization error:', error);
      setOptimizationError(error instanceof Error ? error.message : 'Optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleProjectsAnalyzed = (updatedResume: ResumeData) => {
    console.log('Projects analyzed, received updated resume:', updatedResume);
    setShowProjectAnalysis(false);
    // Continue with the post-optimization flow using the updated resume
    processPostOptimizationSteps(updatedResume);
  };

  const checkMissingSections = (resumeData: ResumeData, userType: UserType): string[] => {
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

  const getChangedSections = (resumeData: ResumeData, userType: UserType): string[] => {
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

    setShowMissingSections(false);
    console.log('Missing sections provided, continuing with updated resume:', updatedResume);
    
    // Continue with the post-optimization flow using the updated resume
    await processPostOptimizationSteps(updatedResume);
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
      component: <ResumePreview resumeData={optimizedResume} userType={currentUserType} />,
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
          jobDescription={currentJobDescription}
          targetRole={currentTargetRole}
        />
      ),
      resumeData: optimizedResume,
    });
  }

  console.log('Current sections array for MobileOptimizedInterface:', sections);

  // If we have sections to show, render MobileOptimizedInterface
  if (sections.length > 0) {
    return <MobileOptimizedInterface sections={sections} />;
  }

  // Otherwise, render the carousel input flow
  return (
    <div>
      {/* Subscription Status */}
      {isAuthenticated && (
        <div className="container-responsive py-6">
          <SubscriptionStatus onUpgrade={() => setShowSubscriptionPlans(true)} />
        </div>
      )}

      {/* Carousel Input Flow */}
      <ResumeFlowCarousel
        onOptimize={handleOptimizeResume}
        isOptimizing={isOptimizing}
        optimizationError={optimizationError}
        canOptimize={canOptimize}
        remainingOptimizations={remainingOptimizations}
        onShowSubscriptionPlans={() => setShowSubscriptionPlans(true)}
        isAuthenticated={isAuthenticated}
        onShowAuthModal={onShowAuthModal}
      />

      {/* Modals */}
      <ProjectAnalysisModal
        isOpen={showProjectAnalysis}
        onClose={() => setShowProjectAnalysis(false)}
        resumeData={optimizedResume || {} as ResumeData}
        jobDescription={currentJobDescription}
        targetRole={currentTargetRole}
        onProjectsUpdated={handleProjectsAnalyzed}
      />

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