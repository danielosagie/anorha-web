export function SellTogetherPartner() {
  return (
    <section className="together-section">
      <div className="together-grid">
        <article className="together-card sell-together-card">
          <div aria-hidden="true" className="team-avatars">
            <i />
            <i />
            <i />
          </div>
          <h2>Sell together.</h2>
          <p>Invite your team. One shelf, nothing listed twice.</p>
        </article>
        <article className="together-card partner-card">
          <div aria-hidden="true" className="partner-symbol">
            <i />
            <svg viewBox="0 0 28 20">
              <title>Decorative partner arrow</title>
              <path
                d="M2 10H26M26 10L18 3M26 10L18 17"
                fill="none"
                stroke="#5C6B1E"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
            </svg>
            <i />
          </div>
          <h2>Partner up.</h2>
          <p>Consign, split payouts, and share stock with stores you trust.</p>
        </article>
      </div>
    </section>
  );
}
