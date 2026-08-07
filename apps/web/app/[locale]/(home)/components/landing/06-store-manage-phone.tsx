import Image from 'next/image';
import { IntegrationOrbit } from './integration-orbit';

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

        {/* The real Inventory screen, captured off the simulator (test
            Shopify store data) — replaces the hand-built mock list. The shell
            keeps its own status row; the capture starts below the real one. */}
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

          <span className="inventory-shot">
            <Image
              alt=""
              fill
              sizes="300px"
              src="/assets/landing/inventory-screen.png"
            />
          </span>
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
