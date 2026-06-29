// CMS disabled temporarily
import { cn } from '@repo/design-system/lib/utils';
import { getDictionary } from '@repo/internationalization';
import type { Blog, WithContext } from '@repo/seo/json-ld';
import { JsonLd } from '@repo/seo/json-ld';
import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import Link from 'next/link';

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
      <div className="w-full min-h-[calc(100vh-80px)] bg-zinc-950 text-white selection:bg-[#A7CE38]/30 py-20 lg:py-40">
        <div className="container mx-auto flex flex-col gap-14 px-4 relative z-10">
          <div className="flex w-full flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="max-w-xl font-regular text-4xl tracking-tighter md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
              {dictionary.web.blog.meta.title}
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8">
              <h3 className="text-2xl font-medium mb-2">Blog coming soon</h3>
              <p className="text-zinc-400">We’re working on it.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogIndex;
