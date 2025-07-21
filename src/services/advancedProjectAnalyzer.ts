import { ResumeData } from '../types/resume';

const GEMINI_API_KEY = 'AIzaSyDZWV51wiJ976BaWu8P7yE1MxWiE4oIMvQ';

interface ProjectScore {
  title: string;
  score: number;
  reason: string;
}

interface ReplacementSuggestion {
  title: string;
  githubUrl: string;
  bullets: string[];
}

interface ProjectAnalysisResult {
  projectsToReplace: ProjectScore[];
  replacementSuggestions: ReplacementSuggestion[];
}

class AdvancedProjectAnalyzer {
  async analyzeAndReplaceProjects(
    resumeData: ResumeData,
    jobRole: string,
    jobDescription: string
  ): Promise<ProjectAnalysisResult> {
    const resumeProjects = resumeData.projects?.map(p => ({
      title: p.title,
      bullets: p.bullets || []
    })) || [];

    const prompt = `You are an expert resume optimizer.

Given:
- Existing projects: ${JSON.stringify(resumeProjects)}
- Job Role: ${jobRole}
- Job Description: ${jobDescription}

1. Score each resume project (0-100) based on how well it fits the job description and role.
2. Replace any project with score below 80.
3. Recommend 5 GitHub open-source projects with exact GitHub URLs.
4. For each project, write 3 bullet points (20 words max) showing how it fits the JD and role.
5. Highlight tech stack, role relevance, and contributions using action verbs.
6. Avoid suggesting the same project twice.
7. Output in this JSON format:

{
  "projectsToReplace": [
    {
      "title": "Project Name",
      "score": 0-100,
      "reason": "Why this project scores low for the role"
    }
  ],
  "replacementSuggestions": [
    {
      "title": "GitHub Project Name",
      "githubUrl": "https://github.com/username/repo",
      "bullets": [
        "Bullet point 1 - exactly 20 words max",
        "Bullet point 2 - exactly 20 words max", 
        "Bullet point 3 - exactly 20 words max"
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
- Each bullet point MUST be EXACTLY 20 words or less
- Start each bullet with strong action verbs (Developed, Implemented, Architected, etc.)
- NO weak verbs like "helped", "assisted", "worked on"
- Include specific technologies from the job description
- Focus on achievements and impact, not just responsibilities
- Align with job description requirements
- Include metrics and quantifiable results where possible
- Provide real GitHub URLs that exist
- Only replace projects scoring below 80

Respond ONLY with valid JSON.`;

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
      console.error('Error calling Gemini API for project analysis:', error);
      throw new Error('Failed to analyze projects. Please try again.');
    }
  }

  // Apply the analysis results to update the resume
  applyProjectReplacements(
    resumeData: ResumeData,
    analysisResult: ProjectAnalysisResult
  ): ResumeData {
    const projectsToReplaceSet = new Set(
      analysisResult.projectsToReplace.map(p => p.title)
    );

    // Keep projects that don't need replacement
    const keptProjects = resumeData.projects?.filter(
      project => !projectsToReplaceSet.has(project.title)
    ) || [];

    // Add replacement projects
    const newProjects = analysisResult.replacementSuggestions.map(suggestion => ({
      title: suggestion.title,
      bullets: suggestion.bullets,
      githubUrl: suggestion.githubUrl
    }));

    return {
      ...resumeData,
      projects: [...keptProjects, ...newProjects]
    };
  }
}

export const advancedProjectAnalyzer = new AdvancedProjectAnalyzer();