import { Sidebar } from '@/components/sidebar';
import { env } from '@/env';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
// CMS disabled temporarily
import { JsonLd } from '@repo/seo/json-ld';
import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const protocol = env.VERCEL_PROJECT_PRODUCTION_URL?.startsWith('https')
  ? 'https'
  : 'http';
const url = new URL(`${protocol}://${env.VERCEL_PROJECT_PRODUCTION_URL}`);

type BlogPostProperties = {
  readonly params: Promise<{
    slug: string;
  }>;
};

export const generateMetadata = async (): Promise<Metadata> => {
  return createMetadata({
    title: 'Post coming soon',
    description: 'CMS is disabled for now.',
  });
};

// Static params disabled while CMS is off

const BlogPost = async ({ params }: BlogPostProperties) => {
  await params; // silence unused

  return (
    <>
      <JsonLd code={{ '@type': 'BlogPosting', '@context': 'https://schema.org' }} />
      <div className="container mx-auto py-16">
        <Link
          className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm focus:underline focus:outline-none"
          href="/blog"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Blog
        </Link>
        <div className="mt-16">
          <h1 className="scroll-m-20 text-balance font-extrabold text-4xl tracking-tight lg:text-5xl">
            Post coming soon
          </h1>
          <p className="text-balance leading-7 [&:not(:first-child)]:mt-6">
            CMS is disabled for now.
          </p>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
