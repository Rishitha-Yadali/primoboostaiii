import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Download, TrendingUp, Target, Award, User, Briefcase, AlertCircle, CheckCircle, Loader2, RefreshCw, Zap, Plus, Eye, EyeOff, Crown, Calendar, Clock, Users, Star, ArrowRight, Shield, Settings, LogOut, Menu, X, Upload, BarChart3, Lightbulb } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { InputSection } from './InputSection';
import { ResumePreview } from './ResumePreview';
import { ExportButtons } from './ExportButtons';
import { ComprehensiveAnalysis } from './ComprehensiveAnalysis';
import { ProjectAnalysisModal } from './ProjectAnalysisModal';
import { MobileOptimizedInterface } from './MobileOptimizedInterface';
import { ProjectEnhancement } from './ProjectEnhancement';
import { SubscriptionPlans } from './payment/SubscriptionPlans';
import { SubscriptionStatus } from './payment/SubscriptionStatus';
import { MissingSectionsModal } from './MissingSectionsModal';
import { parseFile } from '../utils/fileParser';
import { optimizeResume } from '../services/geminiService';
import { getMatchScore, generateBeforeScore, generateAfterScore, getDetailedResumeScore, reconstructResumeText } from '../services/scoringService';
import { analyzeProjectAlignment } from '../services/projectAnalysisService';
import { advancedProjectAnalyzer } from '../services/advancedProjectAnalyzer';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import { ResumeData, UserType, MatchScore, DetailedScore } from '../types/resume';

