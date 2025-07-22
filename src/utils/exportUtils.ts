import jsPDF from 'jspdf';
import { ResumeData } from '../types/resume';
import { saveAs } from 'file-saver';

// Professional PDF Layout Constants - Updated to meet specifications
const PDF_CONFIG = {
  // A4 dimensions in mm
  pageWidth: 210,
  pageHeight: 297,
  
  // Professional margins in mm (1 inch = 25.4mm)
  margins: {
    top: 20,    // 1 inch from top
    bottom: 2, // 1 inch from bottom
    left: 10,   // 1 inch from left
    right: 10   // 1 inch from right
  },
  
  // Calculated content area
  get contentWidth() { return this.pageWidth - this.margins.left - this.margins.right; },
  get contentHeight() { return this.pageHeight - this.margins.top - this.margins.bottom; },
  
  // Typography settings - Professional specifications
  fonts: {
  name: { size: 18, weight: 'bold' },           // Matches preview
  contact: { size: 10.5, weight: 'normal' },
  sectionTitle: { size: 11, weight: 'bold' },
  jobTitle: { size: 10, weight: 'bold' },
  company: { size: 10, weight: 'normal' },
  year: { size: 10, weight: 'normal' },
  body: { size: 9.5, weight: 'normal' }
},
spacing: {
  nameFromTop: 15,
  afterName: 2,
  afterContact: 3,
  sectionSpacingBefore: 3,
  sectionSpacingAfter: 1.5,
  bulletListSpacing: 1,
  afterSubsection: 2.5,
  lineHeight: 1.25,
  bulletIndent: 4
},
colors: {
  primary: [0, 0, 0],
  secondary: [80, 80, 80],
  accent: [37, 99, 235]
}

};

interface DrawPosition {
  x: number;
  y: number;
}

interface PageState {
  currentPage: number;
  currentY: number;
  doc: jsPDF;
}

// Helper function to detect mobile device
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Helper function to trigger download on mobile
const triggerMobileDownload = (blob: Blob, filename: string): void => {
  try {
    // For mobile devices, use a more reliable download method
    if (isMobileDevice()) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the URL object after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } else {
      // For desktop, use saveAs
      saveAs(blob, filename);
    }
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: try to open in new window
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
};

// Helper function to check if content fits on current page
function checkPageSpace(state: PageState, requiredHeight: number): boolean {
  const maxY = PDF_CONFIG.margins.top + PDF_CONFIG.contentHeight;
  return (state.currentY + requiredHeight) <= maxY;
}

// Add new page and reset position
function addNewPage(state: PageState): void {
  state.doc.addPage();
  state.currentPage++;
  state.currentY = PDF_CONFIG.margins.top;
  
  // Add page number (only if multiple pages)
  if (state.currentPage > 1) {
    const pageText = `Page ${state.currentPage}`;
    state.doc.setFont('Calibri', 'normal');
    state.doc.setFontSize(9);
    state.doc.setTextColor(128, 128, 128); // Gray
    
    const pageWidth = state.doc.internal.pageSize.getWidth();
    const textWidth = state.doc.getTextWidth(pageText);
    state.doc.text(pageText, pageWidth - PDF_CONFIG.margins.right - textWidth, PDF_CONFIG.pageHeight - 15);
  }
}

// Draw text with automatic wrapping and return height used
function drawText(
  state: PageState, 
  text: string, 
  x: number, 
  options: {
    fontSize?: number;
    fontWeight?: string;
    color?: number[];
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  } = {}
): number {
  const {
    fontSize = PDF_CONFIG.fonts.body.size,
    fontWeight = 'normal',
    color = PDF_CONFIG.colors.primary,
    maxWidth = PDF_CONFIG.contentWidth,
    align = 'left'
  } = options;

  state.doc.setFont('Calibri', fontWeight);
  state.doc.setFontSize(fontSize);
  state.doc.setTextColor(color[0], color[1], color[2]);

  // Split text to fit width
  const lines = state.doc.splitTextToSize(text, maxWidth);
  const lineHeight = fontSize * PDF_CONFIG.spacing.lineHeight * 0.352778; // Convert pt to mm
  const totalHeight = lines.length * lineHeight;

  // Check if we need a new page
  if (!checkPageSpace(state, totalHeight)) {
    addNewPage(state);
  }

  // Calculate x position based on alignment
  let textX = x;
  if (align === 'center') {
    textX = PDF_CONFIG.margins.left + (PDF_CONFIG.contentWidth / 2);
  } else if (align === 'right') {
    textX = PDF_CONFIG.margins.left + PDF_CONFIG.contentWidth;
  }

  // Draw each line
  lines.forEach((line: string, index: number) => {
    const yPos = state.currentY + (index * lineHeight);
    
    if (align === 'center') {
      const lineWidth = state.doc.getTextWidth(line);
      state.doc.text(line, textX - (lineWidth / 2), yPos);
    } else if (align === 'right') {
      const lineWidth = state.doc.getTextWidth(line);
      state.doc.text(line, textX - lineWidth, yPos);
    } else {
      state.doc.text(line, textX, yPos);
    }
  });

  state.currentY += totalHeight;
  return totalHeight;
}

