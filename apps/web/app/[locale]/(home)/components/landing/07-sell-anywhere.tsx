import Image from 'next/image';

const listingCards = [
  { className: 'browser-card-one', position: '10% 50%' },
  { className: 'browser-card-two', position: '35% 50%' },
  { className: 'browser-card-three', position: '65% 50%' },
  { className: 'browser-card-four', position: '90% 50%' },
] as const;

export function SellAnywhere() {
  return (
    <section className="sell-anywhere-section">
      <div className="sell-anywhere-panel">
        <div className="sell-anywhere-copy">
          <h2>Sell anywhere you can&apos;t</h2>
          <p>
            Our desktop app fills in your listing on any marketplace, even ones
            without an official hookup
          </p>
        </div>
        <div className="browser-scene">
          <svg
            aria-hidden="true"
            className="browser-connector"
            viewBox="0 0 620 560"
          >
            <path
              d="M60 470 C 120 180, 480 120, 580 380"
              fill="none"
              stroke="#CBD3A8"
              strokeDasharray="2 10"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
          <div className="browser-window">
            <div className="browser-bar">
              <i />
              <i />
              <i />
            </div>
            <div className="browser-fields">
              <span />
              <span />
              <span className="field-highlight" />
              <span />
            </div>
          </div>
          {listingCards.map((card) => (
            <div
              className={`browser-listing-card ${card.className}`}
              key={card.className}
            >
              <Image
                alt="Inventory item listing"
                fill
                sizes="118px"
                src="/assets/listing_items.png"
                style={{ objectPosition: card.position }}
              />
              <i />
              <i />
            </div>
          ))}
          <span className="sticky-pill sticky-any-site">any site</span>
          <span className="sticky-pill sticky-auto-filled">auto-filled</span>
        </div>
      </div>
    </section>
  );
}
