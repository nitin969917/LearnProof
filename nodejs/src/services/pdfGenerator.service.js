const PDFDocument = require('pdfkit');

/**
 * Format LaTeX math expressions into clean readable mathematical text for PDFKit
/**
 * Format LaTeX math expressions into clean, elegant, and readable mathematical text for PDFKit
 */
function formatLatexExpression(expr) {
    if (!expr) return '';
    let str = expr;

    // 1. Fractions: \frac{a}{b} or frac{a}{b} -> (a)/(b)
    for (let i = 0; i < 4; i++) {
        str = str.replace(/\\?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
        str = str.replace(/\\?frac\s+([a-zA-Z0-9]+)\s+([a-zA-Z0-9]+)/g, '$1/$2');
    }

    // 2. Matrix Environments: \begin{pmatrix} a & b \\ c & d \end{pmatrix} -> [ a   b ] \n [ c   d ]
    str = str.replace(/\\begin\{(?:pmatrix|bmatrix|vmatrix|matrix)\}([\s\S]*?)\\end\{(?:pmatrix|bmatrix|vmatrix|matrix)\}/g, (m, body) => {
        const rows = body.trim().split(/\\\\|\n/).map(r => r.trim()).filter(Boolean);
        const formatted = rows.map(r => {
            const cells = r.split('&').map(c => c.trim()).filter(Boolean);
            return '[ ' + cells.join('   ') + ' ]';
        });
        return formatted.length > 1 ? '\n' + formatted.join('\n') + '\n' : (formatted[0] || '[ ]');
    });

    // 3. Logic, Functions, and Linear Algebra Operators
    str = str
        .replace(/\\implies\b/g, ' => ')
        .replace(/\\impliedby\b/g, ' <= ')
        .replace(/\\iff\b/g, ' <=> ')
        .replace(/\\to\b|\\rightarrow\b/g, ' -> ')
        .replace(/\\leftarrow\b/g, ' <- ')
        .replace(/\\Rightarrow\b/g, ' => ')
        .replace(/\\Leftarrow\b/g, ' <= ')
        .replace(/\\Leftrightarrow\b/g, ' <=> ')
        .replace(/\\det\b/g, 'det')
        .replace(/\\dim\b/g, 'dim')
        .replace(/\\ker\b/g, 'ker')
        .replace(/\\rank\b/g, 'rank')
        .replace(/\\operatorname\{([^{}]+)\}/g, '$1')
        .replace(/\\text\{([^{}]+)\}/g, '$1')
        .replace(/\\mathbf\{([^{}]+)\}/g, '$1')
        .replace(/\\mathit\{([^{}]+)\}/g, '$1')
        .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
        .replace(/\\mathbb\{([^{}]+)\}/g, '$1')
        .replace(/\\mathcal\{([^{}]+)\}/g, '$1');

    // 4. Integrals, Summations, and Calculus
    str = str
        .replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/g, 'Integral[$1 to $2] ')
        .replace(/\\int_\{([^{}]+)\}/g, 'Integral[$1] ')
        .replace(/\\int\b/g, 'Integral ')
        .replace(/\\iint\b/g, 'Double-Integral ')
        .replace(/\\iiint\b/g, 'Triple-Integral ')
        .replace(/\\oint\b/g, 'Contour-Integral ')
        .replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, 'Sum($1 to $2) ')
        .replace(/\\sum_\{([^{}]+)\}/g, 'Sum($1) ')
        .replace(/\\sum\b/g, 'Sum ')
        .replace(/\\prod_\{([^{}]+)\}\^\{([^{}]+)\}/g, 'Product($1 to $2) ')
        .replace(/\\prod\b/g, 'Product ')
        .replace(/\\lim_\{([^{}]+)\}/g, 'lim($1) ')
        .replace(/\\sqrt\[([^{}]+)\]\{([^{}]+)\}/g, 'root[$1]($2)')
        .replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');

    // 5. Mathematical Operators (Strict ASCII to prevent WinAnsi font corruption in PDFKit)
    str = str
        .replace(/\\sim\b/g, ' ~ ')
        .replace(/\\approx\b/g, ' ~= ')
        .replace(/\\equiv\b/g, ' == ')
        .replace(/\\ne\b|\\neq\b/g, ' != ')
        .replace(/\\le\b|\\leq\b/g, ' <= ')
        .replace(/\\ge\b|\\geq\b/g, ' >= ')
        .replace(/\\pm\b/g, ' +/- ')
        .replace(/\\mp\b/g, ' -/+ ')
        .replace(/\\times\b/g, ' * ')
        .replace(/\\cdot\b/g, ' * ')
        .replace(/\\div\b/g, ' / ')
        .replace(/\\infty\b/g, 'inf')
        .replace(/\\partial\b/g, 'd')
        .replace(/\\nabla\b/g, 'grad')
        .replace(/\\in\b/g, ' in ')
        .replace(/\\notin\b/g, ' not in ')
        .replace(/\\subset\b/g, ' subset ')
        .replace(/\\subseteq\b/g, ' subset= ')
        .replace(/\\cup\b/g, ' union ')
        .replace(/\\cap\b/g, ' intersect ');

    // 6. Greek Letters in Standard Text
    str = str
        .replace(/\\lambda\b/g, 'lambda')
        .replace(/\\Lambda\b/g, 'Lambda')
        .replace(/\\theta\b/g, 'theta')
        .replace(/\\Theta\b/g, 'Theta')
        .replace(/\\pi\b/g, 'pi')
        .replace(/\\Pi\b/g, 'Pi')
        .replace(/\\alpha\b/g, 'alpha')
        .replace(/\\beta\b/g, 'beta')
        .replace(/\\gamma\b/g, 'gamma')
        .replace(/\\Gamma\b/g, 'Gamma')
        .replace(/\\delta\b/g, 'delta')
        .replace(/\\Delta\b/g, 'Delta')
        .replace(/\\epsilon\b|\\varepsilon\b/g, 'epsilon')
        .replace(/\\mu\b/g, 'mu')
        .replace(/\\nu\b/g, 'nu')
        .replace(/\\sigma\b/g, 'sigma')
        .replace(/\\Sigma\b/g, 'Sigma')
        .replace(/\\tau\b/g, 'tau')
        .replace(/\\phi\b|\\varphi\b/g, 'phi')
        .replace(/\\Phi\b/g, 'Phi')
        .replace(/\\omega\b/g, 'omega')
        .replace(/\\Omega\b/g, 'Omega')
        .replace(/\\rho\b/g, 'rho')
        .replace(/\\zeta\b/g, 'zeta')
        .replace(/\\eta\b/g, 'eta')
        .replace(/\\chi\b/g, 'chi')
        .replace(/\\psi\b/g, 'psi')
        .replace(/\\Psi\b/g, 'Psi');

    // 7. Delimiters & Formatting
    str = str
        .replace(/\\left\s*([(\[{|])/g, '$1')
        .replace(/\\right\s*([)\]}|])/g, '$1')
        .replace(/\\left\./g, '')
        .replace(/\\right\./g, '')
        .replace(/\\{/g, '{')
        .replace(/\\}/g, '}')
        .replace(/\\cos\b/g, 'cos')
        .replace(/\\sin\b/g, 'sin')
        .replace(/\\tan\b/g, 'tan')
        .replace(/\\sec\b/g, 'sec')
        .replace(/\\csc\b/g, 'csc')
        .replace(/\\cot\b/g, 'cot')
        .replace(/\\ln\b/g, 'ln')
        .replace(/\\log\b/g, 'log')
        .replace(/\\exp\b/g, 'exp')
        .replace(/\\quad/g, '  ')
        .replace(/\\qquad/g, '    ')
        .replace(/\\,|\\;|\\!/g, ' ')
        .replace(/\\hat\{([^{}]+)\}/g, '$1^')
        .replace(/\\bar\{([^{}]+)\}/g, 'bar($1)')
        .replace(/\\vec\{([^{}]+)\}/g, 'vec($1)');

    // 8. Superscripts & Subscripts
    str = str.replace(/\^\{([^{}]+)\}/g, '^$1');
    str = str.replace(/_\{([^{}]+)\}/g, '_$1');

    // 9. Strip leftover backslashes
    str = str.replace(/\\([a-zA-Z]+)/g, '$1');
    str = str.replace(/\\/g, '');

    return str.trim();
}

