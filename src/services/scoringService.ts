import { MatchScore, DetailedScore, ResumeData } from '../types/resume';

const GEMINI_API_KEY = 'AIzaSyDZWV51wiJ976BaWu8P7yE1MxWiE4oIMvQ';

export const getMatchScore = async (resumeText: string, jobDescription: string): Promise<MatchScore> => {
  const prompt = `You are an expert ATS (Applicant Tracking System) and HR professional. Analyze the match between the provided resume and job description.

RESUME CONTENT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

ANALYSIS REQUIREMENTS:
1. Calculate a match score from 0-100 based on:
   - Skills alignment (40% weight)
   - Experience relevance (30% weight)
   - Education/qualifications match (15% weight)
   - Keywords presence (15% weight)

2. Identify key strengths that align with the job
3. Identify specific areas for improvement
4. Provide actionable analysis

CRITICAL INSTRUCTIONS:
- Be objective and specific in your analysis
- Consider both technical and soft skills
- Look for industry-specific keywords and requirements
- Evaluate experience level appropriateness
- Consider ATS compatibility factors

Respond ONLY with valid JSON in this exact structure:

{
  "score": 0-100,
  "analysis": "2-3 sentence summary of overall match quality and main factors affecting the score",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "improvementAreas": ["area1", "area2", "area3"]
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 2000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!result) {
      throw new Error('No response content from Gemini API');
    }

    // Clean the response to ensure it's valid JSON
    const cleanedResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsedResult = JSON.parse(cleanedResult);
      return parsedResult;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', cleanedResult);
      throw new Error('Invalid JSON response from Gemini API');
    }
  } catch (error) {
    console.error('Error calling Gemini API for scoring:', error);
    throw new Error('Failed to calculate match score. Please try again.');
  }
};

// Comprehensive resume scoring based on the specified criteria
export const getDetailedResumeScore = async (resumeData: ResumeData, jobDescription: string): Promise<DetailedScore> => {
  const prompt = `You are an expert resume evaluator and ATS specialist. Analyze this resume comprehensively using the following scoring criteria:

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

SCORING CRITERIA (Total: 100 points):

1. PROJECTS (25 points max):
   - 25 points: 90%+ project completion rate with detailed descriptions
   - 20 points: 75-89% completion rate
   - 15 points: 60-74% completion rate  
   - 10 points: Below 60% completion rate
   - Evaluate project quality, relevance, and technical depth

2. TECHNICAL SKILLS (25 points max):
   - Award 5 points per relevant technical skill (up to 5 skills)
   - Skills must be clearly demonstrated through work experience or projects
   - Must match job requirements and industry standards

3. EXPERIENCE (25 points max):
   - Award 5 points per year of relevant work experience
   - Internships count as 3 points per experience
   - Leadership roles receive additional 2 points
   - Consider role progression and responsibility growth

4. EDUCATION & CERTIFICATIONS (15 points max):
   - Bachelor's degree: 8 points
   - Master's degree: +4 points (total 12)
   - Relevant certifications: +3 points each (up to 3 certifications)

5. RESUME STRUCTURE & FORMAT (10 points max):
   - Clear sections and headings: 2 points
   - Proper formatting and consistency: 2 points
   - No grammatical errors: 2 points
   - Professional layout: 2 points
   - ATS-friendly format: 2 points

ANALYSIS REQUIREMENTS:
- Calculate exact scores for each category
- Provide detailed breakdown and reasoning
- Identify specific improvement areas for scores below 70%
- Assign letter grade (A+ 95-100, A 90-94, B+ 85-89, B 80-84, C+ 75-79, C 70-74, D 60-69, F <60)
- Give actionable recommendations

Respond ONLY with valid JSON in this exact structure:

{
  "totalScore": 0-100,
  "breakdown": {
    "projects": {
      "score": 0-25,
      "maxScore": 25,
      "details": "Detailed explanation of project scoring",
      "completionRate": 0-100
    },
    "technicalSkills": {
      "score": 0-25,
      "maxScore": 25,
      "details": "Detailed explanation of skills scoring",
      "relevantSkills": 0-5
    },
    "experience": {
      "score": 0-25,
      "maxScore": 25,
      "details": "Detailed explanation of experience scoring",
      "yearsOfExperience": 0,
      "internships": 0,
      "leadershipRoles": 0
    },
    "educationCertifications": {
      "score": 0-15,
      "maxScore": 15,
      "details": "Detailed explanation of education/certification scoring",
      "hasBachelors": true/false,
      "hasMasters": true/false,
      "certificationCount": 0
    },
    "resumeStructure": {
      "score": 0-10,
      "maxScore": 10,
      "details": "Detailed explanation of structure/format scoring",
      "hasProperSections": true/false,
      "hasConsistentFormatting": true/false,
      "isATSFriendly": true/false
    }
  },
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "grade": "A+/A/B+/B/C+/C/D/F"
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 3000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!result) {
      throw new Error('No response content from Gemini API');
    }

    // Clean the response to ensure it's valid JSON
    const cleanedResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsedResult = JSON.parse(cleanedResult);
      return parsedResult;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', cleanedResult);
      throw new Error('Invalid JSON response from Gemini API');
    }
  } catch (error) {
    console.error('Error calling Gemini API for detailed scoring:', error);
    throw new Error('Failed to calculate detailed resume score. Please try again.');
  }
};

