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

  const [userType, setUserType] = useState<UserType>('fresher');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);

  const [showPlans, setShowPlans] = useState(false);
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

  // ✅ [Step 1] User submits input from carousel
  const handleOptimizeResume = async ({
    resumeText,
    jobDescription,
    userType,
    targetRole,
    linkedinUrl,
    githubUrl,
    location
  }: {
    resumeText: string;
    jobDescription: string;
    userType: UserType;
    targetRole: string;
    linkedinUrl: string;
    githubUrl: string;
    location: string;
  }) => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setOptimizationError('Please provide both resume and job description');
      return;
    }

    if (!isAuthenticated) {
      onShowAuthModal();
      return;
    }

    if (!canOptimize) {
      setShowPlans(true);
      return;
    }

    setIsOptimizing(true);
    setOptimizationError(null);

    try {
      const before = generateBeforeScore(resumeText);
      setBeforeScore(before);

      setUserType(userType);
      setJobDescription(jobDescription);
      setTargetRole(targetRole);

      const optimized = await optimizeResume(
        resumeText,
        jobDescription,
        userType,
        linkedinUrl,
        githubUrl,
        targetRole
      );

      optimized.linkedin = linkedinUrl;
      optimized.github = githubUrl;
      optimized.targetRole = targetRole;

      // ✅ [Step 2] Show project analysis modal
      setOptimizedResume(optimized);
      setShowProjectModal(true);
    } catch (err) {
      setOptimizationError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  // ✅ [Step 3] User completes project analysis
  const handleProjectsAnalyzed = (updatedResume: ResumeData) => {
    setShowProjectModal(false);

    const missing = checkMissingSections(updatedResume);
    if (missing.length > 0) {
      setMissingSections(missing);
      setOptimizedResume(updatedResume);
      setShowMissingModal(true); // → Show missing sections modal
    } else {
      finalizeResume(updatedResume); // → All good, finalize directly
    }
  };

  // ✅ [Step 4] Missing sections provided
  const handleMissingSectionsProvided = (data: MissingSectionsData) => {
    if (!optimizedResume) return;

    const updated = {
      ...optimizedResume,
      workExperience: [...(optimizedResume.workExperience || []), ...(data.workExperience || [])],
      projects: [...(optimizedResume.projects || []), ...(data.projects || [])],
      certifications: [...(optimizedResume.certifications || []), ...(data.certifications || [])]
    };

    setShowMissingModal(false);
    finalizeResume(updated);
  };

  // ✅ [Step 5] Final step → set scores and sections
  const finalizeResume = async (resume: ResumeData) => {
    const after = generateAfterScore(JSON.stringify(resume));
    setAfterScore(after);

    const changed = getChangedSections(resume);
    setChangedSections(changed);

    setOptimizedResume(resume);

    if (user) {
      await paymentService.useOptimization(user.id);
      await checkSubscriptionStatus();
    }
  };

  const checkMissingSections = (resume: ResumeData): string[] => {
    const missing: string[] = [];

    if (userType === 'fresher') {
      if (!resume.workExperience?.length) missing.push('workExperience');
      if (!resume.projects?.length) missing.push('projects');
    } else {
      if ((resume.workExperience?.length || 0) < 2) missing.push('workExperience');
      if (!resume.projects?.length) missing.push('projects');
    }

    if (!resume.certifications?.length) missing.push('certifications');
    return missing;
  };

  const getChangedSections = (resume: ResumeData): string[] => {
    const changed: string[] = [];
    if (resume.summary) changed.push('summary');
    if (resume.workExperience?.length) changed.push('workExperience');
    if (resume.projects?.length) changed.push('projects');
    if (resume.skills?.length) changed.push('skills');
    if (resume.certifications?.length) changed.push('certifications');
    if (resume.education?.length) changed.push('education');
    if (userType === 'fresher') {
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
      component: <ResumePreview resumeData={optimizedResume} userType={userType} />,
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
          jobDescription={jobDescription}
          targetRole={targetRole}
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
          <SubscriptionStatus onUpgrade={() => setShowPlans(true)} />
        </div>
      )}

      <ResumeFlowCarousel
        onOptimize={handleOptimizeResume}
        isOptimizing={isOptimizing}
        optimizationError={optimizationError}
        canOptimize={canOptimize}
        remainingOptimizations={remainingOptimizations}
        onShowSubscriptionPlans={() => setShowPlans(true)}
        isAuthenticated={isAuthenticated}
        onShowAuthModal={onShowAuthModal}
      />

      <ProjectAnalysisModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        resumeData={optimizedResume || {} as ResumeData}
        jobDescription={jobDescription}
        targetRole={targetRole}
        onProjectsUpdated={handleProjectsAnalyzed}
      />

      <MissingSectionsModal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
        missingSections={missingSections}
        onSectionsProvided={handleMissingSectionsProvided}
      />

      <SubscriptionPlans
        isOpen={showPlans}
        onClose={() => setShowPlans(false)}
        onSubscriptionSuccess={checkSubscriptionStatus}
      />
    </div>
  );
}
