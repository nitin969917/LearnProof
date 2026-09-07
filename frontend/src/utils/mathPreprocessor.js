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

const LATEX_COMMANDS = [
  'frac', 'to', 'text', 'lim', 'sum', 'int', 'cos', 'sin', 'tan', 'cot', 'sec', 'csc',
  'ln', 'log', 'exp', 'infty', 'cdot', 'cdots', 'vdots', 'ddots',
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta',
  'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi', 'rho', 'varrho', 'sigma', 'varsigma',
  'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega',
  'left', 'right', 'quad', 'qquad', 'sqrt', 'times', 'div', 'pm', 'mp',
  'le', 'ge', 'leq', 'geq', 'ne', 'neq', 'approx', 'sim', 'simeq', 'cong',
  'partial', 'nabla', 'subset', 'subseteq', 'supset', 'supseteq', 'in', 'notin', 'cap', 'cup',
  'forall', 'exists', 'neg', 'vee', 'wedge', 'boxed', 'begin', 'end', 'over',
  'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix', 'cases', 'align', 'aligned',
  'gather', 'gathered', 'equiv', 'parallel', 'perp', 'circ', 'bullet', 'star', 'ast',
  'prime', 'hat', 'bar', 'tilde', 'vec', 'dot', 'ddot'
].join('|');

const OVER_ESCAPED_REGEX = new RegExp(`\\\\{2,}(?=${LATEX_COMMANDS}\\b)`, 'g');

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

  // 2. Protect fenced code blocks (e.g. ```python ... ```)
  const codeBlocks = [];
  processed = processed.replace(/(```[\s\S]*?```)/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 3. Fix over-escaped backslashes before LaTeX commands (\\frac -> \frac, \\to -> \to, etc.)
  // Always use a replacer function to avoid JavaScript string replacement $ quirks
  processed = processed.replace(OVER_ESCAPED_REGEX, () => '\\');

  // 4. Normalize LaTeX bracket delimiters \[...\] and \(...\) while protecting \left[ and \right]
  processed = processed.replace(/(?<!\\left|\\right|[a-zA-Z])\\\[([\s\S]*?)\\\]/g, (match, content) => `\n\n$$\n${content.trim()}\n$$\n\n`);
  processed = processed.replace(/(?<!\\left|\\right|[a-zA-Z])\\\(([\s\S]*?)\\\)/g, (match, content) => ` $${content.trim()}$ `);

  // 5. Normalize 4-space indentation outside fenced code blocks so CommonMark doesn't treat derivations as code
  processed = processed.split('\n').map(line => {
    if (/^\s{4,}/.test(line)) {
      return line.replace(/^\s{4}/, '');
    }
    return line;
  }).join('\n');

  // 6. Fix nested dollar signs inside \boxed{...}
  processed = processed.replace(/\\boxed\{([^{}]*)\}/g, (match, content) => {
    return `\\boxed{${content.replace(/\$/g, '')}}`;
  });

  // 7. Ensure standalone single-line display math $$...$$ has surrounding blank lines for remark-math
  processed = processed.replace(/^[ \t]*\$\$\s*([^\n]+?)\s*\$\$[ \t]*$/gm, (match, content) => `\n\n$$\n${content.trim()}\n$$\n\n`);

  // 8. Split text into segments: math blocks (inside $ or $$) and plain text blocks
  // Strict non-greedy pattern ensures $$ is not accidentally parsed as an empty inline $
  const tokens = processed.split(/(\$\$[\s\S]*?\$\$|\$(?!\$)[^$\n]+?\$)/g);

  const processedTokens = tokens.map((token, index) => {
    if (index % 2 === 0) {
      // Out-of-math plain text block:
      let t = token;

      // Auto-wrap unwrapped \frac{...}{...} outside math delimiters
      t = t.replace(/(?<!\$)\\frac\{([^{}]+)\}\{([^{}]+)\}(?!\$)/g, (m, g1, g2) => `$ \\frac{${g1}}{${g2}} $`);

      // Auto-wrap unwrapped standalone Greek and math symbols
      const symbolsToWrap = [
        'vee', 'wedge', 'neg', 'in', 'notin', 'forall', 'exists',
        'cup', 'cap', 'subset', 'subseteq', 'varnothing', 'emptyset',
        'to', 'gets', 'iff', 'implies', 'impliedby', 'oplus', 'otimes',
        'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta',
        'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
        'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
      ];
      symbolsToWrap.forEach(sym => {
        const regex = new RegExp(`\\\\${sym}\\b(?![a-zA-Z0-9$])`, 'g');
        t = t.replace(regex, (match) => `$ ${match} $`);
      });

      // Auto-wrap unwrapped LaTeX math environments
      t = t.replace(/\\begin\{(bmatrix|matrix|pmatrix|array|align|equation|cases|split)\}([\s\S]*?)\\end\{\1\}/g, (match) => {
        let mathContent = match;
        mathContent = mathContent.replace(/\$\s*\\(\w+)\s*\$/g, '\\$1');
        return `\n\n$$\n${mathContent.trim()}\n$$\n\n`;
      });

      return t;
    } else {
      // Inside math block: preserve 100% of formula integrity
      return token;
    }
  });

  processed = processedTokens.join('');

  // 9. Restore code blocks
  codeBlocks.forEach((cb, i) => {
    processed = processed.replace(`__CODE_BLOCK_${i}__`, cb);
  });

  return processed.trim();
};

export default preprocessMath;
