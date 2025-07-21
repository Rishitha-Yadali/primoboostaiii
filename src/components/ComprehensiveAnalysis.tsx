import React, { useState } from 'react';
import { MatchScore, DetailedScore, ResumeData } from '../types/resume';
import { RecommendedProject } from '../types/analysis';
import { TrendingUp, Target, CheckCircle, AlertCircle, ArrowRight, Eye, BarChart3, RefreshCw, Award, Users, BookOpen, Code, FileText, Lightbulb, Clock, Star, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { getDetailedResumeScore } from '../services/scoringService';
import { analyzeProjectAlignment } from '../services/projectAnalysisService';

interface ComprehensiveAnalysisProps {
  beforeScore: MatchScore;
  afterScore: MatchScore;
  changedSections: string[];
  resumeData: ResumeData;
  jobDescription: string;
  targetRole: string;
}

export const ComprehensiveAnalysis: React.FC<ComprehensiveAnalysisProps> = ({
  beforeScore,
  afterScore,
  changedSections,
  resumeData,
  jobDescription,
  targetRole
}) => {
  const improvement = afterScore.score - beforeScore.score;

  // Pie chart component
  const PieChart: React.FC<{ score: number; size?: number; strokeWidth?: number; showLabel?: boolean }> = ({ 
    score, 
    size = 120, 
    strokeWidth = 8,
    showLabel = true
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    const getColor = (score: number) => {
      if (score >= 90) return '#10B981'; // Green
      if (score >= 80) return '#3B82F6'; // Blue
      if (score >= 70) return '#F59E0B'; // Yellow
      if (score >= 60) return '#F97316'; // Orange
      return '#EF4444'; // Red
    };

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Score text */}
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{score}%</div>
              <div className="text-xs sm:text-sm text-gray-500">Score</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSectionDisplayName = (section: string) => {
    const sectionNames: { [key: string]: string } = {
      'summary': 'Professional Summary',
      'workExperience': 'Work Experience',
      'education': 'Education',
      'projects': 'Projects',
      'skills': 'Technical Skills',
      'certifications': 'Certifications',
      'achievements': 'Achievements',
      'extraCurricularActivities': 'Extra-curricular Activities',
      'languagesKnown': 'Languages Known',
      'personalDetails': 'Personal Details'
    };
    return sectionNames[section] || section;
  };

  return (
    <div className="card border border-secondary-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-green-50 p-4 sm:p-6 border-b border-secondary-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-primary-600 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mr-3 sm:mr-4">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-fluid-lg sm:text-fluid-xl font-bold text-secondary-900">Resume Analysis Complete</h2>
              <p className="text-fluid-xs sm:text-fluid-sm text-secondary-600">Score Improvement & Optimization Results</p>
            </div>
          </div>
          
          {/* Improvement Badge */}
          <div className={`px-3 sm:px-4 py-2 rounded-full font-bold text-fluid-sm ${
            improvement > 0 
              ? 'bg-green-100 text-green-800' 
              : improvement < 0 
              ? 'bg-red-100 text-red-800' 
              : 'bg-secondary-100 text-secondary-800'
          }`}>
            {improvement > 0 ? '+' : ''}{improvement} points
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Score Comparison Section */}
        <div className="mb-6 lg:mb-8">
          <h3 className="text-fluid-lg sm:text-fluid-xl font-bold text-secondary-900 mb-4 lg:mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600" />
            Score Comparison
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-4 lg:mb-6">
            {/* Before Score */}
            <div className="text-center">
              <h4 className="text-fluid-base sm:text-fluid-lg font-semibold text-secondary-900 mb-3 sm:mb-4">Before Optimization</h4>
              <div className="flex justify-center mb-3 sm:mb-4">
                <PieChart score={beforeScore.score} size={100} strokeWidth={6} />
              </div>
              <div className="mb-3">
                <span className="px-3 py-1 rounded-full text-fluid-sm font-medium bg-red-100 text-red-800">
                  Needs Improvement
                </span>
              </div>
              <p className="text-fluid-xs sm:text-fluid-sm text-secondary-600 leading-relaxed">
                {beforeScore.analysis}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="hidden lg:flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full">
                <ArrowRight className="w-8 h-8 text-primary-600" />
              </div>
              <div className="lg:hidden flex items-center justify-center py-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center rotate-90">
                  <ArrowRight className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            {/* After Score */}
            <div className="text-center">
              <h4 className="text-fluid-base sm:text-fluid-lg font-semibold text-secondary-900 mb-3 sm:mb-4">After Optimization</h4>
              <div className="flex justify-center mb-3 sm:mb-4">
                <PieChart score={afterScore.score} size={100} strokeWidth={6} />
              </div>
              <div className="mb-3">
                <span className="px-3 py-1 rounded-full text-fluid-sm font-medium bg-green-100 text-green-800">
                  Excellent
                </span>
              </div>
              <p className="text-fluid-xs sm:text-fluid-sm text-secondary-600 leading-relaxed">
                {afterScore.analysis}
              </p>
            </div>
          </div>

          {/* Changed Sections */}
          {changedSections.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-primary-50 rounded-xl p-4 sm:p-6 mb-4 lg:mb-6">
              <h4 className="text-fluid-base sm:text-fluid-lg font-semibold text-secondary-900 mb-3 sm:mb-4 flex items-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                Sections Optimized
              </h4>
              <div className="grid-responsive gap-2 sm:gap-3">
                {changedSections.map((section, index) => (
                  <div key={index} className="flex items-center bg-white rounded-lg p-2 sm:p-3 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    <span className="text-fluid-xs sm:text-fluid-sm font-medium text-secondary-900">
                      {getSectionDisplayName(section)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Key Strengths and Improvements */}
        <div className="grid-responsive-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Key Strengths */}
          <div className="bg-green-50 rounded-xl p-4 sm:p-6 border border-green-200">
            <h4 className="text-fluid-base sm:text-fluid-lg font-semibold text-secondary-900 mb-3 sm:mb-4 flex items-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
              Key Strengths
            </h4>
            <ul className="space-y-2">
              {afterScore.keyStrengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="text-fluid-xs sm:text-fluid-sm text-secondary-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Further Improvement */}
          <div className="bg-primary-50 rounded-xl p-4 sm:p-6 border border-primary-200">
            <h4 className="text-fluid-base sm:text-fluid-lg font-semibold text-secondary-900 mb-3 sm:mb-4 flex items-center">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600" />
              Areas for Further Improvement
            </h4>
            <ul className="space-y-2">
              {afterScore.improvementAreas.map((area, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="text-fluid-xs sm:text-fluid-sm text-secondary-700">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <Award className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-fluid-base sm:text-fluid-lg font-bold text-secondary-900">
                🎉 Optimization Complete!
              </h3>
            </div>
            <p className="text-fluid-xs sm:text-fluid-sm text-secondary-700 mb-3">
              Your resume score improved by <strong>{improvement} points</strong> (from {beforeScore.score}% to {afterScore.score}%), 
              making it significantly more competitive and likely to pass ATS systems.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-fluid-xs">
              <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full">
                ATS Optimized
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                Keyword Enhanced
              </span>
              <span className="px-2 py-1 bg-accent-100 text-accent-800 rounded-full">
                Industry Aligned
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                {afterScore.score >= 90 ? 'Excellent Score' : 'Good Score'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};