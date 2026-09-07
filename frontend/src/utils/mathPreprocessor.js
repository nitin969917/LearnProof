/**
 * Math and LaTeX Preprocessor for KaTeX and React-Markdown
 * Cleans malformed LaTeX, fixes character escaping issues (e.g. form feeds \x0c from \frac,
 * carriage returns from \right, dropped backslashes, control chars), standardizes math delimiters ($ and $$),
 * and auto-wraps LaTeX environments for pristine rendering in AI Notes and Chatbot sections.
 */

export const preprocessMath = (text) => {
  if (!text || typeof text !== 'string') return '';

  let processed = text;

  // 1. Remove/normalize control characters and corrupted escape sequences:
  // \x0c (form feed) produced by \f in \frac
  // \x08 (backspace) produced by \b in \beta
  // \x00 (null character)
  processed = processed
    .replace(/\x0crac\b/g, '\\frac')
    .replace(/\x0crac\{/g, '\\frac{')
    .replace(/\x0c/g, '')
    .replace(/\x08eta\b/g, '\\beta')
    .replace(/\x08/g, '')
    .replace(/\0/g, '');

  // 2. Fix corrupted LaTeX keywords where backslash was stripped during JSON/regex handling:
  processed = processed
    .replace(/(?<![a-zA-Z\\])rac\{/g, '\\frac{')
    .replace(/(?<![a-zA-Z\\])ight(\]|\)|\}|\||\.)/g, '\\right$1')
    .replace(/(?<![a-zA-Z\\])left(\[|\(|\{|\.|\|)/g, '\\left$1')
    .replace(/(?<![a-zA-Z\\])times\b/g, '\\times')
    .replace(/(?<![a-zA-Z\\])theta\b/g, '\\theta')
    .replace(/(?<![a-zA-Z\\])tau\b/g, '\\tau')
    .replace(/(?<![a-zA-Z\\])nabla\b/g, '\\nabla')
    .replace(/(?<![a-zA-Z\\])int_/g, '\\int_')
    .replace(/(?<![a-zA-Z\\])sum_/g, '\\sum_')
    .replace(/(?<![a-zA-Z\\])sqrt\{/g, '\\sqrt{')
    .replace(/(?<![a-zA-Z\\])infty\b/g, '\\infty')
    .replace(/(?<![a-zA-Z\\])cdot\b/g, '\\cdot')
    .replace(/(?<![a-zA-Z\\])approx\b/g, '\\approx')
    .replace(/(?<![a-zA-Z\\])neq\b/g, '\\neq')
    .replace(/(?<![a-zA-Z\\])leq\b/g, '\\leq')
    .replace(/(?<![a-zA-Z\\])geq\b/g, '\\geq')
    .replace(/(?<![a-zA-Z\\])pm\b/g, '\\pm')
    .replace(/(?<![a-zA-Z\\])partial\b/g, '\\partial')
    .replace(/(?<![a-zA-Z\\])dots\b/g, '\\dots')
    .replace(/(?<![a-zA-Z\\])cdots\b/g, '\\cdots')
    .replace(/(?<![a-zA-Z\\])vdots\b/g, '\\vdots')
    .replace(/(?<![a-zA-Z\\])ddots\b/g, '\\ddots');

  // 3. Convert HTML break tags
  processed = processed.replace(/<br\s*\/?>/gi, '\n');

  // 4. Normalize block math delimiters \[ ... \] and inline delimiters \( ... \) safely
  // (using negative lookbehind so \left[ and \right] are protected)
  processed = processed.replace(/(?<!\\left|\\right|[a-zA-Z])\\\[([\s\S]*?)\\\]/g, '\n$$\n$1\n$$\n');
  processed = processed.replace(/(?<!\\left|\\right|[a-zA-Z])\\\(([\s\S]*?)\\\)/g, '$$1$');

  // 5. Fix nested dollar signs inside \boxed{...}
  processed = processed.replace(/\\boxed\{([^{}]*)\}/g, (match, content) => {
    return `\\boxed{${content.replace(/\$/g, '')}}`;
  });

  // 6. Split text into segments: code blocks, existing math blocks ($$...$$ and $...$), and plain text
  // Tokenizer protects existing code blocks and valid math blocks from disruptive regex transformations
  const tokenRegex = /(```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  const tokens = processed.split(tokenRegex);

  const processedTokens = tokens.map((token, index) => {
    // Odd indices are protected tokens (code blocks or math blocks)
    if (index % 2 === 1) {
      if (token.startsWith('$')) {
        let mathInner = token;
        // Clean inner corrupted \rac, \ight, or stray internal dollars
        mathInner = mathInner
          .replace(/(?<![a-zA-Z\\])rac\{/g, '\\frac{')
          .replace(/(?<![a-zA-Z\\])ight(\]|\)|\}|\||\.)/g, '\\right$1')
          .replace(/(?<![a-zA-Z\\])left(\[|\(|\{|\.|\|)/g, '\\left$1')
          .replace(/(?<!\\)\$\s*(?=[a-zA-Z0-9\\+\-*=_])/g, '');
        return mathInner;
      }
      return token;
    }

    // Out-of-math & out-of-code plain text block:
    let t = token;

    // A. Auto-wrap unwrapped LaTeX math environments
    t = t.replace(/\\begin\{(bmatrix|matrix|pmatrix|vmatrix|Vmatrix|array|align|align\*|equation|equation\*|cases|split|gather|gather\*)\}([\s\S]*?)\\end\{\1\}/g, (match) => {
      let mathContent = match.replace(/\$\s*\\(\w+)\s*\$/g, '\\$1');
      return `\n$$\n${mathContent.trim()}\n$$\n`;
    });

    // B. Standalone math symbol auto-wrapping (Greek letters, logic operators, calculus symbols)
    const symbolsToWrap = [
      'vee', 'wedge', 'neg', 'in', 'notin', 'forall', 'exists',
      'cup', 'cap', 'subset', 'subseteq', 'varnothing', 'emptyset',
      'to', 'gets', 'iff', 'implies', 'impliedby', 'oplus', 'otimes',
      'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta',
      'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
      'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
      'nabla', 'partial', 'infty', 'approx', 'neq', 'leq', 'geq', 'pm', 'times', 'div', 'cdot'
    ];

    symbolsToWrap.forEach(sym => {
      const regex = new RegExp(`\\\\${sym}\\b(?![^$]*\\$)`, 'g');
      t = t.replace(regex, `$\\${sym}$`);
    });

    // C. Lines that are predominantly mathematical formulas but lack $ or $$ delimiters
    t = t.split('\n').map(line => {
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) return line;

      // Check if this line contains significant LaTeX commands but is NOT wrapped in $ or $$
      const hasLatexFormula = /\\[a-zA-Z]+/.test(trimmed) && /(\\frac|\\int|\\sum|\\lim|\\sqrt|\\left|\\right|\\prod|\\partial|\\nabla|=)/.test(trimmed);
      if (hasLatexFormula) {
        // Strip out latex commands and math symbols to check English word count
        const textOnly = trimmed
          .replace(/\\[a-zA-Z]+(?:\{[^{}]*\})*/g, '')
          .replace(/[\d$={}+*/<>()\[\]|,\-_.:;?!\s]+/g, ' ');
        const words = textOnly.trim().split(/\s+/).filter(w => w.length > 2 && !/^(sin|cos|tan|log|ln|lim|exp|det|max|min|dx|dy|dt|dz)$/i.test(w));

        // If there are very few descriptive conversational English words, treat as an equation block
        if (words.length <= 3 && !trimmed.startsWith('$') && !trimmed.endsWith('$')) {
          if (trimmed.includes('=') || trimmed.includes('\\int') || trimmed.includes('\\sum') || trimmed.includes('\\frac')) {
            return `$$\n${trimmed}\n$$`;
          } else {
            return `$${trimmed}$`;
          }
        }
      }
      return line;
    }).join('\n');

    return t;
  });

  let result = processedTokens.join('');

  // 7. Merge contiguous math blocks separated only by logic symbols/connectives
  let prevResult;
  let loopCount = 0;
  do {
    prevResult = result;
    result = result.replace(/\$\$\s*([\s\S]*?)\s*\$\$\s*([\s\S]*?)\s*\$\$\s*([\s\S]*?)\s*\$\$/g, (match, g1, g2, g3) => {
      const isMathConnective = /^[\s\n\r,=+\-*\\a-zA-Z$()]*$/.test(g2) && !/[a-zA-Z]{5,}/.test(g2);
      if (isMathConnective) {
        const cleanConnective = g2.replace(/\$/g, '');
        return `$$\n${g1.trim()}\n${cleanConnective.trim()}\n${g3.trim()}\n$$`;
      }
      return match;
    });
    loopCount++;
  } while (result !== prevResult && loopCount < 5);

  return result.trim();
};

export default preprocessMath;
