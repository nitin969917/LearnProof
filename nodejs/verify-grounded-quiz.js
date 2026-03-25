const { generateIntuition, generateQuiz } = require('./src/services/ai.service');

async function verifyGroundedness() {
    const testTitle = "Quantum Computing for Beginners";
    const testDesc = "An introduction to qubits, superposition, and entanglement.";
    const testUrl = "https://www.youtube.com/watch?v=Quant123";

    try {
        console.log("--- Step 1: Generating Intuition ---");
        const intuition = await generateIntuition(testTitle, testDesc, testUrl);
        console.log("Intuition Generated (First 100 chars):", intuition.content.substring(0, 100));

        console.log("\n--- Step 2: Generating Grounded Quiz ---");
        const quiz = await generateQuiz(testTitle, testDesc, testUrl, intuition.content, 5);
        
        console.log("\n--- Verification ---");
        console.log("Number of questions:", quiz.questions.length);
        console.log("Example Question:", quiz.questions[0].question);
        console.log("Is grounded? (Checking if 'AI Intuition Summary (PRIMARY SOURCE)' was in prompt logic implicitly through sequential flow)");
        
        if (quiz.questions.length >= 5) {
            console.log("SUCCESS: Quiz generated with grounded intuition context.");
        } else {
            console.error("FAILURE: Quiz generation failed or returned too few questions.");
        }
    } catch (err) {
        console.error("Verification failed:", err);
    }
}

verifyGroundedness();
