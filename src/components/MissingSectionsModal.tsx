import React, { useState } from 'react';
import { X, Plus, Briefcase, Code, Award, AlertCircle, CheckCircle, Calendar, Building } from 'lucide-react';

interface WorkExperience {
  role: string;
  company: string;
  year: string;
  bullets: string[];
}

interface Project {
  title: string;
  bullets: string[];
}

interface MissingSectionsData {
  workExperience?: WorkExperience[];
  projects?: Project[];
  certifications?: string[];
}

interface MissingSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingSections: string[];
  onSectionsProvided: (data: MissingSectionsData) => void;
}

export const MissingSectionsModal: React.FC<MissingSectionsModalProps> = ({
  isOpen,
  onClose,
  missingSections,
  onSectionsProvided
}) => {
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([
    { role: '', company: '', year: '', bullets: [''] }
  ]);
  const [projects, setProjects] = useState<Project[]>([
    { title: '', bullets: [''] }
  ]);
  const [certifications, setCertifications] = useState<string[]>(['']);
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, { role: '', company: '', year: '', bullets: [''] }]);
  };

  const removeWorkExperience = (index: number) => {
    if (workExperience.length > 1) {
      setWorkExperience(workExperience.filter((_, i) => i !== index));
    }
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperience(updated);
  };

  const addWorkBullet = (workIndex: number) => {
    const updated = [...workExperience];
    updated[workIndex].bullets.push('');
    setWorkExperience(updated);
  };

  const updateWorkBullet = (workIndex: number, bulletIndex: number, value: string) => {
    const updated = [...workExperience];
    updated[workIndex].bullets[bulletIndex] = value;
    setWorkExperience(updated);
  };

  const removeWorkBullet = (workIndex: number, bulletIndex: number) => {
    const updated = [...workExperience];
    if (updated[workIndex].bullets.length > 1) {
      updated[workIndex].bullets.splice(bulletIndex, 1);
      setWorkExperience(updated);
    }
  };

  const addProject = () => {
    setProjects([...projects, { title: '', bullets: [''] }]);
  };

  const removeProject = (index: number) => {
    if (projects.length > 1) {
      setProjects(projects.filter((_, i) => i !== index));
    }
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const addProjectBullet = (projectIndex: number) => {
    const updated = [...projects];
    updated[projectIndex].bullets.push('');
    setProjects(updated);
  };

  const updateProjectBullet = (projectIndex: number, bulletIndex: number, value: string) => {
    const updated = [...projects];
    updated[projectIndex].bullets[bulletIndex] = value;
    setProjects(updated);
  };

  const removeProjectBullet = (projectIndex: number, bulletIndex: number) => {
    const updated = [...projects];
    if (updated[projectIndex].bullets.length > 1) {
      updated[projectIndex].bullets.splice(bulletIndex, 1);
      setProjects(updated);
    }
  };

  const addCertification = () => {
    setCertifications([...certifications, '']);
  };

  const removeCertification = (index: number) => {
    if (certifications.length > 1) {
      setCertifications(certifications.filter((_, i) => i !== index));
    }
  };

  const updateCertification = (index: number, value: string) => {
    const updated = [...certifications];
    updated[index] = value;
    setCertifications(updated);
  };

  const validateCurrentSection = () => {
    const currentSection = missingSections[currentStep];
    
    if (currentSection === 'workExperience') {
      return workExperience.some(we => we.role.trim() && we.company.trim() && we.year.trim());
    }
    
    if (currentSection === 'projects') {
      return projects.some(p => p.title.trim() && p.bullets.some(b => b.trim()));
    }
    
    if (currentSection === 'certifications') {
      return certifications.some(c => c.trim());
    }
    
    return false;
  };

  const handleNext = () => {
    if (currentStep < missingSections.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const data: MissingSectionsData = {};
    
    if (missingSections.includes('workExperience')) {
      data.workExperience = workExperience.filter(we => 
        we.role.trim() && we.company.trim() && we.year.trim()
      ).map(we => ({
        ...we,
        bullets: we.bullets.filter(b => b.trim())
      }));
    }
    
    if (missingSections.includes('projects')) {
      data.projects = projects.filter(p => 
        p.title.trim() && p.bullets.some(b => b.trim())
      ).map(p => ({
        ...p,
        bullets: p.bullets.filter(b => b.trim())
      }));
    }
    
    if (missingSections.includes('certifications')) {
      data.certifications = certifications.filter(c => c.trim());
    }
    
    onSectionsProvided(data);
    onClose();
  };

  const currentSection = missingSections[currentStep];
  const isValid = validateCurrentSection();

  const renderWorkExperienceForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-blue-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Work Experience</h3>
        <p className="text-sm sm:text-base text-gray-600">Please provide your work experience details</p>
      </div>

      {workExperience.map((work, workIndex) => (
        <div key={workIndex} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Experience #{workIndex + 1}</h4>
            {workExperience.length > 1 && (
              <button
                onClick={() => removeWorkExperience(workIndex)}
                className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={work.role}
                onChange={(e) => updateWorkExperience(workIndex, 'role', e.target.value)}
                placeholder="e.g., Software Engineer"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <input
                type="text"
                value={work.company}
                onChange={(e) => updateWorkExperience(workIndex, 'company', e.target.value)}
                placeholder="e.g., TechCorp Inc."
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Duration *
            </label>
            <input
              type="text"
              value={work.year}
              onChange={(e) => updateWorkExperience(workIndex, 'year', e.target.value)}
              placeholder="e.g., Jan 2023 - Present"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Key Responsibilities
            </label>
            {work.bullets.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateWorkBullet(workIndex, bulletIndex, e.target.value)}
                  placeholder="Describe your responsibility/achievement"
                  className="w-full sm:flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]"
                />
                {work.bullets.length > 1 && (
                  <button
                    onClick={() => removeWorkBullet(workIndex, bulletIndex)}
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-red-300 rounded-lg sm:border-none"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addWorkBullet(workIndex)}
              className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex items-center min-h-[44px] w-full sm:w-auto justify-center sm:justify-start p-2 border border-blue-300 rounded-lg sm:border-none sm:p-0"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Add Responsibility
            </button>
          </div>
        </div>
      ))}
      
      <button
        onClick={addWorkExperience}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Experience
      </button>
    </div>
  );

  const renderProjectsForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-green-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Code className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Projects</h3>
        <p className="text-sm sm:text-base text-gray-600">Please provide your project details</p>
      </div>

      {projects.map((project, projectIndex) => (
        <div key={projectIndex} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Project #{projectIndex + 1}</h4>
            {projects.length > 1 && (
              <button
                onClick={() => removeProject(projectIndex)}
                className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={project.title}
              onChange={(e) => updateProject(projectIndex, 'title', e.target.value)}
              placeholder="e.g., E-commerce Website"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm min-h-[44px]"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Project Details
            </label>
            {project.bullets.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateProjectBullet(projectIndex, bulletIndex, e.target.value)}
                  placeholder="Describe what you built/achieved"
                  className="w-full sm:flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm min-h-[44px]"
                />
                {project.bullets.length > 1 && (
                  <button
                    onClick={() => removeProjectBullet(projectIndex, bulletIndex)}
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-red-300 rounded-lg sm:border-none"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addProjectBullet(projectIndex)}
              className="text-green-600 hover:text-green-700 text-xs sm:text-sm font-medium flex items-center min-h-[44px] w-full sm:w-auto justify-center sm:justify-start p-2 border border-green-300 rounded-lg sm:border-none sm:p-0"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Add Detail
            </button>
          </div>
        </div>
      ))}
      
      <button
        onClick={addProject}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Project
      </button>
    </div>
  );

  const renderCertificationsForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-purple-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Certifications</h3>
        <p className="text-sm sm:text-base text-gray-600">Please provide your certifications</p>
      </div>

      {certifications.map((cert, index) => (
        <div key={index} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={cert}
            onChange={(e) => updateCertification(index, e.target.value)}
            placeholder="e.g., AWS Certified Solutions Architect"
            className="w-full sm:flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm min-h-[44px]"
          />
          {certifications.length > 1 && (
            <button
              onClick={() => removeCertification(index)}
              className="w-full sm:w-auto text-red-600 hover:text-red-700 p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-red-300 rounded-lg sm:border-none"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      ))}
      
      <button
        onClick={addCertification}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Certification
      </button>
    </div>
  );

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'workExperience': return <Briefcase className="w-4 h-4" />;
      case 'projects': return <Code className="w-4 h-4" />;
      case 'certifications': return <Award className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getSectionName = (section: string) => {
    switch (section) {
      case 'workExperience': return 'Work Experience';
      case 'projects': return 'Projects';
      case 'certifications': return 'Certifications';
      default: return section;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-4xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-50 to-red-50 p-3 sm:p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50 min-w-[44px] min-h-[44px]"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 px-4">
              Complete Your Resume
            </h1>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              We found some missing sections that are important for optimization
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-4 sm:mb-8">
            {missingSections.map((section, index) => (
              <div key={section} className="flex items-center w-full sm:w-auto">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index < currentStep ? 'bg-green-500 text-white' :
                  index === currentStep ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {index < currentStep ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : getSectionIcon(section)}
                </div>
                <div className="ml-3">
                  <div className="text-xs sm:text-sm font-medium text-gray-900">{getSectionName(section)}</div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {index < currentStep ? 'Completed' :
                     index === currentStep ? 'Current' : 'Pending'}
                  </div>
                </div>
                {index < missingSections.length - 1 && index < currentStep && (
                  <div className={`w-16 h-1 mx-4 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  } hidden sm:block`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {currentSection === 'workExperience' && renderWorkExperienceForm()}
          {currentSection === 'projects' && renderProjectsForm()}
          {currentSection === 'certifications' && renderCertificationsForm()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 flex-shrink-0">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px]"
          >
            Previous
          </button>
          
          <div className="text-xs sm:text-sm text-gray-500 order-first sm:order-none">
            Step {currentStep + 1} of {missingSections.length}
          </div>
          
          <button
            onClick={handleNext}
            disabled={!isValid}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed text-sm min-h-[44px]"
          >
            {currentStep === missingSections.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};