const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF certificate and save it to the media folder.
 * Supports dynamic templates with customized colors, text, layouts, logo embedding, and signatures.
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

            const width = doc.page.width;
            const height = doc.page.height;

            // Template theme tokens with sensible defaults
            const primaryColor = template.primaryColor || '#1e293b';
            const accentColor = template.accentColor || '#f59e0b';
            const textColor = template.textColor || '#0f172a';
            const bgColor = template.backgroundColor || '#ffffff';
            const titleText = template.titleText || 'CERTIFICATE OF ACHIEVEMENT';
            const subtitleText = template.subtitleText || 'THIS IS PROUDLY PRESENTED TO';
            const bodyText = template.bodyText || 'for demonstrating exemplary mastery of the curriculum and successfully passing the comprehensive examination for';
            const issuerName = template.issuerName || 'LEARNPROOF ACADEMY';
            const issuerTitle = template.issuerTitle || 'Global Council for Digital & Technical Credentials';
            const signatoryName = template.signatoryName || 'Dr. Arthur Pendelton';
            const signatoryTitle = template.signatoryTitle || 'Director of Academic Credentials';
            const sealText = template.sealText || 'VERIFIED';
            const layout = template.layout || 'classic';

            // 1. Background Fill
            doc.rect(0, 0, width, height).fill(bgColor);

            const margin = 26;

            if (layout === 'modern') {
                // Modern Clean Tech Layout
                doc.rect(0, 0, width, 14).fill(accentColor);
                doc.rect(margin, margin + 4, width - (margin * 2), height - (margin * 2) - 8)
                    .lineWidth(2.5)
                    .stroke(primaryColor);
                doc.rect(margin + 8, margin + 12, width - (margin * 2) - 16, height - (margin * 2) - 24)
                    .lineWidth(1)
                    .stroke(accentColor);
            } else if (layout === 'executive') {
                // Executive Layout
                doc.rect(margin, margin, width - (margin * 2), height - (margin * 2))
                    .lineWidth(6)
                    .stroke(primaryColor);
                doc.rect(margin + 6, margin + 6, width - (margin * 2) - 12, height - (margin * 2) - 12)
                    .lineWidth(1.5)
                    .stroke(accentColor);
                doc.rect(margin + 12, margin + 12, width - (margin * 2) - 24, height - (margin * 2) - 24)
                    .lineWidth(1)
                    .stroke(primaryColor);
            } else if (layout === 'minimal') {
                // Minimalist Layout
                doc.rect(margin + 8, margin + 8, width - (margin * 2) - 16, height - (margin * 2) - 16)
                    .lineWidth(2.5)
                    .stroke(accentColor);
            } else {
                // Classic Academic Layout (Default)
                doc.rect(margin, margin, width - (margin * 2), height - (margin * 2))
                    .lineWidth(7)
                    .stroke(primaryColor);

                doc.rect(margin + 10, margin + 10, width - (margin * 2) - 20, height - (margin * 2) - 20)
                    .lineWidth(1.5)
                    .stroke(accentColor);

                // Corner solid accent squares
                const decoSize = 50;
                doc.rect(margin, margin, decoSize, decoSize).fill(primaryColor);
                doc.rect(width - margin - decoSize, margin, decoSize, decoSize).fill(primaryColor);
                doc.rect(margin, height - margin - decoSize, decoSize, decoSize).fill(primaryColor);
                doc.rect(width - margin - decoSize, height - margin - decoSize, decoSize, decoSize).fill(primaryColor);
            }

            // 2. Logo Brandmark
            const possibleLogoPaths = [
                path.join(__dirname, '../assets/LP_logo.png'),
                path.join(__dirname, '../../../frontend/public/LP_logo.png'),
                path.join(__dirname, '../../public/LP_logo.png')
            ];

            let logoRendered = false;
            for (const p of possibleLogoPaths) {
                if (fs.existsSync(p)) {
                    try {
                        doc.image(p, width / 2 - 45, 38, { width: 90 });
                        logoRendered = true;
                        break;
                    } catch (e) {
                        console.warn('PDF logo embed warning:', e.message);
                    }
                }
            }

            const headerStartY = logoRendered ? 88 : 60;

            // 3. Issuer Branding
            doc.font('Helvetica-Bold')
                .fontSize(8.5)
                .fillColor('#64748b')
                .text(issuerTitle.toUpperCase(), 0, headerStartY, { align: 'center', characterSpacing: 2 });

            // 4. Header - Title
            doc.font('Helvetica-Bold')
                .fontSize(28)
                .fillColor(primaryColor)
                .text(titleText.toUpperCase(), 0, headerStartY + 20, { align: 'center', characterSpacing: 2 });

            // Ornate center divider
            const lineW = 140;
            doc.rect(width / 2 - (lineW / 2), headerStartY + 56, lineW, 1.5).fill(accentColor);

            // 5. Subtitle
            doc.font('Helvetica')
                .fontSize(10)
                .fillColor('#64748b')
                .text(subtitleText.toUpperCase(), 0, headerStartY + 74, { align: 'center', characterSpacing: 2 });

            // 6. Recipient Name
            doc.font('Helvetica-Bold')
                .fontSize(34)
                .fillColor(accentColor)
                .text((userName || 'LEARNER').toUpperCase(), 0, headerStartY + 96, { align: 'center' });

            // Thin underline under recipient
            doc.rect(width / 2 - 160, headerStartY + 138, 320, 0.75).fill('#cbd5e1');

            // 7. Body Text & Course Name
            doc.font('Helvetica')
                .fontSize(11)
                .fillColor('#475569')
                .text(bodyText, width / 2 - 270, headerStartY + 152, { width: 540, align: 'center', lineGap: 3 });

            // Course Name with shaded rounded badge
            const courseBadgeY = headerStartY + 192;
            doc.font('Helvetica-Bold')
                .fontSize(20)
                .fillColor(textColor)
                .text(contentName, 0, courseBadgeY, { align: 'center', oblique: true });

            // 8. Seal (Center bottom)
            const sealY = height - 145;
            // Metallic Gold Seal rings
            doc.circle(width / 2, sealY + 28, 38)
                .lineWidth(3)
                .stroke(accentColor);
            doc.circle(width / 2, sealY + 28, 33)
                .lineWidth(1)
                .stroke(primaryColor);

            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor(primaryColor)
                .text(sealText.toUpperCase(), width / 2 - 25, sealY + 20, { width: 50, align: 'center', characterSpacing: 1 });

            doc.fontSize(6)
                .fillColor(accentColor)
                .text('LEARNPROOF', width / 2 - 25, sealY + 32, { width: 50, align: 'center' });

            // 9. Signatures (Left & Right)
            const footerY = height - 90;

            // Left Side: Date Conferred
            doc.rect(90, footerY - 5, 160, 0.75).fill('#94a3b8');
            doc.font('Helvetica-Bold')
                .fontSize(10)
                .fillColor(textColor)
                .text(new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), 90, footerY - 20, { width: 160, align: 'center' });
            doc.font('Helvetica')
                .fontSize(8)
                .fillColor('#64748b')
                .text('DATE CONFERRED', 90, footerY + 6, { width: 160, align: 'center', characterSpacing: 1 });

            // Right Side: Academic Signatory
            doc.rect(width - 250, footerY - 5, 160, 0.75).fill('#94a3b8');
            doc.font('Helvetica-Bold')
                .fontSize(10)
                .fillColor(textColor)
                .text(signatoryName, width - 250, footerY - 20, { width: 160, align: 'center' });
            doc.font('Helvetica')
                .fontSize(8)
                .fillColor('#64748b')
                .text(signatoryTitle.toUpperCase(), width - 250, footerY + 6, { width: 160, align: 'center', characterSpacing: 0.5 });

            // Bottom Security Footer
            doc.font('Helvetica')
                .fontSize(7.5)
                .fillColor('#94a3b8')
                .text(`LearnProof Accreditation Repository  •  Certificate ID: ${certId}  •  Verify at https://learnproofai.com/verify/${certId}`, 0, height - 36, { align: 'center' });

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
