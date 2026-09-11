import type { MDXComponents } from 'mdx/types';
import { FAQ, Question, Answer } from '@/components/mdx/KnowledgeComponents';
import JsonLd from '@/components/mdx/JsonLd';

export function useMDXComponents(): MDXComponents {
  return {
    FAQ,
    Question,
    Answer,
    JsonLd,
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
