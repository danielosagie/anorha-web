import { env } from '@/env';
import Link from 'next/link';

type LandingPricingProps = {
  locale: string;
};

type PricingTier = {
  action: string;
  description: string;
  features: readonly string[];
  name: string;
  popular?: boolean;
  price: string;
};

const tiers: readonly PricingTier[] = [
  {
    action: 'Start free',
    description: 'For solo resellers just getting going.',
    features: [
      'Unlimited photo-to-listings',
      'Up to 2 members/partners',
      'Cross-platform inventory sync',
      'Sprout assistant, drafts & prices',
      '100 bulk recognitions / month',
    ],
    name: 'Hobby',
    price: 'Free',
  },
  {
    action: 'Get Individual',
    description: 'For steady solo sellers.',
    features: [
      '5x photo-to-listings',
      'Up to 2 members/partners',
      'Cross-platform inventory sync',
      'Sprout assistant, drafts & prices',
      '100 bulk recognitions / month',
    ],
    name: 'Individual',
    price: '$20',
  },
  {
    action: 'Get Pro',
    description: 'For power sellers & growing teams.',
    features: [
      'Unlimited marketplaces',
      'Cross-org sync: teams & partners',
      '15x photo-to-listings usage',
      'Full Sprout automation & campaigns',
      'Team seats + priority support',
    ],
    name: 'Pro',
    popular: true,
    price: '$60',
  },
];

function PricingCheck({ emphasized = false }: { emphasized?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={emphasized ? 'is-emphasized' : undefined}
      fill="none"
      viewBox="0 0 18 18"
    >
      <path
        d="m3.5 9.4 3.2 3.1 7.8-7.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingPricing({ locale }: LandingPricingProps) {
  const signUpUrl = `${env.NEXT_PUBLIC_APP_URL}/sign-up`;

  return (
    <section
      aria-labelledby="landing-pricing-title"
      className="landing-pricing"
      id="pricing"
    >
      <div className="landing-pricing-heading">
        <span>PRICING</span>
        <h2 id="landing-pricing-title">One price. Everything you sell.</h2>
        <p>
          Start free while we&apos;re in beta. Pick a plan when you&apos;re
          ready. Cancel anytime.
        </p>
      </div>

      <div className="landing-pricing-cards">
        {tiers.map((tier) => (
          <article
            className={`landing-pricing-card${tier.popular ? ' is-popular' : ''}`}
            key={tier.name}
          >
            <div className="landing-pricing-card-header">
              <div>
                <h3>{tier.name}</h3>
                <p>{tier.description}</p>
              </div>
              {tier.popular ? (
                <span className="landing-pricing-popular">MOST POPULAR</span>
              ) : null}
            </div>

            <div className="landing-pricing-price">
              <strong>{tier.price}</strong>
              {tier.price.startsWith('$') ? <span>/ month</span> : null}
            </div>

            <Link className="landing-pricing-action" href={signUpUrl}>
              {tier.action}
            </Link>

            <div className="landing-pricing-features">
              {tier.popular ? <p>EVERYTHING IN STARTER, PLUS</p> : null}
              <ul>
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <PricingCheck emphasized={tier.popular} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <Link className="landing-pricing-comparison" href={`/${locale}/pricing`}>
        Full comparison
      </Link>
    </section>
  );
}
