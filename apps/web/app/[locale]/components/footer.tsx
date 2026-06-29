import { env } from '@/env';
import { Status } from '@repo/observability/status';
import Link from 'next/link';
import { Linkedin, Twitter } from 'lucide-react';
import Image from 'next/image';

export const Footer = () => {
  const navigationItems = [
    {
      title: 'Home',
      items: [
        { title: 'Pricing', href: '/pricing' },
      ],
    },
    {
      title: 'Pages',
      items: [
        { title: 'Blog', href: '/blog' },
        { title: 'Docs', href: env.NEXT_PUBLIC_DOCS_URL || '/docs' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { title: 'Privacy', href: '/legal/privacy' },
        { title: 'Terms', href: '/legal/terms' },
      ],
    },
  ];

  return (
    <section className="w-full pt-16 pb-12">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid gap-16 lg:grid-cols-[1.8fr_1fr_1fr_1fr] items-start">
          {/* Left Column: Brand & Status */}
          <div className="flex flex-col items-start gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Image 
                  src="/logo.png" 
                  alt="anorha" 
                  width={24} 
                  height={24} 
                  className="rounded-sm"
                />
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  anorha
                </h2>
              </div>
              <p className="text-muted-foreground text-sm">
                The wind behind your sales.
              </p>
            </div>

            {/* Uptime Badge
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/5 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Uptime 99.994%
              </span>
            </div>
            */}

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <Link
                href="https://linkedin.com"
                className="p-2 rounded-full bg-black text-white hover:bg-black/80 transition-colors"
                target="_blank"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} />
              </Link>
              <Link
                href="https://x.com"
                className="p-2 rounded-full bg-black text-white hover:bg-black/80 transition-colors"
                target="_blank"
                aria-label="X (Twitter)"
              >
                <Twitter size={16} />
              </Link>
            </div>

            <p className="text-muted-foreground text-xs mt-4">
              Made by inirha (© {new Date().getFullYear()})
            </p>
          </div>

          {/* Navigation Columns */}
          {navigationItems.map((column) => (
            <div key={column.title} className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {column.items.map((item) => (
                  <li key={item.title}>
                    <Link 
                      href={item.href} 
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
