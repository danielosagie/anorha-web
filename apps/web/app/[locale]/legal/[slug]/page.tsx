import type React from 'react';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import Link from 'next/link';

type LegalPageProperties = {
  readonly params: Promise<{
    slug: string;
  }>;
};

const legalContent: Record<string, { title: string; description: string; content: React.ReactNode }> = {

  privacy: {
    title: 'Privacy Policy',
    description: 'Privacy policy for Anorha - how we handle your data and protect your privacy',
    content: (
      <>
        <p className="text-muted-foreground mb-8">Last updated: December 24, 2025</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">1. Introduction</h2>
          <p>
            This Privacy Policy describes how Anorha ("we", "us", or "our") collects, uses, and discloses your information
            when you use our inventory/liquidation platform, mobile applications, and websites (the "Service").
          </p>
          <p>
            By using Anorha, you agree to the collection and use of information in accordance with this policy. We are
            committed to protecting your business data and personal information with industry-standard security practices.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">2. Information We Collect</h2>
          <h3 className="text-xl font-semibold">Account Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email address, name, and profile information (via Clerk/Google/Apple)</li>
            <li>Business name, address, and contact details</li>
            <li>Billing information (processed securely through Stripe/Polar)</li>
          </ul>

          <h3 className="text-xl font-semibold">Business & Marketplace Data</h3>
          <p>To provide our core sync services, we collect and process data from your connected platforms:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Product details: titles, descriptions, SKUs, barcodes, categories, and tags</li>
            <li>Pricing: retail price, compare-at price, and cost of goods</li>
            <li>Inventory: stock levels across multiple locations and warehouse data</li>
            <li>Media: product images and videos (which may be processed by AI for detail generation)</li>
            <li>Orders & Sales: Transaction history to power sales velocity insights and liquidation strategies</li>
            <li>Platform Tokens: Encrypted API credentials (OAuth tokens) to communicate with Shopify, Square, Facebook, etc.</li>
          </ul>

          <h3 className="text-xl font-semibold">Usage & Technical Data</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Device info: IP address, browser type, OS version, and unique device identifiers</li>
            <li>Interactions: Feature usage, navigation paths, and performance logs</li>
            <li>Local Data: We may store cached product data on your device for offline access</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Core Sync:</strong> To keep your inventory and product data consistent across Shopify, Square,
              Facebook Marketplace, and other connected channels.
            </li>
            <li>
              <strong>AI Optimization:</strong> To generate or improve product titles, descriptions, and tags using
              Large Language Models (LLMs).
            </li>
            <li>
              <strong>Liquidation Insights:</strong> To analyze sales data and suggest strategies for moving slow-moving
              stock.
            </li>
            <li>
              <strong>Communication:</strong> To send critical alerts (e.g., sync failures), security updates, and
              account-related notifications.
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">4. Data Sharing & Third-Parties</h2>
          <p>We do not sell your business data. We share information only in these specific cases:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Service Providers:</strong> Cloud hosting (Vercel/Supabase), Auth (Clerk), Payments (Stripe/Polar),
              and AI processing (OpenAI/Anthropic/Google).
            </li>
            <li>
              <strong>Marketplace APIs:</strong> We transmit your product data to platforms you explicitly connect (e.g.,
              pushing a listing to Facebook Marketplace).
            </li>
            <li>
              <strong>Legal Requirements:</strong> If required by law or to protect our rights and user safety.
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">5. Data Retention & Security</h2>
          <p>
            We retain your data as long as your account is active. If you disconnect a platform or delete your account,
            we will purge your API tokens and cached business data, though some transaction records may remain for
            financial/tax compliance.
          </p>
          <p>
            We use end-to-end encryption for sensitive API credentials and regular security audits to ensure your data
            remains private.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">6. Your Rights (GDPR/CCPA)</h2>
          <p>Regardless of your location, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access and export your data in a portable format.</li>
            <li>Correct inaccurate information.</li>
            <li>Request deletion of your account and data.</li>
            <li>Opt-out of non-essential data processing.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">7. Contact Us</h2>
          <p>For privacy-related inquiries or data requests, please contact us at:</p>
          <p className="font-semibold text-primary">legal@anorha.com</p>
        </section>
      </>
    ),
  },
  terms: {
    title: 'Terms of Service',
    description: 'Terms of service for using Anorha inventory/liquidation platform',
    content: (
      <>
        <p className="text-muted-foreground mb-8">Last updated: December 24, 2025</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">1. Agreement to Terms</h2>
          <p>
            By accessing or using Anorha ("the Service"), you agree to be bound by these Terms of Service. If you are
            using the Service on behalf of a business, you represent that you have the authority to bind that entity
            to these terms.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">2. Use of the Service</h2>
          <p>
            Anorha grants you a limited, non-exclusive, non-transferable license to use our platform for your internal
            business operations.
          </p>
          <h3 className="text-xl font-semibold">AI Content & Responsibility</h3>
          <p>
            The Service uses Artificial Intelligence (AI) to generate product titles, descriptions, and other content.
            <strong> You are solely responsible for reviewing and verifying the accuracy of all AI-generated content </strong>
            before publishing it to any platform. Anorha does not guarantee the truthfulness, safety, or legality of
            content generated by LLMs.
          </p>
          <h3 className="text-xl font-semibold">Prohibited Conduct</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Circumventing service limits or violating the security of the platform.</li>
            <li>Using AI features to generate fraudulent, infringing, or prohibited content.</li>
            <li>Automating the platform in a way that places undue load on our infrastructure.</li>
            <li>Reselling the service without explicit written permission.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">3. Subscription & Billing</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Fees:</strong> You agree to pay all fees associated with your selected plan. Fees are non-refundable
              unless required by law.
            </li>
            <li>
              <strong>Usage Limits:</strong> Some plans may have limits on SKUs, sync frequency, or AI generations.
              Overage charges may apply if configured in your plan.
            </li>
            <li>
              <strong>Taxes:</strong> You are responsible for any applicable taxes related to your use of the service.
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">4. Data Ownership & Intellectual Property</h2>
          <p>
            <strong>Your Data:</strong> You retain all ownership rights to the product data, images, and information
            you sync through Anorha. You grant us a license to process this data solely to provide the Service.
          </p>
          <p>
            <strong>Our IP:</strong> All software, code, designs, and AI models powering Anorha are the property of
            Anorha and are protected by copyright and trademark laws.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">5. Third-Party Platform Terms</h2>
          <p>
            The Service interacts with third-party platforms (Shopify, Square, Meta/Facebook). You are responsible for
            complying with their respective Terms of Service. Anorha is not responsible for any actions taken by
            these platforms against your account (e.g., suspension for violating Marketplace rules).
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">6. Limitation of Liability</h2>
          <p>
            Anorha is provided "as is" and "as available." To the maximum extent permitted by law, we shall not be
            liable for any indirect, incidental, or consequential damages, including loss of profits or revenue
            resulting from sync errors or data discrepancies.
          </p>
          <p>
            Our total liability for any claim shall not exceed the amount you paid to Anorha in the 12 months
            preceding the claim.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">7. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Anorha, its officers, directors, and employees from and
            against any and all claims, liabilities, damages, or expenses (including reasonable legal fees) arising out
            of your use of the Service, your violation of these Terms, or your infringement of any intellectual property
            or other rights of any third-party.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">8. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account if you violate these terms or fail to pay
            fees. You may cancel your subscription at any time through our billing portal.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">8. Governing Law</h2>
          <p>
            These terms shall be governed by the laws of the State of Delaware, without regard to its conflict of
            law provisions.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">9. Contact</h2>
          <p>For legal notices or questions, contact:</p>
          <p className="font-semibold text-primary">legal@anorha.com</p>
        </section>
      </>
    ),
  },
};

