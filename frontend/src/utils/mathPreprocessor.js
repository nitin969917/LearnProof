/**
 * Math and LaTeX Preprocessor for KaTeX and React-Markdown
 * Delivers crisp, textbook-grade mathematical typography across LearnProof.
 * 
 * Key capabilities:
 * 1. Sanitizes legacy control characters (\x0c, \x08, \0) and fixes broken \frac / \beta.
 * 2. Protects fenced code blocks (```...```) so source code syntax is NEVER touched.
 * 3. Normalizes over-escaped backslashes (e.g. \\frac -> \frac, \\to -> \to, \\text -> \text).
 * 4. Normalizes bracket delimiters \[...\] -> $$ and \(...\) -> $ while preserving \left[ and \right].
 * 5. Strips unintended 4-space indentation outside code blocks to prevent accidental CommonMark code blocks.
 * 6. Formats display math ($$...$$) on clean block boundaries for proper KaTeX display rendering.
 * 7. Tokenizes strictly to preserve valid math expressions while auto-wrapping unwrapped symbols/fractions in plain text.
 */

/**
 * Math and LaTeX Preprocessor for KaTeX and React-Markdown
 * Delivers crisp, textbook-grade mathematical typography across LearnProof.
 * 
 * Key capabilities:
 * 1. Sanitizes legacy control characters (\x0c, \x08, \0) and fixes broken \frac / \beta.
 * 2. Protects fenced code blocks (```...```) and inline code (`...`) so programming code is NEVER touched.
 * 3. Broad universal LaTeX backslash normalization: converts \\cmd to \cmd for ANY LaTeX command or symbol.
 * 4. Normalizes bracket delimiters \[...\] -> $$ and \(...\) -> $ while preserving \left[ and \right].
 * 5. Strips unintended leading indentation outside code blocks to prevent CommonMark from creating indented code blocks.
 * 6. Formats display math ($$...$$) on clean block boundaries for proper KaTeX display rendering.
 * 7. Automatically wraps unwrapped LaTeX environments (cases, align, matrix, pmatrix, etc.) in display math.
 * 8. Tokenizes strictly to preserve valid math expressions while auto-wrapping unwrapped symbols/fractions in plain text.
 */

