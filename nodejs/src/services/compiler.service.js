const { exec, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { generateGeminiContent, MODELS } = require('./ai.service');

// Normalizes language aliases to standard keys
const normalizeLanguage = (lang = '') => {
    const l = String(lang).toLowerCase().trim();
    if (['python', 'python3', 'py'].includes(l)) return 'python';
    if (['javascript', 'js', 'node', 'nodejs'].includes(l)) return 'javascript';
    if (['typescript', 'ts'].includes(l)) return 'typescript';
    if (['cpp', 'c++', 'cxx', 'cc'].includes(l)) return 'cpp';
    if (['c'].includes(l)) return 'c';
    if (['java'].includes(l)) return 'java';
    if (['go', 'golang'].includes(l)) return 'go';
    if (['rust', 'rs'].includes(l)) return 'rust';
    if (['bash', 'sh', 'shell'].includes(l)) return 'bash';
    return l || 'python';
};

/**
 * Execute code safely in an isolated temporary directory with timeout and stdin support.
 */
const executeCode = async ({ language, code, stdin = '' }) => {
    if (!code || typeof code !== 'string') {
        return {
            stdout: '',
            stderr: 'Error: No code provided to execute.',
            exitCode: 1,
            executionTime: 0
        };
    }

    const lang = normalizeLanguage(language);
    const execId = crypto.randomUUID();
    const tempDir = path.join(os.tmpdir(), 'learnproof-compiler', execId);
    await fs.ensureDir(tempDir);

    const startTime = process.hrtime.bigint();
    const timeoutMs = 8000; // 8 seconds execution safety limit

    try {
        let executable = '';
        let execArgs = [];
        let compileCommand = null;
        let sourceFileName = 'main.txt';

        switch (lang) {
            case 'python': {
                sourceFileName = 'main.py';
                await fs.writeFile(path.join(tempDir, sourceFileName), code, 'utf8');
                executable = 'python3';
                execArgs = [sourceFileName];
                break;
            }

            case 'javascript': {
                sourceFileName = 'main.js';
                await fs.writeFile(path.join(tempDir, sourceFileName), code, 'utf8');
                executable = 'node';
                execArgs = [sourceFileName];
                break;
            }

            case 'typescript': {
                sourceFileName = 'main.ts';
                await fs.writeFile(path.join(tempDir, sourceFileName), code, 'utf8');
                executable = 'npx';
                execArgs = ['--yes', 'tsx', sourceFileName];
                break;
            }

            case 'cpp': {
                sourceFileName = 'main.cpp';
                const binName = process.platform === 'win32' ? 'main.exe' : 'main.out';
                let runnableCode = code;

                // 1. If main is commented out inside /* ... */, uncomment it
                const commentMainCpp = /\/\*([\s\S]*?\bint\s+main\s*\([\s\S]*?)\*\//;
                if (commentMainCpp.test(runnableCode)) {
                    runnableCode = runnableCode.replace(commentMainCpp, '$1');
                }

                // 2. If no main() exists at all, auto-append harness
                if (!/\bmain\s*\(/.test(runnableCode)) {
                    runnableCode += `\n\n// Auto-generated test harness for DSA solution\nint main() {\n    return 0;\n}\n`;
                }

                await fs.writeFile(path.join(tempDir, sourceFileName), runnableCode, 'utf8');
                const compiler = process.platform === 'darwin' ? 'clang++' : 'g++';
                compileCommand = `${compiler} -O2 -std=c++17 "${sourceFileName}" -o "${binName}"`;
                executable = path.join(tempDir, binName);
                execArgs = [];
                break;
            }

            case 'c': {
                let runnableCode = code;

                // 1. If main is commented out inside /* ... */, uncomment it
                const commentMainC = /\/\*([\s\S]*?\bint\s+main\s*\([\s\S]*?)\*\//;
                if (commentMainC.test(runnableCode)) {
                    runnableCode = runnableCode.replace(commentMainC, '$1');
                }

                // 2. If no main() exists at all, auto-append harness
                if (!/\bmain\s*\(/.test(runnableCode)) {
                    runnableCode += `\n\nint main() {\n    return 0;\n}\n`;
                }

                // 3. Detect if C++ headers or syntax were submitted in C mode (e.g. from C++ DSA lessons tagged as C)
                const isCpp = /#include\s*<(?:iostream|vector|algorithm|limits|string|map|set|queue|stack|utility|numeric)>/i.test(runnableCode) ||
                    /\bstd::/.test(runnableCode) ||
                    /\bcout\b/.test(runnableCode) ||
                    /\bcin\b/.test(runnableCode) ||
                    /\bnamespace\b/.test(runnableCode) ||
                    /\bclass\b/.test(runnableCode) ||
                    /\btemplate\s*</.test(runnableCode);

                sourceFileName = isCpp ? 'main.cpp' : 'main.c';
                const binName = process.platform === 'win32' ? 'main.exe' : 'main.out';
                await fs.writeFile(path.join(tempDir, sourceFileName), runnableCode, 'utf8');

                if (isCpp) {
                    const compiler = process.platform === 'darwin' ? 'clang++' : 'g++';
                    compileCommand = `${compiler} -O2 -std=c++17 "${sourceFileName}" -o "${binName}"`;
                } else {
                    const compiler = process.platform === 'darwin' ? 'clang' : 'gcc';
                    compileCommand = `${compiler} -O2 -std=c11 -Wno-implicit-function-declaration "${sourceFileName}" -o "${binName}" -lm`;
                }

                executable = path.join(tempDir, binName);
                execArgs = [];
                break;
            }

            case 'java': {
                let runnableCode = code;

                // 1. If public static void main is trapped inside /* ... */, uncomment it!
                const commentMainJava = /\/\*([\s\S]*?public\s+static\s+void\s+main[\s\S]*?)\*\//;
                if (commentMainJava.test(runnableCode)) {
                    runnableCode = runnableCode.replace(commentMainJava, '$1');
                }

                // 2. If code has no class declaration, wrap it in class Main
                if (!/\bclass\s+[A-Za-z0-9_]+/.test(runnableCode)) {
                    runnableCode = `import java.util.*;\n\npublic class Main {\n${runnableCode}\n\n    public static void main(String[] args) {\n        System.out.println("Executed successfully.");\n    }\n}`;
                } else if (!/public\s+static\s+void\s+main\s*\(/.test(runnableCode)) {
                    // Inject a runnable main method before the last closing brace
                    const lastBrace = runnableCode.lastIndexOf('}');
                    if (lastBrace !== -1) {
                        runnableCode = runnableCode.slice(0, lastBrace) +
                            `\n    public static void main(String[] args) {\n        System.out.println("Executed successfully.");\n    }\n` +
                            runnableCode.slice(lastBrace);
                    }
                }

                // 3. Find the class that contains public static void main
                let className = 'Main';
                const publicMatch = runnableCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
                if (publicMatch) {
                    className = publicMatch[1];
                } else {
                    const parts = runnableCode.split(/public\s+static\s+void\s+main/);
                    if (parts.length > 1) {
                        const classesBeforeMain = [...parts[0].matchAll(/class\s+([A-Za-z0-9_]+)/g)];
                        if (classesBeforeMain.length > 0) {
                            className = classesBeforeMain[classesBeforeMain.length - 1][1];
                        }
                    } else {
                        const anyClass = runnableCode.match(/class\s+([A-Za-z0-9_]+)/);
                        if (anyClass) className = anyClass[1];
                    }
                }

                sourceFileName = `${className}.java`;
                await fs.writeFile(path.join(tempDir, sourceFileName), runnableCode, 'utf8');
                compileCommand = `javac "${sourceFileName}"`;
                executable = 'java';
                execArgs = ['-cp', '.', className];
                break;
            }

            case 'go': {
                sourceFileName = 'main.go';
                await fs.writeFile(path.join(tempDir, sourceFileName), code, 'utf8');
                executable = 'go';
                execArgs = ['run', sourceFileName];
                break;
            }

            case 'rust': {
                sourceFileName = 'main.rs';
                const binName = process.platform === 'win32' ? 'main.exe' : 'main.out';
                await fs.writeFile(path.join(tempDir, sourceFileName), code, 'utf8');
                compileCommand = `rustc "${sourceFileName}" -o "${binName}"`;
                executable = path.join(tempDir, binName);
                execArgs = [];
                break;
            }

            case 'bash': {
                sourceFileName = 'main.sh';
                await fs.writeFile(path.join(tempDir, sourceFileName), code, 'utf8');
                executable = 'bash';
                execArgs = [sourceFileName];
                break;
            }

            default:
                throw new Error(`Unsupported programming language: ${lang}`);
        }

        // 1. Compilation Step (if applicable)
        if (compileCommand) {
            try {
                await new Promise((resolve, reject) => {
                    exec(compileCommand, { cwd: tempDir, timeout: 7000 }, (error, stdout, stderr) => {
                        if (error) {
                            reject(new Error(stderr || stdout || error.message));
                        } else {
                            resolve({ stdout, stderr });
                        }
                    });
                });
            } catch (compileErr) {
                const endTime = process.hrtime.bigint();
                const executionTime = Number((endTime - startTime) / 1000000n);
                return {
                    stdout: '',
                    stderr: `Compilation Error:\n${compileErr.message}`,
                    exitCode: 1,
                    executionTime,
                    compilationError: true
                };
            }
        }

        // 2. Execution Step (with stdin streaming and timeout protection)
        const runResult = await new Promise((resolve) => {
            const child = spawn(executable, execArgs, {
                cwd: tempDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';
            let isTimedOut = false;

            const timer = setTimeout(() => {
                isTimedOut = true;
                try {
                    child.kill('SIGKILL');
                } catch {
                    // Ignore kill errors
                }
            }, timeoutMs);

            child.stdout.on('data', (data) => {
                if (stdout.length < 1000000) { // 1MB buffer cap
                    stdout += data.toString();
                }
            });

            child.stderr.on('data', (data) => {
                if (stderr.length < 1000000) {
                    stderr += data.toString();
                }
            });

            // Write stdin if provided
            if (stdin) {
                try {
                    child.stdin.write(stdin);
                    child.stdin.end();
                } catch {
                    // Stdin pipe closed
                }
            } else {
                child.stdin.end();
            }

            child.on('close', (code) => {
                clearTimeout(timer);
                if (isTimedOut) {
                    resolve({
                        stdout,
                        stderr: `Time Limit Exceeded (TLE): Program exceeded ${timeoutMs / 1000}s limit. Check for infinite loops or heavy operations.`,
                        exitCode: 124,
                        timedOut: true
                    });
                } else {
                    resolve({
                        stdout,
                        stderr,
                        exitCode: code || 0,
                        timedOut: false
                    });
                }
            });

            child.on('error', (err) => {
                clearTimeout(timer);
                resolve({
                    stdout,
                    stderr: `Execution System Error: ${err.message}`,
                    exitCode: 1,
                    timedOut: false
                });
            });
        });

        const endTime = process.hrtime.bigint();
        const executionTime = Number((endTime - startTime) / 1000000n);

        return {
            stdout: runResult.stdout,
            stderr: runResult.stderr,
            exitCode: runResult.exitCode,
            executionTime,
            timedOut: runResult.timedOut
        };

    } catch (err) {
        const endTime = process.hrtime.bigint();
        const executionTime = Number((endTime - startTime) / 1000000n);
        return {
            stdout: '',
            stderr: err.message,
            exitCode: 1,
            executionTime
        };
    } finally {
        // Asynchronously clean up the temp execution sandbox directory
        fs.remove(tempDir).catch(() => {});
    }
};

/**
 * Converts a code snippet between programming languages using Vertex AI / Gemini.
 */
const convertCodeSnippet = async ({ code, fromLanguage, toLanguage }) => {
    if (!code || !code.trim()) {
        throw new Error('Code snippet is required');
    }

    const targetLang = normalizeLanguage(toLanguage);
    const sourceLang = normalizeLanguage(fromLanguage) || 'code';

    if (targetLang === sourceLang) {
        return { code, language: targetLang };
    }

    const prompt = `You are a Principal Software Engineer and Master Algorithms Instructor.
Convert the following code snippet from ${sourceLang} to idiomatic, high-performance, fully runnable ${targetLang}.

RULES:
1. Preserve the exact algorithmic logic, variable semantics, comments, and time/space complexity.
2. The converted code MUST BE COMPLETE AND IMMEDIATELY RUNNABLE:
   - For C/C++: Include all required headers (<iostream>, <vector>, <algorithm>, etc.) and ALWAYS include an ACTIVE, UNCOMMENTED int main() function that executes the algorithm with sample test inputs and prints the result using std::cout.
   - For Java: Include imports like java.util.*, declare 'public class Main', and ALWAYS include an ACTIVE, UNCOMMENTED 'public static void main(String[] args)' method that executes the algorithm with sample test inputs and prints the result using System.out.println.
   - For Python: Include sample test calls or an 'if __name__ == "__main__":' block printing sample outputs.
3. CRITICAL: NEVER comment out the main() method or test execution block (DO NOT put it inside /* ... */ or // comments). It must be active runnable code.
4. Output ONLY the raw converted code inside a single markdown code fence with language tag:
\`\`\`${targetLang}
// your converted code here
\`\`\`
Do NOT include any greetings, notes, or explanations outside the code block.

SOURCE CODE (${sourceLang}):
${code}
`;

    const modelName = MODELS.GEMINI_FLASH_LITE || 'gemini-2.5-flash-lite';
    const rawResponse = await generateGeminiContent(modelName, prompt, {
        maxOutputTokens: 3000,
        temperature: 0.1
    });

    if (!rawResponse || !rawResponse.trim()) {
        throw new Error('Failed to convert code snippet');
    }

    // Extract code from inside ```lang ... ```
    const codeBlockMatch = rawResponse.match(/```(?:[a-zA-Z0-9+#_-]*)\s*([\s\S]*?)```/);
    let cleanCode = codeBlockMatch ? codeBlockMatch[1].trim() : rawResponse.trim();

    // Safety: If Gemini commented out main() inside /* ... */, automatically unwrap it
    if (targetLang === 'java') {
        const commentMainJava = /\/\*([\s\S]*?public\s+static\s+void\s+main[\s\S]*?)\*\//;
        if (commentMainJava.test(cleanCode)) {
            cleanCode = cleanCode.replace(commentMainJava, '$1');
        }
    } else if (targetLang === 'cpp' || targetLang === 'c') {
        const commentMainCpp = /\/\*([\s\S]*?\bint\s+main\s*\([\s\S]*?)\*\//;
        if (commentMainCpp.test(cleanCode)) {
            cleanCode = cleanCode.replace(commentMainCpp, '$1');
        }
    }

    return {
        code: cleanCode,
        language: targetLang
    };
};

module.exports = {
    executeCode,
    convertCodeSnippet,
    normalizeLanguage
};
