import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import Link from 'next/link';

type LegalPageProperties = {
  readonly params: Promise<{
    slug: string;
  }>;
};

export const generateMetadata = async (): Promise<Metadata> => {
  return createMetadata({ title: 'Legal', description: 'Legal page coming soon' });
};

export const generateStaticParams = async (): Promise<{ slug: string }[]> => {
  const posts = ["privacy", "terms"]; //await legal.getPosts();

  return posts.map((slug) => ({ slug }));
};

const LegalPage = async ({ params }: LegalPageProperties) => {
  await params; // silence unused

  return (
    <div className="container max-w-5xl py-16">
      <Link
        className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm focus:underline focus:outline-none"
        href="/"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="scroll-m-20 text-balance font-extrabold text-4xl tracking-tight lg:text-5xl">
        Legal page coming soon
      </h1>
      <p className="text-balance leading-7 [&:not(:first-child)]:mt-6">
        CMS is disabled for now.
      </p>
    </div>
  );
};

export default LegalPage;
