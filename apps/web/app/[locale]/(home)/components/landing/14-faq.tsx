export const landingFaqItems = [
  {
    answer:
      'Yes. CSV import brings in your catalog so you can review it before publishing.',
    question: 'Can I upload from a CSV?',
  },
  {
    answer:
      'Anorha supports Shopify, eBay, Facebook, Square, Clover, WooCommerce, and Etsy.',
    question: 'Which selling platforms are supported?',
  },
  {
    answer:
      'Every plan includes AI usage. Teams includes 3x usage. Paid plans bill monthly until you cancel.',
    question: 'How do AI usage and billing work?',
  },
  {
    answer: 'Growth includes 2 members. Teams includes 5 members.',
    question: 'How many team members are included?',
  },
  {
    answer:
      'Yes. Cancel from billing. Your paid plan stays active through the current billing period.',
    question: 'Can I cancel anytime?',
  },
  {
    answer:
      'Yes. Anorha updates shared inventory as sales and edits come in, helping prevent overselling.',
    question: 'Does Anorha sync inventory across platforms?',
  },
] as const;

export function LandingFaq() {
  return (
    <section
      aria-labelledby="landing-faq-title"
      className="landing-faq-section"
    >
      <div className="landing-faq-inner">
        <div className="landing-faq-copy">

          <h2 id="landing-faq-title">FAQ</h2>
          <p>A couple commonly asked questions</p>
        </div>
        <div className="landing-faq-list">
          {landingFaqItems.map(({ answer, question }) => (
            <details className="landing-faq-item" key={question}>
              <summary className="landing-faq-question">
                <span>{question}</span>
                <svg aria-hidden="true" viewBox="0 0 14 14">
                  <path
                    d="M2 7H12"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                  <path
                    className="landing-faq-icon-vertical"
                    d="M7 2V12"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
              </summary>
              <div className="landing-faq-answer">
                <p>{answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
