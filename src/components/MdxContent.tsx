import { readFile } from 'fs/promises';
import { join } from 'path';
import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import { FAQ, Question, Answer } from '@/components/mdx/KnowledgeComponents';
import JsonLd from '@/components/mdx/JsonLd';

// Custom link component for external links
function CustomLink({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  // Check if it's an external link
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
  
  if (isExternal) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-red-400 hover:text-red-600 underline"
        {...props}
      >
        {children}
      </a>
    );
  }
  
  // For internal links, use default behavior
  return <a href={href} {...props}>{children}</a>;
}

// MDX components that will be available in all MDX files
const mdxComponents = {
  FAQ,
  Question,
  Answer,
  JsonLd,
  a: CustomLink,
};

interface MdxContentProps {
  locale: string;
  slug: string;
}

export default async function MdxContent({ locale, slug }: MdxContentProps) {
  try {
    // Construct the file path
    const filePath = join(process.cwd(), 'src', 'data', 'knowledge', locale, `${slug}.mdx`);
    
    // Read the MDX file
    const source = await readFile(filePath, 'utf8');
    
    // Compile MDX
    const compiled = await compile(source, {
      outputFormat: 'function-body',
      remarkPlugins: [remarkGfm],
      development: process.env.NODE_ENV === 'development',
    });
    
    // Run the compiled MDX
    const { default: Content } = await run(compiled, {
      ...runtime,
      baseUrl: import.meta.url,
    });
    
    // Render with components
    return <Content components={mdxComponents} />;
  } catch (error) {
    console.error('Error rendering MDX:', error);
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 mb-4">Failed to load article content</p>
        <p className="text-gray-600 text-sm">The article content could not be rendered.</p>
      </div>
    );
  }
}

export async function checkMdxFileExists(locale: string, slug: string): Promise<boolean> {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'knowledge', locale, `${slug}.mdx`);
    await readFile(filePath, 'utf8');
    return true;
  } catch {
    return false;
  }
}