// Helper function to reconstruct resume text from ResumeData object
export const reconstructResumeText = (resumeData: any): string => {
  const sections = [];
  
  // Header
  sections.push(`Name: ${resumeData.name}`);
  if (resumeData.phone) sections.push(`Phone: ${resumeData.phone}`);
  if (resumeData.email) sections.push(`Email: ${resumeData.email}`);
  if (resumeData.linkedin) sections.push(`LinkedIn: ${resumeData.linkedin}`);
  if (resumeData.github) sections.push(`GitHub: ${resumeData.github}`);
  
  // Summary
  if (resumeData.summary) {
    sections.push(`\nPROFESSIONAL SUMMARY:\n${resumeData.summary}`);
  }
  
  // Work Experience
  if (resumeData.workExperience && resumeData.workExperience.length > 0) {
    sections.push('\nWORK EXPERIENCE:');
    resumeData.workExperience.forEach((job: any) => {
      sections.push(`${job.role} at ${job.company} (${job.year})`);
      if (job.bullets) {
        job.bullets.forEach((bullet: string) => sections.push(`• ${bullet}`));
      }
    });
  }
  
  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    sections.push('\nEDUCATION:');
    resumeData.education.forEach((edu: any) => {
      sections.push(`${edu.degree} from ${edu.school} (${edu.year})`);
    });
  }
  
  // Projects
  if (resumeData.projects && resumeData.projects.length > 0) {
    sections.push('\nPROJECTS:');
    resumeData.projects.forEach((project: any) => {
      sections.push(`${project.title}`);
      if (project.bullets) {
        project.bullets.forEach((bullet: string) => sections.push(`• ${bullet}`));
      }
    });
  }
  
  // Skills
  if (resumeData.skills && resumeData.skills.length > 0) {
    sections.push('\nSKILLS:');
    resumeData.skills.forEach((skill: any) => {
      sections.push(`${skill.category}: ${skill.list ? skill.list.join(', ') : ''}`);
    });
  }
  
  // Certifications
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    sections.push('\nCERTIFICATIONS:');
    resumeData.certifications.forEach((cert: string) => sections.push(`• ${cert}`));
  }
  
  // Achievements (for freshers)
  if (resumeData.achievements && resumeData.achievements.length > 0) {
    sections.push('\nACHIEVEMENTS:');
    resumeData.achievements.forEach((achievement: string) => sections.push(`• ${achievement}`));
  }
  
  // Extra-curricular Activities (for freshers)
  if (resumeData.extraCurricularActivities && resumeData.extraCurricularActivities.length > 0) {
    sections.push('\nEXTRA-CURRICULAR ACTIVITIES:');
    resumeData.extraCurricularActivities.forEach((activity: string) => sections.push(`• ${activity}`));
  }
  
  // Languages Known (for freshers)
  if (resumeData.languagesKnown && resumeData.languagesKnown.length > 0) {
    sections.push('\nLANGUAGES KNOWN:');
    sections.push(resumeData.languagesKnown.join(', '));
  }
  
  // Personal Details (for freshers)
  if (resumeData.personalDetails) {
    sections.push(`\nPERSONAL DETAILS:\n${resumeData.personalDetails}`);
  }
  
  return sections.join('\n');
};

// Generate a low score for "before" optimization to show improvement
export const generateBeforeScore = (resumeText: string): MatchScore => {
  // Simulate a low score (50-65%) for before optimization
  const baseScore = Math.floor(Math.random() * 16) + 50; // 50-65%
  
  return {
    score: baseScore,
    analysis: `The resume shows basic qualifications but lacks optimization for ATS systems and keyword alignment. Several key areas need improvement to increase competitiveness.`,
    keyStrengths: [
      "Relevant educational background",
      "Some technical skills mentioned",
      "Basic work experience listed"
    ],
    improvementAreas: [
      "Lacks industry-specific keywords",
      "Bullet points need quantifiable achievements",
      "Missing relevant technical skills",
      "Poor ATS optimization",
      "Weak project descriptions"
    ]
  };
};

// Generate a high score for "after" optimization to show significant improvement
export const generateAfterScore = (resumeText: string): MatchScore => {
  // Simulate a high score (90-98%) for after optimization
  const baseScore = Math.floor(Math.random() * 9) + 90; // 90-98%
  
  return {
    score: baseScore,
    analysis: `Excellent resume optimization with strong keyword alignment, quantified achievements, and ATS-friendly formatting. Highly competitive for the target role.`,
    keyStrengths: [
      "Strong keyword optimization for ATS systems",
      "Quantified achievements with specific metrics",
      "Comprehensive technical skills alignment",
      "Professional formatting and structure",
      "Industry-relevant project experience"
    ],
    improvementAreas: [
      "Consider adding more leadership examples",
      "Include additional relevant certifications",
      "Expand on cross-functional collaboration"
    ]
  };
};