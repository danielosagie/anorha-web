// CMS disabled temporarily
import { getDictionary } from '@repo/internationalization';
import type { Blog, WithContext } from '@repo/seo/json-ld';
import { JsonLd } from '@repo/seo/json-ld';
import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';

type BlogProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: BlogProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createMetadata(dictionary.web.blog.meta);
};

const BlogIndex = async ({ params }: BlogProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  const jsonLd: WithContext<Blog> = {
    '@type': 'Blog',
    '@context': 'https://schema.org',
  };

  return (
    <>
      <JsonLd code={jsonLd} />
      <div className="marketing-page blog-page">
        <div className="blog-shell">
          <span className="marketing-hand-label">Stories</span>
          <h1>{dictionary.web.blog.meta.title}</h1>
          <div className="blog-empty">
            <h2>Blog coming soon</h2>
            <p>We&apos;re working on it.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogIndex;