// Draw section title with underline and proper spacing
function drawSectionTitle(state: PageState, title: string): number {
  // Add 12pt space before section title
  state.currentY += PDF_CONFIG.spacing.sectionSpacingBefore;
  
  const titleHeight = drawText(state, title.toUpperCase(), PDF_CONFIG.margins.left, {
    fontSize: PDF_CONFIG.fonts.sectionTitle.size,
    fontWeight: PDF_CONFIG.fonts.sectionTitle.weight,
    color: PDF_CONFIG.colors.primary
  });
  

  // Add underline
  const underlineY = state.currentY - 3.5;
  state.doc.setDrawColor(128, 128, 128); // Gray underline
  state.doc.setLineWidth(0.3);
  state.doc.line(
    PDF_CONFIG.margins.left,
    underlineY,
    PDF_CONFIG.margins.left + PDF_CONFIG.contentWidth,
    underlineY
  );

  // Add 6pt space after section title
  state.currentY += 1.5;
  state.currentY += PDF_CONFIG.spacing.sectionSpacingAfter;
  return titleHeight + PDF_CONFIG.spacing.sectionSpacingBefore + PDF_CONFIG.spacing.sectionSpacingAfter;
}

// Draw contact information with vertical bars as separators
function drawContactInfo(state: PageState, resumeData: ResumeData): number {
  const contactParts: string[] = [];
  
  if (resumeData.phone) {
    contactParts.push(`${resumeData.phone}`);
  }
  if (resumeData.email) {
    contactParts.push(`${resumeData.email}`);
  }
  if (resumeData.linkedin) {
    contactParts.push(`${resumeData.linkedin}`);
  }
  if (resumeData.github) {
    contactParts.push(`${resumeData.github}`);
  }

  if (contactParts.length === 0) return 0;

  // Use vertical bars as separators instead of bullets
  const contactText = contactParts.join(' | ');
  const height = drawText(state, contactText, PDF_CONFIG.margins.left, {
    fontSize: PDF_CONFIG.fonts.contact.size,
    fontWeight: PDF_CONFIG.fonts.contact.weight,
    color: PDF_CONFIG.colors.primary,
    align: 'center'
  });

  state.currentY += PDF_CONFIG.spacing.afterContact;
  return height + PDF_CONFIG.spacing.afterContact;
}

