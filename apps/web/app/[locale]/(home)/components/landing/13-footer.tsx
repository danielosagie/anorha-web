import Image from 'next/image';
import Link from 'next/link';
import { PaintReveal } from '../../../components/paint-reveal';

type LandingFooterProps = {
  locale: string;
};

const columns = [
  {
    items: [
      ['Features', '#product'],
      ['Sprout AI', '#sprout'],
      ['Pricing', 'pricing'],
    ],
    title: 'PRODUCT',
  },
  {
    items: [
      ['eBay', '#product'],
      ['Shopify', '#product'],
      ['Square & Clover', '#product'],
    ],
    title: 'PLATFORMS',
  },
  {
    items: [
      ['About', '#sprout'],
      ['Support', 'legal/support'],
      ['Privacy', 'legal/privacy'],
    ],
    title: 'COMPANY',
  },
] as const;

export function LandingFooter({ locale }: LandingFooterProps) {
  const home = `/${locale}`;

  return (
    <footer className="landing-footer">
      <div className="footer-main">
        <div className="footer-brand-column">
          <div className="footer-brand">
            <Image
              alt=""
              height={32}
              src="/assets/landing/footer-logo.png"
              width={32}
            />
            <strong>anorha</strong>
          </div>
          <p>The wind behind your sales</p>
          <div className="footer-socials">
            <a
              aria-label="Anorha on LinkedIn"
              href="https://linkedin.com"
              rel="noreferrer"
              target="_blank"
            >
              <svg aria-hidden="true" viewBox="0 0 18 18">
                <path
                  d="M3 6V15M3 3.5V3.6M7 15V9M7 11.2C7 8.7 14 7.6 14 11.3V15"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="sr-only">LinkedIn</span>
            </a>
            <a
              aria-label="Anorha on X"
              href="https://x.com"
              rel="noreferrer"
              target="_blank"
            >
              <svg aria-hidden="true" viewBox="0 0 18 18">
                <path
                  d="M3 3L15 15M14.5 3L3.5 15"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="sr-only">X</span>
            </a>
          </div>
        </div>
        <div className="footer-links">
          {columns.map((column) => (
            <div key={column.title}>
              <h3>{column.title}</h3>
              {column.items.map(([label, href]) =>
                href.startsWith('#') ? (
                  <Link href={`${home}${href}`} key={label}>
                    {label}
                  </Link>
                ) : (
                  <Link href={`/${locale}/${href}`} key={label}>
                    {label}
                  </Link>
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Inira · Made w/ &lt;3</span>
        <span>iOS · Android</span>
      </div>
      <div className="footer-meadow">
        <Image
          alt="A watercolor meadow of buttercups, cornflowers, poppies, grasses, bees, and dandelion seeds"
          fill
          sizes="100vw"
          src="/assets/landing/footer-wildflower-meadow.png"
        />
        <PaintReveal
          brushSize={150}
          color="#FFFFFF"
          preRevealedSpots={[
            [0.28, 0.55],
            [0.72, 0.32],
          ]}
        />
      </div>
    </footer>
  );
}
