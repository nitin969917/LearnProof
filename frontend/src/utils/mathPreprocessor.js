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
        const regex = new RegExp(`(?<![\\{^_\\\\])\\\\${sym}\\b(?![a-zA-Z0-9$])`, 'g');
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

/**
 * Quiz Math & LaTeX Formatter
 * Specifically formats multiple-choice questions, options, and explanations
 * so that mathematical notation renders in textbook-grade KaTeX typography.
 */
export const formatQuizMath = (text) => {
  if (!text || typeof text !== 'string') return '';

  let processed = text.trim();

  // 1. Normalize escaped backslashes (\\sum -> \sum, \\frac -> \frac, etc.)
  processed = processed.replace(/\\{2,}(?=[a-zA-Z])/g, '\\');
  processed = processed.replace(/\\{2,}(?=[{}_^,;!|~])/g, '\\');

  // 2. Normalize LaTeX bracket delimiters \[...\] -> $$ and \(...\) -> $
  processed = processed.replace(/(?<!\\left|\\right|[a-zA-Z])\\\[([\s\S]*?)\\\]/g, (match, content) => {
    return `$$${content.trim()}$$`;
  });
  processed = processed.replace(/(?<!\\left|\\right|[a-zA-Z])\\\(([\s\S]*?)\\\)/g, (match, content) => {
    return `$${content.trim()}$`;
  });

  // 3. If already wrapped in $ or $$, return with clean whitespace
  if (processed.includes('$')) {
    return processed;
  }

  // Common natural language words that indicate human conversational text / sentences
  const naturalLanguageRegex = /\b(the|is|are|was|were|what|which|why|how|when|where|because|expands|uses|simplifying|special|case|point|value|function|series|approximate|derivative|multiplied|radius|within|converges|only|three|non-zero|terms|first|second|third|general|formula|about|from|with|this|that|between|during|before|after|calculate|evaluate|find|determine|state|explain|defined|given|assume|consider|statement|following|correct|incorrect|true|false)\b/i;

  const hasMathIndicators = 
    /\\[a-zA-Z]+/.test(processed) || // has LaTeX command like \sum, \frac, \infty, \beta
    /[a-zA-Z0-9_()]+\^[a-zA-Z0-9_{}()]+/.test(processed) || // powers like e^x, x^2
    /[a-zA-Z0-9_()]+\_[a-zA-Z0-9_{}()]+/.test(processed) || // subscripts like a_n
    /^[a-zA-Z]\([a-zA-Z]\)\s*=/.test(processed) || // f(x)=
    /^[a-zA-Z]\^[a-zA-Z0-9]\s*=/.test(processed) || // e^x =
    (/=/.test(processed) && /[+\-*/^]/.test(processed)); // equations

  const hasNaturalLanguage = naturalLanguageRegex.test(processed);

  // If it is predominantly a pure math formula or equation (like quiz options):
  if (hasMathIndicators && !hasNaturalLanguage) {
    let formula = processed;
    formula = formula.replace(/\.\.\./g, '\\dots');
    // Convert common division in formulas like (f^{(n)}(a)/n!) or x^2/2! to \frac for textbook aesthetics
    formula = formula.replace(/\((f\^\{[^}]+\}\([^)]+\))\/([a-zA-Z0-9{}!]+)\)/g, '\\frac{$1}{$2}');
    formula = formula.replace(/\b([a-zA-Z0-9]+(?:\^[a-zA-Z0-9{}]+)?)\/([a-zA-Z0-9{}]+!)/g, '\\frac{$1}{$2}');
    
    // Check if it has large operators like \sum, \int, \lim, \prod, \frac
    const needsDisplayStyle = /\\[(sum|int|lim|prod|frac)]/.test(formula);
    return needsDisplayStyle ? `$\\displaystyle ${formula}$` : `$${formula}$`;
  }

  // If it's a natural language sentence with embedded math terms:
  let sentence = processed;
  sentence = sentence.replace(/(?<!\$)(f\^\{[^}]+\}\([^)]+\))(?!\$)/g, (m, g1) => `$${g1}$`);
  sentence = sentence.replace(/(?<!\$)\(([a-zA-Z0-9]+-[a-zA-Z0-9]+)\)\^([a-zA-Z0-9{}]+)(?!\$)/g, (m, g1, g2) => `$(${g1})^${g2}$`);
  sentence = sentence.replace(/(?<!\$)\b([a-zA-Z0-9]+)\^([a-zA-Z0-9{}]+)\b(?!\$)/g, (m, g1, g2) => `$${g1}^${g2}$`);
  sentence = sentence.replace(/(?<!\$)\b([a-zA-Z0-9]+)\_([a-zA-Z0-9{}]+)\b(?!\$)/g, (m, g1, g2) => `$${g1}_${g2}$`);
  sentence = sentence.replace(/(?<!\$)\b([fg]\([a-zA-Z]\))(?!\$)/g, (m, g1) => `$${g1}$`);
  sentence = sentence.replace(/(?<!\$)\b([fg]'\([a-zA-Z]\))(?!\$)/g, (m, g1) => `$${g1}$`);
  sentence = sentence.replace(/(?<!\$)\b(sin|cos|tan|cot|sec|csc|log|ln)\(([a-zA-Z0-9.]+)\)(?!\$)/g, (m, g1, g2) => `$\\${g1}(${g2})$`);
  sentence = sentence.replace(/(?<!\$)\b([a-zA-Z])\s*=\s*([0-9]+)\b(?!\$)/g, (m, g1, g2) => `$${g1} = ${g2}$`);
  sentence = sentence.replace(/(?<!\$)\(([a-zA-Z0-9]+\s*-\s*[a-zA-Z0-9]+)\)(?!\$)/g, (m, g1) => `$(${g1})$`);
  // Standalone LaTeX commands in sentences
  sentence = sentence.replace(/(?<!\$)\\[a-zA-Z]+(?:\{[^}]*\})*(?:_\{?[^}\s]*\}?)?(?:\^\{?[^}\s]*\}?)?(?!\$)/g, (m) => `$${m}$`);

  return sentence;
};

export default preprocessMath;
