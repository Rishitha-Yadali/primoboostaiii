import React, { useState, useEffect } from 'react';
import { FileText, BarChart3 } from 'lucide-react';
import { ResumeData, MatchScore, UserType } from '../types/resume';
import { optimizeResume } from '../services/geminiService';
import { generateBeforeScore, generateAfterScore } from '../services/scoringService';
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

interface ResumeOptimizerProps {
  onShowAuthModal: () => void;
}

interface MissingSectionsData {
  workExperience?: any[];
  projects?: any[];
  certifications?: string[];
}

export default function ResumeOptimizer({ onShowAuthModal }: ResumeOptimizerProps) {
  const { user, isAuthenticated } = useAuth();

  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [beforeScore, setBeforeScore] = useState<MatchScore | null>(null);
  const [afterScore, setAfterScore] = useState<MatchScore | null>(null);
  const [changedSections, setChangedSections] = useState<string[]>([]);

  const [currentUserType, setCurrentUserType] = useState<UserType>('fresher');
  const [currentJobDescription, setCurrentJobDescription] = useState('');
  const [currentTargetRole, setCurrentTargetRole] = useState('');

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
  const [showMissingSections, setShowMissingSections] = useState(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [canOptimize, setCanOptimize] = useState(false);
  const [remainingOptimizations, setRemainingOptimizations] = useState(0);

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
    } catch {
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
      const before = generateBeforeScore(data.resumeText);
      setBeforeScore(before);

      setCurrentUserType(data.userType);
      setCurrentJobDescription(data.jobDescription);
      setCurrentTargetRole(data.targetRole);

      const optimized = await optimizeResume(
        data.resumeText,
        data.jobDescription,
        data.userType,
        data.linkedinUrl,
        data.githubUrl,
        data.targetRole
      );

      optimized.targetRole = data.targetRole;
      optimized.linkedin = data.linkedinUrl;
      optimized.github = data.githubUrl;

      setOptimizedResume(optimized);
      setShowProjectAnalysis(true); // Step 1: open project modal
    } catch (err) {
      setOptimizationError(
        err instanceof Error ? err.message : 'Optimization failed. Please try again.'
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleProjectsAnalyzed = (resumeWithProjects: ResumeData) => {
    setShowProjectAnalysis(false);
    const missing = checkMissingSections(resumeWithProjects, currentUserType);

    if (missing.length > 0) {
      setMissingSections(missing);
      setOptimizedResume(resumeWithProjects);
      setShowMissingSections(true); // Step 2: open missing modal
    } else {
      finalizeOptimization(resumeWithProjects);
    }
  };

  const handleMissingSectionsProvided = (data: MissingSectionsData) => {
    if (!optimizedResume) return;
    const updated = {
      ...optimizedResume,
      workExperience: [...(optimizedResume.workExperience || []), ...(data.workExperience || [])],
      projects: [...(optimizedResume.projects || []), ...(data.projects || [])],
      certifications: [...(optimizedResume.certifications || []), ...(data.certifications || [])],
    };
    setShowMissingSections(false);
    finalizeOptimization(updated); // Step 3: finalize
  };

  const finalizeOptimization = async (finalResume: ResumeData) => {
    const after = generateAfterScore(JSON.stringify(finalResume));
    setAfterScore(after);

    const changed = getChangedSections(finalResume, currentUserType);
    setChangedSections(changed);

    setOptimizedResume(finalResume);

    if (user) {
      await paymentService.useOptimization(user.id);
      await checkSubscriptionStatus();
    }
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionPlans(false);
    checkSubscriptionStatus();
  };

  const checkMissingSections = (resume: ResumeData, type: UserType): string[] => {
    const missing: string[] = [];

    if (type === 'fresher') {
      if (!resume.workExperience?.length) missing.push('workExperience');
      if (!resume.projects?.length) missing.push('projects');
    } else {
      if ((resume.workExperience?.length || 0) < 2) missing.push('workExperience');
      if (!resume.projects?.length) missing.push('projects');
    }

    if (!resume.certifications?.length) missing.push('certifications');
    return missing;
  };

  const getChangedSections = (resume: ResumeData, type: UserType): string[] => {
    const changed: string[] = [];
    if (resume.summary) changed.push('summary');
    if (resume.workExperience?.length) changed.push('workExperience');
    if (resume.projects?.length) changed.push('projects');
    if (resume.skills?.length) changed.push('skills');
    if (resume.certifications?.length) changed.push('certifications');
    if (resume.education?.length) changed.push('education');
    if (type === 'fresher') {
      if (resume.achievements?.length) changed.push('achievements');
      if (resume.extraCurricularActivities?.length) changed.push('extraCurricularActivities');
      if (resume.languagesKnown?.length) changed.push('languagesKnown');
      if (resume.personalDetails) changed.push('personalDetails');
    }
    return changed;
  };

  const sections = [];

  if (optimizedResume) {
    sections.push({
      id: 'preview',
      title: 'Preview',
      icon: <FileText className="w-5 h-5" />,
      component: <ResumePreview resumeData={optimizedResume} userType={currentUserType} />,
      resumeData: optimizedResume,
    });
  }

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

  if (sections.length > 0) return <MobileOptimizedInterface sections={sections} />;

  return (
    <div>
      {isAuthenticated && (
        <div className="container-responsive py-6">
          <SubscriptionStatus onUpgrade={() => setShowSubscriptionPlans(true)} />
        </div>
      )}

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