// Draw work experience section
function drawWorkExperience(state: PageState, workExperience: any[], userType: UserType = 'experienced'): number {
  if (!workExperience || workExperience.length === 0) return 0;

  const sectionTitle = userType === 'fresher' ? 'INTERNSHIPS & WORK EXPERIENCE' : 'EXPERIENCE';
  let totalHeight = drawSectionTitle(state, sectionTitle);

  workExperience.forEach((job, index) => {
    // Check if we need space for at least the job header and one bullet
    const estimatedJobHeight = 25;
    if (!checkPageSpace(state, estimatedJobHeight)) {
      addNewPage(state);
    }

    // Job title
    const jobTitleHeight = drawText(state, job.role, PDF_CONFIG.margins.left, {
      fontSize: PDF_CONFIG.fonts.jobTitle.size,
      fontWeight: PDF_CONFIG.fonts.jobTitle.weight
    });

    // Company name
    const companyHeight = drawText(state, job.company, PDF_CONFIG.margins.left, {
      fontSize: PDF_CONFIG.fonts.company.size,
      fontWeight: PDF_CONFIG.fonts.company.weight,
      color: PDF_CONFIG.colors.primary
    });

    // Year (right-aligned, regular weight as specified)
    state.doc.setFont('Calibri', 'normal'); // Changed from 'bold' to 'normal'
    state.doc.setFontSize(PDF_CONFIG.fonts.year.size);
    state.doc.setTextColor(PDF_CONFIG.colors.primary[0], PDF_CONFIG.colors.primary[1], PDF_CONFIG.colors.primary[2]);
    
    const yearWidth = state.doc.getTextWidth(job.year);
    const yearX = PDF_CONFIG.margins.left + PDF_CONFIG.contentWidth - yearWidth;
    const yearY = state.currentY - jobTitleHeight - companyHeight + (PDF_CONFIG.fonts.jobTitle.size * 0.352778);
    state.doc.text(job.year, yearX, yearY);

    state.currentY += 2; // Small gap before bullets

    // Add 6pt spacing before bullet list
    if (job.bullets && job.bullets.length > 0) {
      state.currentY += PDF_CONFIG.spacing.bulletListSpacing;
      
      job.bullets.forEach((bullet: string) => {
        const bulletText = `• ${bullet}`;
        const bulletHeight = drawText(state, bulletText, PDF_CONFIG.margins.left + PDF_CONFIG.spacing.bulletIndent, {
          fontSize: PDF_CONFIG.fonts.body.size,
          maxWidth: PDF_CONFIG.contentWidth - PDF_CONFIG.spacing.bulletIndent
        });
        totalHeight += bulletHeight;
      });
      
      // Add 6pt spacing after bullet list
      state.currentY += PDF_CONFIG.spacing.bulletListSpacing;
    }

    // Add space between jobs (except for the last one)
    if (index < workExperience.length - 1) {
      state.currentY += PDF_CONFIG.spacing.afterSubsection;
      totalHeight += PDF_CONFIG.spacing.afterSubsection;
    }
  });

  return totalHeight;
}

// Draw education section
function drawEducation(state: PageState, education: any[]): number {
  if (!education || education.length === 0) return 0;

  state.currentY +=4; // 👈 Added spacing before EDUCATION title

  let totalHeight = drawSectionTitle(state, 'EDUCATION');

  education.forEach((edu, index) => {
    if (!checkPageSpace(state, 20)) {
      addNewPage(state);
    }

    const degreeHeight = drawText(state, edu.degree, PDF_CONFIG.margins.left, {
      fontSize: PDF_CONFIG.fonts.jobTitle.size,
      fontWeight: PDF_CONFIG.fonts.jobTitle.weight
    });

    const schoolHeight = drawText(state, edu.school, PDF_CONFIG.margins.left, {
      fontSize: PDF_CONFIG.fonts.company.size,
      fontWeight: PDF_CONFIG.fonts.company.weight,
      color: PDF_CONFIG.colors.primary
    });

    // Add CGPA if present
    let cgpaHeight = 0;
    if (edu.cgpa) {
      cgpaHeight = drawText(state, `CGPA: ${edu.cgpa}`, PDF_CONFIG.margins.left, {
        fontSize: PDF_CONFIG.fonts.body.size,
        fontWeight: PDF_CONFIG.fonts.body.weight,
        color: PDF_CONFIG.colors.secondary
      });
    }

    state.doc.setFont('Calibri', 'normal');
    state.doc.setFontSize(PDF_CONFIG.fonts.year.size);
    state.doc.setTextColor(PDF_CONFIG.colors.primary[0], PDF_CONFIG.colors.primary[1], PDF_CONFIG.colors.primary[2]);

    const yearWidth = state.doc.getTextWidth(edu.year);
    const yearX = PDF_CONFIG.margins.left + PDF_CONFIG.contentWidth - yearWidth;
    const yearY = state.currentY - degreeHeight - schoolHeight - cgpaHeight + (PDF_CONFIG.fonts.jobTitle.size * 0.352778);
    state.doc.text(edu.year, yearX, yearY);

    totalHeight += degreeHeight + schoolHeight + cgpaHeight;

    if (index < education.length - 1) {
      state.currentY += 3;
      totalHeight += PDF_CONFIG.spacing.afterSubsection;
    }
  });

  return totalHeight;
}


