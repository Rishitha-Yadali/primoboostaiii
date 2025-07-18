import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const parseFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return await parsePDF(file);
  } else if (fileName.endsWith('.docx')) {
    return await parseDocx(file);
  } else if (fileName.endsWith('.txt')) {
    return await parseText(file);
  } else {
    throw new Error('Unsupported file format. Please use PDF, DOCX, or TXT files.');
  }
};

const parsePDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    text += strings.join(' ') + ' ';
  }

  return text.trim();
};

const parseDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const parseText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read text file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};