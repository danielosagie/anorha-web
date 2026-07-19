const connections = [
  ['eBay', true],
  ['Shopify', true],
  ['FB Marketplace', true],
  ['Square', false],
  ['Depop', false],
] as const;

const platforms = [
  { className: 'orbit-ebay', label: 'eBay' },
  { className: 'orbit-shop', label: 'shop' },
  { className: 'orbit-fb', label: 'fb' },
  { className: 'orbit-square', label: '' },
  { className: 'orbit-clover', label: 'clover' },
  { className: 'orbit-depop', label: 'depop' },
  { className: 'orbit-whatnot', label: 'whatnot' },
] as const;

export function StoreManagePhone() {
  return (
    <section className="store-manage-section">
      <div className="store-manage-panel">
        <svg aria-hidden="true" className="orbit-rings" viewBox="0 0 1240 640">
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
        <div aria-hidden="true" className="orbit-platforms">
          {platforms.map((platform, index) => (
            <div
              className={`orbit-tile ${platform.className}`}
              key={platform.className}
              style={{ animationDelay: `${index * -0.65}s` }}
            >
              {platform.label || <span className="square-glyph" />}
            </div>
          ))}
        </div>
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
