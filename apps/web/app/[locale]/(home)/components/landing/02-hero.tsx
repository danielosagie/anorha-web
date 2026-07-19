import Image from 'next/image';
import { Waitlist } from '../waitlist';
import { HeroIntro } from './hero-intro';

export function LandingHero() {
  return (
    <section className="landing-hero" id="download">
      <svg aria-hidden="true" className="hero-squiggle" viewBox="0 0 1180 300">
        <g className="hero-wind-wave hero-wind-wave-one">
          <path
            d="M-1160 150C-1020 60 -860 60 -710 130C-580 190 -420 200 -280 120C-180 64 -80 80 -20 150M20 150C160 60 320 60 470 130C600 190 760 200 900 120C1000 64 1100 80 1160 150M1200 150C1340 60 1500 60 1650 130C1780 190 1940 200 2080 120C2180 64 2280 80 2340 150"
            fill="none"
            stroke="#E7E3D2"
            strokeLinecap="round"
            strokeWidth="5"
          />
        </g>
        <g className="hero-wind-wave hero-wind-wave-two">
          <path
            d="M-1140 210C-980 130 -820 140 -660 200C-520 252 -360 250 -200 178M40 210C200 130 360 140 520 200C660 252 820 250 980 178M1220 210C1380 130 1540 140 1700 200C1840 252 2000 250 2160 178"
            fill="none"
            stroke="#EDEAD9"
            strokeLinecap="round"
            strokeWidth="5"
          />
        </g>
      </svg>
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
          sizes="(max-width: 768px) 112vw, 1110px"
          src="/assets/landing/hero-illustration.png"
          width={1694}
        />
      </div>
    </section>
  );
}
