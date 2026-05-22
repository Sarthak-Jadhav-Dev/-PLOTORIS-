import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageOrientation,
  SectionType,
  ColumnBreak,
  TableRow,
  TableCell,
  Table,
  WidthType,
  BorderStyle,
} from "docx";

export const maxDuration = 30;

// Strip all HTML tags and decode common entities
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Detect if text is a heading (ALL CAPS section heading like "I. INTRODUCTION")
function isIEEEHeading(text: string): boolean {
  const trimmed = text.trim();
  return /^[IVX]+\.\s+[A-Z\s&]+$/.test(trimmed) || trimmed === trimmed.toUpperCase() && trimmed.length < 60 && trimmed.length > 3;
}

// Parse an HTML string into docx Paragraph objects
function htmlToParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Split by block-level tags
  const blocks = html.split(/<\/(?:p|h[1-6]|div|li|tr)>/gi);

  for (const block of blocks) {
    // Get tag type
    const tagMatch = block.match(/^<(h[1-6]|p|div|li)[^>]*>/i);
    const tag = tagMatch ? tagMatch[1].toLowerCase() : "p";

    // Extract text content
    let text = stripHtml(block);
    if (!text.trim()) continue;

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      if (!line) continue;

      // Detect bold/italic patterns
      const isBold = /<strong|<b[ >]/i.test(block);
      const isItalic = /<em|<i[ >]/i.test(block);
      const isHeading = tag.startsWith("h") || isIEEEHeading(line);

      if (tag === "h1") {
        // Paper title — centered, large, bold
        paragraphs.push(
          new Paragraph({
            text: line,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 120 },
            run: { bold: true, font: "Times New Roman", size: 44 } as any,
          })
        );
      } else if (isHeading) {
        // IEEE section heading — centered, uppercase, bold
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 60 },
            children: [
              new TextRun({
                text: line.toUpperCase(),
                bold: true,
                font: "Times New Roman",
                size: 20,
              }),
            ],
          })
        );
      } else {
        // Body paragraph — justified, Times New Roman 10pt
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { before: 0, after: 80, line: 240 },
            indent: { firstLine: 360 },
            children: [
              new TextRun({
                text: line,
                font: "Times New Roman",
                size: 20, // 10pt = 20 half-points
                bold: isBold,
                italics: isItalic,
              }),
            ],
          })
        );
      }
    }
  }

  return paragraphs;
}

export async function POST(request: Request) {
  try {
    const { html, projectId } = await request.json();

    if (!html) {
      return NextResponse.json({ error: "Missing HTML content" }, { status: 400 });
    }

    const paragraphs = htmlToParagraphs(html);

    if (paragraphs.length === 0) {
      return NextResponse.json({ error: "No content to export" }, { status: 400 });
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Times New Roman", size: 20 },
          },
        },
      },
      sections: [
        {
          properties: {
            type: SectionType.CONTINUOUS,
            column: {
              space: 708, // ~0.5 inch gap between columns (in twentieths of a point)
              count: 2,
              equalWidth: true,
            },
            page: {
              size: {
                // A4: 11906 x 16838 twips
                width: 11906,
                height: 16838,
                orientation: PageOrientation.PORTRAIT,
              },
              margin: {
                top: 1440,    // 1 inch
                right: 1134,  // ~0.79 inch (IEEE standard)
                bottom: 1440, // 1 inch
                left: 1134,   // ~0.79 inch
              },
            },
            pageNumberStart: 1,
          },
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="IEEE_Paper_${projectId || "Draft"}.docx"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("DOCX generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate DOCX" }, { status: 500 });
  }
}
