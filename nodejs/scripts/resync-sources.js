/**
 * Re-sync script: Re-parse local files and re-upload to Dify for INDEXED sources with missing text
 */
require('dotenv').config({ path: __dirname + '/../.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const difyService = require('../src/services/dify.service');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

async function parseFileLocally(filePath, ext) {
    const dataBuffer = fs.readFileSync(filePath);
    let normalizedExt = ext.toLowerCase();
    if (!normalizedExt.startsWith('.')) normalizedExt = '.' + normalizedExt;

    if (normalizedExt === '.pdf') {
        const data = await pdf(dataBuffer);
        let text = data.text || '';
        if (text.trim().length < 150 && genAI) {
            console.log('  Scanned PDF detected, running Gemini Vision OCR...');
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const result = await model.generateContent([
                { inlineData: { mimeType: 'application/pdf', data: dataBuffer.toString('base64') } },
                'Extract all text, equations, tables, headings, and lessons. Maintain layout.'
            ]);
            text = result.response.text() || '';
        }
        console.log('  Extracted', text.trim().length, 'characters of text');
        return text;
    } else if (['.txt', '.md'].includes(normalizedExt)) {
        return dataBuffer.toString('utf-8');
    }
    return '';
}

async function main() {
    console.log('=== LearnProof Source Re-Sync ===\n');
    const sources = await prisma.knowledgeSource.findMany({
        where: { status: 'INDEXED' },
        include: { workspace: true }
    });

    const needsResync = sources.filter(s => {
        try {
            const meta = s.metadata ? JSON.parse(s.metadata) : {};
            return !meta.extractedText || meta.extractedText.length < 50;
        } catch { return true; }
    });

    console.log('Sources to re-sync:', needsResync.length, '\n');

    for (const source of needsResync) {
        console.log('Processing:', source.name, '(ID:', source.id + ')');
        if (!source.fileUrl || !fs.existsSync(source.fileUrl)) {
            console.log('  File not found:', source.fileUrl);
            await prisma.knowledgeSource.update({ where: { id: source.id }, data: { status: 'FAILED', errorMessage: 'File missing - please re-upload' } });
            continue;
        }
        try {
            const ext = path.extname(source.name);
            const extractedText = await parseFileLocally(source.fileUrl, ext);
            if (source.workspace?.difyDatasetId) {
                console.log('  Uploading to Dify...');
                try {
                    const difyRes = await difyService.uploadFileToDataset(source.workspace.difyDatasetId, source.fileUrl, source.name);
                    const newDifyDocId = difyRes?.document?.id;
                    console.log('  Dify doc ID:', newDifyDocId);
                    await prisma.knowledgeSource.update({ where: { id: source.id }, data: { status: 'INDEXED', difyDocumentId: newDifyDocId, metadata: JSON.stringify({ extractedText }) } });
                    console.log('  Done (Dify + local text)');
                } catch (difyErr) {
                    console.log('  Dify failed:', difyErr.message, '- saving local text only');
                    await prisma.knowledgeSource.update({ where: { id: source.id }, data: { status: 'INDEXED', metadata: JSON.stringify({ extractedText }) } });
                }
            } else {
                await prisma.knowledgeSource.update({ where: { id: source.id }, data: { status: 'INDEXED', metadata: JSON.stringify({ extractedText }) } });
                console.log('  Done (local text only)');
            }
        } catch (err) {
            console.error('  Failed:', err.message);
        }
        console.log('');
    }

    console.log('=== Re-sync complete ===');
    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); prisma.$disconnect(); process.exit(1); });
