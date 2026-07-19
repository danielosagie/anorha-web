import { getDictionary } from '@repo/internationalization';
import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import { LandingHero } from './components/landing/02-hero';
import { PlatformMarquee } from './components/landing/03-marquee';
import { ProblemScatterPills } from './components/landing/04-problem-scatter-pills';
import { SingleBulkCards } from './components/landing/05-single-bulk-cards';
import { StoreManagePhone } from './components/landing/06-store-manage-phone';
import { SellAnywhere } from './components/landing/07-sell-anywhere';
import { SproutIntro } from './components/landing/08-sprout-intro';
import { SproutFeatureBlocks } from './components/landing/09-sprout-feature-blocks';
import { KeepsGoingList } from './components/landing/10-keeps-going-list';
import { SellTogetherPartner } from './components/landing/11-sell-together-partner';
import { LandingCta } from './components/landing/12-cta';
import { LandingPricing } from './components/landing/12a-pricing';
import { SectionReveal } from './components/landing/section-reveal';

type HomeProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: HomeProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const metadata = createMetadata(dictionary.web.home.meta);

  return {
    ...metadata,
    alternates: {
      canonical: 'https://anorha.com',
    },
    keywords: [
      'inventory sync software',
      'multi-channel listing app',
      'cross-platform selling',
      'reseller inventory management',
      'consignment inventory management',
    ],
  };
};

const Home = async ({ params }: HomeProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    applicationCategory: 'BusinessApplication',
    description: dictionary.web.home.meta.description,
    name: 'Anorha',
    operatingSystem: 'iOS, Android, Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <div className="anorha-landing">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is serialized and contains no user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <LandingHero />
      <PlatformMarquee />
      <SectionReveal className="landing-section-shell">
        <ProblemScatterPills />
      </SectionReveal>
      <SectionReveal className="landing-section-shell">
        <SingleBulkCards />
      </SectionReveal>
      <SectionReveal className="landing-section-shell">
        <StoreManagePhone />
      </SectionReveal>
      <SectionReveal className="landing-section-shell">
        <SellAnywhere />
      </SectionReveal>
      <SectionReveal className="landing-section-shell">
        <SproutIntro />
      </SectionReveal>
      <SectionReveal className="landing-section-shell">
        <SproutFeatureBlocks />
      </SectionReveal>
      <SectionReveal className="landing-section-shell">
        <KeepsGoingList />
      </SectionReveal>
      <SectionReveal className="landing-section-shell">
        <SellTogetherPartner />
      </SectionReveal>
      <SectionReveal className="landing-section-shell">
        <LandingPricing locale={locale} />
      </SectionReveal>
      <SectionReveal className="landing-section-shell">
        <LandingCta />
      </SectionReveal>
    </div>
  );
};

export default Home;
