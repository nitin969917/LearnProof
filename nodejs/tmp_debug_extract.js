const ragService = require('./src/services/rag.service');
const path = require('path');
const fs = require('fs-extra');

async function debugExtraction() {
    const filePath = '/Users/nitingaikwad/LearnProof/nodejs/media/ask_my_notes/file-1773553007295-498273058.pdf';
    console.log('Testing extraction for:', filePath);
    
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai'); // Check if required deps are there
        const pdfParse = require('pdf-parse');
        
        // Manual extraction test since we want to see pagesData length
        const dataBuffer = await fs.readFile(filePath);
        const pagesData = [];
        const pagerender = (pageData) => {
            return pageData.getTextContent().then(textContent => {
                let text = textContent.items.map(i => i.str).join(' ');
                pagesData.push({ text, page: pageData.pageIndex + 1 });
                return text;
            });
        };
        
        await pdfParse(dataBuffer, { pagerender });
        console.log('Total Pages found by pdf-parse:', pagesData.length);
        if (pagesData.length > 0) {
            console.log('Sample text from Page 1 (first 200 chars):', pagesData[0].text.substring(0, 200));
        }

        // Test the chunking
        if (pagesData.length > 0) {
            const text = pagesData[0].text;
            const chunks = [];
            let start = 0;
            const chunkSize = 800;
            const overlap = 150;
            while (start < text.length) {
                const end = Math.min(start + chunkSize, text.length);
                chunks.push(text.slice(start, end));
                start += chunkSize - overlap;
                if (start >= text.length) break;
            }
            console.log('Chunks for Page 1:', chunks.length);
        }

    } catch (err) {
        console.error('Extraction Error:', err);
    }
}

debugExtraction();