/**
 * Clean markdown symbols and convert LaTeX math for PDFKit text rendering without any font encoding corruption
 */
function cleanMarkdownLine(line) {
    if (!line) return '';
    let str = line;

    // Convert display math ($$...$$) and inline math ($...$) into clean math text
    str = str.replace(/\$\$([\s\S]*?)\$\$/g, (m, p1) => formatLatexExpression(p1));
    str = str.replace(/\$([^\$\n]+?)\$/g, (m, p1) => formatLatexExpression(p1));

    // Also check for standalone LaTeX commands outside delimiters
    if (/(?:\\|\b)(begin|pmatrix|bmatrix|vmatrix|matrix|frac|int|sum|prod|lim|sqrt|alpha|beta|gamma|theta|pi|lambda|cos|sin|tan|ln|log|left|right|partial|approx|sim|le|ge|ne|times|cdot|implies|det|dim|ker|rank|text|mathbf|mathrm)/.test(str)) {
        str = formatLatexExpression(str);
    }

    // Convert any raw Unicode math characters into safe ASCII equivalents
    str = str
        .replace(/λ/g, 'lambda')
        .replace(/Λ/g, 'Lambda')
        .replace(/θ/g, 'theta')
        .replace(/Θ/g, 'Theta')
        .replace(/π/g, 'pi')
        .replace(/Π/g, 'Pi')
        .replace(/α/g, 'alpha')
        .replace(/β/g, 'beta')
        .replace(/γ/g, 'gamma')
        .replace(/Γ/g, 'Gamma')
        .replace(/δ/g, 'delta')
        .replace(/Δ/g, 'Delta')
        .replace(/ε/g, 'epsilon')
        .replace(/μ/g, 'mu')
        .replace(/ν/g, 'nu')
        .replace(/σ/g, 'sigma')
        .replace(/Σ/g, 'Sigma')
        .replace(/τ/g, 'tau')
        .replace(/φ/g, 'phi')
        .replace(/Φ/g, 'Phi')
        .replace(/ω/g, 'omega')
        .replace(/Ω/g, 'Omega')
        .replace(/ρ/g, 'rho')
        .replace(/≤/g, '<=')
        .replace(/≥/g, '>=')
        .replace(/≠/g, '!=')
        .replace(/≈/g, '~=')
        .replace(/≡/g, '==')
        .replace(/±/g, '+/-')
        .replace(/∓/g, '-/+')
        .replace(/×/g, '*')
        .replace(/·/g, '*')
        .replace(/÷/g, '/')
        .replace(/→/g, '->')
        .replace(/←/g, '<-')
        .replace(/⇒/g, '=>')
        .replace(/⇐/g, '<=')
        .replace(/⇔/g, '<=>')
        .replace(/∞/g, 'inf')
        .replace(/∂/g, 'd')
        .replace(/∇/g, 'grad')
        .replace(/∈/g, ' in ')
        .replace(/∉/g, ' not in ')
        .replace(/⊂/g, ' subset ')
        .replace(/⊆/g, ' subset= ')
        .replace(/∪/g, ' union ')
        .replace(/∩/g, ' intersect ')
        .replace(/∑/g, 'Sum ')
        .replace(/∫/g, 'Integral ')
        .replace(/√/g, 'sqrt')
        .replace(/•/g, '-')
        .replace(/[^\x00-\x7F]/g, '');

    return str
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
        margins: { top: 50, bottom: 45, left: 45, right: 45 },
        bufferPages: true,
        autoFirstPage: false
    });

    const primaryColor = '#4338ca'; // Indigo 700
    const primaryBg = '#eef2ff'; // Indigo 50
    const darkTextColor = '#0f172a'; // Slate 900
    const bodyTextColor = '#334155'; // Slate 700
    const codeBgColor = '#f8fafc'; // Slate 50
    const codeBorderColor = '#cbd5e1'; // Slate 300

    const totalPagesCount = (pages && pages.length) || 1;

    const drawHeader = (pageNumber, topicTitle) => {
        const pageWidth = doc.page.width;
        const contentWidth = pageWidth - 90;

        // Header Background Banner
        doc.rect(45, 20, contentWidth, 22).fill(primaryBg);
        doc.rect(45, 20, 90, 22).fill(primaryColor);

        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff')
            .text('LEARNPROOF AI', 52, 27, { characterSpacing: 0.8, lineBreak: false });

        doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryColor)
            .text((subjectCategory || 'DIGITAL STUDY NOTES').toUpperCase(), 145, 27, { width: contentWidth - 230, lineBreak: false });

        if (topicTitle) {
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#6366f1')
                .text(`TOPIC ${pageNumber} OF ${totalPagesCount}`, pageWidth - 145, 27, { width: 100, align: 'right', lineBreak: false });
        }
    };

    (pages || []).forEach((page, pageIdx) => {
        doc.addPage();
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const contentWidth = pageWidth - 90;

        drawHeader(pageIdx + 1, page.title);

        // Document Title
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e1b4b')
            .text(title || 'Lecture Study Notes', 45, 52, { width: contentWidth });

        // Topic Banner Box
        const topicBoxY = doc.y + 4;
        doc.rect(45, topicBoxY, contentWidth, 22).fill('#f1f5f9');
        doc.rect(45, topicBoxY, 4, 22).fill(primaryColor);

        doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1e1b4b')
            .text(page.title || `Topic ${pageIdx + 1}`, 56, topicBoxY + 5, { width: contentWidth - 20, lineBreak: false });

        doc.y = topicBoxY + 28;

        // Render Page Content
        const rawContent = page.content || '';
        const lines = rawContent.split('\n');
        let inCodeBlock = false;
        let codeLines = [];
        let codeLanguage = '';

        const checkOverflow = (requiredHeight = 20) => {
            if (doc.y + requiredHeight > pageHeight - 50) {
                doc.addPage();
                drawHeader(pageIdx + 1, page.title);
                doc.y = 52;
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            const trimmed = rawLine.trim();

            // Code Block Handling
            if (trimmed.startsWith('```')) {
                if (inCodeBlock) {
                    const codeText = codeLines.join('\n') || ' ';
                    doc.font('Courier').fontSize(8);
                    const textHeight = doc.heightOfString(codeText, { width: contentWidth - 20, lineGap: 1.5 });
                    const blockHeight = Math.max(20, textHeight + 12);

                    checkOverflow(blockHeight + 8);

                    const currentY = doc.y;
                    doc.rect(45, currentY, contentWidth, blockHeight).fillAndStroke(codeBgColor, codeBorderColor);

                    if (codeLanguage) {
                        doc.font('Helvetica-Bold').fontSize(7).fillColor('#64748b')
                            .text(codeLanguage.toUpperCase(), contentWidth + 10, currentY + 3, { align: 'right', lineBreak: false });
                    }

                    doc.font('Courier').fontSize(8).fillColor(darkTextColor)
                        .text(codeText, 55, currentY + 6, { width: contentWidth - 20, lineGap: 1.5 });

                    doc.y = currentY + blockHeight + 5;
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
                doc.moveDown(0.25);
                continue;
            }

            // Headers
            if (trimmed.startsWith('# ')) {
                checkOverflow(26);
                doc.moveDown(0.3);
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e1b4b')
                    .text(cleanMarkdownLine(trimmed.slice(2)), 45, doc.y, { width: contentWidth });
                doc.moveDown(0.15);
            } else if (trimmed.startsWith('## ')) {
                checkOverflow(22);
                doc.moveDown(0.25);
                doc.font('Helvetica-Bold').fontSize(11).fillColor('#312e81')
                    .text(cleanMarkdownLine(trimmed.slice(3)), 45, doc.y, { width: contentWidth });
                doc.moveDown(0.15);
            } else if (trimmed.startsWith('### ')) {
                checkOverflow(20);
                doc.moveDown(0.2);
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#3730a3')
                    .text(cleanMarkdownLine(trimmed.slice(4)), 45, doc.y, { width: contentWidth });
                doc.moveDown(0.1);
            } else if (trimmed.startsWith('#### ')) {
                checkOverflow(18);
                doc.moveDown(0.2);
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#4338ca')
                    .text(cleanMarkdownLine(trimmed.slice(5)), 45, doc.y, { width: contentWidth });
                doc.moveDown(0.1);
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
                // List items
                const isNumbered = /^\d+\.\s/.test(trimmed);
                const bullet = isNumbered ? trimmed.match(/^\d+\./)[0] : '-';
                const textContent = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');

                checkOverflow(16);

                const currentY = doc.y;
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor(primaryColor)
                    .text(bullet, 52, currentY, { lineBreak: false });

                doc.font('Helvetica').fontSize(9).fillColor(bodyTextColor)
                    .text(cleanMarkdownLine(textContent), 64, currentY, { width: contentWidth - 20, lineGap: 2 });

                doc.moveDown(0.15);
            } else if (trimmed.startsWith('> ')) {
                // Blockquote
                const quoteText = cleanMarkdownLine(trimmed.slice(2));
                checkOverflow(22);
                const quoteY = doc.y;
                doc.rect(45, quoteY, 3, 16).fill('#6366f1');
                doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#3730a3')
                    .text(quoteText, 54, quoteY + 2, { width: contentWidth - 15 });
                doc.moveDown(0.2);
            } else {
                // Standard paragraph
                checkOverflow(16);
                doc.font('Helvetica').fontSize(9).fillColor(bodyTextColor)
                    .text(cleanMarkdownLine(trimmed), 45, doc.y, { width: contentWidth, lineGap: 2 });
                doc.moveDown(0.2);
            }
        }

        // Flush any unclosed code block
        if (inCodeBlock && codeLines.length > 0) {
            const codeText = codeLines.join('\n');
            doc.font('Courier').fontSize(8);
            const blockHeight = Math.max(20, doc.heightOfString(codeText, { width: contentWidth - 20, lineGap: 1.5 }) + 12);
            checkOverflow(blockHeight + 8);
            const currentY = doc.y;
            doc.rect(45, currentY, contentWidth, blockHeight).fillAndStroke(codeBgColor, codeBorderColor);
            doc.font('Courier').fontSize(8).fillColor(darkTextColor)
                .text(codeText, 55, currentY + 6, { width: contentWidth - 20, lineGap: 1.5 });
            doc.y = currentY + blockHeight + 5;
        }

        // Revision Checklist on final page
        if (pageIdx === totalPagesCount - 1) {
            checkOverflow(36);
            const checkY = doc.y + 6;
            doc.rect(45, checkY, contentWidth, 24).fillAndStroke('#f0fdf4', '#bbf7d0');
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#166534')
                .text('Study Revision Checklist', 54, checkY + 4, { lineBreak: false });
            doc.font('Helvetica').fontSize(7.5).fillColor('#15803d')
                .text('Review key concepts & code patterns above | Re-test intuition with LearnProof AI Quiz', 54, checkY + 14, { lineBreak: false });
            doc.y = checkY + 28;
        }
    });

    // Add running footers to all pages without triggering new page creation
    const range = doc.bufferedPageRange();
    for (let p = range.start; p < range.start + range.count; p++) {
        doc.switchToPage(p);
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;

        doc.rect(45, pageHeight - 32, pageWidth - 90, 0.5).fill('#e2e8f0');
        doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8')
            .text('LearnProof AI Study Companion', 45, pageHeight - 24, { lineBreak: false });

        doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8')
            .text('learnproofai.com', pageWidth / 2 - 30, pageHeight - 24, { align: 'center', lineBreak: false });

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#64748b')
            .text(`Page ${p + 1} of ${range.count}`, pageWidth - 145, pageHeight - 24, { width: 100, align: 'right', lineBreak: false });
    }

    return doc;
}

module.exports = {
    buildStudyNotesPDF
};
