const prisma = require('../src/lib/prisma');

async function test() {
  console.log('Testing newly created database models...');

  try {
    // 1. Test AnonymousDevice upsert
    console.log('Testing AnonymousDevice model write...');
    const token = 'test-token-' + Date.now();
    const device = await prisma.anonymousDevice.upsert({
      where: { token },
      update: {
        deviceType: 'web',
        timezone: 'UTC'
      },
      create: {
        token,
        deviceType: 'web',
        timezone: 'UTC'
      }
    });
    console.log('AnonymousDevice saved successfully:', device);

    // Clean up test device
    await prisma.anonymousDevice.delete({ where: { token } });
    console.log('AnonymousDevice cleanup successful.');

    // 2. Test AppLaunchLog create
    console.log('Testing AppLaunchLog model write...');
    const deviceId = 'test-device-id-' + Date.now();
    const log = await prisma.appLaunchLog.create({
      data: {
        deviceId
      }
    });
    console.log('AppLaunchLog saved successfully:', log);

    // Clean up test log
    await prisma.appLaunchLog.delete({ where: { id: log.id } });
    console.log('AppLaunchLog cleanup successful.');

    console.log('All database models verified successfully!');
  } catch (error) {
    console.error('Database models verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
