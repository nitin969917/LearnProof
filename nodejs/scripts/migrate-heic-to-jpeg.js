/**
 * One-time and on-demand migration script to transcode all existing HEIC images
 * in the database (posts, profile pictures, cover images) to universal JPEG.
 */
const datingPrisma = require('../src/utils/datingPrisma');
const { ensureUniversalImage, isHeicString } = require('../src/utils/imageUtils');

async function migrate() {
  console.log('--- Scanning database for iPhone HEIC images ---');

  // 1. Check Users (profilePicture, coverImage)
  const users = await datingPrisma.user.findMany({
    select: { id: true, name: true, profilePicture: true, coverImage: true }
  });

  let convertedUsers = 0;
  for (const u of users) {
    let needsUpdate = false;
    const updateData = {};

    if (u.profilePicture && isHeicString(u.profilePicture)) {
      console.log(`Converting profile picture for User ${u.id} (${u.name})...`);
      const newPic = await ensureUniversalImage(u.profilePicture);
      if (newPic && newPic.startsWith('data:image/jpeg')) {
        updateData.profilePicture = newPic;
        needsUpdate = true;
      }
    }

    if (u.coverImage && isHeicString(u.coverImage)) {
      console.log(`Converting cover image for User ${u.id} (${u.name})...`);
      const newCover = await ensureUniversalImage(u.coverImage);
      if (newCover && newCover.startsWith('data:image/jpeg')) {
        updateData.coverImage = newCover;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await datingPrisma.user.update({
        where: { id: u.id },
        data: updateData
      });
      convertedUsers++;
      console.log(`✓ Updated User ${u.id} to universal JPEG`);
    }
  }

  // 2. Check Posts (image)
  const posts = await datingPrisma.post.findMany({
    where: { image: { not: null } },
    select: { id: true, image: true }
  });

  let convertedPosts = 0;
  for (const p of posts) {
    if (p.image && isHeicString(p.image)) {
      console.log(`Converting image for Post ${p.id}...`);
      const newImage = await ensureUniversalImage(p.image);
      if (newImage && newImage.startsWith('data:image/jpeg')) {
        await datingPrisma.post.update({
          where: { id: p.id },
          data: { image: newImage }
        });
        convertedPosts++;
        console.log(`✓ Updated Post ${p.id} to universal JPEG`);
      }
    }
  }

  console.log(`--- Migration complete ---`);
  console.log(`Converted users: ${convertedUsers}`);
  console.log(`Converted posts: ${convertedPosts}`);
  await datingPrisma.$disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
