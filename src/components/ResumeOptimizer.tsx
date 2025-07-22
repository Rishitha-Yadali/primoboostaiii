// ✅ Updated ResumeOptimizer with original flow preserved and new UI layout

import React, { useState, useEffect } from 'react';
import {
  FileText,
  BarChart3,
  Upload,
  Briefcase,
  User,
  Users,
  Linkedin,
  Github,
  MapPin,
  Target,
  Sparkles,
  Zap,
  AlertCircle,
  Loader2,
  ArrowRight,
  Crown,
  Star,
  Clock,
  CheckCircle
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

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [location, setLocation] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [userType, setUserType] = useState<UserType>('fresher');

  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [beforeScore, setBeforeScore] = useState<MatchScore | null>(null);
  const [afterScore, setAfterScore] = useState<MatchScore | null>(null);
  const [changedSections, setChangedSections] = useState<string[]>([]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
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
    } catch (error) {
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
      const beforeScoreData = generateBeforeScore(resumeText);
      setBeforeScore(beforeScoreData);

      const optimized = await optimizeResume(
        resumeText,
        jobDescription,
        userType,
        linkedinUrl,
        githubUrl,
        targetRole
      );

      optimized.targetRole = targetRole;
      optimized.linkedin = linkedinUrl;
      optimized.github = githubUrl;

      const missing = checkMissingSections(optimized);
      if (missing.length > 0) {
        setMissingSections(missing);
        setOptimizedResume(optimized);
        setShowMissingSections(true);
        return;
      }

      const afterScoreData = generateAfterScore(JSON.stringify(optimized));
      setAfterScore(afterScoreData);

      const changed = getChangedSections(optimized);
      setChangedSections(changed);
      setOptimizedResume(optimized);

      if (user) {
        await paymentService.useOptimization(user.id);
        await checkSubscriptionStatus();
      }
    } catch (error) {
      setOptimizationError(error instanceof Error ? error.message : 'Optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const checkMissingSections = (resumeData: ResumeData): string[] => {
    const missing: string[] = [];
    if (userType === 'fresher') {
      if (!resumeData.workExperience?.length) missing.push('workExperience');
      if (!resumeData.projects?.length) missing.push('projects');
    } else {
      if ((resumeData.workExperience?.length || 0) < 2) missing.push('workExperience');
      if (!resumeData.projects?.length) missing.push('projects');
    }
    if (!resumeData.certifications?.length) missing.push('certifications');
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

    const updatedResume = {
      ...optimizedResume,
      workExperience: [...(optimizedResume.workExperience || []), ...(data.workExperience || [])],
      projects: [...(optimizedResume.projects || []), ...(data.projects || [])],
      certifications: [...(optimizedResume.certifications || []), ...(data.certifications || [])]
    };

    setOptimizedResume(updatedResume);
    setShowMissingSections(false);

    const afterScoreData = generateAfterScore(JSON.stringify(updatedResume));
    setAfterScore(afterScoreData);

    const changed = getChangedSections(updatedResume);
    setChangedSections(changed);
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionPlans(false);
    checkSubscriptionStatus();
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
      component: <ComprehensiveAnalysis beforeScore={beforeScore} afterScore={afterScore} changedSections={changedSections} resumeData={optimizedResume} jobDescription={jobDescription} targetRole={targetRole} />,
      resumeData: optimizedResume,
    });
  }
  if (sections.length > 0) return <MobileOptimizedInterface sections={sections} />;

  return (
    <div className="container-responsive py-10">
      <div className="text-center mb-10">
        <div className="bg-primary-600 text-white w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-secondary-900">AI Resume Optimizer</h1>
        <p className="text-secondary-600 max-w-xl mx-auto mt-2">
          Instantly tailor your resume to job descriptions with AI-powered optimization.
        </p>
      </div>

      {isAuthenticated && <SubscriptionStatus onUpgrade={() => setShowSubscriptionPlans(true)} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center"><User className="w-5 h-5 mr-2" />I am a...</h3>
            <div className="flex gap-4">
              <button onClick={() => setUserType('fresher')} className={`btn ${userType === 'fresher' ? 'btn-primary' : 'btn-outline'}`}>Fresher</button>
              <button onClick={() => setUserType('experienced')} className={`btn ${userType === 'experienced' ? 'btn-primary' : 'btn-outline'}`}>Experienced</button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center"><Upload className="w-5 h-5 mr-2" />Upload Resume</h3>
            <FileUpload onFileUpload={setResumeText} />
          </div>

          <div className="card p-6">
            <InputSection resumeText={resumeText} jobDescription={jobDescription} onResumeChange={setResumeText} onJobDescriptionChange={setJobDescription} />
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-green-600" />Additional Info</h3>
            <input className="input-base mb-4" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Target Role (e.g. Data Scientist)" />
            <input className="input-base mb-4" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" />
            <input className="input-base mb-4" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub URL" />
            <input className="input-base" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 text-center">
            <div className="mb-4">
              <Zap className="w-8 h-8 text-primary-600 mx-auto" />
            </div>
            <h3 className="text-xl font-bold">Ready to Optimize?</h3>
            <p className="text-secondary-600 mt-2">
              {isAuthenticated ? (canOptimize ? `You have ${remainingOptimizations} optimizations left` : 'No optimizations left') : 'Please sign in to continue'}
            </p>

            {optimizationError && <p className="text-red-600 mt-2 text-sm flex items-center justify-center"><AlertCircle className="w-4 h-4 mr-1" />{optimizationError}</p>}

            <button onClick={handleOptimizeResume} disabled={isOptimizing || !resumeText || !jobDescription} className="btn btn-primary w-full mt-4">
              {isOptimizing ? <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Optimizing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Optimize Resume <ArrowRight className="w-4 h-4 ml-2" /></>}
            </button>

            {isAuthenticated && !canOptimize && (
              <button onClick={() => setShowSubscriptionPlans(true)} className="btn w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <Crown className="w-4 h-4 mr-2" /> Choose Subscription Plan
              </button>
            )}
          </div>

          <div className="card p-6 bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
            <h3 className="text-center text-lg font-semibold text-secondary-900 mb-2">Affordable Pricing</h3>
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center"><Clock className="w-4 h-4 mr-1 text-primary-600" />1 Hour: ₹19</div>
              <div className="flex items-center"><Zap className="w-4 h-4 mr-1 text-green-600" />1 Week: ₹129</div>
            </div>
          </div>
        </div>
      </div>

      <MissingSectionsModal isOpen={showMissingSections} onClose={() => setShowMissingSections(false)} missingSections={missingSections} onSectionsProvided={handleMissingSectionsProvided} />
      <SubscriptionPlans isOpen={showSubscriptionPlans} onClose={() => setShowSubscriptionPlans(false)} onSubscriptionSuccess={handleSubscriptionSuccess} />
    </div>
  );
}