// Draw projects section
function drawProjects(state: PageState, projects: any[]): number {
  if (!projects || projects.length === 0) return 0;

  // Collect GitHub URLs for referenced projects section
  const githubProjects = projects.filter(project => project.githubUrl);
  
  let totalHeight = drawSectionTitle(state, 'PROJECTS');

  projects.forEach((project, index) => {
    // Check space for project title and at least one bullet
    if (!checkPageSpace(state, 25)) {
      addNewPage(state);
    }

    // Project title
    const titleHeight = drawText(state, project.title, PDF_CONFIG.margins.left, {
      fontSize: PDF_CONFIG.fonts.jobTitle.size,
      fontWeight: PDF_CONFIG.fonts.jobTitle.weight
    });

    totalHeight += titleHeight;
    state.currentY += 2; // Small gap before bullets

    // Add 6pt spacing before bullet list
    if (project.bullets && project.bullets.length > 0) {
      state.currentY += PDF_CONFIG.spacing.bulletListSpacing;
      
      project.bullets.forEach((bullet: string) => {
        const bulletText = `• ${bullet}`;
        const bulletHeight = drawText(state, bulletText, PDF_CONFIG.margins.left + PDF_CONFIG.spacing.bulletIndent, {
          fontSize: PDF_CONFIG.fonts.body.size,
          maxWidth: PDF_CONFIG.contentWidth - PDF_CONFIG.spacing.bulletIndent
        });
        totalHeight += bulletHeight;
      });
      
      // Add 6pt spacing after bullet list
      state.currentY += PDF_CONFIG.spacing.bulletListSpacing;
    }

    // Add space between projects (except for the last one)
    if (index < projects.length - 1) {
      state.currentY += PDF_CONFIG.spacing.afterSubsection;
      totalHeight += PDF_CONFIG.spacing.afterSubsection;
    }
  });

  return totalHeight;
}

// Draw GitHub references section
function drawGitHubReferences(state: PageState, projects: any[]): number {
  const githubProjects = projects.filter(project => project.githubUrl);
  
  if (!githubProjects || githubProjects.length === 0) return 0;
  
  // Add extra spacing before GitHub references section
  state.currentY += 4;
  
  let totalHeight = drawSectionTitle(state, 'REFERENCED PROJECTS');
  
  githubProjects.forEach((project, index) => {
    // Check space
    if (!checkPageSpace(state, 15)) {
      addNewPage(state);
    }
    
    const projectText = `• ${project.title}: ${project.githubUrl}`;
    const projectHeight = drawText(state, projectText, PDF_CONFIG.margins.left, {
      fontSize: PDF_CONFIG.fonts.body.size,
      maxWidth: PDF_CONFIG.contentWidth
    });
    
    totalHeight += projectHeight;
    
    // Add space between projects
    if (index < githubProjects.length - 1) {
      state.currentY += 2;
      totalHeight += 2;
    }
  });
  
  return totalHeight;
}


// Draw skills section
function drawSkills(state: PageState, skills: any[]): number {
  if (!skills || skills.length === 0) return 0;

  let totalHeight = drawSectionTitle(state, 'SKILLS');

  skills.forEach((skill, index) => {
    // Check space
    if (!checkPageSpace(state, 15)) {
      addNewPage(state);
    }

    const x = PDF_CONFIG.margins.left;
const categoryText = `${skill.category}: `;
const listText = skill.list ? skill.list.join(', ') : '';

// Draw bold category text
const categoryHeight = drawText(state, categoryText, x, {
  fontSize: PDF_CONFIG.fonts.body.size,
  fontWeight: 'bold'
});

// Reset Y so list appears on same line
state.currentY -= categoryHeight;

// Get width of category to offset list
const categoryWidth = state.doc.getTextWidth(categoryText);

// Draw normal-weight list text right after category
const listHeight = drawText(state, listText, x + categoryWidth, {
  fontSize: PDF_CONFIG.fonts.body.size
});

const skillHeight = Math.max(categoryHeight, listHeight);
totalHeight += skillHeight;


    // Add small space between skill categories
    if (index < skills.length - 1) {
      state.currentY += 2;
      totalHeight += 2;
    }
  });

  return totalHeight;
}


