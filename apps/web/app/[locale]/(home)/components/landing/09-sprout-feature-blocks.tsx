import Image from 'next/image';
import type { ReactNode } from 'react';
import { SproutScrollSync } from './sprout-scroll-sync';

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

function PhoneStatus() {
  return (
    <div aria-hidden="true" className="feature-phone-status">
      <span>9:12</span>
      <i className="phone-speaker" />
      <span className="feature-phone-signal">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

function ChatHeader({ name, time }: { name: string; time: string }) {
  return (
    <div className="chat-header">
      <span className="chat-avatar" />
      <strong>{name}</strong>
      <small>{time}</small>
    </div>
  );
}

function ArrowDown() {
  return (
    <svg
      aria-hidden="true"
      className="sprout-cue-icon"
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d="M6 1.5v9m0 0L2.4 6.9M6 10.5l3.6-3.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      aria-hidden="true"
      className="sprout-note-arrow"
      fill="none"
      viewBox="0 0 14 10"
    >
      <path
        d="M1 5h11m0 0L8.6 1.6M12 5 8.6 8.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function Sparkline() {
  return (
    <svg
      aria-hidden="true"
      className="sprout-spark"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 120 34"
    >
      <path
        d="M1 27c9-2 13 3 21-4s12 6 20-1 12 2 20-7 13 3 21-6 12 1 16-1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

const storyBeats = [
  {
    title: 'Ask it anything',
    description:
      "It knows your whole shelf. Ask what's selling, what's stuck, or what to restock.",
  },
  {
    title: 'Clears difficult inventory',
    description:
      'Time-boxed campaigns drop the price until it moves. No babysitting.',
  },
  {
    title: 'Writes and prices it',
    description:
      'One photo in. Title, tags, description, and a price from real sold comps.',
  },
  {
    title: 'Talks to buyers',
    description:
      'Negotiates in your voice, day or night. You approve the big calls.',
  },
  {
    title: 'Keeps you posted',
    description:
      'A morning brief, and a nudge when something needs you. No dashboard digging.',
  },
] as const;

export function SproutFeatureBlocks() {
  return (
    <section aria-label="What Sprout can do" className="sprout-features">
      <div className="sprout-stage" data-active="0">
        <div className="sprout-scroll-heading">
          <span className="sprout-scroll-mark">
            <Image alt="" height={36} src="/logo.png" width={36} />
          </span>
          <h2>Anorha solves that!</h2>
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

          <Orbit index={0}>
            <span className="sprout-cue sprout-cue-left">
              <i className="sprout-cue-dot" />
              Sprout is replying
            </span>
            <span className="sprout-note sprout-note-right-high">
              <small>Reading</small>
              <strong>214 items</strong>
              <span className="sprout-note-foot">your whole shelf</span>
            </span>
          </Orbit>

          <Orbit index={1}>
            <span className="sprout-cue is-green sprout-cue-right-high">
              <ArrowDown />
              10% tonight
            </span>
            <span className="sprout-note sprout-note-left-low">
              <small>This week</small>
              <strong>14 sold</strong>
              <span className="sprout-note-foot">$412 back on the shelf</span>
            </span>
          </Orbit>

          <Orbit index={2}>
            <span className="sprout-photos">
              <i className="sprout-photo-back" />
              <i className="sprout-photo-front">
                <Image
                  alt=""
                  fill
                  sizes="76px"
                  src="/assets/landing/sprout-writes-prices-photo.jpg"
                />
              </i>
            </span>
            <span className="sprout-note sprout-note-right-mid">
              <small>Ready for</small>
              <span className="sprout-note-chips">
                <b>eBay</b>
                <b>Depop</b>
                <b>Shopify</b>
              </span>
            </span>
          </Orbit>

          <Orbit index={3}>
            <span className="sprout-cue is-green sprout-cue-left-mid">
              <i className="sprout-cue-dot" />
              Sprout replied
            </span>
            <span className="sprout-note sprout-note-right-low">
              <small>Your floor</small>
              <span className="sprout-note-row">
                <strong>$65</strong>
                <ArrowRight />
                <b>$68</b>
              </span>
              <span className="sprout-note-foot">never goes under</span>
            </span>
          </Orbit>

          <Orbit index={4}>
            <span className="sprout-cue sprout-cue-left-high">
              <i className="sprout-cue-dot" />3 sold overnight
            </span>
            <span className="sprout-note sprout-note-right-low is-wide">
              <small>Demand this month</small>
              <Sparkline />
            </span>
          </Orbit>
          <div className="sprout-anchor">
            <div
              aria-label="Interactive Anorha app preview"
              className="sprout-live-phone"
              data-phone
            >
              <PhoneStatus />

              <div className="sprout-phone-viewport">
                <PhoneScreen
                  className="sprout-screen-chat is-active"
                  index={0}
                  label="Ask Sprout"
                >
                  <ChatHeader name="Sprout" time="online" />
                  <div className="phone-divider" />
                  <div className="chat-bubble incoming sprout-sequence-one">
                    What sold best this month?
                  </div>
                  <div className="sprout-typing sprout-sequence-two">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="chat-bubble outgoing sprout-sequence-three">
                    Sneakers. 9 of your 14 sales, $72 average.
                  </div>
                  <small className="chat-source sprout-sequence-four">
                    from your inventory
                  </small>
                  <div className="sprout-mini-stat sprout-sequence-five">
                    <span>
                      <small>This month</small>
                      <strong>14 sales</strong>
                    </span>
                    <b>$1,008</b>
                    <em>up 22%</em>
                  </div>
                  <button className="sprout-action is-muted" type="button">
                    Ask Sprout
                  </button>
                </PhoneScreen>

                <PhoneScreen
                  className="sprout-screen-campaign campaign-phone"
                  index={1}
                  label="Clear difficult inventory"
                >
                  <div className="campaign-title">
                    <strong>Winter clearout</strong>
                    <span>Day 4 of 7</span>
                  </div>
                  <div className="campaign-card sprout-sequence-one">
                    <div className="campaign-card-head">
                      <div className="campaign-thumb">
                        <Image
                          alt="Inventory items in a campaign"
                          fill
                          sizes="43px"
                          src="/assets/landing/sprout-writes-prices-photo.jpg"
                        />
                        <b>30+</b>
                      </div>
                      <div>
                        <strong>Winter clearout</strong>
                        <span>36h left · 9/43 sold</span>
                      </div>
                    </div>
                    <div className="campaign-progress">
                      <i />
                      <span>
                        $500 <small>/$750 goal</small>
                      </span>
                    </div>
                  </div>
                  <div className="sprout-repricing sprout-sequence-two">
                    <ArrowDown /> Repricing slow movers by 3%
                  </div>
                  <div className="phone-divider" />
                  <div className="campaign-item sprout-sequence-three">
                    <i className="item-blue" />
                    <span>Wool coat</span>
                    <small>
                      <s>$85</s> <b>$68</b>
                    </small>
                  </div>
                  <div className="campaign-item sprout-sequence-four">
                    <i className="item-tan" />
                    <span>Ski boots</span>
                    <small className="sold-chip">Sold</small>
                  </div>
                  <div className="campaign-item sprout-sequence-five">
                    <i className="item-lavender" />
                    <span>Snow jacket</span>
                    <small className="sold-chip">Sold</small>
                  </div>
                  <button className="sprout-action" type="button">
                    Keep it running
                  </button>
                </PhoneScreen>

                <PhoneScreen
                  className="sprout-screen-listing listing-phone"
                  index={2}
                  label="Create a listing"
                >
                  <div className="sprout-editor-header">
                    <strong>New listing</strong>
                    <span>Draft</span>
                  </div>
                  <div className="listing-editor-photo sprout-sequence-one">
                    <Image
                      alt="A hand holding a comic book ready to list"
                      fill
                      sizes="300px"
                      src="/assets/landing/sprout-writes-prices-photo.jpg"
                    />
                    <span>1 photo</span>
                    <b className="sprout-scan-line" />
                  </div>
                  <div className="editor-label sprout-sequence-two">
                    <span>TITLE</span>
                    <b>Sprout wrote this</b>
                  </div>
                  <strong className="editor-title sprout-sequence-three">
                    Batman graphic novel collection, 3-book set
                  </strong>
                  <div className="editor-price sprout-sequence-four">
                    <strong>$74</strong>
                    <span>~6 days, 12 comps</span>
                  </div>
                  <div className="editor-tags sprout-sequence-five">
                    <span>comics</span>
                    <span>batman</span>
                    <span>collector</span>
                  </div>
                  <button className="sprout-action" type="button">
                    Publish everywhere
                  </button>
                </PhoneScreen>

                <PhoneScreen
                  className="sprout-screen-buyers"
                  index={3}
                  label="Talk to buyers"
                >
                  <ChatHeader name="Jordan" time="11:42 pm" />
                  <div className="phone-divider" />
                  <div className="chat-bubble incoming sprout-sequence-one">
                    Would you take $60?
                  </div>
                  <div className="sprout-typing sprout-sequence-two">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="chat-bubble outgoing sprout-sequence-three">
                    Can do $68, held until 6 pm tomorrow.
                  </div>
                  <small className="chat-source sprout-sequence-four">
                    Sprout, in your voice
                  </small>
                  <div className="chat-bubble incoming sprout-sequence-five">
                    Deal.
                  </div>
                  <div className="sprout-offer-card sprout-sequence-five">
                    <span>
                      <small>Offer accepted</small>
                      <strong>$68</strong>
                    </span>
                    <b>Pickup tomorrow</b>
                  </div>
                  <button className="sprout-action is-muted" type="button">
                    Pending pickup
                  </button>
                </PhoneScreen>

                <PhoneScreen
                  className="sprout-screen-brief brief-phone"
                  index={4}
                  label="Morning brief"
                >
                  <strong className="brief-title">Morning brief</strong>
                  <small className="sprout-brief-date">
                    Wednesday, July 29
                  </small>
                  <div className="brief-total sprout-sequence-one">
                    <strong>+$84</strong>
                    <span>overnight</span>
                  </div>
                  <div className="brief-progress sprout-sequence-two">
                    <i />
                  </div>
                  <div className="brief-counts sprout-sequence-two">
                    <span>3 sold</span>
                    <b>2 offers</b>
                    <span>1 stale</span>
                  </div>
                  <div className="phone-divider" />
                  <small className="brief-label">WHILE YOU SLEPT</small>
                  <div className="brief-row sprout-sequence-three">
                    <span>Air Max 90, sold</span>
                    <b>$78</b>
                  </div>
                  <div className="brief-row sprout-sequence-four">
                    <span>Wool coat, offer</span>
                    <b>$52</b>
                  </div>
                  <div className="brief-row sprout-sequence-five">
                    <span>Ski boots, sold</span>
                    <b>$69</b>
                  </div>
                  <button className="sprout-action" type="button">
                    Review 2 offers
                  </button>
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
