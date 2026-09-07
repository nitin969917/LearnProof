/**
 * Math and LaTeX Preprocessor for KaTeX and React-Markdown
 * Matches the proven AskMyNotes tokenizer architecture:
 * 1. Sanitizes legacy control characters (\x0c, \x08, \0) and missing backslashes (\frac).
 * 2. Normalizes LaTeX display \[...\] and inline \(...\) delimiters while protecting \left[ and \right].
 * 3. Splits text into math blocks ($$...$$ and $...$) and plain text blocks.
 * 4. Leaves math blocks 100% untouched to preserve formula integrity.
 * 5. In plain text blocks, auto-wraps unwrapped LaTeX environments (\begin{bmatrix}...\end{bmatrix})
 *    and standalone LaTeX symbols (\alpha, \beta, etc.).
 * 6. Merges contiguous math blocks separated only by logic symbols/connectives.
 */

export const preprocessMath = (text) => {
  if (!text || typeof text !== 'string') return '';

  let processed = text;

  // 1. Remove/normalize control characters and restore corrupted \frac / \beta
  processed = processed
    .replace(/\x0crac\b/g, '\\frac')
    .replace(/\x0crac\{/g, '\\frac{')
    .replace(/(?<![a-zA-Z\\])rac\{/g, '\\frac{')
    .replace(/\x0c/g, '')
    .replace(/\x08eta\b/g, '\\beta')
    .replace(/\x08/g, '')
    .replace(/\0/g, '');

  // 2. Normalize LaTeX bracket delimiters \[...\] and \(...\) while protecting \left[ and \right]
  processed = processed.replace(/(?<!\\left|\\right|[a-zA-Z])\\\[([\s\S]*?)\\\]/g, '\n$$\n$1\n$$\n');
  processed = processed.replace(/(?<!\\left|\\right|[a-zA-Z])\\\(([\s\S]*?)\\\)/g, ' $$1$ ');

  // 3. Fix nested dollar signs inside \boxed{...}
  processed = processed.replace(/\\boxed\{([^{}]*)\}/g, (match, content) => {
    return `\\boxed{${content.replace(/\$/g, '')}}`;
  });

  // 4. Split text into segments: math blocks (inside $ or $$) and plain text blocks.
  // Exactly as in AskMyNotes
  const tokens = processed.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);

  const processedTokens = tokens.map((token, index) => {
    if (index % 2 === 0) {
      // Out-of-math plain text block:
      let t = token;

      const symbolsToWrap = [
        'vee', 'wedge', 'neg', 'in', 'notin', 'forall', 'exists',
        'cup', 'cap', 'subset', 'subseteq', 'varnothing', 'emptyset',
        'to', 'gets', 'iff', 'implies', 'impliedby', 'oplus', 'otimes',
        'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta',
        'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
        'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
      ];

      symbolsToWrap.forEach(sym => {
        const regex = new RegExp(`\\\\${sym}\\b`, 'g');
        t = t.replace(regex, `$ \\\\${sym} $`);
      });

      // Auto-wrap unwrapped LaTeX math environments
      t = t.replace(/\\begin\{(bmatrix|matrix|pmatrix|array|align|equation|cases|split)\}([\s\S]*?)\\end\{\1\}/g, (match) => {
        let mathContent = match;
        mathContent = mathContent.replace(/\$\s*\\(\w+)\s*\$/g, '\\$1');
        return `\n$$\n${mathContent.trim()}\n$$\n`;
      });

      return t;
    } else {
      // Inside math block: return exactly as is so formula delimiters ($ and $$) are NEVER corrupted
      return token;
    }
  });

  let result = processedTokens.join('');

  // 5. Merge contiguous math blocks separated only by logic symbols/connectives
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
