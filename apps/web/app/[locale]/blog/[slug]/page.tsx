import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { JsonLd } from '@repo/seo/json-ld';
import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import Link from 'next/link';

type BlogPostProperties = {
  readonly params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export const generateMetadata = async (): Promise<Metadata> =>
  createMetadata({
    description: 'CMS is disabled for now.',
    title: 'Post coming soon',
  });

const BlogPost = async ({ params }: BlogPostProperties) => {
  const { locale } = await params;

  return (
    <>
      <JsonLd
        code={{ '@context': 'https://schema.org', '@type': 'BlogPosting' }}
      />
      <div className="marketing-page article-page">
        <div className="article-shell">
          <Link className="marketing-back-link" href={`/${locale}/blog`}>
            <ArrowLeftIcon aria-hidden="true" />
            Back to Blog
          </Link>
          <h1>Post coming soon</h1>
          <p>CMS is disabled for now.</p>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
