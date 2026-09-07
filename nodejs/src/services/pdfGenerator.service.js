const PDFDocument = require('pdfkit');

/**
 * Clean markdown symbols for PDFKit text rendering
 */
function cleanMarkdownLine(line) {
    if (!line) return '';
    return line
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\\([*_{}[\]()#+\-.!])/g, '$1')
        .trim();
}

/**
 * Generate a clean, beautifully formatted Study Notes PDF using PDFKit
 */
function buildStudyNotesPDF({ title, pages, subjectCategory }) {
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 50, left: 45, right: 45 },
        bufferPages: true,
        autoFirstPage: false
    });

    const primaryColor = '#4338ca'; // Indigo 700
    const darkTextColor = '#0f172a'; // Slate 900
    const bodyTextColor = '#334155'; // Slate 700
    const codeBgColor = '#f1f5f9'; // Slate 100
    const codeBorderColor = '#cbd5e1'; // Slate 300

    const totalPagesCount = (pages && pages.length) || 1;

    (pages || []).forEach((page, pageIdx) => {
        doc.addPage();
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const contentWidth = pageWidth - 90;

        // Top Brand Header Banner
        doc.rect(45, 30, contentWidth, 24).fill('#eef2ff');
        doc.rect(45, 30, 95, 24).fill(primaryColor);

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
            .text('LEARNPROOF AI', 52, 38, { characterSpacing: 1 });

        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(primaryColor)
            .text((subjectCategory || 'STUDY GUIDE').toUpperCase(), 150, 38);

        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#6366f1')
            .text(`TOPIC ${pageIdx + 1} OF ${totalPagesCount}`, pageWidth - 140, 38, { width: 95, align: 'right' });

        // Document Title
        doc.moveDown(1.8);
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#1e1b4b')
            .text(title || 'Lecture Study Notes', 45, 68, { width: contentWidth });

        // Topic Banner Box
        const topicBoxY = doc.y + 6;
        doc.rect(45, topicBoxY, contentWidth, 26).fill('#f8fafc');
        doc.rect(45, topicBoxY, 4, 26).fill(primaryColor);

        doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e1b4b')
            .text(page.title || `Topic ${pageIdx + 1}`, 56, topicBoxY + 7, { width: contentWidth - 20 });

        doc.y = topicBoxY + 34;

        // Render Page Content
        const rawContent = page.content || '';
        const lines = rawContent.split('\n');
        let inCodeBlock = false;
        let codeLines = [];
        let codeLanguage = '';

        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            const trimmed = rawLine.trim();

            // Code Block Handling
            if (trimmed.startsWith('```')) {
                if (inCodeBlock) {
                    // Flush accumulated code block
                    const codeBlockY = doc.y + 4;
                    const codeText = codeLines.join('\n');
                    doc.font('Courier').fontSize(8.5);
                    const blockHeight = Math.max(28, doc.heightOfString(codeText, { width: contentWidth - 24 }) + 16);

                    // Check page overflow
                    if (codeBlockY + blockHeight > pageHeight - 65) {
                        doc.addPage();
                        doc.y = 45;
                    }

                    const currentY = doc.y;
                    doc.rect(45, currentY, contentWidth, blockHeight).fillAndStroke(codeBgColor, codeBorderColor);
                    
                    // Code header tag
                    if (codeLanguage) {
                        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#64748b')
                            .text(codeLanguage.toUpperCase(), contentWidth + 10, currentY + 4, { align: 'right' });
                    }

                    doc.font('Courier').fontSize(8.5).fillColor(darkTextColor)
                        .text(codeText, 55, currentY + 8, { width: contentWidth - 20, lineGap: 2 });

                    doc.y = currentY + blockHeight + 8;
                    inCodeBlock = false;
                    codeLines = [];
                    codeLanguage = '';
                } else {
                    inCodeBlock = true;
                    codeLanguage = trimmed.slice(3).trim();
                    codeLines = [];
                }
                continue;
            }

            if (inCodeBlock) {
                codeLines.push(rawLine);
                continue;
            }

            if (!trimmed) {
                doc.moveDown(0.4);
                continue;
            }

            // Headers
            if (trimmed.startsWith('# ')) {
                doc.moveDown(0.6);
                doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e1b4b')
                    .text(cleanMarkdownLine(trimmed.slice(2)), 45, doc.y, { width: contentWidth });
                doc.moveDown(0.3);
            } else if (trimmed.startsWith('## ')) {
                doc.moveDown(0.5);
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#312e81')
                    .text(cleanMarkdownLine(trimmed.slice(3)), 45, doc.y, { width: contentWidth });
                doc.moveDown(0.2);
            } else if (trimmed.startsWith('### ')) {
                doc.moveDown(0.4);
                doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#3730a3')
                    .text(cleanMarkdownLine(trimmed.slice(4)), 45, doc.y, { width: contentWidth });
                doc.moveDown(0.2);
            } else if (trimmed.startsWith('#### ')) {
                doc.moveDown(0.3);
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#4338ca')
                    .text(cleanMarkdownLine(trimmed.slice(5)), 45, doc.y, { width: contentWidth });
                doc.moveDown(0.2);
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
                // List items
                const isNumbered = /^\d+\.\s/.test(trimmed);
                const bullet = isNumbered ? trimmed.match(/^\d+\./)[0] : '•';
                const textContent = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');

                const bulletX = 52;
                const textX = 66;

                // Check page overflow
                if (doc.y > pageHeight - 65) {
                    doc.addPage();
                    doc.y = 45;
                }

                const currentY = doc.y;
                doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor)
                    .text(bullet, bulletX, currentY);

                doc.font('Helvetica').fontSize(9.5).fillColor(bodyTextColor)
                    .text(cleanMarkdownLine(textContent), textX, currentY, { width: contentWidth - 25, lineGap: 2 });

                doc.moveDown(0.25);
            } else if (trimmed.startsWith('> ')) {
                // Blockquote
                const quoteText = cleanMarkdownLine(trimmed.slice(2));
                const quoteY = doc.y;
                doc.rect(45, quoteY, 3, 20).fill('#6366f1');
                doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#3730a3')
                    .text(quoteText, 55, quoteY + 2, { width: contentWidth - 15 });
                doc.moveDown(0.4);
            } else {
                // Standard paragraph
                if (doc.y > pageHeight - 65) {
                    doc.addPage();
                    doc.y = 45;
                }

                doc.font('Helvetica').fontSize(9.5).fillColor(bodyTextColor)
                    .text(cleanMarkdownLine(trimmed), 45, doc.y, { width: contentWidth, lineGap: 2.5 });
                doc.moveDown(0.35);
            }
        }

        // Checklist Box on final topic page
        if (pageIdx === totalPagesCount - 1) {
            const checkY = Math.min(doc.y + 10, pageHeight - 110);
            doc.rect(45, checkY, contentWidth, 34).fillAndStroke('#f0fdf4', '#bbf7d0');
            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#166534')
                .text('Study Revision Checklist', 55, checkY + 7);
            doc.font('Helvetica').fontSize(8.5).fillColor('#15803d')
                .text('Review key algorithms & data patterns above • Re-test intuition with LearnProof AI Quiz', 55, checkY + 20);
        }
    });

    // Add running footers to all pages
    const range = doc.bufferedPageRange();
    for (let p = range.start; p < range.start + range.count; p++) {
        doc.switchToPage(p);
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;

        doc.rect(45, pageHeight - 40, pageWidth - 90, 0.5).fill('#e2e8f0');
        doc.font('Helvetica').fontSize(8).fillColor('#94a3b8')
            .text('LearnProof AI Study Notes', 45, pageHeight - 32);

        doc.font('Helvetica').fontSize(8).fillColor('#94a3b8')
            .text('learnproofai.com', pageWidth / 2 - 30, pageHeight - 32, { align: 'center' });

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b')
            .text(`Page ${p + 1} of ${range.count}`, pageWidth - 145, pageHeight - 32, { width: 100, align: 'right' });
    }

    return doc;
}

module.exports = {
    buildStudyNotesPDF
};
