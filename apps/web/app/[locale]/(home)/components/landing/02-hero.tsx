import Image from 'next/image';
import { Waitlist } from '../waitlist';
import { HeroIntro } from './hero-intro';
import { HeroWaves } from './hero-waves';

export function LandingHero() {
  return (
    <section className="landing-hero" id="download">
      <HeroWaves />
      <HeroIntro>
        <div className="hero-copy">
          <h1>
            <span data-hero-line>A platform to help you sell</span>
            <span data-hero-line>
              anything, everywhere, <em>fast.</em>
            </span>
          </h1>
          <p data-hero-line>
            One photo and a couple of notes becomes a polished listing, live
            everywhere you sell.
          </p>
          <div data-hero-line>
            <Waitlist className="landing-downloads" variant="landing" />
          </div>
        </div>
      </HeroIntro>
      <div className="hero-illustration-wrap">
        <Image
          alt="Two people packing and carrying boxes marked fragile"
          className="hero-illustration"
          height={820}
          priority
          sizes="(max-width: 560px) calc(100vw - 36px), (max-width: 820px) calc(100vw - 48px), 1110px"
          src="/assets/landing/hero-illustration.png"
          width={1694}
        />
      </div>
    </section>
  );
}
