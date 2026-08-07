import { ScatterField } from './scatter-field';
import Image from 'next/image';

export function ProblemScatterPills() {
  return (
    <section className="problem-section">
      <span className="landing-eyebrow">THE PROBLEM</span>
      <h2>Selling online is hard</h2>
      <p>
        Every platform wants its own photos, prices, and paperwork. 
        The same work, five times. But only 1 you.
      </p>
      <div className="problem-illustration-wrap">
        <Image
          alt="Seller concerned balancing their platform's growth"
          className="problem-illustration"
          height={1028}
          priority
          sizes="(max-width: 560px) calc(100vw - 36px), (max-width: 820px) calc(100vw - 48px), 1110px"
          src="/assets/landing/Problem.png"
          width={1080}
        />
      </div>  
    </section>
  );
}