// Draw certifications section
function drawCertifications(state: PageState, certifications: any[]): number {
  if (!certifications || certifications.length === 0) return 0;

  let totalHeight = drawSectionTitle(state, 'CERTIFICATIONS');

  // Add 6pt spacing before bullet list
  state.currentY += PDF_CONFIG.spacing.bulletListSpacing;

  certifications.forEach((cert) => {
    // Check space
    if (!checkPageSpace(state, 10)) {
      addNewPage(state);
    }

    // Handle both string and object formats
    let certText = '';
    if (typeof cert === 'string') {
      certText = cert;
    } else if (cert && typeof cert === 'object') {
      // Handle object format with title and issuer
      if ('title' in cert && 'issuer' in cert) {
        certText = `${cert.title} - ${cert.issuer}`;
      } else if ('name' in cert) {
        certText = cert.name;
      } else {
        certText = JSON.stringify(cert);
      }
    } else {
      certText = String(cert);
    }

    const bulletText = `• ${certText}`;
    const certHeight = drawText(state, bulletText, PDF_CONFIG.margins.left + PDF_CONFIG.spacing.bulletIndent, {
      fontSize: PDF_CONFIG.fonts.body.size,
      maxWidth: PDF_CONFIG.contentWidth - PDF_CONFIG.spacing.bulletIndent
    });

    totalHeight += certHeight;
  });

  // Add 6pt spacing after bullet list
  state.currentY += PDF_CONFIG.spacing.bulletListSpacing;

  return totalHeight;
}


// Main export function with mobile optimization
export const exportToPDF = async (resumeData: ResumeData, userType: UserType = 'experienced'): Promise<void> => {
  // Format filename with role if available
  const getFileName = () => {
    const namePart = resumeData.name.replace(/\s+/g, '_');
    const rolePart = resumeData.targetRole ? `_${resumeData.targetRole.replace(/\s+/g, '_')}` : '';
    return `${namePart}${rolePart}_Resume.pdf`;
  };

  try {
    // Show loading indicator for mobile users
    if (isMobileDevice()) {
      console.log('Starting PDF generation for mobile device...');
    }

    // Initialize PDF with professional settings
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Initialize page state - start name 0.5" from top edge
    const state: PageState = {
      currentPage: 1,
      currentY: PDF_CONFIG.spacing.nameFromTop,
      doc
    };

    // Set document properties
    doc.setProperties({
      title: `${resumeData.name} - Resume`,
      subject: 'Professional Resume',
      author: resumeData.name,
      creator: 'Resume Optimizer',
      producer: 'Resume Optimizer PDF Generator'
    });

    // Draw header (name) - ALL CAPS as specified
    const nameHeight = drawText(state, resumeData.name.toUpperCase(), PDF_CONFIG.margins.left, {
      fontSize: PDF_CONFIG.fonts.name.size,
      fontWeight: PDF_CONFIG.fonts.name.weight,
      align: 'center'
    });

    state.currentY += PDF_CONFIG.spacing.afterName;

    // Draw contact information
    drawContactInfo(state, resumeData);

    // Add separator line
    const separatorY = state.currentY;
    doc.setDrawColor(0, 0, 0); // Dark gray
    doc.setLineWidth(0.4);
    doc.line(
      PDF_CONFIG.margins.left + 20,
      separatorY,
      PDF_CONFIG.margins.left + PDF_CONFIG.contentWidth - 20,
      separatorY
    );
    state.currentY += 3;

    // Draw sections in order
    drawWorkExperience(state, resumeData.workExperience, userType);
    drawEducation(state, resumeData.education);
    drawProjects(state, resumeData.projects);
    drawSkills(state, resumeData.skills);
    drawCertifications(state, resumeData.certifications);
    
    // Add GitHub references section if any projects have GitHub URLs
    if (resumeData.projects?.some(p => p.githubUrl)) {
      drawGitHubReferences(state, resumeData.projects);
    }

    // Add page numbers to all pages (only if multiple pages)
    const totalPages = state.currentPage;
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        if (i > 1) {
          doc.setPage(i);
        }
        
        const pageText = `Page ${i} of ${totalPages}`;
        doc.setFont('times', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80); // Gray
        
        const textWidth = doc.getTextWidth(pageText);
        doc.text(pageText, PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - textWidth, PDF_CONFIG.pageHeight - 10);
      }
    }

    // Generate filename and save with mobile-optimized download
    const fileName = getFileName();
    
    if (isMobileDevice()) {
      // For mobile devices, create blob and use custom download method
      const pdfBlob = doc.output('blob');
      triggerMobileDownload(pdfBlob, fileName);
    } else {
      // For desktop, use standard jsPDF save
      doc.save(fileName);
    }

  } catch (error) {
    console.error('Error exporting to PDF:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('jsPDF')) {
        throw new Error('PDF generation failed. Please try again or contact support if the issue persists.');
      } else {
        throw new Error('An error occurred while creating the PDF. Please try again.');
      }
    } else {
      throw new Error('An unexpected error occurred while exporting PDF. Please try again.');
    }
  }
};

