import fs from 'fs';

const content = fs.readFileSync('/Users/nitingaikwad/LearnProof/frontend/src/components/Dashboard/AskMyNotes.jsx', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, idx) => {
    let inComment = false;
    let cleanLine = '';
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '/' && line[i+1] === '/') {
            break;
        }
        cleanLine += line[i];
    }

    for (let i = 0; i < cleanLine.length; i++) {
        if (cleanLine[i] === '{') {
            stack.push({ lineNum: idx + 1, text: cleanLine.trim() });
        }
        if (cleanLine[i] === '}') {
            if (stack.length > 0) {
                stack.pop();
            } else {
                console.log(`Extra closing brace at line ${idx + 1}: ${cleanLine.trim()}`);
            }
        }
    }
});

console.log('--- UNCLOSED BRACES ---');
stack.forEach(s => {
    console.log(`Line ${s.lineNum}: ${s.text}`);
});
