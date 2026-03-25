-- CreateTable
CREATE TABLE "UserProfile" (
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
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "pid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_goal" INTEGER,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "vid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "playlistId" INTEGER,
    "imported_at" TIMESTAMP(3) NOT NULL,
    "watch_progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
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
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "videoId" INTEGER,
    "playlistId" INTEGER,
    "certificate_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "download_url" TEXT,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "activity_type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoNote" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "vid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoNoteFile" (
    "id" SERIAL NOT NULL,
    "noteId" INTEGER NOT NULL,
    "file" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoNoteFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoComment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "vid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoIntuition" (
    "id" SERIAL NOT NULL,
    "vid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model_name" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoIntuition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoQuizData" (
    "id" SERIAL NOT NULL,
    "vid" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoQuizData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectNote" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AskMyNoteChat" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "session_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "citations" TEXT,
    "confidence" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AskMyNoteChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_uid_key" ON "UserProfile"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_userId_pid_key" ON "Playlist"("userId", "pid");

-- CreateIndex
CREATE UNIQUE INDEX "Video_userId_vid_key" ON "Video"("userId", "vid");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificate_id_key" ON "Certificate"("certificate_id");

-- CreateIndex
CREATE UNIQUE INDEX "VideoNote_userId_vid_key" ON "VideoNote"("userId", "vid");

-- CreateIndex
CREATE UNIQUE INDEX "VideoIntuition_vid_key" ON "VideoIntuition"("vid");

-- CreateIndex
CREATE UNIQUE INDEX "VideoQuizData_vid_key" ON "VideoQuizData"("vid");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_userId_name_key" ON "Subject"("userId", "name");

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoNote" ADD CONSTRAINT "VideoNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoNoteFile" ADD CONSTRAINT "VideoNoteFile_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "VideoNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoComment" ADD CONSTRAINT "VideoComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoComment" ADD CONSTRAINT "VideoComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "VideoComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectNote" ADD CONSTRAINT "SubjectNote_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AskMyNoteChat" ADD CONSTRAINT "AskMyNoteChat_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
