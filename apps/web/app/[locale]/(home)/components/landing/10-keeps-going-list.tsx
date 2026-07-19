const items = [
  [
    'One inventory, every channel',
    'Change it once, it updates everywhere in seconds.',
  ],
  [
    'Bring your whole catalog',
    'Pull your catalog from eBay, Shopify, or Square in one pass.',
  ],
  ['Orders in one place', 'Every sale lands in one list, ready to ship.'],
  ['Drafts that never die', 'Every scan saved. Pick up where you left off.'],
  [
    "Know what's working",
    'A morning brief: what sold, what stalled, what to list.',
  ],
  ['Room for your people', 'Staff list and ship. Payouts stay yours.'],
] as const;

export function KeepsGoingList() {
  return (
    <section className="keeps-going-section">
      <div className="keeps-going-inner">
        <div className="keeps-going-copy">
          <span className="landing-eyebrow">EVERYTHING ELSE</span>
          <h2>And it keeps going.</h2>
          <p>The unglamorous parts of selling, handled in the background.</p>
        </div>
        <div className="keeps-going-list">
          {items.map(([title, description]) => (
            <article key={title}>
              <div>
                <h3>{title}</h3>
                <svg aria-hidden="true" viewBox="0 0 14 14">
                  <path
                    d="M7 2V12M2 7H12"
                    fill="none"
                    stroke="#9A998E"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
