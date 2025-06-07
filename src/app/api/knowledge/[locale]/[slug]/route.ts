import { NextRequest, NextResponse } from 'next/server';
import { isKnowledgeSupported } from '@/config/knowledge';
import { getMDXData } from '@/lib/mdx';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; slug: string }> }
) {
  try {
    const { locale, slug } = await params;
    
    // Check if locale is supported
    if (!isKnowledgeSupported(locale)) {
      return NextResponse.json({ error: 'Locale not supported' }, { status: 404 });
    }
    
    // URL decode the slug to handle Chinese characters properly
    const decodedSlug = decodeURIComponent(slug);
    
    // Get compiled MDX data
    const mdxData = await getMDXData(locale, decodedSlug);
    
    return NextResponse.json({ 
      content: mdxData.content,
      frontmatter: mdxData.frontmatter 
    });
  } catch (error) {
    console.error('Error reading MDX file:', error);
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }
} 