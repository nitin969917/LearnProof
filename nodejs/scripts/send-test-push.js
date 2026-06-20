const prisma = require('../src/lib/prisma');
const admin = require('../src/lib/firebaseAdmin');

async function sendTestPush() {
    console.log("=== Sending Direct Test Push ===");
    
    // Fetch the latest FCM token in the database
    const fcmTokenRecord = await prisma.userFcmToken.findFirst({
        orderBy: { updated_at: 'desc' },
        include: { user: true }
    });
    
    if (!fcmTokenRecord) {
        console.error("Error: No FCM tokens found in the database. Please log in or refresh the dashboard to register a device.");
        process.exit(1);
    }
    
    const { token, user } = fcmTokenRecord;
    console.log(`Sending test notification to: ${user?.name} (ID: ${user?.id})`);
    console.log(`Token: ${token.substring(0, 20)}...`);
    
    if (!admin || admin.apps.length === 0) {
        console.error("Error: Firebase Admin SDK is not initialized.");
        process.exit(1);
    }
    
    const message = {
        notification: {
            title: '📚 LearnProof Test Alert',
            body: 'Your Firebase Cloud Messaging test notification works! 🔥'
        },
        token: token
    };
    
    try {
        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
        console.log("=== Test Notification Dispatched ===");
    } catch (error) {
        console.error("Error sending message to FCM:", error);
    }
    
    process.exit(0);
}

sendTestPush().catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
});
