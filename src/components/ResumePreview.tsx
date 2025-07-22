import React from 'react';
import { ResumeData, UserType } from '../types/resume';

interface ResumePreviewProps {
  resumeData: ResumeData;
  userType?: UserType;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeData, userType = 'experienced' }) => {
  // Debug logging to check what data we're receiving
  console.log('ResumePreview received data:', resumeData);
  
  // Add validation to ensure we have valid resume data
  if (!resumeData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-gray-500 mb-4">No resume data available</div>
          <div className="text-sm text-gray-400">Please ensure your resume has been properly optimized</div>
        </div>
      </div>
    );
  }

  // Ensure we have at least a name to display
  if (!resumeData.name || resumeData.name.trim() === '') {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-gray-500 mb-4">Invalid resume data</div>
          <div className="text-sm text-gray-400">Resume name is missing or empty</div>
        </div>
      </div>
    );
  }

  // Build contact info with bold labels and hyperlinks
  const buildContactInfo = () => {
    const contactElements = [];
    
    if (resumeData.phone) {
      contactElements.push(
        <span key="phone">
          <strong>Phone no: </strong>
          <a 
            href={`tel:${resumeData.phone}`} 
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {resumeData.phone}
          </a>
        </span>
      );
    }
    
    if (resumeData.email) {
      contactElements.push(
        <span key="email">
          <strong>Email: </strong>
          <a 
            href={`mailto:${resumeData.email}`} 
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {resumeData.email}
          </a>
        </span>
      );
    }
    
    if (resumeData.linkedin) {
      contactElements.push(
        <span key="linkedin">
          <strong>LinkedIn: </strong>
          <a 
            href={resumeData.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {resumeData.linkedin}
          </a>
        </span>
      );
    }
    
    if (resumeData.github) {
      contactElements.push(
        <span key="github">
          <strong>GitHub: </strong>
          <a 
            href={resumeData.github} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {resumeData.github}
          </a>
        </span>
      );
    }
    
    return contactElements;
  };

  const contactElements = buildContactInfo();

  // Define section order based on user type
  const getSectionOrder = () => {
    if (userType === 'experienced') {
      return [
        'summary',
        'workExperience',
        'projects',
        'skills',
        'certifications',
        'education' // Minimal for experienced
      ];
    } else {
      return [
        'summary', // Optional for freshers
        'education', // Prominent for freshers
        'workExperience', // Internships
        'projects', // Academic projects
        'skills',
        'achievements',
        'extraCurricularActivities',
        'certifications',
        'languagesKnown',
        'personalDetails'
      ];
    }
  };

  const sectionOrder = getSectionOrder();

  const renderSection = (sectionName: string) => {
    switch (sectionName) {
      case 'summary':
        if (!resumeData.summary) return null;
        return (
          <div className="mb-6" style={{ marginBottom: '18pt' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              marginTop: '6pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              PROFESSIONAL SUMMARY
            </h2>
            <div className="border-b border-gray-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: '12pt'
            }}></div>
            <p style={{ 
              fontSize: '11pt', 
              lineHeight: '1.15',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              {resumeData.summary}
            </p>
          </div>
        );

      case 'workExperience':
        if (!resumeData.workExperience || resumeData.workExperience.length === 0) return null;
        return (
          <div className="mb-6" style={{ marginBottom: '18pt' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              marginTop: '6pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              {userType === 'fresher' ? 'INTERNSHIPS & WORK EXPERIENCE' : 'WORK EXPERIENCE'}
            </h2>
            <div className="border-b border-gray-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: '12pt'
            }}></div>
            
            {resumeData.workExperience.map((job, index) => (
              <div key={index} className="mb-4" style={{ marginBottom: '12pt' }}>
                <div className="flex justify-between items-start mb-2" style={{ marginBottom: '6pt' }}>
                  <div>
                    <div className="font-bold" style={{ 
                      fontSize: '11pt', 
                      fontWeight: 'bold',
                      fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                    }}>
                      {job.role}
                    </div>
                    <div style={{ 
                      fontSize: '11pt',
                      fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                    }}>
                      {job.company}
                    </div>
                  </div>
                  <div className="font-bold" style={{ 
                    fontSize: '11pt', 
                    fontWeight: 'bold',
                    fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                  }}>
                    {job.year}
                  </div>
                </div>
                {job.bullets && job.bullets.length > 0 && (
                  <ul className="ml-4 space-y-1" style={{ marginLeft: '18pt' }}>
                    {job.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="leading-relaxed" style={{ 
                        fontSize: '11pt', 
                        lineHeight: '1.15',
                        marginBottom: '6pt',
                        fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                      }}>
                        • {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );

      case 'education':
        if (!resumeData.education || resumeData.education.length === 0) return null;
        // For experienced professionals, show education minimally unless it's important
        const showEducationProminently = userType === 'fresher';
        
        return (
          <div className="mb-6" style={{ marginBottom: '18pt' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: showEducationProminently ? '14pt' : '12pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              marginTop: '6pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              EDUCATION
            </h2>
            <div className="border-b border-gray-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: '12pt'
            }}></div>
            
            {resumeData.education.map((edu, index) => (
              <div key={index} className="mb-3" style={{ marginBottom: '12pt' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold" style={{ 
                      fontSize: '11pt', 
                      fontWeight: 'bold',
                      fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                    }}>
                      {edu.degree}
                    </div>
                    <div style={{ 
                      fontSize: '11pt',
                      fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                    }}>
                      {edu.school}
                    </div>
                    {edu.cgpa && (
                      <div style={{ 
                        fontSize: '10pt',
                        fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                        color: '#4B5563'
                      }}>
                        CGPA: {edu.cgpa}
                      </div>
                    )}
                  </div>
                  <div className="font-bold" style={{ 
                    fontSize: '11pt', 
                    fontWeight: 'bold',
                    fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                  }}>
                    {edu.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'projects':
        if (!resumeData.projects || resumeData.projects.length === 0) return null;
        return (
          <div className="mb-6" style={{ marginBottom: '18pt' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              marginTop: '6pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              {userType === 'fresher' ? 'ACADEMIC PROJECTS' : 'PROJECTS'}
            </h2>
            <div className="border-b border-gray-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: '12pt'
            }}></div>
            
            {resumeData.projects.map((project, index) => (
              <div key={index} className="mb-4" style={{ marginBottom: '12pt' }}>
                <div className="font-bold mb-1" style={{ 
                  fontSize: '11pt', 
                  fontWeight: 'bold',
                  marginBottom: '6pt',
                  fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                }}>
                  {project.title}
                </div>
                {project.bullets && project.bullets.length > 0 && (
                  <ul className="ml-4 space-y-1" style={{ marginLeft: '18pt' }}>
                    {project.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="leading-relaxed" style={{ 
                        fontSize: '11pt', 
                        lineHeight: '1.15',
                        marginBottom: '6pt',
                        fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                      }}>
                        • {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );

      case 'skills':
        if (!resumeData.skills || resumeData.skills.length === 0) return null;
        return (
          <div className="mb-6" style={{ marginBottom: '18pt' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              marginTop: '6pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              TECHNICAL SKILLS
            </h2>
            <div className="border-b border-gray-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: '12pt'
            }}></div>
            
            {resumeData.skills.map((skill, index) => (
              <div key={index} className="mb-2" style={{ marginBottom: '6pt' }}>
                <span style={{ 
                  fontSize: '11pt',
                  fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                }}>
                  <span className="font-bold">• {skill.category}:</span>{' '}
                  {skill.list && skill.list.join(', ')}
                </span>
              </div>
            ))}
          </div>
        );

      case 'achievements':
        if (!resumeData.achievements || resumeData.achievements.length === 0) return null;
        return (
          <div className="mb-6" style={{ marginBottom: '18pt' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              marginTop: '6pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              ACHIEVEMENTS
            </h2>
            <div className="border-b border-gray-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: '12pt'
            }}></div>
            
            <ul className="ml-4 space-y-1" style={{ marginLeft: '18pt' }}>
              {resumeData.achievements.map((achievement, index) => (
                <li key={index} style={{ 
                  fontSize: '11pt',
                  marginBottom: '6pt',
                  fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                }}>
                  • {achievement}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'extraCurricularActivities':
        if (!resumeData.extraCurricularActivities || resumeData.extraCurricularActivities.length === 0) return null;
        return (
          <div className="mb-6" style={{ marginBottom: '18pt' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              marginTop: '6pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              EXTRA-CURRICULAR ACTIVITIES
            </h2>
            <div className="border-b border-gray-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: '12pt'
            }}></div>
            
            <ul className="ml-4 space-y-1" style={{ marginLeft: '18pt' }}>
              {resumeData.extraCurricularActivities.map((activity, index) => (
                <li key={index} style={{ 
                  fontSize: '11pt',
                  marginBottom: '6pt',
                  fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                }}>
                  • {activity}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'certifications':
        if (!resumeData.certifications || resumeData.certifications.length === 0) return null;
        return (
          <div className="mb-6" style={{ marginBottom: '18pt' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              marginTop: '6pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              CERTIFICATIONS
            </h2>
            <div className="border-b border-gray-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: '12pt'
            }}></div>
            
            <ul className="ml-4 space-y-1" style={{ marginLeft: '18pt' }}>
              {resumeData.certifications.map((cert, index) => {
                // Handle both string and object formats
                let certText = '';
                if (typeof cert === 'string') {
                  certText = cert;
                } else if (cert && typeof cert === 'object') {
                  // Handle object format with title and issuer
                  if ('title' in cert && 'issuer' in cert) {
                    certText = `${String(cert.title)} - ${String(cert.issuer)}`;
                  } else if ('title' in cert && 'description' in cert) {
                    certText = `${String(cert.title)} - ${String(cert.description)}`;
                  } else if ('name' in cert) {
                    certText = String(cert.name);
                  } else if ('title' in cert) {
                    certText = String(cert.title);
                  } else if ('description' in cert) {
                    certText = cert.description;
                  } else {
                    certText = JSON.stringify(cert);
                  }
                } else {
                  certText = String(cert);
                }
                
                return (
                  <li key={index} style={{ 
                    fontSize: '11pt',
                    marginBottom: '6pt',
                    fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                  }}>
                    • {certText}
                  </li>
                );
              })}
            </ul>
          </div>
        );

      case 'languagesKnown':
        if (!resumeData.languagesKnown || resumeData.languagesKnown.length === 0) return null;
        return (
          <div className="mb-6" style={{ marginBottom: '18pt' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              marginTop: '6pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              LANGUAGES KNOWN
            </h2>
            <div className="border-b border-gray-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: '12pt'
            }}></div>
            
            <p style={{ 
              fontSize: '11pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              {resumeData.languagesKnown.join(', ')}
            </p>
          </div>
        );

      case 'personalDetails':
        if (!resumeData.personalDetails) return null;
        return (
          <div className="mb-6" style={{ marginBottom: '18pt' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              marginTop: '6pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              PERSONAL DETAILS
            </h2>
            <div className="border-b border-gray-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: '12pt'
            }}></div>
            
            <p style={{ 
              fontSize: '11pt',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              {resumeData.personalDetails}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div 
        className="pt-4 px-4 pb-6 sm:pt-6 sm:px-6 sm:pb-8 lg:px-8 max-h-[70vh] sm:max-h-[80vh] lg:max-h-[800px] overflow-y-auto" 
        style={{ 
          fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif', 
          fontSize: 'clamp(10pt, 2.5vw, 11pt)', 
          lineHeight: '1.15', 
          color: '#000'
        }}
      >
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6" style={{ marginBottom: 'clamp(16pt, 4vw, 24pt)' }}>
          <h1 className="font-bold mb-3 tracking-widest uppercase" style={{ 
            fontSize: 'clamp(16pt, 4vw, 18pt)', 
            fontWeight: 'bold', 
            letterSpacing: '2pt',
            marginBottom: 'clamp(8pt, 2vw, 12pt)',
            fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
          }}>
            {resumeData.name}
          </h1>
          
          {/* Contact Information */}
          {contactElements.length > 0 && (
            <div className="flex justify-center items-center gap-2 sm:gap-3 flex-wrap mb-3 sm:mb-4" style={{ 
              fontSize: 'clamp(9pt, 2vw, 11pt)',
              marginBottom: 'clamp(8pt, 2vw, 12pt)'
            }}>
              {contactElements.map((element, index) => (
                <React.Fragment key={index}>
                  {element}
                  {index < contactElements.length - 1 && <span className="hidden sm:inline">•</span>}
                </React.Fragment>
              ))}
            </div>
          )}
          
          {/* Horizontal line under contact info */}
          <div className="border-b-2 border-secondary-600 mx-4 sm:mx-8" style={{ 
            borderBottomWidth: '2px', 
            borderColor: '#4B5563'
          }}></div>
        </div>

        {/* Dynamic sections based on user type */}
        {sectionOrder.map((sectionName) => renderSection(sectionName))}
        
        {/* GitHub References Section - Always at the end */}
        {resumeData.projects?.some(project => project.githubUrl) && (
          <div className="mb-4 sm:mb-6" style={{ marginBottom: 'clamp(12pt, 3vw, 18pt)' }}>
            <h2 className="font-bold mb-2 uppercase tracking-wide" style={{ 
              fontSize: 'clamp(12pt, 3vw, 14pt)', 
              fontWeight: 'bold', 
              marginBottom: 'clamp(4pt, 1.5vw, 6pt)',
              marginTop: 'clamp(4pt, 1.5vw, 6pt)',
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            }}>
              REFERENCED PROJECTS
            </h2>
            <div className="border-b border-secondary-400 mb-3" style={{ 
              borderBottomWidth: '1px', 
              borderColor: '#9CA3AF',
              marginBottom: 'clamp(8pt, 2vw, 12pt)'
            }}></div>
            
            <ul className="ml-3 sm:ml-4 space-y-1" style={{ marginLeft: 'clamp(12pt, 3vw, 18pt)' }}>
              {resumeData.projects
                .filter(project => project.githubUrl)
                .map((project, index) => (
                  <li key={index} style={{ 
                    fontSize: 'clamp(9pt, 2vw, 11pt)',
                    marginBottom: 'clamp(4pt, 1vw, 6pt)',
                    fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                  }}>
                    • <strong>{project.title}:</strong>{' '}
                    <a 
                      href={project.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 transition-colors break-all"
                    >
                      {project.githubUrl}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};