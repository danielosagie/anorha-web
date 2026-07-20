const platforms = [
  { icon: '/assets/platforms/ebay.svg', name: 'eBay' },
  { icon: '/assets/platforms/shopify.svg', name: 'Shopify' },
  { icon: '/assets/platforms/square.svg', name: 'Square' },
  { icon: '/assets/platforms/clover.svg', name: 'Clover' },
  { icon: '/assets/platforms/facebook.svg', name: 'FB Marketplace' },
  { icon: '/assets/platforms/depop.svg', name: 'Depop' },
  { icon: '/assets/platforms/whatnot.svg', name: 'Whatnot' },
] as const;

function PlatformRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden} className="marquee-row">
      {platforms.map((platform) => (
        <span className="marquee-platform" key={platform.name}>
          {/* Local trusted brand SVGs; next/image blocks SVG by default. */}
          {/* biome-ignore lint/nursery/noImgElement: static brand SVG, no optimization needed */}
          <img alt="" className="marquee-icon" src={platform.icon} />
          {platform.name}
        </span>
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
