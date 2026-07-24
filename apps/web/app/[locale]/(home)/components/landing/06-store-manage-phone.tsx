import Image from 'next/image';
import { IntegrationOrbit } from './integration-orbit';

// Inventory screen from the Paper redesign. Badges use square brand marks only
// — wordmarks (eBay) turn to mush at 13px.
const inventory = [
  {
    badges: ['shopify', 'square'],
    photo: '/assets/landing/scan-item-sampler.jpg',
    price: '$16.00',
    sku: 'SKU: 2134',
    title: 'MTG Max V6 Cordless Vacuum SV04 Motorhead & Original Set',
    units: '12 Units Left',
  },
  {
    badges: ['shopify', 'facebook'],
    photo: '/assets/landing/sprout-writes-prices-photo.jpg',
    price: '$25.99',
    sku: 'SKU: INV-LEWJ2PPI',
    title: 'Handmade Ceramic Coffee Mug, Green, Blue & Black Glazed Finish',
    units: '8 Units Left',
  },
  {
    badges: ['square'],
    photo: '/assets/landing/scan-item-table.jpg',
    price: '$53.00',
    sku: 'SKU: 458964',
    title: 'Used Electro-Harmonix Big Muff Distortion Effect Pedal',
    units: '3 Units Left',
  },
  {
    badges: ['shopify'],
    photo: '/assets/landing/scan-shelf.jpg',
    price: '$140.00',
    sku: 'SKU: DRAFT-69101e18',
    title: 'Apple AirPods Pro with Wireless Charging Case, White',
    units: '24 Units Left',
  },
] as const;

const filters = [
  { icon: null, label: 'All' },
  { icon: 'shopify', label: 'Shopify' },
  { icon: 'facebook', label: 'Facebook' },
] as const;

export function StoreManagePhone() {
  return (
    <section className="store-manage-section">
      <div className="store-manage-panel">
        {/* preserveAspectRatio="none" so the rings stretch with the panel and
            the orbiting chips stay glued to the drawn lines at any width. */}
        <svg
          aria-hidden="true"
          className="orbit-rings"
          preserveAspectRatio="none"
          viewBox="0 0 1240 640"
        >
          <circle cx="240" cy="620" fill="none" r="300" stroke="#E1E5CE" />
          <circle cx="240" cy="620" fill="none" r="440" stroke="#E6E9D6" />
          <circle cx="240" cy="620" fill="none" r="580" stroke="#ECEFE0" />
        </svg>

        <div aria-hidden="true" className="inventory-phone phone-shell">
          <div className="phone-status">
            <span>7:07</span>
            <i className="phone-island" />
            <span className="phone-signal">
              <i />
              <i />
              <i />
            </span>
          </div>

          <div className="inventory-head">
            <h3>Inventory</h3>
            <i className="inventory-sort" />
          </div>

          <div className="inventory-search">
            <span className="inventory-field">Search for a product</span>
            <i className="inventory-grid" />
            <i className="inventory-filter" />
          </div>

          <div className="inventory-chips">
            {filters.map((filter) => (
              <span
                className={`inventory-chip${filter.label === 'All' ? ' is-active' : ''}`}
                key={filter.label}
              >
                {filter.icon ? (
                  // biome-ignore lint/nursery/noImgElement: static brand SVG
                  <img alt="" src={`/assets/platforms/${filter.icon}.svg`} />
                ) : null}
                {filter.label}
              </span>
            ))}
          </div>

          <div className="inventory-list">
            {inventory.map((item) => (
              <div className="inventory-row" key={item.sku}>
                <span className="inventory-thumb">
                  <Image alt="" fill sizes="56px" src={item.photo} />
                </span>
                <span className="inventory-meta">
                  <strong>{item.title}</strong>
                  <span className="inventory-price">{item.price}</span>
                  <small>{item.sku}</small>
                  <span className="inventory-badges">
                    {item.badges.map((badge) => (
                      // biome-ignore lint/nursery/noImgElement: static brand SVG
                      <img
                        alt=""
                        key={badge}
                        src={`/assets/platforms/${badge}.svg`}
                      />
                    ))}
                  </span>
                </span>
                <span className="inventory-units">{item.units}</span>
              </div>
            ))}
          </div>
        </div>

        <IntegrationOrbit />

        <div className="store-manage-copy">
          <h2>Store and manage from one place</h2>
          <p>
            Your inventory lives in one place. Every listing pulses out to where
            you sell, and back.
          </p>
        </div>
      </div>
    </section>
  );
}
