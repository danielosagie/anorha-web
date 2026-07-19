const platforms = [
  'eBay',
  'Shopify',
  'Square',
  'Clover',
  'FB Marketplace',
  'Depop',
  'Whatnot',
] as const;

function PlatformRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden} className="marquee-row">
      {platforms.map((platform) => (
        <span key={platform}>{platform}</span>
      ))}
    </div>
  );
}

export function PlatformMarquee() {
  return (
    <section
      aria-label="Connected sales platforms"
      className="platform-marquee"
    >
      <p>Lists to the places you already sell</p>
      <div className="marquee-window">
        <div className="marquee-track">
          <PlatformRow />
          <PlatformRow hidden />
        </div>
      </div>
    </section>
  );
}
