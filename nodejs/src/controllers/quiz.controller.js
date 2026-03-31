const prisma = require('../lib/prisma');
const { generateQuiz } = require('../services/ai.service');
const { generateCertificatePDF } = require('../services/certificate.service');

const normalizeQuestions = (questionsStr) => {
    let parsed = JSON.parse(questionsStr);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
        if (arrayKey) parsed = parsed[arrayKey];
    }

    // Normalize correct answers if AI returned A/B/C/D instead of string
    if (Array.isArray(parsed)) {
        parsed = parsed.map(q => {
            let ans = String(q.answer || "").trim().toLowerCase();
            // Match 'a', 'a)', 'a.', etc.
            const letterMatch = ans.match(/^([a-d])[\)\.]?$/);
            if (letterMatch && q.options && q.options.length === 4) {
                const idx = letterMatch[1].charCodeAt(0) - 97; // 'a' is 97
                if (q.options[idx]) {
                    return { ...q, answer: q.options[idx] };
                }
            }
            return q;
        });
    }

    return parsed;
};

/**
 * Quiz & Engagement Controller
 */
const getQuizList = async (req, res) => {
    const { uid } = req.user;

    try {
        const user = req.user;

        const completedVideos = await prisma.video.findMany({
            where: { userId: user.id, is_completed: true }
        });

        const allPlaylists = await prisma.playlist.findMany({
            where: { userId: user.id },
            include: { 
                videos: {
                    include: {
                        quizzes: {
                            where: { userId: user.id, passed: true },
                            take: 1
                        }
                    }
                } 
            }
        });

        const playlistProgress = allPlaylists.map(pl => {
            const totalVideos = pl.videos.length;
            const passedVideos = pl.videos.filter(v => v.quizzes.length > 0).length;
            const allVideosCompleted = pl.videos.every(v => v.is_completed);

            return {
                ...pl,
                total_videos: totalVideos,
                passed_video_quizzes: passedVideos,
                is_eligible: passedVideos >= totalVideos && allVideosCompleted && totalVideos > 0
            };
        });

        res.status(200).json({
            videos: [], // Removing standalone videos from the main dashboard
            playlists: playlistProgress
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const startQuiz = async (req, res) => {
    const { contentType, contentId } = req.body;
    const { uid } = req.user;

    try {
        const user = req.user;
        let questions = null;
        let target = null;
        if (contentType === 'video') {
            target = await prisma.video.findUnique({
                where: { userId_vid: { userId: user.id, vid: contentId } }
            });
        } else {
            target = await prisma.playlist.findUnique({
                where: { userId_pid: { userId: user.id, pid: contentId } }
            });
        }

        if (!target) return res.status(404).json({ error: 'Content not found' });

        // NEW: For playlists, verify all videos have been passed
        if (contentType === 'playlist') {
            const playlistWithVideos = await prisma.playlist.findUnique({
                where: { id: target.id },
                include: {
                    videos: {
                        include: {
                            quizzes: {
                                where: { userId: user.id, passed: true },
                                orderBy: { attempted_at: 'desc' },
                                take: 1
                            }
                        }
                    }
                }
            });

            const totalv = playlistWithVideos.videos.length;
            const passedv = playlistWithVideos.videos.filter(v => v.quizzes.length > 0).length;

            if (passedv < totalv) {
                return res.status(403).json({
                    error: 'Prerequisite not met',
                    message: `You must pass all video tests in this playlist before taking the certification test. Progress: ${passedv}/${totalv}`,
                    totalVideos: totalv,
                    passedVideos: passedv
                });
            }

            // Aggregate all questions from all passed video quizzes
            let aggregatedQuestions = [];
            playlistWithVideos.videos.forEach(v => {
                if (v.quizzes.length > 0) {
                    const quizQuestions = normalizeQuestions(v.quizzes[0].questions);
                    aggregatedQuestions = aggregatedQuestions.concat(quizQuestions);
                }
            });

            // Shuffle and select a subset (e.g., 25-30 questions or all if fewer)
            const shuffled = aggregatedQuestions.sort(() => 0.5 - Math.random());
            questions = shuffled.slice(0, 30); // Limit to 30 questions for certification
            
            if (questions.length === 0) {
                return res.status(500).json({ error: "Failed to aggregate questions for certification test." });
            }
        }

        const title = target.name;
        const description = target.description || 'No description available';

        // For videos, check if we already have generated questions cached
        if (contentType === 'video') {
            const cachedQuiz = await prisma.videoQuizData.findUnique({ where: { vid: contentId } });
            if (cachedQuiz) {
                questions = normalizeQuestions(cachedQuiz.questions);
            }
        }

        if (!questions) {
            if (contentType === 'playlist') {
                return res.status(500).json({ error: "No questions found in this playlist's video quizzes." });
            }

            let intuitionText = null;
            // Fetch cached intuition if it exists
            const intuition = await prisma.videoIntuition.findUnique({ where: { vid: contentId } });
            if (intuition) intuitionText = intuition.content;

            if (!intuitionText) {
                // SEQUENTIAL GENERATION: Intuition FIRST, then grounded Quiz
                const { generateIntuition, generateQuiz } = require('../services/ai.service');

                console.log(`[Quiz] Missing intuition for ${contentId}. Generating intuition first...`);
                try {
                    const intuitionRes = await generateIntuition(title, description, target.url);
                    intuitionText = intuitionRes.content;

                    // Cache Intuition if successful
                    if (intuitionText && !intuitionRes.isSystemFallback) {
                        await prisma.videoIntuition.upsert({
                            where: { vid: contentId },
                            update: { content: intuitionRes.content, model_name: intuitionRes.model_name },
                            create: { vid: contentId, content: intuitionRes.content, model_name: intuitionRes.model_name }
                        });
                    }
                } catch (e) {
                    console.error("[Quiz] Intuition generation failed:", e.message);
                    // Continue with generic quiz if intuition fails? Or fail?
                    // Let's at least try to generate the quiz with null intuition if it fails
                }

                console.log(`[Quiz] Grounding quiz in intuition for ${contentId}...`);
                try {
                    const quizRes = await generateQuiz(title, description, target.url, intuitionText, 20);
                    questions = (quizRes.questions || []).slice(0, 20);

                    // Cache Quiz if successful
                    if (questions && questions.length > 0 && !quizRes.isSystemFallback) {
                        await prisma.videoQuizData.upsert({
                            where: { vid: contentId },
                            update: { questions: JSON.stringify(questions) },
                            create: { vid: contentId, questions: JSON.stringify(questions) }
                        });
                    }
                } catch (e) {
                    console.error("[Quiz] Quiz generation failed:", e.message);
                    throw new Error("AI failed to generate quiz questions. Please try again.");
                }
            } else {
                // Intuition is cached, generate grounded Quiz
                console.log(`[Quiz] Using cached intuition for ${contentId} to generate quiz...`);
                const { generateQuiz } = require('../services/ai.service');
                try {
                    const { questions: generatedQuestions, isSystemFallback } = await generateQuiz(title, description, target.url, intuitionText, 20);
                    questions = (generatedQuestions || []).slice(0, 20);

                    // Save for videos if not fallback
                    if (questions && questions.length > 0 && !isSystemFallback) {
                        await prisma.videoQuizData.upsert({
                            where: { vid: contentId },
                            update: { questions: JSON.stringify(questions) },
                            create: { vid: contentId, questions: JSON.stringify(questions) }
                        });
                    }
                } catch (e) {
                    console.error("[Quiz] Grounded quiz generation failed:", e.message);
                    throw new Error("Failed to generate quiz from intuition. AI model might be busy.");
                }
            }

            if (!questions || questions.length === 0) {
                throw new Error("No questions were generated for this video.");
            }
        }

        const quiz = await prisma.quiz.create({
            data: {
                userId: user.id,
                videoId: contentType === 'video' ? target.id : null,
                playlistId: contentType === 'playlist' ? target.id : null,
                questions: JSON.stringify(questions),
                is_combined: contentType === 'playlist',
                time_limit: contentType === 'playlist' ? 60 : 15,
                attempted_at: new Date()
            }
        });

        await prisma.userActivityLog.create({
            data: {
                userId: user.id,
                activity_type: contentType === 'video' ? `Quiz Started: ${target.name}` : `Playlist Quiz Started: ${target.name}`
            }
        });

        res.status(200).json({
            quiz: {
                quiz_id: quiz.id,
                questions: questions,
                time_limit: quiz.time_limit,
                is_combined: quiz.is_combined
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const submitQuiz = async (req, res) => {
    const { quizId, answers } = req.body;
    const { uid } = req.user;

    try {
        const user = req.user;
        const quiz = await prisma.quiz.findUnique({
            where: { id: parseInt(quizId), userId: user.id },
            include: { 
                playlist: { include: { videos: true } },
                video: true 
            }
        });

        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

        const questions = normalizeQuestions(quiz.questions);
        let score = 0;
        questions.forEach((q, i) => {
            const userAns = String(answers[i] || "").trim().toLowerCase();
            const targetAns = String(q.answer || "").trim().toLowerCase();
            if (userAns === targetAns) score++;
        });

        const finalScore = Math.round((score / questions.length) * 100 * 100) / 100;
        const passed = finalScore >= 50;

        await prisma.quiz.update({
            where: { id: quiz.id },
            data: {
                score: finalScore,
                passed,
                user_answers: JSON.stringify(answers)
            }
        });

        const activitySubject = quiz.video ? `Quiz Submitted: ${quiz.video.name}` : (quiz.playlist ? `Playlist Quiz Submitted: ${quiz.playlist.name}` : 'Quiz Submitted');
        await prisma.userActivityLog.create({
            data: {
                userId: user.id,
                activity_type: activitySubject
            }
        });

        let certificate_url = null;
        if (passed) {
            let xpGain = quiz.videoId ? 10 : (quiz.playlist ? quiz.playlist.videos.length * 5 : 20);
            const newXp = (user.xp || 0) + xpGain;
            const newLevel = Math.floor(newXp / 100) + 1;

            await prisma.userProfile.update({
                where: { id: user.id },
                data: { xp: newXp, level: newLevel }
            });

            // NEW: Only generate certificates for COMBINED playlist quizzes
            if (quiz.playlistId && quiz.is_combined && quiz.playlist) {
                const cert = await prisma.certificate.create({
                    data: {
                        userId: user.id,
                        videoId: null,
                        playlistId: quiz.playlistId,
                        download_url: `/api/media/certificates/${quiz.id}.pdf`
                    }
                });

                // Generate the actual PDF file
                const contentName = quiz.playlist.name;
                await generateCertificatePDF(quiz.id, user.name, contentName, new Date());

                certificate_url = cert.download_url;

                await prisma.userActivityLog.create({
                    data: {
                        userId: user.id,
                        activity_type: `Playlist Certificate Issued: ${quiz.playlist.name}`
                    }
                });
            }
        }

        const updatedQuiz = await prisma.quiz.findUnique({
            where: { id: quiz.id },
            include: {
                video: { select: { name: true, vid: true } },
                playlist: { select: { name: true, pid: true } }
            }
        });

        res.status(200).json({
            score: finalScore,
            passed,
            certificate_url,
            quiz: updatedQuiz
        });
    } catch (error) {
        console.error("Submit Quiz Error:", error);
        res.status(500).json({ error: error.message });
    }
};

const getCertificates = async (req, res) => {
    const { uid } = req.user;

    try {
        const user = req.user;
        const certificates = await prisma.certificate.findMany({
            where: { userId: user.id },
            include: {
                video: { select: { name: true } },
                playlist: { select: { name: true } }
            },
            orderBy: { issued_at: 'desc' }
        });

        // Map to include title for frontend
        const result = certificates.map(c => ({
            ...c,
            title: c.video?.name || c.playlist?.name || "Certificate",
            description: `Earned for completing ${c.video ? 'video' : 'playlist'}: ${c.video?.name || c.playlist?.name}`
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getActivityGraph = async (req, res) => {
    const { uid } = req.user;

    try {
        const user = req.user;

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const logs = await prisma.userActivityLog.findMany({
            where: {
                userId: user.id,
                timestamp: { gte: sixtyDaysAgo }
            },
            orderBy: { timestamp: 'desc' }
        });

        // Group by date
        const streak_data = [];
        const activityByDate = {};

        for (let i = 60; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayLogs = logs.filter(l => l.timestamp.toISOString().split('T')[0] === dateStr);
            const seen = new Set();
            const activities = [];

            dayLogs.forEach(l => {
                const activity = l.activity_type;

                if (!seen.has(activity)) {
                    seen.add(activity);
                    activities.push(activity);
                }
            });

            const dayData = {
                date: dateStr,
                activity_count: activities.length,
                activities
            };
            streak_data.push(dayData);
            activityByDate[dateStr] = dayData;
        }

        // Calculate dynamic streak
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Start checking from today or yesterday
        let checkDate = (activityByDate[today]?.activity_count > 0) ? today : yesterday;

        if (activityByDate[checkDate]?.activity_count > 0) {
            let tempDate = new Date(checkDate);
            while (true) {
                const dateKey = tempDate.toISOString().split('T')[0];
                if (activityByDate[dateKey]?.activity_count > 0) {
                    currentStreak++;
                    tempDate.setDate(tempDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        res.status(200).json({
            graph: streak_data,
            streak_count: currentStreak
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getQuizHistory = async (req, res) => {
    try {
        const user = req.user;
        const history = await prisma.quiz.findMany({
            where: { userId: user.id },
            include: {
                video: { select: { name: true, vid: true } },
                playlist: { select: { name: true, pid: true } }
            },
            orderBy: { attempted_at: 'desc' }
        });

        const normalizedHistory = history.map(h => ({
            ...h,
            questions: JSON.stringify(normalizeQuestions(h.questions))
        }));

        res.status(200).json(normalizedHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyCertificate = async (req, res) => {
    const { certId } = req.params;

    try {
        const certificate = await prisma.certificate.findUnique({
            where: { certificate_id: certId },
            include: {
                user: { select: { name: true, joined_at: true, profile_pic: true, xp: true, level: true } },
                video: { select: { name: true, description: true, duration_seconds: true } },
                playlist: { 
                    select: { 
                        name: true, 
                        pid: true, 
                        videos: { select: { id: true } } 
                    } 
                }
            }
        });

        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        // Add formatted title and summary
        const result = {
            ...certificate,
            title: certificate.video?.name || certificate.playlist?.name || "Certificate",
            type: certificate.playlistId ? 'Specialization' : 'Course',
            issued_to: certificate.user.name,
            total_videos: certificate.playlist?.videos?.length || 1
        };

        res.status(200).json(result);
    } catch (error) {
        console.error("Verify Certificate Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getQuizList,
    startQuiz,
    submitQuiz,
    getCertificates,
    getActivityGraph,
    getQuizHistory,
    verifyCertificate,
};
