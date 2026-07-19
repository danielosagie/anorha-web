import Image from 'next/image';
import type { ReactNode } from 'react';

type FeaturePanelProps = {
  children: ReactNode;
  className: string;
  description: string;
  floating?: ReactNode;
  title: string;
};

function FeaturePanel({
  children,
  className,
  description,
  floating,
  title,
}: FeaturePanelProps) {
  return (
    <article className={`sprout-feature-panel ${className}`}>
      <div className="sprout-feature-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
      {floating}
    </article>
  );
}

function Phone({
  children,
  className = '',
}: { children: ReactNode; className?: string }) {
  return (
    <div className={`feature-phone phone-shell ${className}`}>
      <div className="phone-speaker" />
      {children}
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

function SproutBadge({
  children,
  className = '',
}: { children: ReactNode; className?: string }) {
  return (
    <div className={`sprout-floating-badge ${className}`}>
      <i />
      <span>{children}</span>
    </div>
  );
}

export function SproutFeatureBlocks() {
  return (
    <section aria-label="What Sprout can do" className="sprout-features">
      <FeaturePanel
        className="sprout-panel-chat"
        description="It knows your whole shelf. Ask what's selling, what's stuck, or what to restock."
        floating={
          <>
            <SproutBadge className="chat-reply-badge">
              Sprout is replying
            </SproutBadge>
            <div className="floating-stat month-stat">
              <small>This month</small>
              <div>
                <span>14 sales</span>
                <strong>$1,008</strong>
                <b>up 22%</b>
              </div>
            </div>
          </>
        }
        title="Ask it anything"
      >
        <Phone>
          <ChatHeader name="Sprout" time="9:12 am" />
          <div className="phone-divider" />
          <div className="chat-bubble incoming">What sold best this month?</div>
          <div className="chat-bubble outgoing">
            Sneakers. 9 of your 14 sales, $72 average.
          </div>
          <small className="chat-source">from your inventory</small>
          <div className="chat-bubble incoming">What should I restock?</div>
          <div className="phone-action muted-action">Ask Sprout</div>
        </Phone>
      </FeaturePanel>

      <FeaturePanel
        className="sprout-panel-campaign"
        description="Time-boxed campaigns drop the price until it moves. No babysitting."
        floating={
          <>
            <div className="repricing-badge">
              <span>↓</span>
              Repricing slow movers by -3%
            </div>
            <div className="floating-stat week-stat">
              <small>This week</small>
              <div>
                <strong>14</strong>
                <b>sold</b>
              </div>
              <span>$412 back on the shelf</span>
            </div>
          </>
        }
        title="Clears difficult inventory"
      >
        <Phone className="campaign-phone">
          <div className="campaign-title">
            <strong>Winter clearout</strong>
            <span>Day 4 of 7</span>
          </div>
          <div className="campaign-card">
            <div className="campaign-card-head">
              <div className="campaign-thumb">
                <Image
                  alt="A group of inventory items in a campaign"
                  fill
                  sizes="43px"
                  src="/assets/landing/sprout-writes-prices-photo.jpg"
                />
                <b>30+</b>
              </div>
              <div>
                <strong>Campaign Name</strong>
                <span>36h left · 9/43 sold</span>
              </div>
            </div>
            <div className="campaign-progress">
              $500 <span>/$750 goal</span>
            </div>
          </div>
          <div className="phone-divider" />
          <div className="campaign-item">
            <i className="item-blue" />
            <span>Wool coat</span>
            <small>
              <s>$85</s> <b>$68</b>
            </small>
          </div>
          <div className="campaign-item">
            <i className="item-tan" />
            <span>Ski boots</span>
            <small className="sold-chip">Sold</small>
          </div>
          <div className="campaign-item">
            <i className="item-lavender" />
            <span>Snow jacket</span>
            <small className="sold-chip">Sold</small>
          </div>
          <div className="phone-action">Keep it running</div>
        </Phone>
      </FeaturePanel>

      <FeaturePanel
        className="sprout-panel-listing"
        description="One photo in. Title, tags, description, and a price from real sold comps."
        floating={
          <>
            <div aria-hidden="true" className="photo-stack">
              <i />
              <i />
            </div>
            <div className="ready-card">
              <small>Ready for</small>
              <div>
                <span>eBay</span>
                <span>Depop</span>
                <span>FB</span>
              </div>
            </div>
            <div className="sold-note">
              <i />
              <div>
                <strong>Sold, $78</strong>
                <small>eBay, 3 days ago</small>
              </div>
            </div>
          </>
        }
        title="Writes and prices it"
      >
        <Phone className="listing-phone">
          <div className="listing-editor-photo">
            <Image
              alt="A hand holding a comic book ready to list"
              fill
              sizes="230px"
              src="/assets/landing/sprout-writes-prices-photo.jpg"
            />
            <span>1 photo</span>
          </div>
          <div className="editor-label">
            <span>TITLE</span>
            <b>Sprout</b>
          </div>
          <strong className="editor-title">
            Nike Air Max 90 &quot;OG White&quot;, size 10
          </strong>
          <div className="editor-price">
            <strong>$74</strong>
            <span>~6 days, 12 comps</span>
          </div>
          <small className="editor-description-label">DESCRIPTION</small>
          <i className="skeleton-line" />
          <i className="skeleton-line skeleton-medium" />
          <i className="skeleton-line skeleton-short" />
          <div className="editor-tags">
            <span>sneakers</span>
            <span>air max</span>
          </div>
          <div className="phone-action">Publish</div>
        </Phone>
      </FeaturePanel>

      <FeaturePanel
        className="sprout-panel-buyers"
        description="Negotiates in your voice, day or night. You approve the big calls."
        floating={
          <>
            <SproutBadge className="buyer-reply-badge">
              Sprout is replying...
            </SproutBadge>
            <div className="floating-stat offer-stat">
              <small>New offer on 48&apos; TV</small>
              <div>
                <s>$60</s>
                <strong>$68</strong>
                <b>accepted</b>
              </div>
            </div>
          </>
        }
        title="Talks to buyers"
      >
        <Phone>
          <ChatHeader name="Jordan" time="11:42 pm" />
          <div className="phone-divider" />
          <div className="chat-bubble incoming">Would you take $60?</div>
          <div className="chat-bubble outgoing">
            Can do $68, held until 6 pm tomorrow.
          </div>
          <small className="chat-source">Sprout, your voice</small>
          <div className="chat-bubble incoming">Deal.</div>
          <div className="phone-action muted-action">Pending pickup</div>
        </Phone>
      </FeaturePanel>

      <FeaturePanel
        className="sprout-panel-brief"
        description="A morning brief, and a nudge when something needs you. No dashboard digging."
        floating={
          <div className="demand-stat">
            <small>Demand this month</small>
            <svg aria-hidden="true" viewBox="0 0 136 30">
              <path
                d="M2 26 L26 20 L50 22 L74 12 L98 14 L134 4"
                fill="none"
                stroke="#7BB304"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        }
        title="Keeps you posted"
      >
        <Phone className="brief-phone">
          <strong className="brief-title">Morning brief</strong>
          <div className="brief-total">
            <strong>+$84</strong>
            <span>overnight</span>
          </div>
          <div className="brief-progress" />
          <div className="brief-counts">
            <span>3 sold</span>
            <b>2 offers</b>
            <span>1 stale</span>
          </div>
          <div className="phone-divider" />
          <small className="brief-label">WHILE YOU SLEPT</small>
          <div className="brief-row">
            <span>Air Max 90, sold</span>
            <b>$78</b>
          </div>
          <div className="brief-row">
            <span>Wool coat, offer</span>
            <b>$52</b>
          </div>
          <div className="brief-row">
            <span>Ski boots, sold</span>
            <b>$69</b>
          </div>
          <div className="phone-action">Review 2 offers</div>
        </Phone>
      </FeaturePanel>
    </section>
  );
}
