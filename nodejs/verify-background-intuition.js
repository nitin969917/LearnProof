const prisma = require('./src/lib/prisma');
const { generateIntuition, generateQuiz } = require('./src/services/ai.service');

// Mock request and response
const mockReq = {
    body: {
        contentType: 'video',
        contentId: 'TEST_VIDEO_123'
    },
    user: {
        id: 1 // Assuming user #1 exists
    }
};

const mockRes = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.data = data; return this; }
};

async function verifySequentialFlow() {
    console.log("--- Starting Sequential Flow Verification ---");
    
    const contentId = mockReq.body.contentId;
    const userId = mockReq.user.id;

    try {
        // 1. Cleanup existing data for clean test
        console.log("Cleaning up previous test data...");
        await prisma.videoIntuition.deleteMany({ where: { vid: contentId } }).catch(() => {});
        await prisma.videoQuizData.deleteMany({ where: { vid: contentId } }).catch(() => {});

        // 2. Mock the controller logic (simplified)
        const title = "Test Video Title";
        const description = "Test Video Description";
        const url = "https://youtube.com/test";

        let intuitionText = null;

        console.log("Step 1: Checking for intuition (should be null)...");
        const intuition = await prisma.videoIntuition.findUnique({ where: { vid: contentId } });
        if (intuition) throw new Error("Cleanup failed, intuition still exists!");

        if (!intuitionText) {
            console.log("Step 2: Triggering sequential generation...");
            const intuitionRes = await generateIntuition(title, description, url);
            intuitionText = intuitionRes.content;
            console.log("Intuition generated successfully.");

            console.log("Step 3: Triggering grounded quiz generation using generated intuition...");
            const quizRes = await generateQuiz(title, description, url, intuitionText, 5);
            const questions = quizRes.questions;
            console.log("Quiz generated successfully with", questions.length, "questions.");

            if (questions.length > 0) {
                console.log("SUCCESS: Sequential flow working as expected.");
            } else {
                console.error("FAILURE: No questions generated.");
            }
        }
    } catch (err) {
        console.error("Verification failed:", err.message);
    } finally {
        // prisma.$disconnect();
    }
}

verifySequentialFlow();
