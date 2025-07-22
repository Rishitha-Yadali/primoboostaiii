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
import { ProjectAnalysisModal } from './ProjectAnalysisModal'; // Keep if you still need ProjectAnalysisModal
import { SubscriptionPlans } from './payment/SubscriptionPlans';
import { SubscriptionStatus } from './payment/SubscriptionStatus';
import { ResumeFlowCarousel } from './ResumeFlowCarousel'; // Import ResumeFlowCarousel

interface MissingSectionsData {
  workExperience?: any[];
  projects?: any[];
  certifications?: string[];
}

interface ResumeOptimizerProps {
  onShowAuthModal: () => void;
}

export default function ResumeOptimizer({ onShowAuthModal }: ResumeOptimizerProps) {
  const { user, isAuthenticated } = useAuth();

  // Removed local state for input fields as they will come from ResumeFlowCarousel
  // const [resumeText, setResumeText] = useState('');
  // const [jobDescription, setJobDescription] = useState('');
  // const [linkedinUrl, setLinkedinUrl] = useState('');
  // const [githubUrl, setGithubUrl] = useState('');
  // const [location, setLocation] = useState('');
  // const [targetRole, setTargetRole] = useState('');
  // const [userType, setUserType] = useState<UserType>('fresher');

  // Resume processing states
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [beforeScore, setBeforeScore] = useState<MatchScore | null>(null);
  const [afterScore, setAfterScore] = useState<MatchScore | null>(null);
  const [changedSections, setChangedSections] = useState<string[]>([]);

  // States to hold data received from carousel for consistent display in analysis
  const [currentUserType, setCurrentUserType] = useState<UserType>('fresher');
  const [currentJobDescription, setCurrentJobDescription] = useState('');
  const [currentTargetRole, setCurrentTargetRole] = useState('');

  // UI interaction and status states
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [showMissingSections, setShowMissingSections] = useState(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [canOptimize, setCanOptimize] = useState(false);
  const [remainingOptimizations, setRemainingOptimizations] = useState(0);

  // Keeping ProjectAnalysisModal states as per the existing code
  const [showProjectModal, setShowProjectModal] = useState(false);


  // Effect to check subscription status when user changes
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

  // Modified handleOptimizeResume signature to accept data object from ResumeFlowCarousel
  const handleOptimizeResume = async (data: {
    resumeText: string;
    jobDescription: string;
    userType: UserType;
    targetRole: string;
    linkedinUrl: string;
    githubUrl: string;
    location: string;
  }) => {
    // Basic input validation
    if (!data.resumeText.trim() || !data.jobDescription.trim()) {
      setOptimizationError('Please provide both resume content and job description.');
      return;
    }

    // Authentication check
    if (!isAuthenticated) {
      onShowAuthModal(); // Call the prop directly
      return;
    }

    // Subscription check
    if (!canOptimize) {
      setShowSubscriptionPlans(true);
      return;
    }

    setIsOptimizing(true);
    setOptimizationError(null); // Clear previous errors

    try {
      // Store current data for use in other functions (like analysis and modals)
      setCurrentUserType(data.userType);
      setCurrentJobDescription(data.jobDescription);
      setCurrentTargetRole(data.targetRole);

      // 1. Generate before score based on raw resume text
      const beforeScoreData = generateBeforeScore(data.resumeText);
      setBeforeScore(beforeScoreData);

      // 2. Call the AI optimization service
      const optimized = await optimizeResume(
        data.resumeText,
        data.jobDescription,
        data.userType,
        data.linkedinUrl,
        data.githubUrl,
        data.targetRole
      );

      // Add additional fields to the optimized resume object for later use
      optimized.targetRole = data.targetRole;
      optimized.linkedin = data.linkedinUrl;
      optimized.github = data.githubUrl;

      setOptimizedResume(optimized); // Store optimized resume initially
      setShowProjectModal(true); // Trigger Project Analysis Modal
      
      // The rest of the processing will happen in handleProjectsAnalyzed or handleMissingSectionsProvided
    } catch (error) {
      console.error('Optimization error:', error);
      setOptimizationError(error instanceof Error ? error.message : 'Optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false); // End loading state
    }
  };

  // This function is called after projects have been analyzed (from ProjectAnalysisModal)
  const handleProjectsAnalyzed = (updatedResume: ResumeData) => {
    setShowProjectModal(false); // Close the project modal

    // Check for missing critical sections (after projects are handled)
    const missing = checkMissingSections(updatedResume);
    if (missing.length > 0) {
      setMissingSections(missing);
      setOptimizedResume(updatedResume); // Store updated resume
      setShowMissingSections(true); // Show modal to prompt user for missing data
    } else {
      finalizeResume(updatedResume); // Proceed if no sections are missing
    }
  };

  // Helper function to identify crucial missing sections based on user type
  const checkMissingSections = (resumeData: ResumeData): string[] => {
    const missing: string[] = [];

    // Use `currentUserType` which was set in `handleOptimizeResume`
    if (currentUserType === 'fresher') {
      if (!resumeData.workExperience || resumeData.workExperience.length === 0) {
        missing.push('workExperience'); // Could be internships for freshers
      }
      if (!resumeData.projects || resumeData.projects.length === 0) {
        missing.push('projects');
      }
    } else { // Experienced
      if (!resumeData.workExperience || resumeData.workExperience.length < 2) {
        missing.push('workExperience'); // Expect at least 2 entries for experienced
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

  // Helper function to list sections that were likely updated/are present
  const getChangedSections = (resumeData: ResumeData): string[] => {
    const sections: string[] = [];

    if (resumeData.summary) sections.push('summary');
    if (resumeData.workExperience?.length) sections.push('workExperience');
    if (resumeData.projects?.length) sections.push('projects');
    if (resumeData.skills?.length) sections.push('skills');
    if (resumeData.certifications?.length) sections.push('certifications');
    if (resumeData.education?.length) sections.push('education');

    // Fresher-specific sections
    // Use `currentUserType`
    if (currentUserType === 'fresher') {
      if (resumeData.achievements?.length) sections.push('achievements');
      if (resumeData.extraCurricularActivities?.length) sections.push('extraCurricularActivities');
      if (resumeData.languagesKnown?.length) sections.push('languagesKnown');
      if (resumeData.personalDetails) sections.push('personalDetails');
    }

    return sections;
  };

  // Callback when user provides missing sections from the modal
  const handleMissingSectionsProvided = async (data: MissingSectionsData) => {
    if (!optimizedResume) return;

    // Merge the newly provided data into the existing optimized resume
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

    setShowMissingSections(false); // Close the modal
    finalizeResume(updatedResume); // Proceed with the finalized resume
  };

  // Finalize resume processing: calculate after score, changed sections, and use credit
  const finalizeResume = async (resume: ResumeData) => {
    const afterScoreData = generateAfterScore(JSON.stringify(resume));
    setAfterScore(afterScoreData);

    const changed = getChangedSections(resume);
    setChangedSections(changed);

    setOptimizedResume(resume); // Set the final optimized resume for display

    // Use one optimization credit from user's subscription
    if (user) {
      await paymentService.useOptimization(user.id);
      await checkSubscriptionStatus(); // Refresh remaining optimizations
    }
  };


  // Callback for successful subscription (refreshes status and closes modal)
  const handleSubscriptionSuccess = () => {
    setShowSubscriptionPlans(false);
    checkSubscriptionStatus();
  };

  // Determine which interface to show: carousel input flow or optimized resume/analysis
  // If optimizedResume exists, show the MobileOptimizedInterface
  if (optimizedResume) {
    const sections = [];
    sections.push({
      id: 'preview',
      title: 'Preview',
      icon: <FileText className="w-5 h-5" />,
      component: <ResumePreview resumeData={optimizedResume} userType={currentUserType} />,
      resumeData: optimizedResume,
    });

    if (beforeScore && afterScore) {
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
    return <MobileOptimizedInterface sections={sections} />;
  }

  // Otherwise, render the ResumeFlowCarousel for input
  return (
    <div>
      {/* Subscription Status Display - Can be kept outside the carousel for persistent visibility */}
      {isAuthenticated && (
        <div className="container-responsive py-6">
          <SubscriptionStatus onUpgrade={() => setShowSubscriptionPlans(true)} />
        </div>
      )}

      {/* Render the ResumeFlowCarousel for the input process */}
      <ResumeFlowCarousel
        onOptimize={handleOptimizeResume} // Pass the updated handleOptimizeResume
        isOptimizing={isOptimizing}
        optimizationError={optimizationError}
        canOptimize={canOptimize}
        remainingOptimizations={remainingOptimizations}
        onShowSubscriptionPlans={() => setShowSubscriptionPlans(true)}
        isAuthenticated={isAuthenticated}
        onShowAuthModal={onShowAuthModal} // Ensure onShowAuthModal is passed down
      />

      {/* Modals rendered outside the main layout flow */}
      <ProjectAnalysisModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        resumeData={optimizedResume || {} as ResumeData} // Pass optimizedResume data
        jobDescription={currentJobDescription} // Pass job description
        targetRole={currentTargetRole} // Pass target role
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