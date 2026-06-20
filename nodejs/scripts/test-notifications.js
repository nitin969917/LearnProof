const prisma = require('../src/lib/prisma');
const notificationService = require('../src/services/notification.service');

async function runTest() {
    console.log("=== Starting Notification Test ===");
    
    // Check if any FCM tokens exist in database
    const tokens = await prisma.userFcmToken.findMany({
        include: { user: true }
    });
    
    console.log(`Found ${tokens.length} FCM tokens in database.`);
    tokens.forEach(t => {
        console.log(`- Token: ${t.token.substring(0, 15)}... | User: ${t.user?.name} (ID: ${t.userId}) | Timezone: ${t.timezone}`);
    });

    console.log("\nSimulating daily notifications check...");
    // Triggering the check logic directly
    await notificationService.sendDailyNotifications();
    
    // Check sent notifications log
    const sentLogs = await prisma.sentNotification.findMany({
        include: { user: true }
    });
    console.log(`\nFound ${sentLogs.length} logged notifications in database:`);
    sentLogs.forEach(log => {
        console.log(`- Type: ${log.type} | User: ${log.user?.name} (ID: ${log.userId}) | Sent At: ${log.sentAt}`);
    });
    
    console.log("\n=== Notification Test Finished ===");
    process.exit(0);
}

runTest().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
