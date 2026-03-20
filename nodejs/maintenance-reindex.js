const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ragService = require('./src/services/rag.service');

async function runRecovery() {
    console.log('[RECOVERY] Starting full subject re-indexing...');
    const subjects = await prisma.subject.findMany({
        include: { notes: true }
    });

    for (const subject of subjects) {
        console.log(`[RECOVERY] Checking Subject: ${subject.name} (ID: ${subject.id})`);
        for (const note of subject.notes) {
            console.log(`[RECOVERY] Processing Note: ${note.original_name}`);
            try {
                await ragService.processAndEmbedFile(note.file_path, subject.id, note.original_name);
            } catch (err) {
                console.error(`[RECOVERY] Failed to process ${note.original_name}:`, err.message);
            }
        }
    }
    console.log('[RECOVERY] Full re-indexing complete.');
}

runRecovery()
    .catch(err => console.error('[RECOVERY] Critical error:', err))
    .finally(() => prisma.$disconnect());