// Generate Word document with mobile optimization
export const exportToWord = (resumeData: ResumeData, userType: UserType = 'experienced'): void => {
  // Format filename with role if available
  const getFileName = () => {
    const namePart = resumeData.name.replace(/\s+/g, '_');
    const rolePart = resumeData.targetRole ? `_${resumeData.targetRole.replace(/\s+/g, '_')}` : '';
    return `${namePart}${rolePart}_Resume.doc`;
  };

  try {
    const htmlContent = generateWordHTMLContent(resumeData, userType);
    const blob = new Blob([htmlContent], { 
      type: 'application/vnd.ms-word'
    });
    
    const fileName = getFileName();
    
    // Use mobile-optimized download
    triggerMobileDownload(blob, fileName);
    
  } catch (error) {
    console.error('Error exporting to Word:', error);
    throw new Error('Word export failed. Please try again.');
  }
};

const generateWordHTMLContent = (data: ResumeData, userType: UserType = 'experienced'): string => {
  // Build contact info with bold labels and proper hyperlinks
  const contactParts = [];
  
  if (data.phone) {
    contactParts.push(`<b>Phone no:</b> <a href="tel:${data.phone}" style="color: #2563eb !important; text-decoration: underline !important;">${data.phone}</a>`);
  }
  
  if (data.email) {
    contactParts.push(`<b>Email:</b> <a href="mailto:${data.email}" style="color: #2563eb !important; text-decoration: underline !important;">${data.email}</a>`);
  }
  
  if (data.linkedin) {
    contactParts.push(`<b>LinkedIn:</b> <a href="${data.linkedin}" target="_blank" rel="noopener noreferrer" style="color: #2563eb !important; text-decoration: underline !important;">${data.linkedin}</a>`);
  }
  
  if (data.github) {
    contactParts.push(`<b>GitHub:</b> <a href="${data.github}" target="_blank" rel="noopener noreferrer" style="color: #2563eb !important; text-decoration: underline !important;">${data.github}</a>`);
  }
  
  const contactInfo = contactParts.join(' | '); // Changed separator to vertical bar

  return `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <meta name="ProgId" content="Word.Document">
      <meta name="Generator" content="Microsoft Word 15">
      <meta name="Originator" content="Microsoft Word 15">
      <title>${data.name} - Resume</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>90</w:Zoom>
          <w:DoNotPromptForConvert/>
          <w:DoNotShowInsertionsAndDeletions/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          margin-top: 25.4mm !important;
          margin-bottom: 25.4mm !important;
          margin-left: 25.4mm !important;
          margin-right: 25.4mm !important;
        }
        
        body { 
          font-family: "Times New Roman", Times, serif !important;

          font-size: 11pt !important; 
          line-height: 1.4 !important; 
          color: #000 !important; 
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        
        a, a:link, a:visited, a:active {
          color: #2563eb !important;
          text-decoration: underline !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
          font-weight: inherit !important;
          font-size: inherit !important;
        }
        
        a:hover {
          color: #1d4ed8 !important;
          text-decoration: underline !important;
        }
        
        b, strong {
          font-weight: bold !important;
          color: #000 !important;
        }
        
        .header { 
          text-align: center !important; 
          margin-bottom: 8mm !important; 
        }
        .name { 
          font-size: 22pt !important; 
          font-weight: bold !important; 
          letter-spacing: 2pt !important; 
          margin-bottom: 6pt !important; 
          text-transform: uppercase !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .contact { 
          font-size: 10pt !important; 
          margin-bottom: 8pt !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .header-line {
          border: none !important;
          border-top: 1px solid #404040 !important;
          margin: 0 2rem !important;
          height: 1px !important;
        }
        .section-title { 
          font-size: 11pt !important; 
          font-weight: bold !important; 
          margin-top: 12pt !important; 
          margin-bottom: 6pt !important; 
          text-transform: uppercase !important;
          letter-spacing: 1pt !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .section-underline {
          border-bottom: 1px solid #808080 !important;
          margin-bottom: 6pt !important;
          height: 1px !important;
        }
        .job-header, .edu-header { 
          display: flex !important; 
          justify-content: space-between !important; 
          margin-bottom: 6pt !important; 
        }
        .job-title, .degree { 
          font-size: 10pt !important; 
          font-weight: bold !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .company, .school { 
          font-size: 10pt !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .year { 
          font-size: 11pt !important; 
          font-weight: normal !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .bullets { 
          margin-left: 5mm !important; 
          margin-bottom: 6pt !important; 
          margin-top: 6pt !important;
        }
        .bullet { 
          font-size: 9.5pt !important; 
          line-height: 1.4 !important; 
          margin: 0 0 2pt 0 !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .skills-item { 
          font-size: 11pt !important; 
          margin: 2pt 0 !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .skill-category { 
          font-weight: bold !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .project-title {
          font-size: 10pt !important;
          font-weight: bold !important;
          margin-bottom: 2pt !important;
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        @media print {
          body { margin: 0 !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${data.name.toUpperCase()}</div>
        ${contactInfo ? `<div class="contact">${contactInfo}</div>` : ''}
        <hr class="header-line">
      </div>
      
      ${data.workExperience && data.workExperience.length > 0 ? `
        <div class="section-title">${userType === 'fresher' ? 'INTERNSHIPS & WORK EXPERIENCE' : 'EXPERIENCE'}</div>
        <div class="section-underline"></div>
        ${data.workExperience.map(job => `
          <div class="job-header">
            <div>
              <div class="job-title">${job.role}</div>
              <div class="company">${job.company}</div>
            </div>
            <div class="year">${job.year}</div>
          </div>
          ${job.bullets && job.bullets.length > 0 ? `
            <div class="bullets">
              ${job.bullets.map(bullet => `<div class="bullet">• ${bullet}</div>`).join('')}
            </div>
          ` : ''}
        `).join('')}
      ` : ''}
      
      ${data.education && data.education.length > 0 ? `
        <div class="section-title">EDUCATION</div>
        <div class="section-underline"></div>
        ${data.education.map(edu => `
          <div class="edu-header">
            <div>
              <div class="degree">${edu.degree}</div>
              <div class="school">${edu.school}</div>
              ${edu.cgpa ? `<div style="font-size: 10pt; color: #4B5563; font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">CGPA: ${edu.cgpa}</div>` : ''}
            </div>
            <div class="year">${edu.year}</div>
          </div>
        `).join('')}
      ` : ''}
      
      ${data.projects && data.projects.length > 0 ? `
        <div class="section-title">PROJECTS</div>
        <div class="section-underline"></div>
        ${data.projects.map(project => `
          <div class="project-title">${project.title}</div>
          ${project.bullets && project.bullets.length > 0 ? `
            <div class="bullets">
              ${project.bullets.map(bullet => `<div class="bullet">• ${bullet}</div>`).join('')}
            </div>
          ` : ''}
        `).join('')}
      ` : ''}
      
      ${data.skills && data.skills.length > 0 ? `
        <div class="section-title">SKILLS</div>
        <div class="section-underline"></div>
        ${data.skills.map(skill => `
          <div class="skills-item">
            <span class="skill-category">${skill.category}:</span> ${skill.list ? skill.list.join(', ') : ''}
          </div>
        `).join('')}
      ` : ''}
      
      ${data.certifications && data.certifications.length > 0 ? `
        <div class="section-title">CERTIFICATIONS</div>
        <div class="section-underline"></div>
        <div class="bullets">
          ${data.certifications.map(cert => {
            // Handle both string and object formats
            let certText = '';
            if (typeof cert === 'string') {
              certText = cert;
            } else if (cert && typeof cert === 'object') {
              // Handle various object formats
              if ('title' in cert && 'description' in cert) {
                certText = `${cert.title} - ${cert.description}`;
              } else if ('title' in cert && 'issuer' in cert) {
                certText = `${cert.title} - ${cert.issuer}`;
              } else if ('name' in cert) {
                certText = cert.name;
              } else if ('title' in cert) {
                certText = cert.title;
              } else if ('description' in cert) {
                certText = cert.description;
              } else {
                certText = Object.values(cert).filter(Boolean).join(' - ');
              }
            } else {
              certText = String(cert);
            }
            return `<div class="bullet">• ${certText}</div>`;
          }).join('')}
        </div>
      ` : ''}
      
      ${data.projects?.some(project => project.githubUrl) ? `
        <div class="section-title">REFERENCED PROJECTS</div>
        <div class="section-underline"></div>
        <div class="bullets">
          ${data.projects
            .filter(project => project.githubUrl)
            .map(project => `
              <div class="bullet">• ${project.title}: <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb !important; text-decoration: underline !important;">${project.githubUrl}</a></div>
            `).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;
};