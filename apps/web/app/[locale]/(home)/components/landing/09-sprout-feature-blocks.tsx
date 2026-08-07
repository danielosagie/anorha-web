import Image from 'next/image';
import type { ReactNode } from 'react';
import { SproutScrollSync } from './sprout-scroll-sync';

/* ============================================================
   The phones show the REAL app, not a stylised idea of it.
   Every screen below is a rebuild of a shipped Anorha surface,
   with values taken from the app source, not from screenshots:
   src/design/sproutTheme.ts (hero green #6F9C26, chat wash,
   campaign chips), StreamingMessageBubble.tsx (the #F0F0F3 user
   bubble and the assistant reply that has no bubble at all) and
   SproutHomeScreen.tsx (the goal pill + 28 ticks).

   The app only has three surfaces — a green insight hero, a white
   chat, and a grey detail sheet — so beats 1 and 3 share the chat
   and beat 4 is the hero. Paper source: "Anorha (Updated)" →
   App shots → Real 01-04 / Stages.
   ============================================================ */

type StoryCopyProps = {
  description: string;
  index: number;
  title: string;
};

function StoryCopy({ description, index, title }: StoryCopyProps) {
  return (
    <article
      aria-hidden={index !== 0}
      className="sprout-feature-copy"
      data-copy-layer={index}
    >
      <span className="sprout-beat-number">0{index + 1}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function PhoneScreen({
  children,
  className = '',
  index,
  label,
}: {
  children: ReactNode;
  className?: string;
  index: number;
  label: string;
}) {
  return (
    <section
      aria-hidden={index !== 0}
      aria-label={label}
      className={`sprout-phone-screen ${className}`}
      data-phone-screen={index}
    >
      {children}
    </section>
  );
}

/**
 * The callouts that live *outside* the device. One layer per beat, cross-faded
 * off the stage's data-active exactly like the phone screens. Positioned
 * against .sprout-anchor (the phone's own box) so they hang off the device
 * edges no matter how wide the card gets.
 */
function Orbit({ children, index }: { children: ReactNode; index: number }) {
  return (
    <div aria-hidden="true" className="sprout-orbit" data-orbit={index}>
      {children}
    </div>
  );
}

/**
 * Sprout's brand mark, ported verbatim from the app's
 * src/components/brand/AnorhaFace.tsx. The path data is load-bearing — it
 * matches the mark everywhere else in the product. Do not redraw it.
 */
function AnorhaFace({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`sprout-mark ${className}`}
      fill="none"
      viewBox="0 0 23 19"
    >
      <g transform="translate(1,1)">
        <path
          d="M18.833 0H2.167C.97 0 0 .988 0 2.208v12.566c0 1.219.97 2.207 2.167 2.207h16.666c1.197 0 2.167-.988 2.167-2.207V2.208C21 .988 20.03 0 18.833 0Z"
          fill="#fff"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M12.833 6.453c.087-.338.484-1.301.935-1.766.287-.295.657-.271 1.162-.272.279.024.758.082 1.168.111.409.03.734.03 1.068.03"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        {/* Nose: thin bar with a rounded bottom — verbatim from the app's
            AnorhaFace path data. No stroke; a stroke fattens it. */}
        <path
          d="M9.75 4.991C9.75 4.991 9.75 4.491 9.75 4.491C9.75 4.491 11.25 4.491 11.25 4.491C11.25 4.491 11.25 4.991 11.25 4.991C11.25 4.991 10.5 4.991 10.5 4.991C10.5 4.991 9.75 4.991 9.75 4.991ZM11.25 8.991C11.25 9.267 10.914 9.491 10.5 9.491C10.086 9.491 9.75 9.267 9.75 8.991C9.75 8.991 10.5 8.991 10.5 8.991C10.5 8.991 11.25 8.991 11.25 8.991ZM11.25 4.991C11.25 4.991 10.5 4.991 10.5 4.991C10.5 4.991 9.75 4.991 9.75 4.991C9.75 4.991 9.75 8.991 9.75 8.991C9.75 8.991 10.5 8.991 10.5 8.991C10.5 8.991 11.25 8.991 11.25 8.991C11.25 8.991 11.25 4.991 11.25 4.991Z"
          fill="currentColor"
        />
        <path
          d="M7.833 6.453c-.086-.338-.484-1.301-.935-1.766-.286-.295-.657-.271-1.161-.272-.279.024-.759.082-1.169.111-.409.03-.734.03-1.068.03"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <path
          d="M5.833 11.887c1.333 1.189 3.025.34 4.667.34 1.5 0 3.166.679 4.666-.34"
          stroke="currentColor"
          strokeLinecap="square"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}

function Chevron() {
  return (
    <svg aria-hidden="true" className="sprout-chevron" fill="none" viewBox="0 0 24 24">
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.3"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg aria-hidden="true" className="sprout-followup-arrow" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 12h15m0 0l-5.5-5.5M19 12l-5.5 5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

/** The copy / speak / up / down bar that sits under a finished Sprout reply. */
function MessageActions() {
  return (
    <div aria-hidden="true" className="sprout-msg-actions">
      <svg fill="none" viewBox="0 0 24 24">
        <rect
          height="14"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.7"
          width="12"
          x="8.5"
          y="3.5"
        />
        <path
          d="M15.5 20.5h-9a3 3 0 0 1-3-3v-11"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </svg>
      <svg fill="none" viewBox="0 0 24 24">
        <path
          d="M4 9.5h3.5L12.5 5v14l-5-4.5H4z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <path
          d="M16.5 9.2a4 4 0 0 1 0 5.6M19.2 6.5a8 8 0 0 1 0 11"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </svg>
      <svg fill="none" viewBox="0 0 24 24">
        <path
          d="M7 21V10l4.5-7c1.4 0 2.2 1 2 2.4L12.8 9H19a2 2 0 0 1 2 2.4l-1.6 7.6a2.5 2.5 0 0 1-2.4 2H7z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <path d="M7 10H3v11h4" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
      <svg fill="none" viewBox="0 0 24 24">
        <path
          d="M17 3v11l-4.5 7c-1.4 0-2.2-1-2-2.4l.7-3.6H5a2 2 0 0 1-2-2.4l1.6-7.6A2.5 2.5 0 0 1 7 3h10z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <path d="M17 14h4V3h-4" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    </div>
  );
}

/** The app's floating glass header: a nav pill, a title pill, a round action. */
function GlassHeader({
  meta,
  title,
}: {
  meta: string;
  title: string;
}) {
  return (
    <header className="sprout-glass-header">
      <span className="sprout-glass-pill">
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <rect
            height="15"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
            width="17"
            x="3.5"
            y="4.5"
          />
          <path d="M10 4.5v15" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        Chat
      </span>
      <span className="sprout-glass-title">
        <strong>{title}</strong>
        <small>{meta}</small>
      </span>
      <span className="sprout-glass-round">
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.1"
          />
        </svg>
      </span>
    </header>
  );
}

/** The app's composer: + circle, placeholder pill, mic. */
function Composer({ placeholder }: { placeholder: string }) {
  return (
    <div aria-hidden="true" className="sprout-composer">
      <span className="sprout-composer-add">
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2.1" />
        </svg>
      </span>
      <span className="sprout-composer-field">
        {placeholder}
        <i className="sprout-composer-mic">
          <svg fill="none" viewBox="0 0 24 24">
            <rect fill="#fff" height="11" rx="3" width="6" x="9" y="3" />
            <path
              d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"
              stroke="#fff"
              strokeLinecap="round"
              strokeWidth="1.9"
            />
          </svg>
        </i>
      </span>
    </div>
  );
}

const storyBeats = [
  {
    title: 'Ask it anything',
    description:
      "It knows your whole shelf. Ask what's selling, what's stuck, what to restock.",
  },
  {
    title: 'Writes and prices it',
    description: 'One photo in. Title, tags, and a price from real sold comps.',
  },
  {
    title: 'Talks to buyers',
    description:
      'Negotiates in your voice, day or night. You approve the big calls.',
  },
  {
    title: 'Clears it while you sleep',
    description:
      'Time-boxed campaigns drop the price until it moves, and a brief tells you what happened.',
  },
] as const;

export function SproutFeatureBlocks() {
  return (
    <section aria-label="What Sprout can do" className="sprout-features">
      <div className="sprout-stage" data-active="0">
        <div className="sprout-scroll-heading">
          <AnorhaFace className="sprout-face-hero" />
          <h2>Sprout can do it!</h2>
        </div>

        {/* One card. It opens to full width on entry and holds that width for
            every beat; only its tint, the copy, the screen and the callouts
            change as you scroll. */}
        <div className="sprout-card">
          {storyBeats.map((beat, index) => (
            <span
              aria-hidden="true"
              className="sprout-card-tint"
              data-tint={index}
              key={beat.title}
            />
          ))}

          <div className="sprout-card-side">
            <div className="sprout-copy-track">
              {storyBeats.map((beat, index) => (
                <StoryCopy
                  description={beat.description}
                  index={index}
                  key={beat.title}
                  title={beat.title}
                />
              ))}
            </div>

            <div className="sprout-scroll-progress">
              {storyBeats.map((beat, index) => (
                <button
                  aria-label={beat.title}
                  aria-pressed={index === 0}
                  className={index === 0 ? 'is-active' : undefined}
                  data-progress-dot={index}
                  key={beat.title}
                  type="button"
                >
                  <i />
                </button>
              ))}
            </div>
          </div>

          {/* Two callouts per beat, and the pair swaps sides every beat so the
              scroll never repeats a layout. */}
          <Orbit index={0}>
            <span className="sprout-cue sprout-cue-left-mid">
              <AnorhaFace />
              Sprout is reading your shelf
            </span>
            <span className="sprout-note sprout-note-right-high">
              <small>Total sales for June</small>
              <strong>$2,491</strong>
              <span className="sprout-note-foot">14/35 sneakers left</span>
            </span>
          </Orbit>

          <Orbit index={1}>
            <span className="sprout-note sprout-note-right-mid is-channels">
              <small>Ready for</small>
              {/* Local trusted brand SVGs; next/image blocks SVG by default. */}
              <span className="sprout-note-logos">
                {/* biome-ignore lint/nursery/noImgElement: static brand SVG, no optimization needed */}
                <img alt="eBay" height={14} src="/assets/platforms/ebay.svg" width={40} />
                {/* biome-ignore lint/nursery/noImgElement: static brand SVG, no optimization needed */}
                <img alt="Shopify" height={22} src="/assets/platforms/shopify.svg" width={22} />
                {/* biome-ignore lint/nursery/noImgElement: static brand SVG, no optimization needed */}
                <img alt="Depop" height={22} src="/assets/platforms/depop.svg" width={22} />
              </span>
            </span>
          </Orbit>

          <Orbit index={2}>
            <span className="sprout-cue sprout-cue-left-high">
              <AnorhaFace />
              Answered while you slept
            </span>
            <span className="sprout-note sprout-note-right-low">
              <small>Your floor</small>
              <strong>$65</strong>
              <span className="sprout-note-foot">never goes under</span>
            </span>
          </Orbit>

          <Orbit index={3}>
            <span className="sprout-cue sprout-cue-right-mid">
              <AnorhaFace />
              Dropped 12 items 3% overnight
            </span>
            <span className="sprout-note sprout-note-left-low">
              <small>Overnight report</small>
              <strong>$240</strong>
              <span className="sprout-note-foot">3 sold yesterday night</span>
            </span>
          </Orbit>

          <div className="sprout-anchor">
            <div
              aria-label="Interactive Anorha app preview"
              className="sprout-live-phone"
              data-phone
            >
              <div className="sprout-phone-viewport">
                {/* ---- 01 Ask Sprout: the real chat surface. The assistant
                        reply deliberately has no bubble — that is how the app
                        renders it. ---- */}
                <PhoneScreen
                  className="sprout-screen-chat is-active"
                  index={0}
                  label="Ask Sprout"
                >
                  <GlassHeader meta="18/60 sold &middot; 3d left" title="Sneaker vault" />

                  <div className="sprout-feed">
                    <div className="sprout-user-bubble sprout-sequence-one">
                      What sold best this month?
                    </div>

                    <div className="sprout-tool-line sprout-sequence-two">
                      Checked your sold history
                      <Chevron />
                    </div>

                    {/* The reply stops where the result card takes over — it
                        used to repeat "two pairs are stale" in prose. */}
                    <p className="sprout-reply sprout-sequence-three">
                      Sneakers. <b>9 of your 14 sales</b> this month, at a{' '}
                      <b>$72 average.</b>
                    </p>

                    <div className="sprout-result-card sprout-sequence-four">
                      <span className="sprout-result-thumb">
                        <Image
                          alt=""
                          fill
                          sizes="44px"
                          src="/assets/landing/sprout-item-airmax.jpg"
                        />
                      </span>
                      <span className="sprout-result-text">
                        <strong>2 pairs going stale</strong>
                        <small>tap to reprice</small>
                      </span>
                      <Chevron />
                    </div>

                    <div className="sprout-sequence-five">
                      <MessageActions />
                      <div className="sprout-followup">
                        <ArrowRight />
                        Which should move first?
                      </div>
                    </div>
                  </div>

                  <footer className="sprout-phone-footer">
                    <div className="sprout-disclaimer">
                      <AnorhaFace />
                      <span>Sprout can make mistakes.</span>
                    </div>
                    <Composer placeholder="Ask Sprout" />
                  </footer>
                </PhoneScreen>

                {/* ---- 02 Edit details: the real listing editor. ---- */}
                <PhoneScreen
                  className="sprout-screen-listing"
                  index={1}
                  label="Edit listing details"
                >
                  <div className="sprout-glass-header is-detail">
                    <span className="sprout-glass-round">
                      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M15 5l-7 7 7 7"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.2"
                        />
                      </svg>
                    </span>
                    <span className="sprout-glass-title is-single">
                      <strong>Edit details</strong>
                    </span>
                    <span className="sprout-glass-round">
                      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                        <circle cx="5.5" cy="12" fill="currentColor" r="1.7" />
                        <circle cx="12" cy="12" fill="currentColor" r="1.7" />
                        <circle cx="18.5" cy="12" fill="currentColor" r="1.7" />
                      </svg>
                    </span>
                  </div>

                  <div className="sprout-sheet sprout-sequence-one">
                    <span className="sprout-hero-photo">
                      <Image
                        alt="An Off-White Nike Air Max 97 in its box"
                        fill
                        sizes="238px"
                        src="/assets/landing/sprout-item-airmax.jpg"
                      />
                      <b className="sprout-scan-line" />
                    </span>
                    <span className="sprout-wrote sprout-sequence-two">
                      <AnorhaFace />
                      Sprout wrote this
                    </span>
                    <strong className="sprout-hero-title sprout-sequence-two">
                      Nike Air Max 97 Off-White, size 11M, great condition
                    </strong>
                    {/* A price never travels alone — it carries its receipt. */}
                    <span className="sprout-price-row sprout-sequence-three">
                      <b>$342.00</b>
                      <small>12 sold comps &middot; ~6 days</small>
                    </span>
                    <span className="sprout-tags sprout-sequence-four">
                      <i>nike</i>
                      <i>air max 97</i>
                      <i>off-white</i>
                    </span>
                  </div>

                  <div className="sprout-sheet sprout-rows sprout-sequence-four">
                    <small className="sprout-rows-label">Details</small>
                    <span className="sprout-row">
                      <b>Category</b>
                      <i>Sneakers</i>
                      <Chevron />
                    </span>
                    <span className="sprout-row">
                      <b>Condition</b>
                      <i>Great</i>
                      <Chevron />
                    </span>
                  </div>

                  <div className="sprout-sheet sprout-channels sprout-sequence-five">
                    <small className="sprout-rows-label">Ready for</small>
                    <span className="sprout-channel-row">
                      <i className="sprout-channel-logo">
                        {/* biome-ignore lint/nursery/noImgElement: static brand SVG, no optimization needed */}
                        <img alt="" height={7} src="/assets/platforms/ebay.svg" width={19} />
                      </i>
                      <span className="sprout-channel-text">
                        <strong>eBay</strong>
                        <small>Not listed</small>
                      </span>
                      <b className="sprout-publish">Publish</b>
                    </span>
                  </div>
                </PhoneScreen>

                {/* ---- 03 Marketplace chat. Anorha's own chat surface showing a
                        connected channel — the eBay mark is the channel marker,
                        not a copy of eBay's UI. ---- */}
                <PhoneScreen
                  className="sprout-screen-buyers"
                  index={2}
                  label="A buyer conversation"
                >
                  <div className="sprout-glass-header is-buyer">
                    <span className="sprout-glass-round">
                      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M15 5l-7 7 7 7"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.2"
                        />
                      </svg>
                    </span>
                    <span className="sprout-buyer-pill">
                      <i className="sprout-buyer-avatar">J</i>
                      <span className="sprout-glass-title">
                        <strong>Jordan M.</strong>
                        <small>Air Max 97</small>
                      </span>
                      {/* biome-ignore lint/nursery/noImgElement: static brand SVG, no optimization needed */}
                      <img
                        alt="eBay"
                        className="sprout-buyer-channel"
                        height={14}
                        src="/assets/platforms/ebay.svg"
                        width={40}
                      />
                    </span>
                  </div>

                  <div className="sprout-feed">
                    <div className="sprout-user-bubble is-incoming sprout-sequence-one">
                      Would you take $60?
                    </div>

                    <div className="sprout-authored sprout-sequence-two">
                      <AnorhaFace />
                      Sprout replied &middot; 11:42 pm
                    </div>
                    <div className="sprout-agent-bubble sprout-sequence-two">
                      Can do $68, and I&rsquo;ll hold it for you until 6 pm tomorrow.
                    </div>

                    <div className="sprout-user-bubble is-incoming sprout-sequence-three">
                      Deal.
                    </div>

                    <div className="sprout-result-card is-deal sprout-sequence-four">
                      <span className="sprout-result-thumb">
                        <Image
                          alt=""
                          fill
                          sizes="38px"
                          src="/assets/landing/sprout-item-airmax.jpg"
                        />
                      </span>
                      <span className="sprout-result-text">
                        <small className="sprout-deal-kicker">Deal closed</small>
                        <strong>$68 &middot; pickup tomorrow</strong>
                      </span>
                    </div>
                  </div>

                  <footer className="sprout-phone-footer sprout-sequence-five">
                    <div className="sprout-takeover">
                      <span className="sprout-takeover-status">
                        <i />
                        Sprout replying
                      </span>
                      <span className="sprout-takeover-btn">Take over</span>
                    </div>
                  </footer>
                </PhoneScreen>

                {/* ---- 04 Sprout home. One screen doing two jobs: the recap in
                        the green hero, the clearing campaigns underneath. ---- */}
                <PhoneScreen
                  className="sprout-screen-home"
                  index={3}
                  label="Your morning brief"
                >
                  <div className="sprout-hero">
                    <div className="sprout-hero-top sprout-sequence-one">
                      <span className="sprout-greeting">
                        Good morning, Daniel
                        <AnorhaFace />
                      </span>
                      <span className="sprout-new-pill">
                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeWidth="2.4"
                          />
                        </svg>
                        New
                      </span>
                    </div>

                    <p className="sprout-recap sprout-sequence-two">
                      While you slept: <b>3 sold,</b> <b>$240 banked,</b> 1 buyer waiting.
                    </p>

                    <div className="sprout-report-card sprout-sequence-three">
                      <i className="sprout-report-icon">
                        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                          <path d="M6 3h7l5 5v13H6z" fill="#fff" />
                          <path d="M13 3v5h5" fill="#e4e9da" />
                        </svg>
                      </i>
                      <strong>Overnight report</strong>
                      <b>View</b>
                    </div>

                    <div className="sprout-hero-actions sprout-sequence-four">
                      <MessageActions />
                      <span>New look in 9h</span>
                    </div>

                    <div className="sprout-hero-followup sprout-sequence-four">
                      <ArrowRight />
                      Counter at 92%?
                    </div>
                  </div>

                  <div className="sprout-chips sprout-sequence-five">
                    <b className="is-on">All</b>
                    <b>Running</b>
                    <b>Done</b>
                  </div>

                  {/* The campaign card, straight from the Dashboard mockup
                      ("home blurb"): days chip + sold count, percent on the
                      right, ringed two-tone goal pill, full-height ticks, then
                      the latest action under a dashed rule. */}
                  <div className="sprout-campaign-card sprout-sequence-five">
                    <div className="sprout-campaign-head">
                      <span className="sprout-campaign-thumb">
                        <Image
                          alt=""
                          fill
                          sizes="42px"
                          src="/assets/landing/sprout-item-boots.jpg"
                        />
                      </span>
                      <span className="sprout-campaign-text">
                        <strong>Winter drop</strong>
                        <span className="sprout-campaign-meta">
                          <b>3d Left</b>
                          <small>- 9/43 sold</small>
                        </span>
                      </span>
                      <span className="sprout-campaign-pct">67%/100%</span>
                    </div>
                    <div className="sprout-goal-row">
                      <span className="sprout-goal-fill">
                        <b>$500</b>
                        <i>/$750 goal</i>
                      </span>
                      <span className="sprout-ticks">
                        {Array.from({ length: 11 }, (_, tick) => (
                          <i key={tick} />
                        ))}
                      </span>
                    </div>
                  </div>

                  <div className="sprout-campaign-card sprout-sequence-five">
                    <div className="sprout-campaign-head">
                      <span className="sprout-campaign-thumb">
                        <Image
                          alt=""
                          fill
                          sizes="42px"
                          src="/assets/landing/sprout-item-airmax.jpg"
                        />
                      </span>
                      <span className="sprout-campaign-text">
                        <strong>Sneaker vault</strong>
                        <span className="sprout-campaign-meta">
                          <b>12d Left</b>
                          <small>- 18/60 sold</small>
                        </span>
                      </span>
                      <b className="sprout-status-pill is-offers">2 offers</b>
                    </div>
                  </div>
                </PhoneScreen>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SproutScrollSync />
    </section>
  );
}
