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

function ProductPhoto({
  label,
  src,
  position = 'center',
}: {
  label: string;
  src: string;
  position?: string;
}) {
  return (
    <div className="product-photo">
      <Image
        alt="A photographed inventory item ready to list"
        fill
        sizes="150px"
        src={src}
        style={{ objectPosition: position }}
      />
      <span>{label}</span>
    </div>
  );
}

const bulkThumbs = [
  {
    position: '50% 40%',
    price: '$249',
    src: '/assets/landing/scan-item-sampler.jpg',
    title: 'EP-133 sampler',
  },
  {
    position: '50% 55%',
    price: '$180',
    src: '/assets/landing/scan-item-table.jpg',
    title: 'Marble bistro table',
  },
  {
    position: '50% 45%',
    price: '$320',
    src: '/assets/landing/scan-shelf.jpg',
    title: 'Parts lot (12)',
  },
];

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
            <ProductPhoto
              label="photo"
              position="50% 40%"
              src="/assets/landing/scan-item-sampler.jpg"
            />
            <Arrow />
            <div className="generated-listing">
              <strong>EP-133 K.O. II sampler</strong>
              <div className="price-row">
                <b>$249</b>
                <span>priced from comps</span>
              </div>
              <p className="generated-description">
                Portable sampler with original box, tested and ready to play.
              </p>
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
            <ProductPhoto
              label="photos"
              position="50% 45%"
              src="/assets/landing/scan-shelf.jpg"
            />
            <Arrow muted />
            <div className="bulk-cart">
              <div className="cart-heading">
                <strong>Cart</strong>
                <span>15 ready</span>
              </div>
              {bulkThumbs.map((thumb) => (
                <div className="cart-row" key={thumb.src}>
                  <Image
                    alt=""
                    height={26}
                    src={thumb.src}
                    style={{
                      objectFit: 'cover',
                      objectPosition: thumb.position,
                    }}
                    width={26}
                  />
                  <span className="cart-item-copy">
                    <strong>{thumb.title}</strong>
                    <b>{thumb.price}</b>
                  </span>
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
