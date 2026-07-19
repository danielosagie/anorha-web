import Image from 'next/image';
import { ConveyorShowcase } from './conveyor-showcase';

function Arrow({ muted = false }: { muted?: boolean }) {
  return (
    <svg aria-hidden="true" className="flow-arrow" viewBox="0 0 56 24">
      <path
        d="M2 12H50M50 12L40 4M50 12L40 20"
        fill="none"
        stroke={muted ? '#8B93AB' : '#9AA36B'}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function ProductPhoto({ label }: { label: string }) {
  return (
    <div className="product-photo">
      <Image
        alt="A photographed inventory item ready to list"
        fill
        sizes="150px"
        src="/assets/landing/sprout-writes-prices-photo.jpg"
      />
      <span>{label}</span>
    </div>
  );
}

export function SingleBulkCards() {
  return (
    <section className="single-bulk-section" id="product">
      <div className="section-heading centered-heading">
        <span className="landing-eyebrow">ANALYZE</span>
        <h2>One item, or a hundred.</h2>
      </div>
      <div className="single-bulk-grid">
        <article className="listing-flow-card listing-flow-single">
          <h3>Single</h3>
          <p>Snap one photo, get a full listing.</p>
          <div className="listing-flow">
            <ProductPhoto label="photo" />
            <Arrow />
            <div className="generated-listing">
              <strong>Nike Air Max 90</strong>
              <div className="price-row">
                <b>$74</b>
                <span>priced from comps</span>
              </div>
              <i className="skeleton-line skeleton-long" />
              <i className="skeleton-line skeleton-medium" />
              <div className="channel-pills">
                <span>eBay</span>
                <span>Shopify</span>
                <span>Depop</span>
              </div>
            </div>
          </div>
        </article>
        <article className="listing-flow-card listing-flow-bulk">
          <h3>Bulk</h3>
          <p>A whole pile, priced and listed in one pass.</p>
          <div className="listing-flow">
            <ProductPhoto label="photos" />
            <Arrow muted />
            <div className="bulk-cart">
              <div className="cart-heading">
                <strong>Cart</strong>
                <span>15 ready</span>
              </div>
              {['one', 'two', 'three'].map((item, index) => (
                <div className="cart-row" key={item}>
                  <Image
                    alt=""
                    height={26}
                    src="/assets/listing_items.png"
                    style={{ objectPosition: `${index * 35}% center` }}
                    width={26}
                  />
                  <i
                    className={`skeleton-line cart-line cart-line-${index + 1}`}
                  />
                </div>
              ))}
              <button type="button">List all</button>
            </div>
          </div>
        </article>
      </div>
      <ConveyorShowcase />
    </section>
  );
}
