import type { MDXComponents } from 'mdx/types';
import { FAQ, Question, Answer } from '@/components/mdx/KnowledgeComponents';

export function useMDXComponents(): MDXComponents {
  return {
    FAQ,
    Question,
    Answer,
    a: ({ href, children, ...props }) => (
      <a
        href={href}
        {...(/^https?:/.test(href ?? '')
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
        {...props}
      >
        {children}
      </a>
    ),
  };
}
