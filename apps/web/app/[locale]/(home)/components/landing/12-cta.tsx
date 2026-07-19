import { Waitlist } from '../waitlist';

export function LandingCta() {
  return (
    <section className="landing-cta">
      <svg
        aria-hidden="true"
        className="cta-background-stroke"
        viewBox="0 0 900 200"
      >
        <path
          d="M20 120C160 40 300 40 440 100C560 150 700 150 880 70"
          fill="none"
          stroke="#D6E2A0"
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
      <h2>
        <span>Ready to clear the</span>
        <em>
          shelf?
          <svg aria-hidden="true" viewBox="0 0 150 16">
            <path
              d="M4 9C40 4 90 4 146 7"
              fill="none"
              stroke="#A7C13A"
              strokeLinecap="round"
              strokeWidth="4"
            />
          </svg>
        </em>
      </h2>
      <p>Try Anorha w/ your needs, it&apos;s free to get started.</p>
      <Waitlist className="landing-downloads" variant="landing" />
    </section>
  );
}
