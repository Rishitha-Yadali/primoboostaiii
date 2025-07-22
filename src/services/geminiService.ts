import { ResumeData, UserType } from '../types/resume';

const GEMINI_API_KEY = 'AIzaSyDZWV51wiJ976BaWu8P7yE1MxWiE4oIMvQ';

export const optimizeResume = async (
  resume: string, 
  jobDescription: string, 
  userType: UserType,
  linkedinUrl?: string, 
  githubUrl?: string,
  targetRole?: string
): Promise<ResumeData> => {
  const getPromptForUserType = (type: UserType) => {
    if (type === 'experienced') {
      return `You are a professional resume optimization assistant for EXPERIENCED PROFESSIONALS. Analyze the provided resume and job description, then create an optimized resume that better matches the job requirements.

EXPERIENCED PROFESSIONAL REQUIREMENTS:
1. MUST include a compelling Professional Summary (2-3 lines highlighting key experience and value proposition)
2. PRIORITIZE Work Experience section - this should be the most prominent
3. Education section should be minimal or omitted unless specifically required by the job
4. Focus on quantifiable achievements and leadership experience
5. Emphasize career progression and increasing responsibilities

SECTION ORDER FOR EXPERIENCED PROFESSIONALS:
1. Contact Information
2. Professional Summary (REQUIRED)
3. Technical Skills
4. Professional Experience (MOST IMPORTANT)
5. Projects (if relevant to role)
6. Certifications
7. Education (minimal or omit if not required)`;
    } else {
      return `You are a professional resume optimization assistant for FRESHERS/NEW GRADUATES. Analyze the provided resume and job description, then create an optimized resume that better matches the job requirements.

FRESHER REQUIREMENTS:
1. Professional Summary is OPTIONAL - only include if the candidate has relevant internships or strong projects
2. PRIORITIZE Education, Academic Projects, and Internships
3. Include additional sections that showcase potential: Achievements, Extra-curricular Activities, Languages
4. Focus on academic projects, internships, and transferable skills
5. Highlight learning ability, enthusiasm, and relevant coursework
6. ALL INTERNSHIPS, TRAININGS, and WORK EXPERIENCE should be categorized under "workExperience" section
7. Extract CGPA from education if mentioned (e.g., "CGPA: 8.4/10" or "GPA: 3.8/4.0")

SECTION ORDER FOR FRESHERS:
1. Contact Information
2. Professional Summary (OPTIONAL - only if relevant experience exists)
3. Technical Skills
4. Education (PROMINENT)
5. Internships & Work Experience (IMPORTANT - includes all internships, trainings, and work)
6. Academic Projects (IMPORTANT)
7. Achievements (if present in original resume)
8. Extra-curricular Activities (if present in original resume)
9. Certifications
10. Languages Known (if present in original resume)
11. Personal Details (if present in original resume)`;
    }
  };

  const prompt = `${getPromptForUserType(userType)}

CRITICAL REQUIREMENTS FOR BULLET POINTS:
1. Each bullet point must contain EXACTLY 20 words (no more, no less)
2. Include at least 20 relevant keywords from the job description across all bullet points
3. Use STRONG ACTION VERBS only (no weak verbs like "helped", "assisted", "worked on", "was responsible for", "participated in", "involved in", "contributed to")
4. Start each bullet with powerful verbs like: Developed, Implemented, Architected, Optimized, Engineered, Designed, Led, Managed, Created, Built, Delivered, Achieved, Increased, Reduced, Streamlined, Automated, Transformed, Executed, Spearheaded, Established
5. No word should be repeated more than twice across all bullet points
6. Quantify achievements with specific numbers, percentages, or metrics wherever possible
7. Focus on RESULTS and IMPACT, not just tasks
8. Don't give more than three bullet points for each project or work experience
9. All section titles should be in ALL CAPS (e.g., WORK EXPERIENCE)
10. Dates should be on the same line as roles/education, using format "Jan 2023 – Mar 2024"
11. Ensure at least 70% of resume keywords match the job description for better ATS compatibility
12. Avoid using adjectives like "passionate", "dedicated", or "hardworking" unless contextually backed with measurable achievements

SKILLS REQUIREMENTS:
1. Generate comprehensive skills based on the resume content and job description
2. Include at least 6-8 skill categories
3. Each category should have 5-8 specific skills
4. Match skills to job requirements and industry standards
5. Include both technical and soft skills relevant to the role

SOCIAL LINKS REQUIREMENTS - CRITICAL:
1. LinkedIn URL: "${linkedinUrl || ''}" - ONLY include if this is NOT empty
2. GitHub URL: "${githubUrl || ''}" - ONLY include if this is NOT empty
3. If LinkedIn URL is empty (""), set linkedin field to empty string ""
4. If GitHub URL is empty (""), set github field to empty string ""
5. DO NOT create, modify, or generate any social media links
6. Use EXACTLY what is provided - no modifications

TARGET ROLE INFORMATION:
${targetRole ? `Target Role: "${targetRole}"` : 'No specific target role provided'}

CONDITIONAL SECTION GENERATION:
${userType === 'experienced' ? `
- Professional Summary: REQUIRED - Create a compelling 2-3 line summary
- Education: MINIMAL or OMIT unless specifically required by job
- Focus heavily on work experience and achievements
- Omit or minimize fresher-specific sections
` : `
- Professional Summary: OPTIONAL - only include if candidate has relevant internships/experience
- Education: PROMINENT - include degree, institution, year, relevant coursework if applicable
- Education: INCLUDE CGPA if mentioned in original resume (e.g., "CGPA: 8.4/10")
- Academic Projects: IMPORTANT - treat as main experience section
- Work Experience: COMBINE all internships, trainings, and work experience under this single section
- Achievements: Include if present in original resume (academic awards, competitions, etc.)
- Extra-curricular Activities: Include if present (leadership roles, clubs, volunteer work)
- Languages Known: Include if present (list languages with proficiency levels if available)
- Personal Details: Include if present in original resume (brief personal information)
`}

IMPORTANT: Follow the exact structure provided below. Only include sections that have actual content.

Rules:
1. Only respond with valid JSON
2. Use the exact structure provided below
3. Rewrite bullet points following the CRITICAL REQUIREMENTS above
4. Generate comprehensive skills section based on resume and job description
5. Only include sections that have meaningful content
6. If optional sections don't exist in original resume, set them as empty arrays or omit
7. Ensure all dates are in proper format (e.g., "Jan 2024 - Apr 2024")
8. Use professional language and industry-specific keywords from the job description
9. For LinkedIn and GitHub, use EXACTLY what is provided - empty string if not provided

JSON Structure:
{
  "name": "",
  "phone": "",
  "email": "",
  "linkedin": "",
  "github": "",
  ${userType === 'experienced' ? '"summary": "",' : '"summary": "",'}
  "education": [
    {"degree": "", "school": "", "year": "", "cgpa": ""}
  ],
  "workExperience": [
    {"role": "", "company": "", "year": "", "bullets": []}
  ],
  "projects": [
    {"title": "", "bullets": []}
  ],
  "skills": [
    {"category": "", "count": 0, "list": []}
  ],
  "certifications": [],
  ${userType === 'fresher' ? `
  "achievements": [],
  "extraCurricularActivities": [],
  "languagesKnown": [],
  "personalDetails": ""` : ''}
}

Resume:
${resume}

Job Description:
${jobDescription}

User Type: ${userType.toUpperCase()}

LinkedIn URL provided: ${linkedinUrl || 'NONE - leave empty'}
GitHub URL provided: ${githubUrl || 'NONE - leave empty'}`;

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
          temperature: 0.4,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 4000,
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
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your Gemini API key configuration.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status >= 500) {
        throw new Error('Gemini API service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }
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
      
      // Ensure skills have proper count values
      if (parsedResult.skills && Array.isArray(parsedResult.skills)) {
        parsedResult.skills = parsedResult.skills.map((skill: any) => ({
          ...skill,
          count: skill.list ? skill.list.length : 0
        }));
      }

      // Ensure certifications are strings, not objects
      if (parsedResult.certifications && Array.isArray(parsedResult.certifications)) {
        parsedResult.certifications = parsedResult.certifications.map((cert: any) => {
          if (typeof cert === 'object' && cert !== null) {
            // Handle various object formats
            if (cert.title && cert.description) {
              return `${cert.title} - ${cert.description}`;
            } else if (cert.title && cert.issuer) {
              return `${cert.title} - ${cert.issuer}`;
            } else if (cert.title) {
              return cert.title;
            } else if (cert.name) {
              return cert.name;
            } else if (cert.description) {
              return cert.description;
            } else {
              // Convert any other object structure to string
              return Object.values(cert).filter(Boolean).join(' - ');
            }
          }
          // If it's already a string, return as is
          return String(cert);
        });
      }

      // Ensure work experience is properly formatted
      if (parsedResult.workExperience && Array.isArray(parsedResult.workExperience)) {
        parsedResult.workExperience = parsedResult.workExperience.filter((work: any) => 
          work && work.role && work.company && work.year
        );
      }

      // Ensure projects are properly formatted
      if (parsedResult.projects && Array.isArray(parsedResult.projects)) {
        parsedResult.projects = parsedResult.projects.filter((project: any) => 
          project && project.title && project.bullets && project.bullets.length > 0
        );
      }

      // CRITICAL: Only use provided social links - empty string if not provided
      parsedResult.linkedin = linkedinUrl || "";
      parsedResult.github = githubUrl || "";
      
      return parsedResult;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', cleanedResult);
      throw new Error('Invalid JSON response from Gemini API');
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Re-throw with more specific error message if it's already a known error
    if (error instanceof Error && (
        error.message.includes('API key') || 
        error.message.includes('Rate limit') || 
        error.message.includes('service is temporarily unavailable') ||
        error.message.includes('Invalid JSON response')
    )) {
      throw error;
    }
    
    // Generic error for network issues or other unknown errors
    throw new Error('Failed to connect to Gemini API. Please check your internet connection and try again.');
  }
};