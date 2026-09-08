import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { formatQuizMath } from '../../utils/mathPreprocessor';

/**
 * QuizMathText
 * Textbook-grade mathematical formula and text renderer for quizzes.
 * Renders LaTeX formulas, equations, and mathematical questions using KaTeX.
 */
const QuizMathText = React.memo(({ text, className = '' }) => {
  const formatted = useMemo(() => formatQuizMath(text), [text]);

  if (!text) return null;

  return (
    <span className={`quiz-math-text inline-block max-w-full overflow-x-auto align-middle custom-scrollbar-thin ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          p: ({ node, ...props }) => <span className="inline leading-relaxed break-words" {...props} />,
          div: ({ node, ...props }) => <span className="inline" {...props} />,
          span: ({ node, ...props }) => <span className="inline" {...props} />
        }}
      >
        {formatted}
      </ReactMarkdown>
    </span>
  );
});

export default QuizMathText;
