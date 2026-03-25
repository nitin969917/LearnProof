const ragService = require('./src/services/rag.service');
const fs = require('fs-extra');
const path = require('path');

async function testNewSubjectIndexing() {
    const fakeSubjectId = 999;
    const fakeFilename = 'test_debug.txt';
    const fakeFilePath = path.join(process.cwd(), 'debug_test.txt');
    
    await fs.writeFile(fakeFilePath, 'This is a test document for debugging indexing issues in new subjects.');
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    try {
        console.log('--- Testing Indexing for New Subject ---');
        const success = await ragService.processAndEmbedFile(fakeFilePath, fakeSubjectId, fakeFilename);
        console.log('Indexing Success:', success);
        
        const storePath = path.join(process.cwd(), 'vector_stores', `subject_${fakeSubjectId}.json`);
        if (fs.existsSync(storePath)) {
            const data = await fs.readJSON(storePath);
            console.log(`Store file created: ${storePath}`);
            console.log(`Number of chunks: ${data.length}`);
        } else {
            console.error('FAILED: Store file was NOT created!');
        }
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    } finally {
        // Clean up
        if (fs.existsSync(fakeFilePath)) await fs.unlink(fakeFilePath);
        // We'll leave the store for a moment to inspect if it exists
    }
}

testNewSubjectIndexing();
