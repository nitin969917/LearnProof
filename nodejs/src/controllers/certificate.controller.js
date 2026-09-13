const prisma = require('../lib/prisma');
const { generateCertificatePDF } = require('../services/certificate.service');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

/**
 * ─────────────────────────────────────────────────────────────
 * USER CONTROLLER METHODS
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Submit a request for a certificate after passing a quiz/course.
 */
const requestCertificate = async (req, res) => {
    try {
        const user = req.user;
        const { playlistId, quizId, fullName, userNotes } = req.body;

        if (!playlistId && !quizId) {
            return res.status(400).json({ error: 'playlistId or quizId is required to request a certificate.' });
        }

        // Verify playlist or quiz
        let targetPlaylist = null;
        let targetQuiz = null;

        if (playlistId) {
            targetPlaylist = await prisma.playlist.findFirst({
                where: { id: parseInt(playlistId), userId: user.id },
                include: { videos: true }
            });
            if (!targetPlaylist) {
                return res.status(404).json({ error: 'Course playlist not found.' });
            }
        }

        if (quizId) {
            targetQuiz = await prisma.quiz.findFirst({
                where: { id: parseInt(quizId), userId: user.id }
            });
        } else if (playlistId) {
            // Find latest passed combined quiz for this playlist
            targetQuiz = await prisma.quiz.findFirst({
                where: {
                    userId: user.id,
                    playlistId: parseInt(playlistId),
                    passed: true
                },
                orderBy: { attempted_at: 'desc' }
            });
        }

        if (!targetQuiz || !targetQuiz.passed) {
            return res.status(400).json({ 
                error: 'You must pass the certification test before requesting a certificate.' 
            });
        }

        // Check if a request already exists for this playlist
        const existingRequest = await prisma.certificateRequest.findFirst({
            where: {
                userId: user.id,
                playlistId: targetPlaylist ? targetPlaylist.id : null,
                status: { in: ['PENDING', 'APPROVED'] }
            },
            include: { certificate: true }
        });

        if (existingRequest) {
            if (existingRequest.status === 'APPROVED') {
                return res.status(200).json({
                    message: 'You already have an approved certificate for this course.',
                    request: existingRequest,
                    certificate: existingRequest.certificate
                });
            }
            return res.status(200).json({
                message: 'A certificate request is already pending review by an admin.',
                request: existingRequest
            });
        }

        // Create new CertificateRequest
        const recipientName = (fullName && fullName.trim()) ? fullName.trim() : user.name;
        const newRequest = await prisma.certificateRequest.create({
            data: {
                userId: user.id,
                playlistId: targetPlaylist ? targetPlaylist.id : null,
                videoId: targetQuiz?.videoId || null,
                quizId: targetQuiz?.id || null,
                fullName: recipientName,
                score: targetQuiz?.score || 100,
                status: 'PENDING',
                userNotes: userNotes || null
            },
            include: {
                playlist: { select: { id: true, name: true, pid: true } }
            }
        });

        // Record user activity
        await prisma.userActivityLog.create({
            data: {
                userId: user.id,
                activity_type: `Requested Certificate: ${targetPlaylist?.name || 'Course'}`
            }
        });

        return res.status(201).json({
            message: 'Certificate request submitted successfully for admin review.',
            request: newRequest
        });
    } catch (error) {
        console.error('Request Certificate Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Get current user's certificate requests and their statuses.
 */
const getMyRequests = async (req, res) => {
    try {
        const user = req.user;
        const requests = await prisma.certificateRequest.findMany({
            where: { userId: user.id },
            include: {
                playlist: {
                    select: {
                        id: true,
                        name: true,
                        pid: true,
                        thumbnail: true,
                        videos: { select: { id: true } }
                    }
                },
                certificate: true,
                template: { select: { name: true, slug: true, layout: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        return res.status(200).json(requests);
    } catch (error) {
        console.error('Get My Requests Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Get current user's issued certificates.
 */
const getMyCertificates = async (req, res) => {
    try {
        const user = req.user;
        const certificates = await prisma.certificate.findMany({
            where: { 
                userId: user.id,
                status: 'ACTIVE'
            },
            include: {
                playlist: {
                    include: {
                        videos: { select: { id: true, name: true, duration_seconds: true } }
                    }
                },
                video: true,
                template: true,
                request: true
            },
            orderBy: { issued_at: 'desc' }
        });

        const result = certificates.map(c => ({
            id: c.certificate_id,
            numericId: c.id,
            certificate_id: c.certificate_id,
            title: c.video?.name || c.playlist?.name || "Certificate of Achievement",
            type: c.playlistId ? "Course Specialization" : "Single Video Mastery",
            issued_at: c.issued_at,
            download_url: c.download_url || `/api/certificates/${c.certificate_id}/pdf`,
            status: c.status,
            template: c.template,
            recipient_name: c.request?.fullName || user.name,
            total_videos: c.playlist?.videos?.length || 1,
            playlist_id: c.playlist?.pid
        }));

        return res.status(200).json(result);
    } catch (error) {
        console.error('Get My Certificates Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Stream or download the Certificate PDF file.
 * Automatically generates the PDF if missing from disk.
 */
const getCertificatePdf = async (req, res) => {
    try {
        const { certId } = req.params;
        if (!certId || certId === 'null' || certId === 'undefined') {
            return res.status(400).send('Certificate ID is required.');
        }

        const isNumeric = /^\d+$/.test(certId);
        const cert = await prisma.certificate.findFirst({
            where: {
                OR: [
                    { certificate_id: certId },
                    ...(isNumeric ? [{ id: parseInt(certId) }] : [])
                ]
            },
            include: {
                user: true,
                playlist: true,
                video: true,
                template: true,
                request: true
            }
        });

        if (!cert) {
            return res.status(404).send('Certificate not found.');
        }

        const fileName = `${cert.certificate_id}.pdf`;
        const filePath = path.join(__dirname, '../../media/certificates', fileName);

        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Generate dynamically on disk if missing
        if (!fs.existsSync(filePath)) {
            const recipientName = cert.request?.fullName || cert.user?.name || 'Learner';
            const courseName = cert.playlist?.name || cert.video?.name || 'Mastery Certification';
            const tmpl = cert.template || await prisma.certificateTemplate.findFirst({ where: { isDefault: true } }) || {};
            await generateCertificatePDF(cert.certificate_id, recipientName, courseName, cert.issued_at, tmpl);
        }

        // Update download_url in database if missing
        if (!cert.download_url) {
            await prisma.certificate.update({
                where: { id: cert.id },
                data: { download_url: `/api/certificates/${cert.certificate_id}/pdf` }
            }).catch(() => {});
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="LearnProof_Certificate_${cert.certificate_id.slice(0, 8)}.pdf"`);
        return res.sendFile(filePath);
    } catch (error) {
        console.error('Serve Certificate PDF Error:', error);
        return res.status(500).send('Failed to serve certificate PDF.');
    }
};

/**
 * Public/User: Get active templates list
 */
const getTemplates = async (req, res) => {
    try {
        const templates = await prisma.certificateTemplate.findMany({
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
        });
        return res.status(200).json(templates);
    } catch (error) {
        console.error('Get Templates Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * ─────────────────────────────────────────────────────────────
 * ADMIN CONTROLLER METHODS
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Admin: Get certificate summary statistics.
 */
const getAdminCertificateStats = async (req, res) => {
    try {
        const [totalRequests, pendingRequests, approvedRequests, rejectedRequests, totalIssued, totalTemplates] = await Promise.all([
            prisma.certificateRequest.count(),
            prisma.certificateRequest.count({ where: { status: 'PENDING' } }),
            prisma.certificateRequest.count({ where: { status: 'APPROVED' } }),
            prisma.certificateRequest.count({ where: { status: 'REJECTED' } }),
            prisma.certificate.count({ where: { status: 'ACTIVE' } }),
            prisma.certificateTemplate.count()
        ]);

        return res.status(200).json({
            totalRequests,
            pendingRequests,
            approvedRequests,
            rejectedRequests,
            totalIssued,
            totalTemplates
        });
    } catch (error) {
        console.error('Get Admin Certificate Stats Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Admin: Get filtered/searched list of certificate requests.
 */
const getAdminRequests = async (req, res) => {
    try {
        const { status = 'ALL', search = '' } = req.query;

        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { playlist: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const requests = await prisma.certificateRequest.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile_pic: true,
                        level: true,
                        xp: true
                    }
                },
                playlist: {
                    select: {
                        id: true,
                        name: true,
                        pid: true,
                        thumbnail: true,
                        videos: { select: { id: true, is_completed: true } }
                    }
                },
                quiz: {
                    select: {
                        id: true,
                        score: true,
                        passed: true,
                        attempted_at: true
                    }
                },
                certificate: true,
                template: true
            },
            orderBy: { created_at: 'desc' }
        });

        return res.status(200).json(requests);
    } catch (error) {
        console.error('Get Admin Requests Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Admin: Approve a certificate request and generate PDF.
 */
const approveCertificateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { templateId, adminNotes, recipientName } = req.body;
        const adminUser = req.user;

        const request = await prisma.certificateRequest.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: true,
                playlist: { include: { videos: true } },
                video: true,
                certificate: true
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Certificate request not found.' });
        }

        if (request.status === 'APPROVED' && request.certificate) {
            return res.status(400).json({ error: 'This certificate request has already been approved.' });
        }

        // Determine template to use
        let chosenTemplate = null;
        if (templateId) {
            chosenTemplate = await prisma.certificateTemplate.findUnique({
                where: { id: parseInt(templateId) }
            });
        }
        if (!chosenTemplate) {
            chosenTemplate = await prisma.certificateTemplate.findFirst({
                where: { isDefault: true }
            }) || await prisma.certificateTemplate.findFirst();
        }

        const finalRecipientName = (recipientName && recipientName.trim()) 
            ? recipientName.trim() 
            : (request.fullName || request.user.name);

        const contentName = request.playlist?.name || request.video?.name || 'Expert Specialization Course';
        const certUuid = uuidv4();
        const downloadUrl = `/api/certificates/${certUuid}/pdf`;

        // Generate PDF using template
        await generateCertificatePDF(
            certUuid,
            finalRecipientName,
            contentName,
            new Date(),
            chosenTemplate || {}
        );

        // Transaction to update request and create Certificate
        const [updatedRequest, certificate] = await prisma.$transaction([
            prisma.certificateRequest.update({
                where: { id: request.id },
                data: {
                    status: 'APPROVED',
                    fullName: finalRecipientName,
                    adminNotes: adminNotes || null,
                    reviewedBy: adminUser.name || 'Admin',
                    reviewedAt: new Date(),
                    templateId: chosenTemplate ? chosenTemplate.id : null
                }
            }),
            prisma.certificate.create({
                data: {
                    userId: request.userId,
                    playlistId: request.playlistId,
                    videoId: request.videoId,
                    certificate_id: certUuid,
                    download_url: downloadUrl,
                    status: 'ACTIVE',
                    templateId: chosenTemplate ? chosenTemplate.id : null,
                    requestId: request.id
                }
            })
        ]);

        // Create log activity
        await prisma.userActivityLog.create({
            data: {
                userId: request.userId,
                activity_type: `Certificate Approved: ${contentName}`
            }
        });

        // Send Inbox Notification to user
        try {
            await prisma.inboxMessage.create({
                data: {
                    receiverId: request.userId,
                    subject: `🎓 Certificate Approved: ${contentName}`,
                    message: `Congratulations ${finalRecipientName}! Your certificate request for "${contentName}" has been officially verified and approved. You can view, share, or download your verified credential from the My Certificates dashboard.`,
                    isRead: false
                }
            });
        } catch (msgErr) {
            console.warn('Inbox message creation error (non-fatal):', msgErr.message);
        }

        return res.status(200).json({
            message: 'Certificate approved and generated successfully.',
            request: updatedRequest,
            certificate
        });
    } catch (error) {
        console.error('Approve Certificate Request Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Admin: Reject a certificate request with feedback.
 */
const rejectCertificateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, adminNotes } = req.body;
        const adminUser = req.user;

        if (!reason) {
            return res.status(400).json({ error: 'A rejection reason is required to notify the student.' });
        }

        const request = await prisma.certificateRequest.findUnique({
            where: { id: parseInt(id) },
            include: { playlist: true, user: true }
        });

        if (!request) {
            return res.status(404).json({ error: 'Certificate request not found.' });
        }

        const updatedRequest = await prisma.certificateRequest.update({
            where: { id: request.id },
            data: {
                status: 'REJECTED',
                rejectionReason: reason,
                adminNotes: adminNotes || null,
                reviewedBy: adminUser.name || 'Admin',
                reviewedAt: new Date()
            }
        });

        // Send Inbox Notification explaining reason
        try {
            const courseTitle = request.playlist?.name || 'Course';
            await prisma.inboxMessage.create({
                data: {
                    receiverId: request.userId,
                    subject: `Certificate Request Update: ${courseTitle}`,
                    message: `Your request for the certificate of "${courseTitle}" could not be approved at this time. Feedback from verification review: "${reason}". Please review your progress and feel free to submit an updated request or reach out to support.`,
                    isRead: false
                }
            });
        } catch (msgErr) {
            console.warn('Inbox notification error:', msgErr.message);
        }

        return res.status(200).json({
            message: 'Certificate request rejected.',
            request: updatedRequest
        });
    } catch (error) {
        console.error('Reject Certificate Request Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Admin: Get list of all issued certificates.
 */
const getAdminCertificates = async (req, res) => {
    try {
        const certificates = await prisma.certificate.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, profile_pic: true } },
                playlist: { select: { id: true, name: true, pid: true } },
                template: true,
                request: true
            },
            orderBy: { issued_at: 'desc' }
        });

        return res.status(200).json(certificates);
    } catch (error) {
        console.error('Get Admin Certificates Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Admin: Revoke / delete certificate.
 */
const revokeCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        const cert = await prisma.certificate.findUnique({
            where: { id: parseInt(id) }
        });

        if (!cert) {
            return res.status(404).json({ error: 'Certificate not found.' });
        }

        await prisma.certificate.update({
            where: { id: parseInt(id) },
            data: { status: 'REVOKED' }
        });

        return res.status(200).json({ message: 'Certificate successfully revoked.' });
    } catch (error) {
        console.error('Revoke Certificate Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Admin: Create a new certificate template.
 */
const createAdminTemplate = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            isDefault = false,
            layout = 'classic',
            primaryColor = '#1e293b',
            accentColor = '#f59e0b',
            textColor = '#0f172a',
            backgroundColor = '#ffffff',
            titleText = 'CERTIFICATE OF ACHIEVEMENT',
            subtitleText = 'THIS IS OFFICIALLY PRESENTED TO',
            bodyText = 'for successfully mastering the curriculum and passing the comprehensive examination for',
            issuerName = 'LearnProof Academy',
            issuerTitle = 'Global Certification Authority',
            signatoryName = 'Academic Director',
            signatoryTitle = 'Head of Certifications',
            sealText = 'VERIFIED'
        } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ error: 'Template name and unique slug are required.' });
        }

        // If new template is marked default, unmark other defaults
        if (isDefault) {
            await prisma.certificateTemplate.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        const newTemplate = await prisma.certificateTemplate.create({
            data: {
                name,
                slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
                description,
                isDefault: Boolean(isDefault),
                layout,
                primaryColor,
                accentColor,
                textColor,
                backgroundColor,
                titleText,
                subtitleText,
                bodyText,
                issuerName,
                issuerTitle,
                signatoryName,
                signatoryTitle,
                sealText
            }
        });

        return res.status(201).json({
            message: 'Certificate template created successfully.',
            template: newTemplate
        });
    } catch (error) {
        console.error('Create Template Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Admin: Update an existing template.
 */
const updateAdminTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.isDefault) {
            await prisma.certificateTemplate.updateMany({
                where: { id: { not: parseInt(id) } },
                data: { isDefault: false }
            });
        }

        const updated = await prisma.certificateTemplate.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        return res.status(200).json({
            message: 'Template updated successfully.',
            template: updated
        });
    } catch (error) {
        console.error('Update Template Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Admin: Delete a certificate template.
 */
const deleteAdminTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const countUsage = await prisma.certificate.count({
            where: { templateId: parseInt(id) }
        });

        if (countUsage > 0) {
            return res.status(400).json({
                error: `Cannot delete template: it is currently referenced by ${countUsage} issued certificate(s).`
            });
        }

        await prisma.certificateTemplate.delete({
            where: { id: parseInt(id) }
        });

        return res.status(200).json({ message: 'Template deleted successfully.' });
    } catch (error) {
        console.error('Delete Template Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    // User routes
    requestCertificate,
    getMyRequests,
    getMyCertificates,
    getCertificatePdf,
    getTemplates,
    // Admin routes
    getAdminCertificateStats,
    getAdminRequests,
    approveCertificateRequest,
    rejectCertificateRequest,
    getAdminCertificates,
    revokeCertificate,
    createAdminTemplate,
    updateAdminTemplate,
    deleteAdminTemplate
};
