const datingPrisma = require('../src/utils/datingPrisma');
const { sendPushNotification } = require('../src/utils/pushNotifier');

async function run() {
  console.log("=== Testing Push Notifier Utility ===");

  // 1. Find all users in dating SQLite database
  const users = await datingPrisma.user.findMany({
    select: { id: true, name: true, email: true }
  });

  console.log(`\nFound ${users.length} users in SQLite database:`);
  users.forEach(u => console.log(`- ID: ${u.id} | Name: ${u.name} | Email: ${u.email}`));

  if (users.length < 2) {
    console.log("Not enough users to simulate notifications. Please add at least 2 users.");
    process.exit(0);
  }

  const sender = users[0];
  const receiver = users[1];

  console.log(`\n1. Simulating Direct Message notification from "${sender.name}" (ID: ${sender.id}) to "${receiver.name}" (ID: ${receiver.id})...`);
  await sendPushNotification(
    [receiver.id],
    `New message from ${sender.name}`,
    `Hey, this is a test message to verify the push notification integration!`,
    { type: 'CHAT_MESSAGE', senderId: String(sender.id) }
  );

  console.log(`\n2. Simulating Friends-Only Room notification from "${sender.name}"...`);
  // Find all friends of sender
  const friendships = await datingPrisma.friendship.findMany({
    where: {
      status: 'accepted',
      OR: [
        { senderId: sender.id },
        { receiverId: sender.id }
      ]
    }
  });
  const friendIds = friendships.map(f => f.senderId === sender.id ? f.receiverId : f.senderId);
  console.log(`Sender "${sender.name}" (ID: ${sender.id}) has friends: ${friendIds.join(', ')}`);
  
  if (friendIds.length > 0) {
    await sendPushNotification(
      friendIds,
      `${sender.name} started a live room`,
      `Join the live room "English Practice" in English to discuss together!`,
      { type: 'LIVE_ROOM_CREATED', roomName: 'test-room-name' }
    );
  } else {
    console.log("No accepted friendships found for sender to test friends-only room notification.");
  }

  console.log("\n=== Test Finished ===");
  process.exit(0);
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
