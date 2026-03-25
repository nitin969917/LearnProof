const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF certificate and save it to the media folder.
 */
const generateCertificatePDF = (certId, userName, contentName, date) => {
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

            // 1. Background
            doc.rect(0, 0, width, height).fill('#ffffff');
            
            // 2. Main Border (Navy/Gold style)
            const margin = 30;
            doc.rect(margin, margin, width - (margin * 2), height - (margin * 2))
                .lineWidth(8)
                .stroke('#1e293b'); // Navy Blue

            doc.rect(margin + 12, margin + 12, width - (margin * 2) - 24, height - (margin * 2) - 24)
                .lineWidth(2)
                .stroke('#f59e0b'); // Amber/Gold

            // Corner Decorations
            const decoSize = 60;
            // Top Left
            doc.rect(margin, margin, decoSize, decoSize).fill('#1e293b');
            // Top Right
            doc.rect(width - margin - decoSize, margin, decoSize, decoSize).fill('#1e293b');
            // Bottom Left
            doc.rect(margin, height - margin - decoSize, decoSize, decoSize).fill('#1e293b');
            // Bottom Right
            doc.rect(width - margin - decoSize, height - margin - decoSize, decoSize, decoSize).fill('#1e293b');

            // 3. Header - "CERTIFICATE OF COMPLETION"
            doc.font('Helvetica-Bold')
                .fontSize(48)
                .fillColor('#1e293b')
                .text('CERTIFICATE', 0, 100, { align: 'center', characterSpacing: 2 });
            
            doc.fontSize(20)
                .fillColor('#64748b')
                .text('OF COMPLETION', 0, 155, { align: 'center', characterSpacing: 4 });

            // 4. Content
            doc.font('Helvetica')
                .fontSize(18)
                .fillColor('#94a3b8')
                .text('THIS IS TO CERTIFY THAT', 0, 220, { align: 'center' });

            doc.moveDown(0.5);

            // Name
            doc.font('Helvetica-Bold')
                .fontSize(42)
                .fillColor('#f97316') // Orange
                .text(userName.toUpperCase(), { align: 'center' });

            doc.moveDown(0.5);

            doc.font('Helvetica')
                .fontSize(18)
                .fillColor('#64748b')
                .text('has successfully completed the expert-level course in', { align: 'center' });

            doc.moveDown(0.8);

            // Course Name
            doc.font('Helvetica-Bold')
                .fontSize(32)
                .fillColor('#1e293b')
                .text(contentName, { align: 'center', oblique: true });

            // 5. Seal / Badge Effect (Bottom Center-ish)
            const sealX = width / 2 - 50;
            const sealY = height - 180;
            
            doc.circle(width / 2, sealY + 50, 45)
                .lineWidth(4)
                .stroke('#f59e0b');
            
            doc.font('Helvetica-Bold')
                .fontSize(10)
                .fillColor('#f59e0b')
                .text('VERIFIED', width / 2 - 25, sealY + 40, { width: 50, align: 'center' });
            
            doc.fontSize(8)
                .text('LEARNPROOF', width / 2 - 30, sealY + 55, { width: 60, align: 'center' });

            // 6. Signatures & Info
            const footerY = height - 100;
            
            // Left Side: Date
            doc.rect(100, footerY - 5, 150, 1).fill('#cbd5e1'); // Line
            doc.font('Helvetica')
                .fontSize(12)
                .fillColor('#64748b')
                .text('DATE ISSUED', 100, footerY + 10, { width: 150, align: 'center' });
            doc.font('Helvetica-Bold')
                .fillColor('#1e293b')
                .text(new Date(date).toLocaleDateString(), 100, footerY - 25, { width: 150, align: 'center' });

            // Right Side: Cert ID
            doc.rect(width - 250, footerY - 5, 150, 1).fill('#cbd5e1'); // Line
            doc.font('Helvetica')
                .fontSize(12)
                .fillColor('#64748b')
                .text('CERTIFICATE ID', width - 250, footerY + 10, { width: 150, align: 'center' });
            doc.font('Helvetica-Bold')
                .fillColor('#1e293b')
                .text(certId, width - 250, footerY - 25, { width: 150, align: 'center' });

            // Branding at bottom
            doc.fontSize(14)
                .fillColor('#1e293b')
                .text('LearnProof Academy', 0, height - 60, { align: 'center' });

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
