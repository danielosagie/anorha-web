import { env } from '@/env';
import { Check, Minus, PhoneCall } from 'lucide-react';
import Link from 'next/link';

type PricingProps = {
  params: Promise<{ locale: string }>;
};

const tiers = [
  {
    action: 'Get Started',
    description: 'Perfect for casual sellers looking to save time on listings.',
    name: 'Starter',
    popular: false,
    price: '$0',
  },
  {
    action: 'Try Pro Free',
    description: 'Built for dedicated resellers managing multiple channels.',
    name: 'Pro',
    popular: true,
    price: '$49',
  },
  {
    action: 'Contact Sales',
    description: 'For warehouses and teams that need absolute automation.',
    name: 'Scale',
    popular: false,
    price: '$149',
  },
] as const;

const featureGroups = [
  {
    title: 'Core Features',
    rows: [
      ['Active Listings', 'Up to 100', 'Up to 2,500', 'Unlimited'],
      ['AI Listing Generations', '50 / mo', '1,000 / mo', 'Unlimited'],
      ['Market Pricing Data', false, true, true],
    ],
  },
  {
    title: 'Integrations & Sync',
    rows: [
      [
        'Channels (Shopify, eBay, Square)',
        '1 Channel',
        'All Channels',
        'All Channels',
      ],
      ['Real-Time Stock Sync', false, true, true],
    ],
  },
  {
    title: 'Team & Support',
    rows: [
      ['Team Members', '1 Seat', '3 Seats', 'Unlimited'],
      ['Priority Support', false, true, true],
    ],
  },
] as const;

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span>{value}</span>;
  }

  return value ? (
    <>
      <Check aria-hidden="true" size={18} />
      <span className="sr-only">Included</span>
    </>
  ) : (
    <>
      <Minus aria-hidden="true" size={18} />
      <span className="sr-only">Not included</span>
    </>
  );
}

const Pricing = async ({ params }: PricingProps) => {
  const { locale } = await params;

  return (
    <div className="marketing-page pricing-page">
      <section className="marketing-page-hero">
        <span className="marketing-hand-label">Clear, simple pricing</span>
        <h1>Scale your inventory without scaling your costs.</h1>
        <p>
          Whether you are just starting your reselling journey or managing a
          massive warehouse, we have a plan designed to give you hours of your
          life back.
        </p>
      </section>

      <section aria-labelledby="compare-plans" className="pricing-section">
        <div className="pricing-intro">
          <h2 id="compare-plans">Compare Plans</h2>
          <p>Find the perfect fit for your workflow.</p>
        </div>

        <div className="pricing-tiers">
          {tiers.map((tier) => (
            <article
              className={`pricing-tier${tier.popular ? ' is-popular' : ''}`}
              key={tier.name}
            >
              <div className="pricing-tier-name">
                <h3>{tier.name}</h3>
                {tier.popular ? <span>Popular</span> : null}
              </div>
              <p>{tier.description}</p>
              <div className="pricing-price">
                <strong>{tier.price}</strong>
                <span>/ month</span>
              </div>
              <Link
                className={`pricing-action${tier.popular ? ' is-primary' : ''}`}
                href={
                  tier.name === 'Scale'
                    ? `/${locale}/contact`
                    : env.NEXT_PUBLIC_APP_URL
                }
              >
                {tier.action}
                {tier.name === 'Scale' ? (
                  <PhoneCall aria-hidden="true" size={16} />
                ) : null}
              </Link>
            </article>
          ))}
        </div>

        <div className="pricing-compare-scroll">
          <div className="pricing-compare">
            <div className="pricing-compare-head">
              <span>Features</span>
              {tiers.map((tier) => (
                <strong key={tier.name}>{tier.name}</strong>
              ))}
            </div>
            {featureGroups.map((group) => (
              <div key={group.title}>
                <h3>{group.title}</h3>
                {group.rows.map(([label, ...values]) => (
                  <div className="pricing-feature-row" key={label}>
                    <span>{label}</span>
                    {values.map((value, index) => (
                      <div
                        className={index === 1 ? 'is-pro' : ''}
                        key={`${label}-${tiers[index]?.name}`}
                      >
                        <FeatureValue value={value} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