export const generateMetadata = async ({ params }: LegalPageProperties): Promise<Metadata> => {
  const { slug } = await params;
  const content = legalContent[slug];

  if (!content) {
    return createMetadata({ title: 'Legal', description: 'Legal page' });
  }

  return createMetadata({ title: content.title, description: content.description });
};

export const generateStaticParams = async (): Promise<{ slug: string }[]> => {
  return Object.keys(legalContent).map((slug) => ({ slug }));
};

const LegalPage = async ({ params }: LegalPageProperties) => {
  const { slug } = await params;
  const content = legalContent[slug];

  if (!content) {
    return (
      <div className="container max-w-4xl py-16">
        <Link
          className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm focus:underline focus:outline-none"
          href="/"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Home
        </Link>
        <h1 className="scroll-m-20 text-balance font-extrabold text-4xl tracking-tight lg:text-5xl">
          Page Not Found
        </h1>
        <p className="text-balance leading-7 [&:not(:first-child)]:mt-6">
          The requested legal page could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-16">
      <Link
        className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm focus:underline focus:outline-none"
        href="/"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="scroll-m-20 text-balance font-extrabold text-4xl tracking-tight lg:text-5xl mb-8">
        {content.title}
      </h1>
      <article className="prose prose-slate dark:prose-invert max-w-none leading-7">
        {content.content}
      </article>
    </div>
  );
};

export default LegalPage;

