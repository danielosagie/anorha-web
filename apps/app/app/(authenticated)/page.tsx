import type { Metadata } from 'next';
import { InConstruction } from './components/in-construction';
import { PageWrapper } from './components/page-wrapper';

export const metadata: Metadata = {
  title: 'Dashboard | Anorha',
  description: 'Your operational control center.',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

const App = () => {
  return (
    <div className="bg-[#FEF4DD]">
      <PageWrapper title='Dashboard' description='Stay up to date' >
        <InConstruction />
      </PageWrapper>
    </div>

  );
};

export default App;
