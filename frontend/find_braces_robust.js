import fs from 'fs';

const content = fs.readFileSync('/Users/nitingaikwad/LearnProof/frontend/src/components/Dashboard/AskMyNotes.jsx', 'utf8');

let curlyStack = [];
let roundStack = [];
let squareStack = [];
let inString = null;
let inComment = null;
let inRegex = false;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i+1];
    const prevChar = content[i-1];

    if (inComment === '//') {
        if (char === '\n') inComment = null;
        continue;
    }
    if (inComment === '/*') {
        if (char === '*' && nextChar === '/') {
            inComment = null;
            i++;
        }
        continue;
    }
    if (!inString && !inRegex) {
        if (char === '/' && nextChar === '/') {
            inComment = '//';
            i++;
            continue;
        }
        if (char === '/' && nextChar === '*') {
            inComment = '/*';
            i++;
            continue;
        }
    }

    if (inString) {
        if (char === inString && prevChar !== '\\') {
            inString = null;
        }
        continue;
    }
    if (!inComment && !inRegex) {
        if (char === '"' || char === "'" || char === '`') {
            inString = char;
            continue;
        }
    }

    if (char === '/' && !inComment && !inString) {
        const before = content.substring(Math.max(0, i - 15), i).trim();
        const isDivision = /[a-zA-Z0-9_\)]$/.test(before);
        if (!isDivision) {
            inRegex = true;
            let escaped = false;
            for (let j = i + 1; j < content.length; j++) {
                if (escaped) {
                    escaped = false;
                    continue;
                }
                if (content[j] === '\\') {
                    escaped = true;
                    continue;
                }
                if (content[j] === '/') {
                    i = j;
                    inRegex = false;
                    break;
                }
                if (content[j] === '\n') {
                    inRegex = false;
                    break;
                }
            }
            continue;
        }
    }

    const lineNum = content.substring(0, i).split('\n').length;
    const lineText = content.split('\n')[lineNum - 1].trim();

    if (char === '{') curlyStack.push({ lineNum, text: lineText });
    if (char === '}') {
        if (curlyStack.length > 0) curlyStack.pop();
        else console.log(`Extra } at line ${lineNum}: ${lineText}`);
    }

    if (char === '(') roundStack.push({ lineNum, text: lineText });
    if (char === ')') {
        if (roundStack.length > 0) roundStack.pop();
        else console.log(`Extra ) at line ${lineNum}: ${lineText}`);
    }

    if (char === '[') squareStack.push({ lineNum, text: lineText });
    if (char === ']') {
        if (squareStack.length > 0) squareStack.pop();
        else console.log(`Extra ] at line ${lineNum}: ${lineText}`);
    }
}

console.log('--- UNCLOSED CURLY BRACES ---');
curlyStack.forEach(s => console.log(`Line ${s.lineNum}: ${s.text}`));

console.log('--- UNCLOSED PARENTHESES ---');
roundStack.forEach(s => console.log(`Line ${s.lineNum}: ${s.text}`));

console.log('--- UNCLOSED BRACKETS ---');
squareStack.forEach(s => console.log(`Line ${s.lineNum}: ${s.text}`));
