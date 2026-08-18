import type { Metadata } from 'next';
import { PublicIntakePage } from './components/public-intake-page';

export const metadata: Metadata = {
  title: 'Send items | Anorha',
  referrer: 'no-referrer',
  robots: {
    follow: false,
    index: false,
  },
};

export default function IntakePage() {
  return <PublicIntakePage />;
}
