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
import { SubscriptionPlans } from './payment/SubscriptionPlans';
import { SubscriptionStatus } from './payment/SubscriptionStatus';
import { ResumeFlowCarousel } from './ResumeFlowCarousel';

interface MissingSectionsData {
  workExperience?: any[];
  projects?: any[];
  certifications?: string[];
}

export default function ResumeOptimizer() {
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
      const beforeScoreData = generateBeforeScore(data.resumeText);
      setBeforeScore(beforeScoreData);

      // Store current data for use in other functions
      setCurrentUserType(data.userType);
      setCurrentJobDescription(data.jobDescription);
      setCurrentTargetRole(data.targetRole);

      // Optimize resume
      const optimized = await optimizeResume(
        data.resumeText,
        data.jobDescription,
        data.userType,
        data.linkedinUrl,
        data.githubUrl,
        data.targetRole
      );

      // Add additional fields
      optimized.targetRole = data.targetRole;
      optimized.linkedin = data.linkedinUrl;
      optimized.github = data.githubUrl;

      // Check for missing critical sections
      const missing = checkMissingSections(optimized, data.userType);
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
      const changed = getChangedSections(optimized, data.userType);
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

    setOptimizedResume(updatedResume);
    setShowMissingSections(false);

    // Generate after score with complete data
    const afterScoreData = generateAfterScore(JSON.stringify(updatedResume));
    setAfterScore(afterScoreData);

    // Update changed sections
    const changed = getChangedSections(updatedResume, currentUserType);
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
      />

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