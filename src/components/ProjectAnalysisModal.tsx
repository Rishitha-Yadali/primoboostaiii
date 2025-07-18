import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Github, 
  AlertTriangle, 
  Loader2, 
  Plus,
  ArrowRight,
  FileText,
  Lightbulb,
  Target,
  RefreshCw
} from 'lucide-react';
import { ResumeData } from '../types/resume';
import { ProjectSuitabilityResult } from '../types/analysis';
import { analyzeProjectSuitability, fetchGitHubProjects, generateProjectBullets } from '../services/projectAnalysisService';
import { advancedProjectAnalyzer } from '../services/advancedProjectAnalyzer';

interface ProjectAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  jobDescription: string;
  targetRole: string;
  onProjectsUpdated: (updatedResume: ResumeData) => void;
}

export const ProjectAnalysisModal: React.FC<ProjectAnalysisModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  jobDescription,
  targetRole,
  onProjectsUpdated
}) => {
  const [analysisResult, setAnalysisResult] = useState<ProjectSuitabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedReplacements, setSelectedReplacements] = useState<{[key: string]: boolean}>({});
  const [selectedSuggestions, setSelectedSuggestions] = useState<{[key: string]: boolean}>({});
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualProject, setManualProject] = useState({
    title: '',
    techStack: [] as string[],
    newTech: '',
    description: ''
  });
  const [generatingBullets, setGeneratingBullets] = useState(false);
  const [manualBullets, setManualBullets] = useState<string[]>([]);
  const [step, setStep] = useState<'analysis' | 'selection' | 'preview'>('analysis');
  const [updatedResume, setUpdatedResume] = useState<ResumeData | null>(null);
  const [useAdvancedAnalysis, setUseAdvancedAnalysis] = useState(false);

  useEffect(() => {
    if (isOpen) {
      analyzeProjects();
    }
  }, [isOpen, resumeData, jobDescription, targetRole]);

  const analyzeProjects = async () => {
    setLoading(true);
    try {
      if (useAdvancedAnalysis) {
        // Use the new advanced analyzer
        const advancedResult = await advancedProjectAnalyzer.analyzeAndReplaceProjects(
          resumeData,
          targetRole,
          jobDescription
        );
        
        // Convert to the expected format
        const convertedResult: ProjectSuitabilityResult = {
          projectAnalysis: [
            ...advancedResult.projectsToReplace.map(p => ({
              title: p.title,
              suitable: p.score >= 80,
              reason: p.score < 80 ? p.reason : undefined,
              replacementSuggestion: undefined
            })),
            ...(resumeData.projects?.filter(project => 
              !advancedResult.projectsToReplace.some(p => p.title === project.title)
            ).map(project => ({
              title: project.title,
              suitable: true,
              reason: undefined,
              replacementSuggestion: undefined
            })) || [])
          ],
          summary: {
            totalProjects: resumeData.projects?.length || 0,
            suitableProjects: (resumeData.projects?.length || 0) - advancedResult.projectsToReplace.length,
            unsuitableProjects: advancedResult.projectsToReplace.length
          },
          suggestedProjects: advancedResult.replacementSuggestions.map(s => ({
            title: s.title,
            githubUrl: s.githubUrl,
            bulletPoints: s.bullets
          }))
        };
        
        setAnalysisResult(convertedResult);
      } else {
        // Use the existing analyzer
        const result = await analyzeProjectSuitability(resumeData, jobDescription, targetRole);
        setAnalysisResult(result);
      }
      
      // Initialize selection state
      const initialReplacements: {[key: string]: boolean} = {};
      if (analysisResult) {
        analysisResult.projectAnalysis.forEach(project => {
          if (!project.suitable && project.replacementSuggestion) {
            initialReplacements[project.title] = false;
          }
        });
      }
      setSelectedReplacements(initialReplacements);
      
      const initialSuggestions: {[key: string]: boolean} = {};
      if (analysisResult) {
        analysisResult.suggestedProjects.forEach(project => {
          initialSuggestions[project.title] = false;
        });
      }
      setSelectedSuggestions(initialSuggestions);
      
      setStep('analysis');
    } catch (error) {
      console.error('Error analyzing projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTech = () => {
    if (manualProject.newTech.trim() && !manualProject.techStack.includes(manualProject.newTech.trim())) {
      setManualProject({
        ...manualProject,
        techStack: [...manualProject.techStack, manualProject.newTech.trim()],
        newTech: ''
      });
    }
  };

  const handleRemoveTech = (tech: string) => {
    setManualProject({
      ...manualProject,
      techStack: manualProject.techStack.filter(t => t !== tech)
    });
  };

  const handleGenerateManualBullets = async () => {
    if (!manualProject.title || manualProject.techStack.length === 0) {
      alert('Please provide a project title and at least one technology');
      return;
    }

    setGeneratingBullets(true);
    try {
      const bullets = await generateProjectBullets(
        manualProject.title,
        manualProject.techStack,
        jobDescription,
        targetRole
      );
      setManualBullets(bullets);
    } catch (error) {
      console.error('Error generating bullets:', error);
      alert('Failed to generate project description. Please try again.');
    } finally {
      setGeneratingBullets(false);
    }
  };

  const handleToggleReplacement = (projectTitle: string) => {
    setSelectedReplacements({
      ...selectedReplacements,
      [projectTitle]: !selectedReplacements[projectTitle]
    });
  };

  const handleToggleSuggestion = (projectTitle: string) => {
    setSelectedSuggestions({
      ...selectedSuggestions,
      [projectTitle]: !selectedSuggestions[projectTitle]
    });
  };

  const handleContinue = () => {
    setStep('selection');
  };

  const handleAddManualProject = () => {
    if (manualBullets.length === 0) {
      alert('Please generate bullet points first');
      return;
    }

    // Create updated resume with manual project
    const newProject = {
      title: manualProject.title,
      bullets: manualBullets
    };

    // Create updated resume
    createUpdatedResume([newProject]);
    
    // Reset form
    setManualProject({
      title: '',
      techStack: [],
      newTech: '',
      description: ''
    });
    setManualBullets([]);
    setShowManualForm(false);
    setStep('preview');
  };

  const handleApplyChanges = () => {
    if (!analysisResult) return;

    const newProjects = [];

    // Add replacement projects
    for (const project of analysisResult.projectAnalysis) {
      if (!project.suitable && selectedReplacements[project.title] && project.replacementSuggestion) {
        newProjects.push({
          title: project.replacementSuggestion.title,
          bullets: project.replacementSuggestion.bulletPoints,
          githubUrl: project.replacementSuggestion.githubUrl
        });
      }
    }

    // Add suggested projects
    for (const project of analysisResult.suggestedProjects) {
      if (selectedSuggestions[project.title]) {
        newProjects.push({
          title: project.title,
          bullets: project.bulletPoints,
          githubUrl: project.githubUrl
        });
      }
    }

    // Create updated resume
    createUpdatedResume(newProjects);
    setStep('preview');
  };

  const createUpdatedResume = (newProjects: any[]) => {
    if (!analysisResult) return;

    // Step 1: Keep only suitable projects from original resume (score 80+) 
    const suitableProjects = resumeData.projects?.filter(project => 
      analysisResult.projectAnalysis.some(analysis => 
        analysis.title === project.title && analysis.suitable
      )
    ) || [];

    // Step 2: REMOVE existing low-scoring projects and REPLACE with new projects
    const finalProjects = [...suitableProjects]; // Start with only good existing projects
    
    // Step 3: Add new projects (replacements + suggestions) up to 3 total
    for (const newProject of newProjects) {
      if (finalProjects.length < 3) {
        finalProjects.push(newProject);
      } else {
        break; // Stop once we reach 3 projects maximum
      }
    }

    // Step 4: Create updated resume with replaced projects
    const updated = {
      ...resumeData,
      projects: finalProjects
    };

    setUpdatedResume(updated);
    
    // Log the replacement process
    const removedCount = (resumeData.projects?.length || 0) - suitableProjects.length;
    const addedCount = finalProjects.length - suitableProjects.length;
    console.log(`Project replacement: ${removedCount} low-scoring projects removed, ${addedCount} new projects added, ${suitableProjects.length} good projects kept. Total: ${finalProjects.length}/3`);
  };

  const handleFinish = () => {
    if (updatedResume) {
      onProjectsUpdated(updatedResume);
    }
    onClose();
  };

  const countSelectedProjects = () => {
    if (!analysisResult) return 0;
    
    let count = 0;
    
    // Count selected replacements
    for (const project of analysisResult.projectAnalysis) {
      if (!project.suitable && selectedReplacements[project.title]) {
        count++;
      }
    }
    
    // Count selected suggestions
    for (const project of analysisResult.suggestedProjects) {
      if (selectedSuggestions[project.title]) {
        count++;
      }
    }
    
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Project Analysis & Recommendations
            </h1>
            <p className="text-gray-600">
              Analyze your projects against job requirements and get personalized recommendations
            </p>
            
            {/* Analysis Mode Toggle */}
            <div className="mt-4 flex items-center justify-center space-x-4">
              <button
                onClick={() => setUseAdvancedAnalysis(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !useAdvancedAnalysis
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Standard Analysis
              </button>
              <button
                onClick={() => setUseAdvancedAnalysis(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  useAdvancedAnalysis
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Advanced Scoring (0-100)
              </button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'analysis' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                <Target className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Analysis</div>
                <div className="text-xs text-gray-500">Review project fit</div>
              </div>
            </div>
            <div className="w-16 h-1 bg-gray-200">
              <div className={`h-1 bg-blue-600 transition-all ${
                step === 'analysis' ? 'w-0' : step === 'selection' ? 'w-1/2' : 'w-full'
              }`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'selection' ? 'bg-blue-600 text-white' : step === 'preview' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Plus className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Selection</div>
                <div className="text-xs text-gray-500">Choose projects</div>
              </div>
            </div>
            <div className="w-16 h-1 bg-gray-200">
              <div className={`h-1 bg-blue-600 transition-all ${
                step === 'preview' ? 'w-full' : 'w-0'
              }`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Preview</div>
                <div className="text-xs text-gray-500">Review changes</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Projects</p>
              <p className="text-gray-600">We're comparing your projects with the job requirements...</p>
            </div>
          ) : step === 'analysis' && analysisResult ? (
            <div className="space-y-6">
              {/* Project Scoring Results */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Project Analysis Results
                </h2>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{analysisResult.summary.totalProjects}</div>
                    <div className="text-sm font-medium text-gray-700">Total Projects</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                    <div className="text-3xl font-bold text-green-600 mb-2">{analysisResult.summary.suitableProjects}</div>
                    <div className="text-sm font-medium text-gray-700">Well Aligned (80+)</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                    <div className="text-3xl font-bold text-red-600 mb-2">{analysisResult.summary.unsuitableProjects}</div>
                    <div className="text-sm font-medium text-gray-700">Need Replacement (&lt;80)</div>
                  </div>
                </div>

                {/* Individual Project Analysis */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Project-by-Project Analysis:</h3>
                
                  {analysisResult.projectAnalysis.map((project, index) => (
                    <div key={index} className={`border-2 rounded-xl p-5 transition-all ${
                      project.suitable 
                        ? 'border-green-300 bg-gradient-to-r from-green-50 to-green-100' 
                        : 'border-red-300 bg-gradient-to-r from-red-50 to-red-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full ${
                            project.suitable 
                              ? 'bg-green-200 text-green-700' 
                              : 'bg-red-200 text-red-700'
                          }`}>
                            {project.suitable ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">"{project.title}"</h4>
                            <div className="flex items-center space-x-3">
                              <span className={`text-sm font-medium ${
                                project.suitable ? 'text-green-700' : 'text-red-700'
                              }`}>
                                Score: {project.suitable ? '80+' : '<80'} / 100
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                project.suitable 
                                  ? 'bg-green-200 text-green-800' 
                                  : 'bg-red-200 text-red-800'
                              }`}>
                                {project.suitable ? '✅ KEEP' : '❌ REPLACE'}
                              </span>
                            </div>
                            {!project.suitable && project.reason && (
                              <p className="text-red-800 text-sm mt-2 font-medium">
                                💡 Why replace: {project.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${
                          project.suitable ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {project.suitable ? '👍' : '👎'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Message */}
                {analysisResult.summary.unsuitableProjects > 0 && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-200 p-2 rounded-full">
                        <AlertCircle className="w-5 h-5 text-orange-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-orange-800 text-lg">Action Required</h4>
                        <p className="text-orange-700 text-sm">
                          We found <strong>{analysisResult.summary.unsuitableProjects}</strong> project{analysisResult.summary.unsuitableProjects > 1 ? 's' : ''} that don't align well with your target role. 
                          You can replace {analysisResult.summary.unsuitableProjects === 1 ? 'it' : 'them'} with more relevant projects to improve your resume score.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleContinue}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span>
                    {analysisResult.summary.unsuitableProjects > 0 
                      ? `Replace ${analysisResult.summary.unsuitableProjects} Project${analysisResult.summary.unsuitableProjects > 1 ? 's' : ''}`
                      : 'Add More Projects'
                    }
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : step === 'selection' && analysisResult ? (
            <div className="space-y-6">
              {/* Replacement Projects Section */}
              {analysisResult.projectAnalysis.some(p => !p.suitable && p.replacementSuggestion) && (
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <RefreshCw className="w-5 h-5 mr-2 text-orange-600" />
                    Replacement Projects
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    {analysisResult.projectAnalysis.filter(p => !p.suitable && p.replacementSuggestion).map((project, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg bg-white p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start">
                            <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
                              <XCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">Replace: {project.title}</h3>
                              <p className="text-red-700 text-sm">{project.reason}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleReplacement(project.title)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              selectedReplacements[project.title]
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {selectedReplacements[project.title] ? 'Selected' : 'Select'}
                          </button>
                        </div>
                        
                        {project.replacementSuggestion && (
                          <div className="ml-10 border-l-2 border-blue-200 pl-4">
                            <div className="flex items-center mb-2">
                              <div className="p-1 rounded-full bg-blue-100 text-blue-600 mr-2">
                                <ArrowRight className="w-4 h-4" />
                              </div>
                              <h4 className="font-medium text-blue-800">{project.replacementSuggestion.title}</h4>
                              <a 
                                href={project.replacementSuggestion.githubUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Github className="w-4 h-4" />
                              </a>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700">
                              {project.replacementSuggestion.bulletPoints.map((bullet, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-blue-600 mr-2">•</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Suggested Projects Section */}
              {analysisResult.suggestedProjects.length > 0 && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-green-600" />
                    Suggested Additional Projects
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    {analysisResult.suggestedProjects.map((project, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg bg-white p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                              <Plus className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{project.title}</h3>
                              <div className="flex items-center mt-1">
                                <a 
                                  href={project.githubUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Github className="w-4 h-4 mr-1" />
                                  <span className="font-mono text-xs">{project.githubUrl.replace('https://github.com/', '')}</span>
                                </a>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleSuggestion(project.title)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              selectedSuggestions[project.title]
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {selectedSuggestions[project.title] ? 'Selected' : 'Select'}
                          </button>
                        </div>
                        
                        <ul className="space-y-2 text-sm text-gray-700 mt-3">
                          {project.bulletPoints.map((bullet, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-green-600 mr-2">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Manual Project Addition */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-purple-600" />
                    Add Project Manually
                  </h2>
                  <button
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center space-x-2"
                  >
                    {showManualForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{showManualForm ? 'Cancel' : 'Add Project'}</span>
                  </button>
                </div>
                
                {showManualForm && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Project Title *
                        </label>
                        <input
                          type="text"
                          value={manualProject.title}
                          onChange={(e) => setManualProject({...manualProject, title: e.target.value})}
                          placeholder="e.g., E-commerce Website"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tech Stack *
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={manualProject.newTech}
                            onChange={(e) => setManualProject({...manualProject, newTech: e.target.value})}
                            placeholder="Add technology (e.g., React, Node.js)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTech()}
                          />
                          <button
                            onClick={handleAddTech}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {manualProject.techStack.map((tech, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                            >
                              {tech}
                              <button
                                onClick={() => handleRemoveTech(tech)}
                                className="ml-2 text-purple-600 hover:text-purple-800"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brief Description (Optional)
                        </label>
                        <textarea
                          value={manualProject.description}
                          onChange={(e) => setManualProject({...manualProject, description: e.target.value})}
                          placeholder="Brief description of what the project does"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-20 resize-none"
                        />
                      </div>
                      
                      {manualBullets.length > 0 ? (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-800 mb-2 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Generated Bullet Points
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            {manualBullets.map((bullet, i) => (
                              <li key={i} className="flex items-start">
                                <span className="text-green-600 mr-2">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateManualBullets}
                          disabled={!manualProject.title || manualProject.techStack.length === 0 || generatingBullets}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          {generatingBullets ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Generating Bullet Points...</span>
                            </>
                          ) : (
                            <>
                              <Lightbulb className="w-4 h-4" />
                              <span>Generate Bullet Points</span>
                            </>
                          )}
                        </button>
                      )}
                      
                      {manualBullets.length > 0 && (
                        <button
                          onClick={handleAddManualProject}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Add Project to Resume
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {countSelectedProjects()} project{countSelectedProjects() !== 1 ? 's' : ''} selected
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('analysis')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleApplyChanges}
                    disabled={countSelectedProjects() === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center space-x-2"
                  >
                    <span>Apply Changes & Preview</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : step === 'preview' && updatedResume ? (
            <div className="space-y-6">
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Resume Updated with GitHub Projects
                  </h2>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Projects Section Preview</h3>
                  
                  <div className="space-y-4">
                    {updatedResume.projects?.map((project, index) => (
                      <div key={index} className="border-l-2 border-green-300 pl-4">
                        <h4 className="font-medium text-gray-900 mb-2">{project.title}</h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {project.bullets && project.bullets.map((bullet, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-green-600 mr-2">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                        {project.githubUrl && (
                          <a 
                            href={project.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1 mt-2"
                          >
                            <Github className="w-4 h-4 mr-1" />
                            <span className="font-mono text-xs">{project.githubUrl.replace('https://github.com/', '')}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">GitHub Links in Exported Resume</p>
                        <p>GitHub links will be included in the exported resume as references. They will appear in a separate section at the end of your resume.</p>
                      </div>
                    </div>
                    
                    {updatedResume.projects?.some(p => p.githubUrl) && (
                      <div className="mt-2 bg-white p-3 rounded-lg border border-blue-100">
                        <h5 className="font-medium text-blue-800 mb-2">🔗 Referenced Projects</h5>
                        <ul className="space-y-1">
                          {updatedResume.projects
                            .filter(p => p.githubUrl)
                            .map((p, idx) => (
                              <li key={idx} className="text-sm">
                                <span className="font-medium">{p.title}:</span>{' '}
                                <a 
                                  href={p.githubUrl as string} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 break-all"
                                >
                                  {p.githubUrl}
                                </a>
                              </li>
                            ))
                          }
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep('selection')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center space-x-2"
                >
                  <span>Apply Changes to Resume</span>
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">No Analysis Available</p>
              <p className="text-gray-600 mb-4">There was a problem analyzing your projects. Please try again.</p>
              <button
                onClick={analyzeProjects}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Retry Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};