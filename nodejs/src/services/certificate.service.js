const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF certificate and save it to the media folder.
 * Matches the official LearnProof certificate preview design pixel-for-pixel:
 * - High-resolution, prominent official logo branding (width 170)
 * - Grand Times-Bold serif typography
 * - Ornate diamond divider with balanced spacing
 * - Double underline under recipient
 * - Shaded rounded pill badge for course name
 * - 3D Metallic Gold Seal with authentic shield vector
 * - Harmonious vertical distribution (no empty holes or cramped sections)
 * - Clean Date Conferred & Unique Credential ID lines
 * - Proper safe footer spacing (zero border overlap)
 * 
 * @param {string|number} certId - The unique certificate ID
 * @param {string} userName - The recipient's full name
 * @param {string} contentName - Name of the course / playlist
 * @param {Date|string} date - Issue date
 * @param {Object} [template] - Configurable template parameters
 */
const generateCertificatePDF = (certId, userName, contentName, date, template = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                layout: 'landscape',
                size: 'A4',
                margin: 0
            });

            const fileName = `${certId}.pdf`;
            const filePath = path.join(__dirname, '../../media/certificates', fileName);

            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            const width = doc.page.width;   // 841.89
            const height = doc.page.height; // 595.28

            // Template theme tokens with sensible defaults matching benchmark
            const primaryColor = template.primaryColor || '#1e293b';
            const accentColor = template.accentColor || '#f59e0b';
            const textColor = template.textColor || '#0f172a';
            const bgColor = template.backgroundColor || '#ffffff';
            const titleText = template.titleText || 'CERTIFICATE OF ACHIEVEMENT';
            const subtitleText = template.subtitleText || 'THIS IS OFFICIALLY PRESENTED TO';
            const bodyText = template.bodyText || 'for successfully mastering the curriculum and passing the comprehensive examination for';
            const issuerTitle = template.issuerTitle || 'GLOBAL CERTIFICATION AUTHORITY';
            const sealText = template.sealText || 'VERIFIED';
            const layout = template.layout || 'classic';

            // Clean recipient display name
            const finalUserName = (userName && String(userName).trim() && String(userName).trim() !== '****')
                ? String(userName).trim()
                : 'Distinguished Learner';

            // Clean formatted date
            const parsedDate = date ? new Date(date) : new Date();
            const formattedDate = !isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

            // Clean formatted credential ID (avoiding wide UUID stretching)
            const rawId = certId ? String(certId) : 'LP-PREVIEW-2026';
            const formattedCertId = rawId.startsWith('LP-')
                ? rawId
                : (rawId.length > 16 ? `LP-${rawId.slice(0, 8).toUpperCase()}` : rawId.toUpperCase());

            // ── 1. BACKGROUND FILL ──
            doc.rect(0, 0, width, height).fill(bgColor);

            const margin = 20;

            // ── 2. DUAL SECURITY FRAMES & CORNER FLOURISHES ──
            if (layout === 'modern') {
                doc.rect(0, 0, width, 14).fill(accentColor);
                doc.rect(margin, margin + 4, width - (margin * 2), height - (margin * 2) - 8)
                    .lineWidth(2.5)
                    .stroke(primaryColor);
                doc.rect(margin + 8, margin + 12, width - (margin * 2) - 16, height - (margin * 2) - 24)
                    .lineWidth(1)
                    .stroke(accentColor);
            } else if (layout === 'minimal') {
                doc.rect(margin + 8, margin + 8, width - (margin * 2) - 16, height - (margin * 2) - 16)
                    .lineWidth(2.5)
                    .stroke(accentColor);
            } else {
                // Classic Institutional Frame (Default matching Image 1)
                // Outer Heavy Structural Border
                doc.rect(margin, margin, width - (margin * 2), height - (margin * 2))
                    .lineWidth(7)
                    .stroke(primaryColor);

                // Inner Gold Accent Border
                doc.rect(margin + 10, margin + 10, width - (margin * 2) - 20, height - (margin * 2) - 20)
                    .lineWidth(1.5)
                    .stroke(accentColor);

                // Inner Dashed Hairline Security Border
                doc.rect(margin + 16, margin + 16, width - (margin * 2) - 32, height - (margin * 2) - 32)
                    .lineWidth(0.75)
                    .dash(4, { space: 3 })
                    .stroke('#cbd5e1');
                doc.undash();

                // 4 Corner Ornate Gold L-Brackets
                const bOffset = margin + 10;
                const bLen = 22;
                // Top-Left
                doc.moveTo(bOffset, bOffset + bLen).lineTo(bOffset, bOffset).lineTo(bOffset + bLen, bOffset).lineWidth(2).stroke(accentColor);
                // Top-Right
                doc.moveTo(width - bOffset - bLen, bOffset).lineTo(width - bOffset, bOffset).lineTo(width - bOffset, bOffset + bLen).lineWidth(2).stroke(accentColor);
                // Bottom-Left
                doc.moveTo(bOffset, height - bOffset - bLen).lineTo(bOffset, height - bOffset).lineTo(bOffset + bLen, height - bOffset).lineWidth(2).stroke(accentColor);
                // Bottom-Right
                doc.moveTo(width - bOffset - bLen, height - bOffset).lineTo(width - bOffset, height - bOffset).lineTo(width - bOffset, height - bOffset - bLen).lineWidth(2).stroke(accentColor);
            }

            // ── 3. PROMINENT LOGO BRANDMARK ──
            const possibleLogoPaths = [
                path.join(__dirname, '../assets/LP_logo.png'),
                path.join(__dirname, '../../../frontend/public/LP_logo.png'),
                path.join(__dirname, '../../public/LP_logo.png')
            ];

            const logoW = 165;
            let logoRendered = false;
            for (const p of possibleLogoPaths) {
                if (fs.existsSync(p)) {
                    try {
                        doc.image(p, width / 2 - (logoW / 2), 40, { width: logoW });
                        logoRendered = true;
                        break;
                    } catch (e) {
                        console.warn('PDF logo embed warning:', e.message);
                    }
                }
            }

            // ── 4. ISSUER SUBTITLE ──
            const issuerY = logoRendered ? 96 : 65;
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor('#64748b')
                .text(issuerTitle.toUpperCase(), 0, issuerY, { align: 'center', characterSpacing: 2.5 });

            // ── 5. CERTIFICATE TITLE (Grand Serif) ──
            const titleY = issuerY + 18;
            doc.font('Times-Bold')
                .fontSize(28)
                .fillColor(primaryColor)
                .text(titleText.toUpperCase(), 0, titleY, { align: 'center', characterSpacing: 2.5 });

            // ── 6. CENTER ORNATE DIVIDER (Diamond flanked by rules) ──
            const divY = titleY + 40;
            const divLineW = 110;
            doc.rect(width / 2 - divLineW - 14, divY, divLineW, 1).fill(accentColor);
            // Center 45-degree diamond
            doc.polygon(
                [width / 2, divY - 4],
                [width / 2 + 5, divY + 0.5],
                [width / 2, divY + 5],
                [width / 2 - 5, divY + 0.5]
            ).fill(accentColor);
            doc.rect(width / 2 + 14, divY, divLineW, 1).fill(accentColor);

            // ── 7. PRESENTATION SUBTITLE ──
            const subtitleY = divY + 18;
            doc.font('Helvetica-Bold')
                .fontSize(8.5)
                .fillColor('#94a3b8')
                .text(subtitleText.toUpperCase(), 0, subtitleY, { align: 'center', characterSpacing: 2 });

            // ── 8. RECIPIENT NAME (Majestic Serif with Double Underline) ──
            const nameY = subtitleY + 18;
            doc.font('Times-Bold')
                .fontSize(34)
                .fillColor(accentColor)
                .text(finalUserName.toUpperCase(), 0, nameY, { align: 'center' });

            // Double underline under recipient
            doc.rect(width / 2 - 160, nameY + 44, 320, 1.2).fill('#cbd5e1');
            doc.rect(width / 2 - 110, nameY + 47.5, 220, 0.8).fill(accentColor);

            // ── 9. CURRICULUM STATEMENT ──
            const bodyY = nameY + 62;
            doc.font('Helvetica')
                .fontSize(10.5)
                .fillColor('#475569')
                .text(bodyText, width / 2 - 275, bodyY, { width: 550, align: 'center', lineGap: 3 });

            // ── 10. COURSE SPECIALIZATION BADGE (Shaded Rounded Pill) ──
            const badgeW = 430;
            const badgeH = 40;
            const badgeY = bodyY + 32;
            doc.roundedRect(width / 2 - (badgeW / 2), badgeY, badgeW, badgeH, 7)
                .fillAndStroke('#fffbeb', '#fde68a');

            doc.font('Times-BoldItalic')
                .fontSize(16)
                .fillColor(textColor)
                .text(contentName || 'Mastery Certification', width / 2 - (badgeW / 2) + 12, badgeY + 11, { width: badgeW - 24, align: 'center' });

            // ── 11. SIGNATURES, 3D GOLD SEAL & CREDENTIAL ID ROW ──
            const sealCenterY = 444;

            // Center: 3D Metallic Gold Seal with Shield Vector
            // Outer golden foil border
            doc.circle(width / 2, sealCenterY, 36)
                .lineWidth(3)
                .fillAndStroke('#fffbeb', accentColor);

            // Inner dashed gold ring
            doc.circle(width / 2, sealCenterY, 31)
                .lineWidth(1)
                .dash(3, { space: 2 })
                .stroke(accentColor);
            doc.undash();

            // Inner hairline accent ring
            doc.circle(width / 2, sealCenterY, 28)
                .lineWidth(0.5)
                .stroke('#b45309');

            // Center Shield Vector Icon
            doc.save();
            doc.translate(width / 2 - 9, sealCenterY - 17);
            doc.path('M 9 0 C 14 0, 18 3, 18 8 C 18 14, 9 19, 9 19 C 9 19, 0 14, 0 8 C 0 3, 4 0, 9 0 Z').fill('#0f172a');
            doc.path('M 5.5 8.5 L 8 11 L 13 5.5').lineWidth(1.5).stroke('#ffffff');
            doc.restore();

            doc.font('Helvetica-Bold')
                .fontSize(6)
                .fillColor('#0f172a')
                .text(sealText.toUpperCase(), width / 2 - 25, sealCenterY + 12, { width: 50, align: 'center', characterSpacing: 1.2 });

            // Left Side: Date Conferred
            const colW = 160;
            const leftX = 85;
            const lineY = sealCenterY + 6;
            doc.rect(leftX, lineY, colW, 0.75).fill('#cbd5e1');
            doc.font('Helvetica-Bold')
                .fontSize(10.5)
                .fillColor(primaryColor)
                .text(formattedDate, leftX, lineY - 20, { width: colW, align: 'center' });
            doc.font('Helvetica-Bold')
                .fontSize(7)
                .fillColor('#94a3b8')
                .text('DATE CONFERRED', leftX, lineY + 6, { width: colW, align: 'center', characterSpacing: 1.5 });

            // Right Side: Unique Credential ID
            const rightX = width - 85 - colW;
            doc.rect(rightX, lineY, colW, 0.75).fill('#cbd5e1');
            doc.font('Courier-Bold')
                .fontSize(10.5)
                .fillColor(primaryColor)
                .text(formattedCertId, rightX, lineY - 20, { width: colW, align: 'center' });
            doc.font('Helvetica-Bold')
                .fontSize(7)
                .fillColor('#94a3b8')
                .text('UNIQUE CREDENTIAL ID', rightX, lineY + 6, { width: colW, align: 'center', characterSpacing: 1.5 });

            // ── 12. BOTTOM SECURITY & VERIFICATION FOOTER ──
            const footLineY = 524;
            doc.rect(margin + 20, footLineY, width - (margin * 2) - 40, 0.5).fill('#e2e8f0');

            doc.font('Courier')
                .fontSize(8)
                .fillColor('#94a3b8')
                .text('OFFICIALLY VERIFIED CREDENTIAL', margin + 22, footLineY + 8);

            doc.font('Courier')
                .fontSize(8)
                .fillColor('#64748b')
                .text('learnproofai.com/verify', width - margin - 170, footLineY + 8, { width: 148, align: 'right' });

            doc.end();

            stream.on('finish', () => resolve(fileName));
            stream.on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    generateCertificatePDF,
};
