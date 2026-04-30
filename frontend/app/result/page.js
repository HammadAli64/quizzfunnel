"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import BrandHeader from "@/components/BrandHeader";

const TRACK_BY_ARCHETYPE = {
  "Ghost Architect": "AI Agents and automated software bots.",
  "Attention Broker": "Faceless content and digital influence.",
  "System Architect": "Global logistics and automated publishing.",
  "Profit Raider": "Crypto markets and Blockchain loops.",
};

function getCleanReportLines(report) {
  return report
    .split("\n")
    .filter((line) => line.trim() !== "")
    .filter((line) => !line.startsWith("The Archetype (Skill Course Mapping)"))
    .filter((line) => !line.startsWith("Determined by the majority of answers in Q2 and Q6."))
    .filter((line) => !line.startsWith("• Ghost Architect:"))
    .filter((line) => !line.startsWith("• Attention Broker:"))
    .filter((line) => !line.startsWith("• System Architect:"))
    .filter((line) => !line.startsWith("• Profit Raider:"))
    .filter((line) => !line.startsWith("Selected Archetype:"))
    .filter((line) => !line.startsWith("Recommended Track:"));
}

function renderStyledReport(report) {
  const lines = getCleanReportLines(report);
  const reportTitle = lines.find((line) => line.startsWith("THE SOVEREIGN ENTITY AUDIT: DOSSIER"));
  const sectionTitles = lines.filter((line) => line.startsWith("Section "));
  const sections = sectionTitles.map((title, index) => {
    const start = lines.indexOf(title) + 1;
    const end = index < sectionTitles.length - 1 ? lines.indexOf(sectionTitles[index + 1]) : lines.length;
    return { title, content: lines.slice(start, end) };
  });

  const keyPrefixes = [
    "STATUS:",
    "ARCHETYPE:",
    "ANALYSIS:",
    "DETECTED VIRUS:",
    "THE STING:",
    "THE DIAGNOSIS:",
    "URGENCY OVERRIDE:",
    "WARNING:",
    "1. THE WEAPON",
    "2. THE SHIELD",
    "3. THE PROTOCOL",
  ];

  return (
    <>
      {reportTitle ? <h2 className="result-heading">{reportTitle}</h2> : null}
      <div className="section-cards-grid">
        {sections.map((section) => (
          <article key={section.title} className="section-card">
            <h3 className="result-subheading">{section.title}</h3>
            {section.content.map((line, idx) => {
              if (line.startsWith("• Course:")) {
                const courseValue = line.replace("• Course:", "").trim();
                return (
                  <p key={`${section.title}-${idx}`} className="result-line result-line-rich result-course-line">
                    <span className="result-key">Course:</span>{" "}
                    <span className="result-course-pill">{courseValue}</span>
                  </p>
                );
              }
              const matchedPrefix = keyPrefixes.find((prefix) => line.startsWith(prefix));
              if (matchedPrefix) {
                return (
                  <p key={`${section.title}-${idx}`} className="result-line result-line-rich">
                    <span className="result-key">{matchedPrefix}</span>{" "}
                    {line.replace(matchedPrefix, "").trim()}
                  </p>
                );
              }
              return (
                <p key={`${section.title}-${idx}`} className="result-line">
                  {line}
                </p>
              );
            })}
          </article>
        ))}
      </div>
    </>
  );
}

