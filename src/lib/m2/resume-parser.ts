import { sanitizeResumeText } from "./skill-extractor";

export interface ParsedResumeResult {
  text: string;
  filename: string;
  mimeType: string;
  charCount: number;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit per Section 4.3

/**
 * Extracts plain text from uploaded PDF, DOCX, Markdown, or plain text buffer.
 */
export async function parseResumeFile(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<ParsedResumeResult> {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error("File exceeds maximum size limit of 5 MB.");
  }

  const lowerName = filename.toLowerCase();
  let rawText = "";

  if (lowerName.endsWith(".pdf") || mimeType === "application/pdf") {
    try {
      // Dynamic import to avoid SSR bundling issues if any
      const pdfParseModule = await import("pdf-parse");
      type PdfParserFn = (b: Buffer) => Promise<{ text: string }>;
      const pdfParse = (typeof pdfParseModule === "function"
        ? pdfParseModule
        : (pdfParseModule as { default?: PdfParserFn }).default || pdfParseModule) as PdfParserFn;
      const data = await pdfParse(buffer);
      rawText = data.text || "";
    } catch (err) {
      console.warn("pdf-parse extraction failed, attempting fallback:", err);
      // Fallback: extract ASCII strings
      rawText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }
  } else if (
    lowerName.endsWith(".docx") ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || "";
    } catch (err) {
      console.warn("mammoth docx extraction failed:", err);
      throw new Error("Could not parse DOCX file. Please upload a PDF or paste text directly.");
    }
  } else {
    // Markdown or plain text (.md, .txt)
    rawText = buffer.toString("utf-8");
  }

  const sanitized = sanitizeResumeText(rawText);
  if (!sanitized || sanitized.trim().length === 0) {
    throw new Error(
      "No readable text could be extracted from this document. If this is a scanned image, please paste your resume text directly."
    );
  }

  return {
    text: sanitized,
    filename,
    mimeType: mimeType || "application/octet-stream",
    charCount: sanitized.length,
  };
}
