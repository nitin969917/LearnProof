const prisma = require('./src/lib/prisma');
const youtube = require('./src/lib/youtube');
require('dotenv').config();

/**
 * Backfill script to populate duration_seconds for existing videos
 */
const backfillDurations = async () => {
    console.log('Starting backfill for video durations...');

    try {
        // Find all videos with duration_seconds = 0
        const videos = await prisma.video.findMany({
            where: { duration_seconds: 0 },
            select: { id: true, vid: true }
        });

        if (videos.length === 0) {
            console.log('No videos found missing durations.');
            return;
        }

        console.log(`Found ${videos.length} videos to update.`);

        // Batch fetch from YouTube (50 IDs max)
        for (let i = 0; i < videos.length; i += 50) {
            const batch = videos.slice(i, i + 50);
            const videoIds = batch.map(v => v.vid);
            
            console.log(`Fetching details for batch ${i / 50 + 1}...`);
            const details = await youtube.getVideosDetails(videoIds);
            
            const updatePromises = details.map(item => {
                const duration = youtube.parseDuration(item.contentDetails.duration);
                return prisma.video.updateMany({
                    where: { vid: item.id },
                    data: { duration_seconds: duration }
                });
            });

            await Promise.all(updatePromises);
            console.log(`Updated ${details.length} videos.`);
        }

        console.log('Backfill complete!');
    } catch (error) {
        console.error('Backfill failed:', error);
    } finally {
        await prisma.$disconnect();
    }
};

backfillDurations();
