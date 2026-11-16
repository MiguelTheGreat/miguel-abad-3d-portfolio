import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export function streamResumePdf(res) {
  const customResumePath = path.join(UPLOADS_DIR, 'Miguel_Andrei_Abad_Resume.pdf');
  if (fs.existsSync(customResumePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Miguel_Andrei_Abad_Resume.pdf"');
    return fs.createReadStream(customResumePath).pipe(res);
  }

  const profile = db.prepare('SELECT * FROM profile LIMIT 1').get();
  const education = db.prepare('SELECT * FROM education').all();
  const skills = db.prepare('SELECT * FROM skills ORDER BY sort_order ASC').all();
  const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC').all();
  const experiences = db.prepare('SELECT * FROM experiences').all();

  const doc = new PDFDocument({ margin: 48, size: 'LETTER' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="Miguel_Andrei_Abad_Resume.pdf"');
  doc.pipe(res);

  const ink = '#111111';
  const muted = '#555555';
  const accent = '#0047FF';

  // Header
  doc.font('Helvetica-Bold').fontSize(20).fillColor(ink)
    .text((profile?.full_name || 'MIGUEL ANDREI B. ABAD').toUpperCase(), { align: 'center' });
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(9.5).fillColor(muted)
    .text(
      `${profile?.location || 'Cavite, Philippines'}  ·  ${profile?.phone || '+63 977 652 9418'}  ·  ${profile?.email || 'abadandrei22@gmail.com'}`,
      { align: 'center' }
    );
  doc.font('Helvetica').fontSize(9).fillColor(accent)
    .text(profile?.linkedin_url || 'https://www.linkedin.com/in/miguel-andrei-abad-a8845532a/', { align: 'center' });

  doc.moveDown(0.8);

  const sectionHeader = (title) => {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(title.toUpperCase());
    const y = doc.y + 2;
    doc.moveTo(48, y).lineTo(564, y).lineWidth(0.8).strokeColor('#CCCCCC').stroke();
    doc.moveDown(0.45);
  };

  // Summary
  sectionHeader('Professional Summary');
  doc.font('Helvetica').fontSize(9.5).fillColor('#222222')
    .text(`${profile?.summary || ''} ${profile?.summary_secondary || ''}`.trim(), { lineGap: 2 });
  doc.moveDown(0.7);

  // Education
  sectionHeader('Education');
  education.forEach((edu) => {
    const coursework = JSON.parse(edu.coursework_json || '[]');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(`${edu.institution} (${edu.period})`);
    doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#333333').text(`${edu.degree} | ${edu.honors}`);
    if (coursework.length) {
      doc.font('Helvetica').fontSize(9).fillColor(muted)
        .text(`Relevant Coursework: ${coursework.join(', ')}`);
    }
    doc.moveDown(0.5);
  });

  // Technical Skills
  sectionHeader('Technical Skills');
  skills.forEach((sk) => {
    const items = JSON.parse(sk.items_json || '[]');
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(ink).text(`${sk.category}: `, { continued: true });
    doc.font('Helvetica').fontSize(9.5).fillColor('#222222').text(items.join(', '));
  });
  doc.moveDown(0.7);

  // Technical Projects
  sectionHeader('Academic & Engineering Projects');
  projects.forEach((proj) => {
    const techs = JSON.parse(proj.technologies_json || '[]');
    const bullets = JSON.parse(proj.bullets_json || '[]');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(`${proj.title} `, { continued: true });
    doc.font('Helvetica').fontSize(9).fillColor(accent).text(`[${proj.status}]`);
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(muted).text(`Technologies: ${techs.join(', ')}`);
    bullets.forEach((b) => {
      doc.font('Helvetica').fontSize(9).fillColor('#222222').text(`• ${b}`, { indent: 10, lineGap: 1.5 });
    });
    doc.moveDown(0.45);
  });

  // Leadership Experience
  sectionHeader('Leadership & Organizational Experience');
  experiences.forEach((exp) => {
    const bullets = JSON.parse(exp.bullets_json || '[]');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(`${exp.role} — ${exp.organization}`);
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(muted).text(exp.period);
    bullets.forEach((b) => {
      doc.font('Helvetica').fontSize(9).fillColor('#222222').text(`• ${b}`, { indent: 10, lineGap: 1.5 });
    });
    doc.moveDown(0.4);
  });

  doc.end();
}