export default function ResultPage() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("quiz_result");
    if (raw) {
      setResult(JSON.parse(raw));
    }
  }, []);

  useEffect(() => {
    document.body.classList.add("result-view");
    return () => {
      document.body.classList.remove("result-view");
    };
  }, []);

  if (!result) {
    return (
      <main className="page-wrap">
        <section className="card">
          <BrandHeader subtitle="No profile found yet. Complete the audit to generate your Project Obsidian diagnosis." />
          <h2>Audit result not found</h2>
          <p>Complete the Sovereign Entity Audit first.</p>
          <Link href="/quiz">
            <button className="btn btn-primary">Begin Audit</button>
          </Link>
        </section>
      </main>
    );
  }

  const resolvedTrack =
    result.recommended_track || TRACK_BY_ARCHETYPE[result.archetype] || "Track to be assigned";

  async function loadLogoDataUrl() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load logo"));
      img.src = "/logo.webp";
    });
  }

  async function downloadReportPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const maxTextWidth = pageWidth - margin * 2;
    let y = margin;

    try {
      const logoDataUrl = await loadLogoDataUrl();
      const logoWidth = 170;
      const logoHeight = 70;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoDataUrl, "PNG", logoX, y, logoWidth, logoHeight);
      y += logoHeight + 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(190, 153, 46);
      doc.text("MONEY • POWER • FREEDOM • HONOUR", pageWidth / 2, y, { align: "center" });
      y += 26;
    } catch {
      // Continue PDF generation even if logo load fails.
    }

    const addLine = (text, fontSize = 12, style = "normal", color = [25, 38, 66], extraGap = 6) => {
      doc.setFont("helvetica", style);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      const wrapped = doc.splitTextToSize(text, maxTextWidth);
      const blockHeight = wrapped.length * (fontSize + 4);
      if (y + blockHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(wrapped, margin, y);
      y += blockHeight + extraGap;
    };

    addLine("THE SOVEREIGN ENTITY AUDIT: PROJECT OBSIDIAN", 18, "bold", [190, 153, 46], 10);
    addLine("Personalized Strategic Report", 11, "normal", [88, 102, 129]);
    y += 4;

    addLine(`Score: ${result.score} / 170`, 12, "bold");
    addLine(`Designation: ${result.designation || result.category}`, 12, "bold");
    addLine(`Archetype: ${result.archetype}`, 12, "bold");
    addLine(`Recommended Track: ${resolvedTrack}`, 12, "bold");
    addLine(`Detected Virus: ${result.fatal_flaw}`, 12, "bold");
    y += 10;

    const reportLines = getCleanReportLines(result.ai_report);
    reportLines.forEach((line) => {
      if (line.startsWith("THE SOVEREIGN ENTITY AUDIT: DOSSIER")) return;
      if (line.startsWith("Section ")) {
        addLine(line, 14, "bold", [190, 153, 46], 10);
        return;
      }
      const emphasisPrefixes = [
        "STATUS:",
        "ARCHETYPE:",
        "ANALYSIS:",
        "DETECTED VIRUS:",
        "THE STING:",
        "THE DIAGNOSIS:",
        "URGENCY OVERRIDE:",
        "WARNING:",
        "1. THE WEAPON",
        "2. THE SHIELD",
        "3. THE PROTOCOL",
      ];
      const isEmphasis = emphasisPrefixes.some((prefix) => line.startsWith(prefix));
      const isCourseLine = line.startsWith("• Course:");
      addLine(line, 11, isEmphasis || isCourseLine ? "bold" : "normal", isCourseLine ? [190, 153, 46] : [25, 38, 66]);
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `project-obsidian-report-${timestamp}.pdf`;

    // Use blob download to avoid browser navigating to broken file:// URLs.
    const pdfBlob = doc.output("blob");
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <main className="page-wrap">
      <section className="card result-page-shell">
        <BrandHeader subtitle="Your strategic report is ready." />
        <div className="result-summary-panel">
          <h2 className="section-title">PROJECT OBSIDIAN DIAGNOSIS</h2>
          <div className="result-summary-grid">
            <div className="summary-item">
              <p className="summary-label">Score</p>
              <p className="summary-value">{result.score} / 170</p>
            </div>
            <div className="summary-item">
              <p className="summary-label">Designation</p>
              <p className="summary-value">{result.designation || result.category}</p>
            </div>
            <div className="summary-item">
              <p className="summary-label">Archetype</p>
              <p className="summary-value">{result.archetype}</p>
            </div>
            <div className="summary-item">
              <p className="summary-label">Detected Virus</p>
              <p className="summary-value">{result.fatal_flaw}</p>
            </div>
          </div>
          <p className="section-subtitle">
            <strong>About The Syndicate:</strong> The Syndicate is built to convert raw hustle into a
            disciplined execution stack through skills, psychology, and strategic operating rules.
          </p>
        </div>
        {renderStyledReport(result.ai_report)}

        <button className="btn btn-primary result-download-btn" onClick={() => void downloadReportPdf()}>
          DOWNLOAD THE BLUEPRINT &amp; ENTER THE SYNDICATE
        </button>
      </section>
    </main>
  );
}
