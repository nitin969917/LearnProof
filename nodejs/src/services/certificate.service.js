const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF certificate and save it to the media folder.
 * Supports dynamic templates with customized colors, text, layouts, and signatures.
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
            const subtitleText = template.subtitleText || 'THIS IS OFFICIALLY PRESENTED TO';
            const bodyText = template.bodyText || 'for successfully mastering the curriculum and passing the comprehensive examination for';
            const issuerName = template.issuerName || 'LearnProof Academy';
            const issuerTitle = template.issuerTitle || 'Global Certification Authority';
            const signatoryName = template.signatoryName || 'Academic Director';
            const signatoryTitle = template.signatoryTitle || 'Head of Certifications';
            const sealText = template.sealText || 'VERIFIED';
            const layout = template.layout || 'classic';

            // 1. Background Fill
            doc.rect(0, 0, width, height).fill(bgColor);

            const margin = 28;

            if (layout === 'modern') {
                // Modern Clean Tech Layout
                // Top accent ribbon
                doc.rect(0, 0, width, 14).fill(accentColor);
                // Outer clean frame
                doc.rect(margin, margin + 4, width - (margin * 2), height - (margin * 2) - 8)
                    .lineWidth(2)
                    .stroke(primaryColor);
                // Inner subtle accent frame
                doc.rect(margin + 8, margin + 12, width - (margin * 2) - 16, height - (margin * 2) - 24)
                    .lineWidth(1)
                    .stroke(accentColor);
            } else if (layout === 'executive') {
                // Executive / High-Honor Layout
                // Double thick luxury border
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
                // Minimalist Aesthetic Layout
                doc.rect(margin + 10, margin + 10, width - (margin * 2) - 20, height - (margin * 2) - 20)
                    .lineWidth(2)
                    .stroke(accentColor);
            } else {
                // Classic Academic Layout (Default)
                doc.rect(margin, margin, width - (margin * 2), height - (margin * 2))
                    .lineWidth(8)
                    .stroke(primaryColor);

                doc.rect(margin + 12, margin + 12, width - (margin * 2) - 24, height - (margin * 2) - 24)
                    .lineWidth(2)
                    .stroke(accentColor);

                // Corner solid accent squares
                const decoSize = 54;
                doc.rect(margin, margin, decoSize, decoSize).fill(primaryColor);
                doc.rect(width - margin - decoSize, margin, decoSize, decoSize).fill(primaryColor);
                doc.rect(margin, height - margin - decoSize, decoSize, decoSize).fill(primaryColor);
                doc.rect(width - margin - decoSize, height - margin - decoSize, decoSize, decoSize).fill(primaryColor);
            }

            // 2. Issuer Branding Top
            doc.font('Helvetica-Bold')
                .fontSize(13)
                .fillColor(primaryColor)
                .text(issuerName.toUpperCase(), 0, 68, { align: 'center', characterSpacing: 2 });
            
            doc.font('Helvetica')
                .fontSize(8)
                .fillColor('#64748b')
                .text(issuerTitle.toUpperCase(), 0, 84, { align: 'center', characterSpacing: 1.5 });

            // 3. Header - Title
            doc.font('Helvetica-Bold')
                .fontSize(34)
                .fillColor(primaryColor)
                .text(titleText.toUpperCase(), 0, 114, { align: 'center', characterSpacing: 2 });

            // Accent underline
            const lineW = 120;
            doc.rect(width / 2 - (lineW / 2), 154, lineW, 2).fill(accentColor);

            // 4. Subtitle
            doc.font('Helvetica')
                .fontSize(11)
                .fillColor('#64748b')
                .text(subtitleText.toUpperCase(), 0, 185, { align: 'center', characterSpacing: 2 });

            // 5. Recipient Name
            doc.font('Helvetica-Bold')
                .fontSize(38)
                .fillColor(accentColor)
                .text((userName || 'LEARNER').toUpperCase(), 0, 215, { align: 'center' });

            // Thin separator under recipient
            doc.rect(width / 2 - 140, 262, 280, 0.75).fill('#cbd5e1');

            // 6. Body Text & Course Name
            doc.font('Helvetica')
                .fontSize(12)
                .fillColor('#475569')
                .text(bodyText, width / 2 - 250, 280, { width: 500, align: 'center', lineGap: 3 });

            doc.font('Helvetica-Bold')
                .fontSize(22)
                .fillColor(textColor)
                .text(contentName, 0, 325, { align: 'center', oblique: true });

            // 7. Verified Seal / Badge (Center-lower)
            const sealY = height - 175;
            doc.circle(width / 2, sealY + 45, 38)
                .lineWidth(3)
                .stroke(accentColor);
            doc.circle(width / 2, sealY + 45, 33)
                .lineWidth(1)
                .stroke(primaryColor);

            doc.font('Helvetica-Bold')
                .fontSize(8.5)
                .fillColor(primaryColor)
                .text(sealText.toUpperCase(), width / 2 - 25, sealY + 38, { width: 50, align: 'center', characterSpacing: 1 });

            doc.fontSize(6.5)
                .fillColor(accentColor)
                .text('LEARNPROOF', width / 2 - 25, sealY + 50, { width: 50, align: 'center' });

            // 8. Bottom Signatures & Certification Meta
            const footerY = height - 95;

            // Left Side: Date Issued & Signatory
            doc.rect(90, footerY - 5, 160, 1).fill('#94a3b8');
            doc.font('Helvetica-Bold')
                .fontSize(10)
                .fillColor(textColor)
                .text(new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), 90, footerY - 20, { width: 160, align: 'center' });
            doc.font('Helvetica')
                .fontSize(8.5)
                .fillColor('#64748b')
                .text('DATE ISSUED', 90, footerY + 8, { width: 160, align: 'center', characterSpacing: 1 });

            // Right Side: Signatory or Cert ID
            doc.rect(width - 250, footerY - 5, 160, 1).fill('#94a3b8');
            doc.font('Helvetica-Bold')
                .fontSize(10)
                .fillColor(textColor)
                .text(signatoryName, width - 250, footerY - 20, { width: 160, align: 'center' });
            doc.font('Helvetica')
                .fontSize(8.5)
                .fillColor('#64748b')
                .text(signatoryTitle.toUpperCase(), width - 250, footerY + 8, { width: 160, align: 'center', characterSpacing: 0.5 });

            // Bottom Footer Details
            doc.font('Helvetica')
                .fontSize(7.5)
                .fillColor('#94a3b8')
                .text(`Certificate ID: ${certId}  •  Verify at https://learnproofai.com/verify/${certId}`, 0, height - 42, { align: 'center' });

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
