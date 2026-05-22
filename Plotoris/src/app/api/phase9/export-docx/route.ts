import { NextResponse } from "next/server";
// @ts-ignore
import HTMLtoDOCX from "html-to-docx";

import JSZip from "jszip";

export async function POST(request: Request) {
  try {
    const { html } = await request.json();

    if (!html) {
      return NextResponse.json({ error: "Missing HTML content" }, { status: 400 });
    }

    // Convert HTML to DOCX buffer with base formatting
    const fileBuffer = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
      font: "Times New Roman",
      fontSize: 20, // 10pt
      margins: {
        top: 1440,
        right: 1440,
        bottom: 1440,
        left: 1440,
      },
    });

    // Inject IEEE 2-column format into the XML
    const zip = await JSZip.loadAsync(fileBuffer);
    const docXml = await zip.file("word/document.xml")?.async("string");
    
    let finalBuffer = fileBuffer;
    if (docXml) {
      // The OOXML schema strictly requires w:cols to appear AFTER w:pgMar
      const newXml = docXml.replace(/(<w:pgMar[^>]+>)/g, '$1<w:cols w:num="2" w:space="708" w:equalWidth="1"/>');
      zip.file("word/document.xml", newXml);
      finalBuffer = await zip.generateAsync({ type: "nodebuffer" });
    }

    // Return as a downloadable file
    return new NextResponse(finalBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Research_Paper_Draft.docx"`,
      },
    });
  } catch (error) {
    console.error("DOCX generation error:", error);
    return NextResponse.json({ error: "Failed to generate DOCX" }, { status: 500 });
  }
}
