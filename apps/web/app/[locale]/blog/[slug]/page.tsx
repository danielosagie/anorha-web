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
      <div className="w-full min-h-[calc(100vh-80px)] bg-zinc-950 text-white selection:bg-[#A7CE38]/30">
        <div className="container mx-auto max-w-4xl py-20 lg:py-32 px-4 relative z-10">
          <Link
            className="mb-8 inline-flex items-center gap-2 text-zinc-400 text-sm hover:text-white transition-colors focus:outline-none"
            href="/blog"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Blog
          </Link>
          <div className="mt-8">
            <h1 className="scroll-m-20 text-balance font-medium text-4xl tracking-tighter lg:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
              Post coming soon
            </h1>
            <p className="text-balance leading-7 text-zinc-400 [&:not(:first-child)]:mt-6">
              CMS is disabled for now.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