export const preprocessMath = (text) => {
  if (!text || typeof text !== 'string') return '';

  let processed = text;

  // 1. Remove control characters and restore corrupted \frac / \beta
  processed = processed
    .replace(/\x0crac\b/g, '\\frac')
    .replace(/\x0crac\{/g, '\\frac{')
    .replace(/(?<![a-zA-Z\\])rac\{/g, '\\frac{')
    .replace(/\x0c/g, '')
    .replace(/\x08eta\b/g, '\\beta')
    .replace(/\x08/g, '')
    .replace(/\0/g, '');

  // 2. Protect fenced code blocks (```...```) and inline code (`...`)
  const codeBlocks = [];
  processed = processed.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 3. Broad universal LaTeX backslash normalization:
  // Normalize \\ followed by any letters (e.g. \\frac -> \frac, \\mathbb -> \mathbb, \\lim -> \lim, \\le -> \le)
  // or common math symbols (e.g. \\{ -> \{, \\} -> \})
  // Note: we do not match \\ followed by whitespace or newline which indicates matrix/table row breaks.
  processed = processed.replace(/\\{2,}(?=[a-zA-Z])/g, '\\');
  processed = processed.replace(/\\{2,}(?=[{}_^,;!|~])/g, '\\');

  // 4. Normalize LaTeX bracket delimiters \[...\] -> $$ and \(...\) -> $
  // while preserving \left[ and \right]
  processed = processed.replace(/(?<!\\left|\\right|[a-zA-Z])\\\[([\s\S]*?)\\\]/g, (match, content) => {
    return `\n\n$$\n${content.trim()}\n$$\n\n`;
  });
  processed = processed.replace(/(?<!\\left|\\right|[a-zA-Z])\\\(([\s\S]*?)\\\)/g, (match, content) => {
    return `$${content.trim()}$`;
  });

  // 5. CRITICAL FIX FOR UNINTENDED INDENTED CODE BLOCKS:
  // In CommonMark, 4 or more leading spaces converts text into an indented code block (<pre><code>).
  // AI-generated notes often have 4, 8, or 12 leading spaces due to nested JSON prompts or markdown lists.
  // We preserve 0 or 2 spaces for actual markdown list items (*, -, +, 1.),
  // and strip all leading whitespace from regular text lines so derivations never become code blocks.
  processed = processed.split('\n').map(line => {
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s/);
    if (listMatch) {
      const indent = listMatch[1].length;
      return (indent >= 2 ? '  ' : '') + line.trimStart();
    }
    return line.trimStart();
  }).join('\n');

  // 6. Normalize display math $$...$$ so it always sits cleanly on block boundaries
  // Standalone single-line $$ formula $$
  processed = processed.replace(/^[ \t]*\$\$\s*([^\n]+?)\s*\$\$[ \t]*$/gm, (match, content) => {
    return `\n\n$$\n${content.trim()}\n$$\n\n`;
  });

  // Multiline or inline display math $$ ... $$
  processed = processed.replace(/([^\n])\s*\$\$([\s\S]*?)\$\$/g, (match, prefix, content) => {
    return `${prefix}\n\n$$\n${content.trim()}\n$$\n\n`;
  });
  processed = processed.replace(/\$\$([\s\S]*?)\$\$\s*([^\n])/g, (match, content, suffix) => {
    return `\n\n$$\n${content.trim()}\n$$\n\n${suffix}`;
  });

  // Fix nested dollar signs inside \boxed{...} or display math
  processed = processed.replace(/\\boxed\{([^{}]*)\}/g, (match, content) => {
    return `\\boxed{${content.replace(/\$/g, '')}}`;
  });

  // 7. Auto-wrap unwrapped LaTeX math environments outside $ or $$
  const environments = [
    'bmatrix', 'matrix', 'pmatrix', 'vmatrix', 'Vmatrix',
    'array', 'align', 'align\\*', 'aligned', 'equation', 'equation\\*',
    'gather', 'gather\\*', 'gathered', 'cases', 'split'
  ].join('|');
  const envRegex = new RegExp(`(?<!\\$)\\\\begin\\{(${environments})\\}([\\s\\S]*?)\\\\end\\{\\1\\}(?!\\$)`, 'g');
  processed = processed.replace(envRegex, (match) => {
    const cleanMatch = match.replace(/\$\s*\\(\w+)\s*\$/g, '\\$1');
    return `\n\n$$\n${cleanMatch.trim()}\n$$\n\n`;
  });

  // 8. Split text into segments: math blocks ($$...$$ and $...$) and plain text blocks
  const tokens = processed.split(/(\$\$[\s\S]*?\$\$|\$(?!\$)[^$\n]+?\$)/g);

  const processedTokens = tokens.map((token, index) => {
    if (index % 2 === 0) {
      // Plain text block outside math delimiters:
      let t = token;

      // Auto-wrap unwrapped \frac{...}{...} outside math delimiters
      t = t.replace(/(?<!\$)\\frac\{([^{}]+)\}\{([^{}]+)\}(?!\$)/g, (m, g1, g2) => `$ \\frac{${g1}}{${g2}} $`);

      // Auto-wrap unwrapped standalone Greek letters and math symbols
      const symbolsToWrap = [
        'vee', 'wedge', 'neg', 'in', 'notin', 'forall', 'exists',
        'cup', 'cap', 'subset', 'subseteq', 'supset', 'supseteq', 'varnothing', 'emptyset',
        'to', 'gets', 'iff', 'implies', 'impliedby', 'oplus', 'otimes', 'pm', 'mp',
        'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta',
        'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi',
        'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
        'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega',
        'infty', 'partial', 'nabla'
      ];
      symbolsToWrap.forEach(sym => {
        const regex = new RegExp(`\\\\${sym}\\b(?![a-zA-Z0-9$])`, 'g');
        t = t.replace(regex, (match) => `$${match}$`);
      });

      return t;
    } else {
      // Inside math block: trim any accidental spaces right next to the $ delimiters
      if (token.startsWith('$') && !token.startsWith('$$') && token.endsWith('$') && !token.endsWith('$$')) {
        const inner = token.slice(1, -1).trim();
        return `$${inner}$`;
      }
      return token;
    }
  });

  processed = processedTokens.join('');

  // 9. Restore code blocks and inline code
  codeBlocks.forEach((cb, i) => {
    processed = processed.replace(`__CODE_BLOCK_${i}__`, cb);
  });

  // Clean excessive blank lines (> 2 newlines -> 2 newlines)
  processed = processed.replace(/\n{3,}/g, '\n\n');

  return processed.trim();
};

export default preprocessMath;
