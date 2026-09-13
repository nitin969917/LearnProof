require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/learnproof_db?connection_limit=15&pool_timeout=30';

async function createAllTables() {
  console.log('🚀 [Schema Setup] Ensuring all LearnProof database tables exist via direct PostgreSQL client...');

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const statements = [
    // 1. UserProfile
    `CREATE TABLE IF NOT EXISTS "UserProfile" (
        "id" SERIAL NOT NULL,
        "uid" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "profile_pic" TEXT,
        "xp" INTEGER NOT NULL DEFAULT 0,
        "level" INTEGER NOT NULL DEFAULT 1,
        "streak_count" INTEGER NOT NULL DEFAULT 0,
        "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_uid_key" ON "UserProfile"("uid");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_email_key" ON "UserProfile"("email");`,

    // 2. InboxMessage
    `CREATE TABLE IF NOT EXISTS "InboxMessage" (
        "id" SERIAL NOT NULL,
        "senderId" INTEGER,
        "receiverId" INTEGER,
        "isBroadcast" BOOLEAN NOT NULL DEFAULT false,
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
    );`,

    // 3. MessageReadStatus
    `CREATE TABLE IF NOT EXISTS "MessageReadStatus" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "messageId" INTEGER NOT NULL,
        "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MessageReadStatus_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "MessageReadStatus_userId_messageId_key" ON "MessageReadStatus"("userId", "messageId");`,

    // 4. Playlist
    `CREATE TABLE IF NOT EXISTS "Playlist" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "pid" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "thumbnail" TEXT,
        "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "duration_goal" INTEGER,
        CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Playlist_userId_pid_key" ON "Playlist"("userId", "pid");`,

    // 5. Video
    `CREATE TABLE IF NOT EXISTS "Video" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "vid" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "description" TEXT,
        "playlistId" INTEGER,
        "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "watch_progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        "is_completed" BOOLEAN NOT NULL DEFAULT false,
        "position" INTEGER NOT NULL DEFAULT 0,
        "duration_seconds" INTEGER NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Video_userId_vid_key" ON "Video"("userId", "vid");`,

    // 6. UserActivityLog
    `CREATE TABLE IF NOT EXISTS "UserActivityLog" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "activity_type" TEXT NOT NULL DEFAULT 'WATCH_VIDEO',
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
    );`,

    // 7. VideoNote
    `CREATE TABLE IF NOT EXISTS "VideoNote" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "vid" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VideoNote_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "VideoNote_userId_vid_key" ON "VideoNote"("userId", "vid");`,

    // 8. VideoNoteFile
    `CREATE TABLE IF NOT EXISTS "VideoNoteFile" (
        "id" SERIAL NOT NULL,
        "noteId" INTEGER NOT NULL,
        "file" TEXT NOT NULL,
        "original_name" TEXT,
        "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VideoNoteFile_pkey" PRIMARY KEY ("id")
    );`,

    // 9. VideoComment
    `CREATE TABLE IF NOT EXISTS "VideoComment" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "vid" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "parentId" INTEGER,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VideoComment_pkey" PRIMARY KEY ("id")
    );`,

    // 10. VideoIntuition
    `CREATE TABLE IF NOT EXISTS "VideoIntuition" (
        "id" SERIAL NOT NULL,
        "vid" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "model_name" TEXT,
        "transcript_used" BOOLEAN NOT NULL DEFAULT false,
        "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VideoIntuition_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "VideoIntuition_vid_key" ON "VideoIntuition"("vid");`,

    // 11. VideoQuizData
    `CREATE TABLE IF NOT EXISTS "VideoQuizData" (
        "id" SERIAL NOT NULL,
        "vid" TEXT NOT NULL,
        "questions" TEXT NOT NULL,
        "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VideoQuizData_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "VideoQuizData_vid_key" ON "VideoQuizData"("vid");`,

    // 12. Quiz
    `CREATE TABLE IF NOT EXISTS "Quiz" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "videoId" INTEGER,
        "playlistId" INTEGER,
        "questions" TEXT NOT NULL,
        "user_answers" TEXT,
        "score" DOUBLE PRECISION,
        "passed" BOOLEAN,
        "is_combined" BOOLEAN NOT NULL DEFAULT false,
        "time_limit" INTEGER NOT NULL DEFAULT 15,
        "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
    );`,

    // 13. Certificate
    `CREATE TABLE IF NOT EXISTS "Certificate" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "videoId" INTEGER,
        "playlistId" INTEGER,
        "certificate_id" TEXT NOT NULL,
        "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "download_url" TEXT,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "templateId" INTEGER,
        "requestId" INTEGER,
        CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_certificate_id_key" ON "Certificate"("certificate_id");`,
    `ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';`,
    `ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "templateId" INTEGER;`,
    `ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "requestId" INTEGER;`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_requestId_key" ON "Certificate"("requestId");`,

    // 13b. CertificateTemplate
    `CREATE TABLE IF NOT EXISTS "CertificateTemplate" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "layout" TEXT NOT NULL DEFAULT 'classic',
        "primaryColor" TEXT NOT NULL DEFAULT '#1e293b',
        "accentColor" TEXT NOT NULL DEFAULT '#f59e0b',
        "textColor" TEXT NOT NULL DEFAULT '#0f172a',
        "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
        "titleText" TEXT NOT NULL DEFAULT 'CERTIFICATE OF COMPLETION',
        "subtitleText" TEXT NOT NULL DEFAULT 'THIS IS TO CERTIFY THAT',
        "bodyText" TEXT NOT NULL DEFAULT 'has successfully completed the comprehensive curriculum and passed the examination for',
        "issuerName" TEXT NOT NULL DEFAULT 'LearnProof Academy',
        "issuerTitle" TEXT NOT NULL DEFAULT 'Global Certification Authority',
        "signatoryName" TEXT NOT NULL DEFAULT 'Academic Director',
        "signatoryTitle" TEXT NOT NULL DEFAULT 'Head of Certifications',
        "sealText" TEXT NOT NULL DEFAULT 'VERIFIED',
        "signatureImage" TEXT,
        "logoUrl" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "CertificateTemplate_slug_key" ON "CertificateTemplate"("slug");`,

    // 13c. CertificateRequest
    `CREATE TABLE IF NOT EXISTS "CertificateRequest" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "playlistId" INTEGER,
        "videoId" INTEGER,
        "quizId" INTEGER,
        "fullName" TEXT NOT NULL,
        "score" DOUBLE PRECISION,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "userNotes" TEXT,
        "adminNotes" TEXT,
        "rejectionReason" TEXT,
        "reviewedBy" TEXT,
        "reviewedAt" TIMESTAMP(3),
        "templateId" INTEGER,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CertificateRequest_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "CertificateRequest_userId_idx" ON "CertificateRequest"("userId");`,
    `CREATE INDEX IF NOT EXISTS "CertificateRequest_status_idx" ON "CertificateRequest"("status");`,
    `CREATE INDEX IF NOT EXISTS "CertificateRequest_playlistId_idx" ON "CertificateRequest"("playlistId");`,

    // 14. AnonymousDevice
    `CREATE TABLE IF NOT EXISTS "AnonymousDevice" (
        "id" SERIAL NOT NULL,
        "token" TEXT NOT NULL,
        "deviceType" TEXT,
        "timezone" TEXT NOT NULL DEFAULT 'UTC',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AnonymousDevice_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AnonymousDevice_token_key" ON "AnonymousDevice"("token");`,

    // 15. AppLaunchLog
    `CREATE TABLE IF NOT EXISTS "AppLaunchLog" (
        "id" SERIAL NOT NULL,
        "deviceId" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AppLaunchLog_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "AppLaunchLog_deviceId_idx" ON "AppLaunchLog"("deviceId");`,
    `CREATE INDEX IF NOT EXISTS "AppLaunchLog_timestamp_idx" ON "AppLaunchLog"("timestamp");`,

    // 16. UserFcmToken
    `CREATE TABLE IF NOT EXISTS "UserFcmToken" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "token" TEXT NOT NULL,
        "deviceType" TEXT,
        "timezone" TEXT NOT NULL DEFAULT 'UTC',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserFcmToken_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "UserFcmToken_token_key" ON "UserFcmToken"("token");`,

    // 17. NotificationTemplate
    `CREATE TABLE IF NOT EXISTS "NotificationTemplate" (
        "id" SERIAL NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "hour" INTEGER NOT NULL DEFAULT 9,
        "minute" INTEGER NOT NULL DEFAULT 0,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "NotificationTemplate_type_key" ON "NotificationTemplate"("type");`,

    // 18. SentNotification
    `CREATE TABLE IF NOT EXISTS "SentNotification" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SentNotification_pkey" PRIMARY KEY ("id")
    );`,

    // 19. SupportTicket
    `CREATE TABLE IF NOT EXISTS "SupportTicket" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'OPEN',
        "priority" TEXT NOT NULL DEFAULT 'NORMAL',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
    );`,

    // 20. SupportResponse
    `CREATE TABLE IF NOT EXISTS "SupportResponse" (
        "id" SERIAL NOT NULL,
        "ticketId" INTEGER NOT NULL,
        "adminId" INTEGER,
        "message" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SupportResponse_pkey" PRIMARY KEY ("id")
    );`,

    // 21. Workspace
    `CREATE TABLE IF NOT EXISTS "Workspace" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "difyDatasetId" TEXT,
        "knowledgeMap" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "Workspace_userId_idx" ON "Workspace"("userId");`,

    // 22. KnowledgeSource
    `CREATE TABLE IF NOT EXISTS "KnowledgeSource" (
        "id" SERIAL NOT NULL,
        "workspaceId" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "fileUrl" TEXT,
        "sourceUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "errorMessage" TEXT,
        "metadata" TEXT,
        "difyDocumentId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "KnowledgeSource_workspaceId_idx" ON "KnowledgeSource"("workspaceId");`,

    // 23. WorkspaceNote
    `CREATE TABLE IF NOT EXISTS "WorkspaceNote" (
        "id" SERIAL NOT NULL,
        "workspaceId" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceNote_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "WorkspaceNote_workspaceId_idx" ON "WorkspaceNote"("workspaceId");`,

    // 24. WorkspaceFlashcard
    `CREATE TABLE IF NOT EXISTS "WorkspaceFlashcard" (
        "id" SERIAL NOT NULL,
        "workspaceId" INTEGER NOT NULL,
        "question" TEXT NOT NULL,
        "answer" TEXT NOT NULL,
        "interval" INTEGER NOT NULL DEFAULT 1,
        "repetition" INTEGER NOT NULL DEFAULT 0,
        "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
        "nextReview" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceFlashcard_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "WorkspaceFlashcard_workspaceId_idx" ON "WorkspaceFlashcard"("workspaceId");`,
    `CREATE INDEX IF NOT EXISTS "WorkspaceFlashcard_nextReview_idx" ON "WorkspaceFlashcard"("nextReview");`,

    // 25. WorkspaceQuiz
    `CREATE TABLE IF NOT EXISTS "WorkspaceQuiz" (
        "id" SERIAL NOT NULL,
        "workspaceId" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "questions" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceQuiz_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "WorkspaceQuiz_workspaceId_idx" ON "WorkspaceQuiz"("workspaceId");`,

    // 26. WorkspaceQuizAttempt
    `CREATE TABLE IF NOT EXISTS "WorkspaceQuizAttempt" (
        "id" SERIAL NOT NULL,
        "quizId" INTEGER NOT NULL,
        "score" DOUBLE PRECISION NOT NULL,
        "answers" TEXT NOT NULL,
        "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceQuizAttempt_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "WorkspaceQuizAttempt_quizId_idx" ON "WorkspaceQuizAttempt"("quizId");`,

    // 27. WorkspaceChatSession
    `CREATE TABLE IF NOT EXISTS "WorkspaceChatSession" (
        "id" SERIAL NOT NULL,
        "workspaceId" INTEGER NOT NULL,
        "title" TEXT NOT NULL DEFAULT 'New Chat',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceChatSession_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "WorkspaceChatSession_workspaceId_idx" ON "WorkspaceChatSession"("workspaceId");`,

    // 28. WorkspaceChatMessage
    `CREATE TABLE IF NOT EXISTS "WorkspaceChatMessage" (
        "id" SERIAL NOT NULL,
        "sessionId" INTEGER NOT NULL,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "citations" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceChatMessage_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "WorkspaceChatMessage_sessionId_idx" ON "WorkspaceChatMessage"("sessionId");`
  ];

  for (const sql of statements) {
    try {
      await client.query(sql);
    } catch (err) {
      console.warn('⚠️ Statement execution warning:', err.message);
    }
  }

  // Seed default certificate templates if none exist
  try {
    const countRes = await client.query('SELECT COUNT(*) FROM "CertificateTemplate"');
    if (parseInt(countRes.rows[0].count) === 0) {
      console.log('🌱 Seeding initial certificate templates...');
      await client.query(`
        INSERT INTO "CertificateTemplate" 
        ("name", "slug", "description", "isDefault", "layout", "primaryColor", "accentColor", "textColor", "backgroundColor", "titleText", "subtitleText", "bodyText", "issuerName", "issuerTitle", "signatoryName", "signatoryTitle", "sealText")
        VALUES 
        ('Classic Gold Academic', 'classic-gold', 'Timeless dual-border with navy corners, gold accents, and academic seal.', true, 'classic', '#1e293b', '#f59e0b', '#0f172a', '#ffffff', 'CERTIFICATE OF ACHIEVEMENT', 'THIS IS OFFICIALLY PRESENTED TO', 'for successfully mastering the curriculum and passing the comprehensive examination for', 'LearnProof Academy', 'Global Certification Authority', 'Academic Director', 'Head of Certifications', 'VERIFIED'),
        ('Modern Emerald Tech', 'modern-emerald', 'Contemporary tech certificate with clean emerald lines and verified badge.', false, 'modern', '#064e3b', '#10b981', '#022c22', '#f8fafc', 'CERTIFICATE OF EXCELLENCE', 'PROUDLY CONFERRED UPON', 'in recognition of exceptional performance and mastery of course competencies in', 'LearnProof Academy', 'Institute of Applied Technology', 'Dean of Engineering', 'Director of Credentials', 'ACCREDITED'),
        ('Royal Indigo Executive', 'royal-indigo', 'Prestigious executive credential designed for high-impact certifications.', false, 'executive', '#1e1b4b', '#6366f1', '#0f172a', '#ffffff', 'EXECUTIVE CERTIFICATE', 'THIS CERTIFIES THAT', 'has successfully completed all rigorous executive course requirements for', 'LearnProof Academy', 'Executive Education Council', 'Executive Director', 'Registrar General', 'HONORS'),
        ('Crimson Minimalist', 'crimson-minimal', 'Sleek, minimalist aesthetic featuring crisp ruby accents and modern typography.', false, 'minimal', '#881337', '#f43f5e', '#18181b', '#ffffff', 'CERTIFICATE OF COMPLETION', 'AWARDED TO', 'having demonstrated professional proficiency and passed the assessment for', 'LearnProof Academy', 'Digital Skills Board', 'Chief Learning Officer', 'Verification Officer', 'CERTIFIED')
      `);
      console.log('✅ Default certificate templates successfully seeded.');
    }
  } catch (err) {
    console.warn('⚠️ Template seeding warning:', err.message);
  }

  await client.end();
  console.log('✅ [Schema Setup] All learning tables and certificate schema verified.');
}

if (require.main === module) {
  createAllTables().catch(console.error);
}

module.exports = { createAllTables };
