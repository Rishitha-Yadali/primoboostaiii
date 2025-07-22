interface Education {
  degree: string;
  school: string;
  year: string;
  cgpa?: string;
}

interface WorkExperience {
  role: string;
  company: string;
  year: string;
  bullets: string[];
}

interface Project {
  title: string;
  bullets: string[];
  githubUrl?: string;
}

interface Skill {
  category: string;
  count: number;
  list: string[];
}

export interface ResumeData {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  targetRole?: string; // Added target role field
  summary?: string; // Professional summary for experienced professionals
  education: Education[];
  workExperience: WorkExperience[];
  projects: Project[];
  skills: Skill[];
  certifications: string[];
  achievements?: string[]; // For freshers - awards, achievements
  extraCurricularActivities?: string[]; // For freshers - activities, leadership
  languagesKnown?: string[]; // For freshers - languages spoken
  personalDetails?: string; // For freshers - personal information
}

export type UserType = 'fresher' | 'experienced';

export interface MatchScore {
  score: number;
  analysis: string;
  keyStrengths: string[];
  improvementAreas: string[];
}

export interface DetailedScore {
  totalScore: number;
  breakdown: {
    projects: {
      score: number;
      maxScore: 25;
      details: string;
      completionRate: number;
    };
    technicalSkills: {
      score: number;
      maxScore: 25;
      details: string;
      relevantSkills: number;
    };
    experience: {
      score: number;
      maxScore: 25;
      details: string;
      yearsOfExperience: number;
      internships: number;
      leadershipRoles: number;
    };
    educationCertifications: {
      score: number;
      maxScore: 15;
      details: string;
      hasBachelors: boolean;
      hasMasters: boolean;
      certificationCount: number;
    };
    resumeStructure: {
      score: number;
      maxScore: 10;
      details: string;
      hasProperSections: boolean;
      hasConsistentFormatting: boolean;
      isATSFriendly: boolean;
    };
  };
  recommendations: string[];
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
}