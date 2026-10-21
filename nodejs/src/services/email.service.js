const { Resend } = require('resend');
let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (e) {
    nodemailer = null;
}

class EmailService {
    constructor() {
        this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
        this.fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'LearnProof AI <onboarding@resend.dev>';
        this.smtpTransporter = null;
        this.initSmtp();
    }

    initSmtp() {
        if (!nodemailer) return;
        const user = process.env.SMTP_USER || process.env.GMAIL_USER;
        const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
        if (user && pass) {
            const host = process.env.SMTP_HOST || (user.includes('@gmail.com') ? 'smtp.gmail.com' : 'smtp.gmail.com');
            const port = Number(process.env.SMTP_PORT) || 465;
            const secure = port === 465;
            try {
                this.smtpTransporter = nodemailer.createTransport({
                    host,
                    port,
                    secure,
                    auth: { user, pass }
                });
                console.log(`[EmailService] SMTP transporter configured for ${user} (${host}:${port})`);
            } catch (err) {
                console.error('[EmailService] Failed to initialize SMTP:', err.message);
            }
        }
    }

    /**
     * Send OTP Verification Email
     * Supports:
     * 1. Resend API (RESEND_API_KEY)
     * 2. Gmail / SMTP (SMTP_USER + SMTP_PASS or GMAIL_USER + GMAIL_APP_PASSWORD)
     * 3. Terminal dev logging fallback with devCode return
     * 
     * @param {string} toEmail 
     * @param {string} otpCode 
     */
    async sendOtpEmail(toEmail, otpCode) {
        // Always log OTP in terminal for immediate testing and verification
        console.log(`\n========================================`);
        console.log(`🔐 [LearnProof Auth OTP]`);
        console.log(`   Recipient : ${toEmail}`);
        console.log(`   Code      : ${otpCode}`);
        console.log(`   Timestamp : ${new Date().toISOString()}`);
        console.log(`========================================\n`);

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your LearnProof AI Verification Code</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
                    <tr>
                        <td align="center">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 460px; background-color: #ffffff; border-radius: 24px; border: 1px solid #fed7aa; box-shadow: 0 16px 36px rgba(249, 115, 22, 0.08); overflow: hidden;">
                                <tr>
                                    <td align="center" style="padding: 32px 24px 20px 24px;">
                                        <h1 style="color: #ea580c; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">LearnProof AI</h1>
                                        <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">AI-Powered Learning Platform</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 28px 28px 28px; text-align: center;">
                                        <div style="background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%); border: 1px solid #ffedd5; border-radius: 20px; padding: 24px 16px;">
                                            <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">Sign-In Verification Code</h2>
                                            <p style="font-size: 13px; color: #475569; margin: 0 0 20px 0; line-height: 1.5;">
                                                Enter this 6-digit code in the app to securely sign in to your LearnProof account.
                                            </p>
                                            
                                            <div style="background-color: #f97316; color: #ffffff; font-size: 30px; font-weight: 800; letter-spacing: 7px; padding: 12px 24px; border-radius: 12px; display: inline-block; margin-bottom: 16px; box-shadow: 0 8px 18px rgba(249, 115, 22, 0.22);">
                                                ${otpCode}
                                            </div>
                                            
                                            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                                                ⏱️ Valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 0 24px 24px 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                                        &copy; ${new Date().getFullYear()} LearnProof AI. All rights reserved.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        // 1. Try Gmail / Custom SMTP if configured
        if (this.smtpTransporter) {
            try {
                const info = await this.smtpTransporter.sendMail({
                    from: this.fromEmail,
                    to: toEmail,
                    subject: `${otpCode} is your LearnProof AI verification code`,
                    html: html
                });
                console.log(`[EmailService] SMTP email delivered to ${toEmail} (ID: ${info.messageId})`);
                return { success: true, provider: 'smtp', messageId: info.messageId };
            } catch (smtpErr) {
                console.error('[EmailService] SMTP send error:', smtpErr.message);
            }
        }

        // 2. Try Resend API if configured
        if (process.env.RESEND_API_KEY) {
            try {
                const client = this.resend || new Resend(process.env.RESEND_API_KEY);
                const { data, error } = await client.emails.send({
                    from: this.fromEmail,
                    to: toEmail,
                    subject: `${otpCode} is your LearnProof AI verification code`,
                    html: html
                });

                if (error) {
                    console.error('[EmailService] Resend API error response:', error);
                    return { success: true, warning: error.message };
                }

                console.log(`[EmailService] Resend email dispatched to ${toEmail} (ID: ${data?.id})`);
                return { success: true, provider: 'resend', id: data?.id };
            } catch (resendErr) {
                console.error('[EmailService] Unexpected error sending via Resend:', resendErr.message);
                return { success: true, warning: resendErr.message };
            }
        }

        // 3. Fallback: Development Mode without email provider keys
        console.log(`[EmailService] Notice: Neither RESEND_API_KEY nor SMTP credentials (GMAIL_USER/GMAIL_APP_PASSWORD) are set in .env.`);
        console.log(`[EmailService] Running in dev mode: verification code is logged above.`);
        return { 
            success: true, 
            devMode: true, 
            devCode: otpCode 
        };
    }
}

module.exports = new EmailService();