const ResumeOptimizer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [userType, setUserType] = useState<UserType>('experienced');
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showProjectMismatch, setShowProjectMismatch] = useState(false);
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const [showManualProjectAdd, setShowManualProjectAdd] = useState(false);
  const [lowScoringProjects, setLowScoringProjects] = useState<any[]>([]);
  const [initialResumeScore, setInitialResumeScore] = useState<DetailedScore | null>(null);
  const [finalResumeScore, setFinalResumeScore] = useState<DetailedScore | null>(null);
  const [parsedResumeData, setParsedResumeData] = useState<ResumeData | null>(null);
  const [manualProject, setManualProject] = useState({
    title: '',
    startDate: '',
    endDate: '',
    techStack: [] as string[],
    oneLiner: ''
  });
  const [newTechStack, setNewTechStack] = useState('');
  const [beforeScore, setBeforeScore] = useState<MatchScore | null>(null);
  const [afterScore, setAfterScore] = useState<MatchScore | null>(null);
  const [changedSections, setChangedSections] = useState<string[]>([]);
  const [showMobileInterface, setShowMobileInterface] = useState(false);
  const [showProjectEnhancement, setShowProjectEnhancement] = useState(false);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showMissingSectionsModal, setShowMissingSectionsModal] = useState(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [isProcessingMissingSections, setIsProcessingMissingSections] = useState(false);
  const [pendingResumeData, setPendingResumeData] = useState<ResumeData | null>(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);

  // Check subscription status on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      checkSubscriptionStatus();
    } else {
      setLoadingSubscription(false);
    }
  }, [isAuthenticated, user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      const userSubscription = await paymentService.getUserSubscription(user.id);
      setSubscription(userSubscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleFileUpload = async (text: string) => {
    try {
      setResumeText(text);
    } catch (error) {
      console.error('Error handling file upload:', error);
      alert('Error processing file. Please try a different format or check if the file is corrupted.');
    }
  };

  // Move to next step when resume text is added
  useEffect(() => {
    if (resumeText.trim().length > 0 && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [resumeText, currentStep]);

  // Move to next step when job description is added
  useEffect(() => {
    if (jobDescription.trim().length > 0 && currentStep === 2) {
      setCurrentStep(3);
    }
  }, [jobDescription, currentStep]);

  const handleOptimize = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      alert('Please provide both resume content and job description');
      return;
    }

    if (!isAuthenticated) {
      alert('Please sign in to optimize your resume');
      return;
    }

    if (!user) {
      alert('User information not available. Please sign in again.');
      return;
    }

    // Check subscription
    if (!subscription) {
      setShowSubscriptionPlans(true);
      return;
    }

    const remaining = subscription.optimizationsTotal - subscription.optimizationsUsed;
    if (remaining <= 0) {
      alert('You have used all your optimizations. Please upgrade your plan.');
      setShowSubscriptionPlans(true);
      return;
    }

    setIsOptimizing(true); // Set to true to show loading screen
    
    try {
      // First, parse the resume to get structured data
      const parsedResume = await optimizeResume(resumeText, jobDescription, userType, linkedinUrl, githubUrl, targetRole);
      setParsedResumeData(parsedResume);
      
      // Check for missing sections
      const missing = checkForMissingSections(parsedResume);
      if (missing.length > 0) {
        setMissingSections(missing);
        setPendingResumeData(parsedResume);
        setShowMissingSectionsModal(true);
        setIsOptimizing(false);
        return;
      }
      
      // Continue with optimization process
      await continueOptimizationProcess(parsedResume);
      
    } catch (error) {
      console.error('Error optimizing resume:', error);
      alert('Failed to optimize resume. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const continueOptimizationProcess = async (resumeData: ResumeData) => {
    try {
      // Continue with initial resume processing
      await handleInitialResumeProcessing(resumeData);
    } catch (error) {
      console.error('Error in optimization process:', error);
      alert('Failed to continue optimization. Please try again.');
    }
  };

  // Handle initial resume processing after AI response or missing sections input
  const handleInitialResumeProcessing = async (resumeData: ResumeData) => {
    try {
      // Calculate initial resume score
      setIsCalculatingScore(true);
      const initialScore = await getDetailedResumeScore(resumeData, jobDescription);
      setInitialResumeScore(initialScore);
      
      // Set the resume data
      setOptimizedResume(resumeData);
      setParsedResumeData(resumeData);
      
      // Check if projects need analysis/enhancement
      if (resumeData.projects && resumeData.projects.length > 0) {
        // Proceed to project analysis
        setShowProjectAnalysis(true);
      } else {
        // No projects to analyze, proceed with final optimization
        await proceedWithFinalOptimization(resumeData, initialScore);
      }
    } catch (error) {
      console.error('Error in initial resume processing:', error);
      alert('Failed to process resume. Please try again.');
      setIsProcessingMissingSections(false);
    } finally {
      setIsCalculatingScore(false);
    }
  };
  
  const checkForMissingSections = (resumeData: ResumeData): string[] => {
    const missing: string[] = [];
    
    // Check work experience
    if (!resumeData.workExperience || resumeData.workExperience.length === 0) {
      missing.push('workExperience');
    }
    
    // Check projects
    if (!resumeData.projects || resumeData.projects.length === 0) {
      missing.push('projects');
    }
    
    // Check certifications
    if (!resumeData.certifications || resumeData.certifications.length === 0) {
      missing.push('certifications');
    }
    
    return missing;
  };
  
  const handleMissingSectionsProvided = async (data: any) => {
    setIsProcessingMissingSections(true);
    try {
      if (!pendingResumeData) return;
      
      // Merge the provided data with existing resume data
      const updatedResume = {
        ...pendingResumeData,
        ...(data.workExperience && { workExperience: data.workExperience }),
        ...(data.projects && { projects: data.projects }),
        ...(data.certifications && { certifications: data.certifications })
      };
      
      setShowMissingSectionsModal(false);
      setMissingSections([]);
      setPendingResumeData(null);
      
      // Continue with initial resume processing
      await handleInitialResumeProcessing(updatedResume);
    } catch (error) {
      console.error('Error processing missing sections:', error);
      alert('Failed to process the provided information. Please try again.');
    } finally {
      setIsProcessingMissingSections(false);
    }
  };
  
  // Renamed to be more specific about its purpose
  const proceedWithFinalOptimization = async (resumeData: ResumeData, initialScore: DetailedScore) => {
    try {
      setIsOptimizing(true);
      
      // Proceed with final AI optimization
      await proceedWithOptimization(resumeData, initialScore);
      
    } catch (error) {
      console.error('Error in final optimization:', error);
      alert('Failed to complete final optimization. Please try again.');
      setIsOptimizing(false);
    } finally {
      setIsOptimizing(false);
    }
  };
  
  const proceedWithOptimization = async (resumeData: ResumeData, initialScore: DetailedScore) => {
    try {
      // Final AI optimization pass - re-optimize the entire resume with all new content
      console.log('Starting final AI optimization pass...');
      const finalOptimizedResume = await optimizeResume(
        JSON.stringify(resumeData), 
        jobDescription, 
        userType, 
        linkedinUrl, 
        githubUrl, 
        targetRole
      );
      
      // Analyze projects and apply replacements if needed
      let finalResumeData = finalOptimizedResume;
      
      if (finalOptimizedResume.projects && finalOptimizedResume.projects.length > 0) {
        try {
          // Use advanced project analyzer to score and replace projects
          const projectAnalysis = await advancedProjectAnalyzer.analyzeAndReplaceProjects(
            finalOptimizedResume,
            targetRole || 'Software Engineer',
            jobDescription
          );
          
          // Step 1: Keep only projects scoring 80+ (suitable projects)
          const suitableProjects = finalOptimizedResume.projects?.filter(project => {
            // Check if this project was marked as suitable (score 80+)
            const analysis = projectAnalysis.projectsToReplace.find(p => p.title === project.title);
            return !analysis || analysis.score >= 80; // Keep if not in replace list or score is 80+
          }) || [];
          
          // Step 2: Get replacement projects (these replace the low-scoring ones)
          const replacementProjects = projectAnalysis.replacementSuggestions.map(suggestion => ({
            title: suggestion.title,
            bullets: suggestion.bullets,
            githubUrl: suggestion.githubUrl
          }));
          
          // Step 3: Combine suitable existing + replacement projects (max 3 total)
          const finalProjects = [...suitableProjects];
          
          // Step 4: Add replacement projects to fill remaining slots (up to 3 total)
          for (const newProject of replacementProjects) {
            if (finalProjects.length < 3) {
              finalProjects.push(newProject);
            } else {
              break; // Stop once we reach 3 projects
            }
          }
          
          // Step 5: Create final resume with replaced projects
          finalResumeData = {
            ...finalOptimizedResume,
            projects: finalProjects
          };
          
          console.log(`Project replacement: ${finalOptimizedResume.projects.length} original → ${suitableProjects.length} kept + ${finalProjects.length - suitableProjects.length} new = ${finalProjects.length} total`);
        } catch (projectError) {
          console.warn('Project analysis failed, using original projects:', projectError);
          // Continue with original resume if project analysis fails
        }
      }

      // Generate before score
      const beforeScoreData = generateBeforeScore(reconstructResumeText(resumeData));
      setBeforeScore(beforeScoreData);

      // Set optimized resume
      setOptimizedResume(finalResumeData);

      // Generate after score
      const afterScoreData = generateAfterScore(JSON.stringify(finalResumeData));
      setAfterScore(afterScoreData);
      
      // Set final detailed score
      const finalScore = await getDetailedResumeScore(finalResumeData, jobDescription);
      setFinalResumeScore(finalScore);

      // Determine changed sections (simplified)
      const sections = ['workExperience', 'education', 'projects', 'skills', 'certifications'];
      setChangedSections(sections);

      // Use optimization and refresh subscription status
      const optimizationResult = await paymentService.useOptimization(user.id);
      if (optimizationResult.success) {
        // Refresh subscription status to show updated count
        await checkSubscriptionStatus();
      }
      

      // Show mobile interface on smaller screens
      if (window.innerWidth < 768) {
        setShowMobileInterface(true);
      }
    } catch (error) {
      console.error('Error optimizing resume:', error);
      alert('Failed to optimize resume. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };
  
  const handleProjectMismatchResponse = (proceed: boolean) => {
    setShowProjectMismatch(false);
    if (proceed) {
      setShowProjectOptions(true);
    } else {
      // Skip project enhancement and proceed with existing resume
      if (parsedResumeData && initialResumeScore) {
        proceedWithOptimization(parsedResumeData, initialResumeScore);
      }
    }
  };
  
  const handleProjectOptionSelect = (option: 'manual' | 'ai') => {
    setShowProjectOptions(false);
    if (option === 'manual') {
      // For manual mode, show the manual project add form
      setShowManualProjectAdd(true);
    } else {
      // For AI mode, show the project enhancement modal with AI suggestions
      setShowProjectEnhancement(true);
    }
  };
  
  const generateAIProject = async (jd: string, resume: ResumeData) => {
    // This would call your AI service to generate a relevant project
    // For now, returning a sample project structure
    return {
      title: "AI-Generated Project Based on Job Requirements",
      bullets: [
        "Developed a full-stack application using technologies mentioned in job description",
        "Implemented key features that align with role requirements and responsibilities",
        "Utilized modern development practices and tools relevant to the target position"
      ]
    };
  };
  
  const addTechToStack = () => {
    if (newTechStack.trim() && !manualProject.techStack.includes(newTechStack.trim())) {
      setManualProject(prev => ({
        ...prev,
        techStack: [...prev.techStack, newTechStack.trim()]
      }));
      setNewTechStack('');
    }
  };
  
  const removeTechFromStack = (tech: string) => {
    setManualProject(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  };
  
  const handleManualProjectSubmit = async () => {
    if (!manualProject.title || !parsedResumeData) return;
    
    // Start optimization process (this will trigger the loading screen)
    setIsOptimizing(true);
    try {
      // Generate project description using AI
      const projectDescription = await generateProjectDescription(manualProject, jobDescription);
      
      const newProject = {
        title: manualProject.title,
        bullets: projectDescription.split('\n').filter(line => line.trim().startsWith('•')).map(line => line.replace('•', '').trim())
      };
      
      // Create updated resume with new project
      let updatedResume;
      
      if (lowScoringProjects.length > 0) {
        // Replace low scoring projects with the new one
        const filteredProjects = parsedResumeData.projects?.filter(project => 
          !lowScoringProjects.some(lowProject => lowProject.title === project.title)
        ) || [];
        
        updatedResume = {
          ...parsedResumeData,
          projects: [...filteredProjects, newProject]
        };
      } else {
        // Just add the new project if there are no low scoring ones
        updatedResume = {
          ...parsedResumeData,
          projects: [...(parsedResumeData.projects || []), newProject]
        };
      }
      
      setShowManualProjectAdd(false);
      await proceedWithOptimization(updatedResume, initialResumeScore!);
    } catch (error) {
      console.error('Error creating manual project:', error);
      alert('Failed to create project. Please try again.');
      setIsOptimizing(false);
    }
  };
  
  const generateProjectDescription = async (project: any, jd: string): Promise<string> => {
    // This would call your AI service to generate project description
    // For now, returning sample bullets
    return `• Developed ${project.title} using ${project.techStack.join(', ')} technologies
• Implemented core features and functionality aligned with industry best practices
• Delivered scalable solution with focus on performance and user experience`;
  };

  // Handle projects added from ProjectEnhancement component
  const handleProjectsAdded = (updatedResumeData: ResumeData) => {
    console.log('handleProjectsAdded called with:', updatedResumeData);
    
    // Update both optimized resume and parsed resume data
    setOptimizedResume(updatedResumeData);
    setParsedResumeData(updatedResumeData);
    
    // Trigger final AI re-optimization with the updated resume
    if (initialResumeScore) {
      proceedWithFinalOptimization(updatedResumeData, initialResumeScore);
    } else {
      // Fallback: generate scores without final AI optimization
      generateScoresAfterProjectAdd(updatedResumeData);
    }
  };
  
  const generateScoresAfterProjectAdd = async (updatedResume: ResumeData) => {
    try {
      // Generate before score (original resume)
      const beforeScoreData = generateBeforeScore(reconstructResumeText(parsedResumeData!));
      setBeforeScore(beforeScoreData);

      // Generate after score (with new projects)
      const afterScoreData = generateAfterScore(JSON.stringify(updatedResume));
      setAfterScore(afterScoreData);
      
      // Get detailed scores
      if (initialResumeScore) {
        const finalScore = await getDetailedResumeScore(updatedResume, jobDescription);
        setFinalResumeScore(finalScore);
      }

      // Set changed sections
      const sections = ['projects', 'workExperience', 'skills'];
      setChangedSections(sections);

      // Show mobile interface on smaller screens
      if (window.innerWidth < 768) {
        setShowMobileInterface(true);
      }
    } catch (error) {
      console.error('Error generating scores after project add:', error);
    }
  };

  const handleSubscriptionSuccess = () => {
    checkSubscriptionStatus();
  };

  const handleProjectsUpdated = (updatedResume: ResumeData) => {
    console.log('Projects updated, triggering final AI re-optimization...');
    
    // Update resume data
    setOptimizedResume(updatedResume);
    setParsedResumeData(updatedResume);
    
    // Trigger final AI re-optimization with the updated resume
    if (initialResumeScore) {
      proceedWithFinalOptimization(updatedResume, initialResumeScore);
    } else {
      // Fallback: generate scores without final AI optimization
      generateScoresAfterProjectAdd(updatedResume);
    }
  };

  // Mobile interface sections
  const mobileSections = [
  {
    id: 'resume',
    title: 'Optimized Resume',
    icon: <FileText className="w-5 h-5" />,
    component: optimizedResume ? (
      <ResumePreview resumeData={optimizedResume} userType={userType} />
    ) : null,
    resumeData: optimizedResume
  },
  {
    id: 'analysis',
    title: 'Analysis',
    icon: <BarChart3 className="w-5 h-5" />,
    component: beforeScore && afterScore ? (
      <>
        <ComprehensiveAnalysis
          beforeScore={beforeScore}
          afterScore={afterScore}
          changedSections={changedSections}
          resumeData={optimizedResume!}
          jobDescription={jobDescription}
          targetRole="Target Role"
        />
        <MissingSectionsModal
          isOpen={showMissingSectionsModal}
          onClose={() => {
            setShowMissingSectionsModal(false);
            setMissingSections([]);
            setPendingResumeData(null);
            setIsOptimizing(false);
          }}
          missingSections={missingSections}
          onSectionsProvided={handleMissingSectionsProvided}
        />
      </>
    ) : null
  }
];


  if (showMobileInterface && optimizedResume) {
    return <MobileOptimizedInterface sections={mobileSections} />;
  }

  // New conditional rendering for the loading screen
  if (isOptimizing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Optimizing Your Resume...</h2>
          <p className="text-gray-600 mb-4">
            Please wait while our AI analyzes your resume and job description to generate the best possible match.
          </p>
          <p className="text-sm text-gray-500">
            This may take a few moments as we process complex data and apply advanced algorithms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!optimizedResume ? (
          // This block will now only render if not optimizing and no optimized resume
          <>
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mx-auto mb-4">
                <img 
                  src="https://res.cloudinary.com/dlkovvlud/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1751536902/a-modern-logo-design-featuring-primoboos_XhhkS8E_Q5iOwxbAXB4CqQ_HnpCsJn4S1yrhb826jmMDw_nmycqj.jpg" 
                  alt="PrimoBoost AI Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">PrimoBoost AI</h1>
              <p className="text-lg text-gray-600 mb-2">Upgrade Your Resume, Unlock Your Future</p>
              <p className="text-base text-gray-500 max-w-2xl mx-auto mb-6">Transform. Optimize. Get Hired – With PrimoBoost.AI</p>
              
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 mb-8">
                <Sparkles className="w-4 h-4 mr-2" />
                Powered by Advanced AI Technology
              </div>
            </div>
            
            {/* Process Steps */}
            <div className="flex flex-col md:flex-row justify-center gap-4 mb-8 max-w-4xl mx-auto">
              <div className={`bg-blue-50 rounded-xl p-6 border ${currentStep === 1 ? 'border-blue-300 ring-2 ring-blue-200' : 'border-gray-200'} flex-1`}>
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Resume</h3>
                <p className="text-sm text-gray-600">Upload your current resume or paste the text</p>
              </div>
              
              <div className={`bg-green-50 rounded-xl p-6 border ${currentStep === 2 ? 'border-green-300 ring-2 ring-green-200' : 'border-gray-200'} flex-1`}>
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold text-lg">2</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Job Details</h3>
                <p className="text-sm text-gray-600">Paste the job description you're targeting</p>
              </div>
              
              <div className={`bg-purple-50 rounded-xl p-6 border ${currentStep === 3 ? 'border-purple-300 ring-2 ring-purple-200' : 'border-gray-200'} flex-1`}>
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold text-lg">3</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Optimized</h3>
                <p className="text-sm text-gray-600">Download your enhanced, ATS-ready resume</p>
              </div>
            </div>
            
            {/* Subscription Status */}
            {isAuthenticated && !loadingSubscription && (
              <div className="mb-8">
                <SubscriptionStatus onUpgrade={() => setShowSubscriptionPlans(true)} />
              </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">
            {/* File Upload */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-600" />
                Upload Resume
              </h2>
              <FileUpload onFileUpload={handleFileUpload} />
            </div>

            {/* Input Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Resume & Job Details
              </h2>
              <InputSection
                resumeText={resumeText}
                jobDescription={jobDescription}
                onResumeChange={setResumeText}
                onJobDescriptionChange={setJobDescription}
              />
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-600" />
                  Social Links (Optional)
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub Profile URL
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-orange-600" />
                  Target Role (Optional)
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Senior Software Engineer, Product Manager..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Specify the exact role title for more targeted project recommendations
                  </p>
                </div>
              </div>
            </div>

            {/* User Type Toggle */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
                Experience Level
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setUserType('fresher')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    userType === 'fresher'
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <User className={`w-6 h-6 mb-2 ${userType === 'fresher' ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className="font-medium">Fresher/New Graduate</span>
                  <span className="text-xs text-gray-500 mt-1">Recent graduate or entry-level professional</span>
                </button>
                
                <button
                  onClick={() => setUserType('experienced')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    userType === 'experienced'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <Briefcase className={`w-6 h-6 mb-2 ${userType === 'experienced' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="font-medium">Experienced Professional</span>
                  <span className="text-xs text-gray-500 mt-1">Professional with 1+ years of work experience</span>
                </button>
              </div>
            </div>

            {/* Optimize Button */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <button
                onClick={handleOptimize}
                disabled={!resumeText.trim() || !jobDescription.trim() || !isAuthenticated} // isOptimizing check removed here as it's handled by the new loading screen
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                  !resumeText.trim() || !jobDescription.trim() || !isAuthenticated
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl cursor-pointer'
                }`}
              >
                <Sparkles className="w-6 h-6" />
                <span>Optimize My Resume</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              {!isAuthenticated ? (
                <p className="text-center text-sm text-gray-500 mt-3">
                  Please sign in to optimize your resume
                </p>
              ) : (
                <p className="text-center text-sm text-gray-500 mt-3">
                  Click to optimize your resume for the target job
                </p>
              )}
            </div>

            {/* Project Analysis Button */}
            {resumeText && jobDescription && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <button
                  onClick={() => setShowProjectAnalysis(true)}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
                >
                  <Target className="w-5 h-5" />
                  <span>Analyze & Improve Projects</span>
                </button>
              </div>
            )}
            </div>
          </>
        ) : (
          // Optimized Resume View
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Resume Preview */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  Optimized Resume
                </h2>
              </div>
              <ResumePreview resumeData={optimizedResume} userType={userType} />
            </div>

            {/* Export Buttons */}
            <ExportButtons resumeData={optimizedResume} targetRole={targetRole} />

            {/* Analysis */}
            {beforeScore && afterScore && initialResumeScore && finalResumeScore && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                    Resume Score Analysis
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Before Optimization</h3>
                      <div className="text-4xl font-bold text-red-600 mb-2">{initialResumeScore.totalScore}/100</div>
                      <div className="text-sm text-gray-600">Grade: {initialResumeScore.grade}</div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">After Optimization</h3>
                      <div className="text-4xl font-bold text-green-600 mb-2">{finalResumeScore.totalScore}/100</div>
                      <div className="text-sm text-gray-600">Grade: {finalResumeScore.grade}</div>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      +{finalResumeScore.totalScore - initialResumeScore.totalScore} Points Improvement
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {beforeScore && afterScore && (
              <ComprehensiveAnalysis
                beforeScore={beforeScore}
                afterScore={afterScore}
                changedSections={changedSections}
                resumeData={optimizedResume}
                jobDescription={jobDescription}
                targetRole={targetRole || "Target Role"}
              />
            )}
            
            {/* Project Analysis Button */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <button
                onClick={() => setShowProjectAnalysis(true)}
                className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
              >
                <Target className="w-5 h-5" />
                <span>Analyze & Improve Projects</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project Mismatch Dialog */}
      {showProjectMismatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Project Mismatch Detected</h2>
                <p className="text-gray-600">
                  Your current projects don't align well with the job description. Would you like to add a relevant project to improve your resume score?
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {initialResumeScore?.totalScore}/100
                  </div>
                  <div className="text-sm text-red-700">Current Resume Score</div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleProjectMismatchResponse(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Yes, Add Project
                </button>
                <button
                  onClick={() => handleProjectMismatchResponse(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Project Options Dialog */}
      {showProjectOptions && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Project Addition Method</h2>
                <p className="text-gray-600">
                  How would you like to add a relevant project to your resume?
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleProjectOptionSelect('manual')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <User className="w-5 h-5" />
                  <span>Manual Add - I'll provide project details</span>
                </button>
                <button
                  onClick={() => handleProjectOptionSelect('ai')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>AI-Suggested - Generate automatically</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Manual Project Add Dialog */}
      {showManualProjectAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Add Project Manually</h2>
                <p className="text-gray-600">
                  Provide project details and AI will generate a professional description
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={manualProject.title}
                    onChange={(e) => setManualProject(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., E-commerce Website"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="month"
                      value={manualProject.startDate}
                      onChange={(e) => setManualProject(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="month"
                      value={manualProject.endDate}
                      onChange={(e) => setManualProject(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tech Stack *
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTechStack}
                      onChange={(e) => setNewTechStack(e.target.value)}
                      placeholder="Add technology (e.g., React, Node.js)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      onKeyPress={(e) => e.key === 'Enter' && addTechToStack()}
                    />
                    <button
                      onClick={addTechToStack}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {manualProject.techStack.map((tech, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {tech}
                        <button
                          onClick={() => removeTechFromStack(tech)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    One-liner Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualProject.oneLiner}
                    onChange={(e) => setManualProject(prev => ({ ...prev, oneLiner: e.target.value }))}
                    placeholder="Brief description of the project"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleManualProjectSubmit}
                  disabled={!manualProject.title || manualProject.techStack.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Generate & Add Project
                </button>
                <button
                  onClick={() => setShowManualProjectAdd(false)}
                  className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missing Sections Processing Loader */}
      {isProcessingMissingSections && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Processing Your Information</h2>
            <p className="text-gray-600 mb-4">
              We're updating your resume with the new sections you provided...
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Analyzing new content</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Calculating resume score</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Preparing optimization</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <>
        <ProjectEnhancement
          isOpen={showProjectEnhancement}
          onClose={() => setShowProjectEnhancement(false)}
          currentResume={parsedResumeData || optimizedResume || { name: '', phone: '', email: '', linkedin: '', github: '', education: [], workExperience: [], projects: [], skills: [], certifications: [] }}
          jobDescription={jobDescription}
          onProjectsAdded={handleProjectsUpdated}
        />

        <ProjectAnalysisModal
          isOpen={showProjectAnalysis}
          onClose={() => setShowProjectAnalysis(false)}
          resumeData={parsedResumeData || optimizedResume || { name: '', phone: '', email: '', linkedin: '', github: '', education: [], workExperience: [], projects: [], skills: [], certifications: [] }}
          jobDescription={jobDescription}
          targetRole={targetRole}
          onProjectsUpdated={handleProjectsUpdated}
        />

        <SubscriptionPlans
          isOpen={showSubscriptionPlans}
          onClose={() => setShowSubscriptionPlans(false)}
          onSubscriptionSuccess={handleSubscriptionSuccess}
        />

        {/* Missing Sections Modal */}
        <MissingSectionsModal
          isOpen={showMissingSectionsModal}
          onClose={() => {
            setShowMissingSectionsModal(false);
            setMissingSections([]);
            setPendingResumeData(null);
            setIsOptimizing(false);
          }}
          missingSections={missingSections}
          onSectionsProvided={handleMissingSectionsProvided}
        />
      </>
    </div>
  );
};

export default ResumeOptimizer;