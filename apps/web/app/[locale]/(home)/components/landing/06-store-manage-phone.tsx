import { IntegrationOrbit } from './integration-orbit';

const connections = [
  ['eBay', true],
  ['Shopify', true],
  ['FB Marketplace', true],
  ['Square', false],
  ['Depop', false],
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
        <div className="connections-phone phone-shell">
          <div className="phone-speaker" />
          <h3>Connections</h3>
          <div className="connection-list">
            {connections.map(([name, connected]) => (
              <div className={connected ? 'connected' : ''} key={name}>
                <span>{name}</span>
                <small>{connected ? 'Connected' : 'Connect'}</small>
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
