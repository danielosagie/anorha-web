import { env } from '@/env';
import Link from 'next/link';

type LandingPricingProps = {
  locale: string;
};

type PricingTier = {
  action: string;
  description: string;
  featureLabel: string;
  features: readonly string[];
  members: string;
  name: string;
  popular?: boolean;
  price: string;
};

const tiers: readonly PricingTier[] = [
  {
    action: 'Start free',
    description: 'For new sellers.',
    featureLabel: 'INCLUDED',
    features: [
      'AI usage included',
      'CSV import',
      'Cross-platform listings',
      'Inventory sync',
    ],
    members: '1 member',
    name: 'Starter',
    price: 'Free',
  },
  {
    action: 'Get Growth',
    description: 'For active sellers.',
    featureLabel: 'EVERYTHING IN STARTER, PLUS',
    features: [
      'AI usage included',
      'Team and partner tools',
      'Sales insights',
      'Sprout access',
    ],
    members: '2 members included',
    name: 'Growth',
    popular: true,
    price: '$20',
  },
  {
    action: 'Get Teams',
    description: 'For growing teams.',
    featureLabel: 'EVERYTHING IN GROWTH, PLUS',
    features: [
      '3x AI usage',
      'Roles and permissions',
      'Partner workflows',
      'Priority support',
    ],
    members: '5 members included',
    name: 'Teams',
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
        <h2 id="landing-pricing-title">Simple pricing.</h2>
        <p>Start free. Upgrade for more people or AI usage. Cancel anytime.</p>
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

            <strong className="landing-pricing-members">{tier.members}</strong>

            <Link className="landing-pricing-action" href={signUpUrl}>
              {tier.action}
            </Link>

            <div className="landing-pricing-features">
              <p>{tier.featureLabel}</p>
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
