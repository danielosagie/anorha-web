import './styles.css';
// CMS disabled temporarily
import { DesignSystemProvider } from '@repo/design-system';
import { fonts } from '@repo/design-system/lib/fonts';
import { cn } from '@repo/design-system/lib/utils';
import { Toolbar } from '@repo/feature-flags/components/toolbar';
import { getDictionary } from '@repo/internationalization';
import type { ReactNode } from 'react';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { PaintReveal } from './components/paint-reveal';
import type { Metadata } from 'next';

type RootLayoutProperties = {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
};

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json', // For PWA
  keywords: ['inventory management', 'multi-channel listing', 'shopify sync', 'cross-listing app'],
};

const RootLayout = async ({ children, params }: RootLayoutProperties) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);



  return (
    <html
      lang="en"
      className={cn(fonts, 'scroll-smooth')}
      suppressHydrationWarning
    >
       <body className="bg-[#FAF7EC">
        <DesignSystemProvider>
          {/* Main Content: This slides UP to reveal what's underneath */}
          <div className="relative z-20 min-h-fit h-hug bg-gradient-to-b from-white to-[#FAF7EC]">
            <Header dictionary={dictionary} />
            <main className="flex-grow">
              {children}
            </main>
          </div>
          
          {/* Sticky Reveal Zone: Pinned to bottom, revealed as z-20 slides up */}
          <div className="relative bg-[#FAF7EC] pb-0">
            <div className="sticky top-0 h-fit w-full flex flex-col z-10 overflow-hidden">
              
              {/* Part 1: Clickable Footer (Clean background) */}
              <div className="relative z-30 pt-20 pb-0 md:pt-0 md:pb-0 px-6 flex-shrink-0">
                <div className="container mx-auto">
                  <Footer />
                </div>
              </div>

              {/* Part 2: Interactive Playground (Flowers & Paint) */}
              <div className="relative w-full z-10 overflow-hidden">
                {/* The "Underneath" Layer: Flower Image drives the height (no forced 100vh) */}
                <div className="relative w-full overflow-hidden">
                  <img
                    src="/assets/FooterImage.png"
                    alt="Footer Background"
                    className="relative block w-full h-auto object-center hover:scale-105 transition-transform duration-[20s] ease-linear"
                  />

                  {/* The "Surface" Layer: Interactive Paint */}
                  <PaintReveal color="#FAF7EC" brushSize={150} preRevealedSpots={[[0.28, 0.55], [0.72, 0.32]]} />

                  {/* Centered wordmark 
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <span className="text-black text-9xl">anorha</span>
                  </div>
                  */}

                  {/* Soft pencil sketch hint of what's underneath - above paint so it's visible */}
                  <img
                    src="/assets/FooterImage.png"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-auto object-contain object-center opacity-[0.12] grayscale contrast-[2.2] pointer-events-none z-20"
                  />

                  
                </div>
              </div>

            </div>
          </div>
        </DesignSystemProvider>
        <Toolbar />
      </body>
    </html>
  );
};

export default RootLayout;
