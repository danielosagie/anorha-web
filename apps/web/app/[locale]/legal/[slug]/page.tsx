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
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">1. Introduction</h2>
          <p>
            This Privacy Policy describes how Anorha ("we", "us", or "our") collects, uses, and discloses your information
            when you use our inventory/liquidation platform, mobile applications, and websites (the "Service").
          </p>
          <p>
            Anorha operates as a <strong>marketplace technology platform</strong> that enables sellers to list and manage
            their products across multiple sales channels, including Facebook Marketplace. We are not the seller of record
            for items listed through our platform — individual sellers retain full ownership and responsibility for their
            products and transactions.
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
            <li>Location Data: Pickup locations for local marketplace listings (latitude, longitude, city)</li>
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
              <strong>Marketplace Distribution:</strong> To publish your product listings to Facebook Marketplace and other
              sales channels on your behalf, using your seller identity and location preferences.
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
              and AI processing (OpenRouter).
            </li>
            <li>
              <strong>Marketplace APIs (Meta/Facebook):</strong> When you connect to Facebook Marketplace, we transmit
              your product data to Meta. Under the Facebook Seller Agreement, both Anorha and Meta are considered
              <strong> independent controllers</strong> of buyer data. We process this data to support transactions
              and sync, while Meta processes it in accordance with their own Data Policy.
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
          <h2 className="text-2xl font-bold">6. Your Rights</h2>
          <p>Regardless of your location, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access and export your data in a portable format.</li>
            <li>Correct inaccurate information.</li>
            <li>Request deletion of your account and data.</li>
            <li>Opt-out of non-essential data processing.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">7. Children's Privacy</h2>
          <p>
            Our Service is not directed to anyone under the age of 18. We do not knowingly collect personally identifiable information from children.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">8. Contact Us</h2>
          <p>For privacy-related inquiries or data requests, please contact us at:</p>
          <p className="font-semibold text-primary">admin@anorha.app</p>
        </section>
      </>
    ),
  },

  returns: {
    title: 'Returns & Refund Policy',
    description: 'Returns and refund policy for Anorha marketplace sellers and buyers',
    content: (
      <>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">1. About This Policy</h2>
          <p>
            Anorha is a <strong>marketplace technology platform</strong> that enables independent sellers to list and manage
            their products across multiple sales channels, including Shopify, Square, Facebook Marketplace and more. Anorha is <strong>not the seller</strong> of
            the products listed through our platform.
          </p>
          <p>
            This policy covers two distinct areas: (1) returns for products purchased from sellers using Anorha, and
            (2) refunds for the Anorha software subscription service itself.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">2. Product Returns (For Buyers)</h2>
          <p>
            When you purchase a product from a seller using Anorha's platform (such as on Facebook Marketplace),
            <strong> you are transacting directly with the individual seller, not with Anorha.</strong>
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Contact the Seller:</strong> All return requests, refunds, and exchanges must be handled directly
              with the seller who listed the product. Their contact information is available on the listing or through the marketplace platform.
            </li>
            <li>
              <strong>Seller's Return Policy Applies:</strong> Each seller may have their own return policy. Some sellers
              may offer returns (e.g., 30 days), while others may sell items "as-is" or "all sales final." You should check the listing details carefully.
            </li>
            <li>
              <strong>Damaged or Incorrect Items:</strong> If you receive an item that is damaged, defective, or not as described, you should contact the seller immediately to resolve the issue. Sellers are responsible for ensuring their product descriptions are accurate.
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">3. Buyer Protection</h2>
          <p>
            Transactions handled through third-party marketplaces (like Facebook Marketplace) are often covered by that platform's native buyer protection policies.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Facebook Marketplace:</strong> Transactions with checkout may be eligible for Purchase Protection.</li>
            <li><strong>Local Transactions:</strong> For local, in-person cash or peer-to-peer (Venmo/CashApp) transactions, Anorha and the marketplace platform generally cannot offer protection. We recommend inspecting items thoroughly before payment.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">4. Dispute Resolution</h2>
          <p>
            Anorha does not mediate disputes between buyers and sellers. As a neutral technology provider, we do not have control over the fulfillment of orders or the quality of items sold by independent users.
          </p>
          <p>
            If a dispute arises, we encourage both parties to communicate in good faith. If a resolution cannot be reached, you should use the dispute resolution tools provided by the sales channel (e.g., Facebook) or your payment provider.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">5. Anorha Software Subscription Refunds</h2>
          <p>
            For the Anorha software service itself (the tool used to manage inventory):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Subscriptions:</strong> Fees for Anorha software subscriptions are generally non-refundable. You may cancel at any time through our billing portal, and you will retain access until the end of your prepaid period.
            </li>
            <li>
              <strong>Technical Issues:</strong> If a persistent technical failure on our part prevents you from using the service, please contact admin@anorha.app to request a partial credit or refund.
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">6. Contact Information</h2>
          <p>For questions about this policy or the Anorha platform, contact:</p>
          <p className="font-semibold text-primary">admin@anorha.app</p>
        </section>
      </>
    ),
  },

  shipping: {
    title: 'Shipping & Delivery Policy',
    description: 'Shipping and delivery information for Anorha marketplace items',
    content: (
      <>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">1. Delivery Responsibility</h2>
          <p>
            Anorha does not handle, store, or ship physical products. Because all items on our platform are sold by independent sellers,
            <strong> all shipping and delivery arrangements are the responsibility of the seller.</strong>
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">2. Local Pickup</h2>
          <p>
            Many items listed through Anorha are intended for local, in-person pickup.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Arrangements:</strong> Buyers and sellers should coordinate the pickup time and location through the marketplace's messaging system.</li>
            <li><strong>Safety:</strong> We recommend meeting in well-lit, public locations for all local transactions.</li>
            <li><strong>Verification:</strong> Buyers should inspect the item thoroughly at the time of pickup before finalizing the transaction.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">3. Shipping Methods</h2>
          <p>
            If a seller offers shipping for an item:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Carrier:</strong> The seller chooses the shipping carrier and method (e.g., USPS, UPS, FedEx).</li>
            <li><strong>Tracking:</strong> Sellers are encouraged to provide tracking information to the buyer once the item has been shipped.</li>
            <li><strong>Costs:</strong> Shipping costs are determined by the seller and should be clearly stated in the listing.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">4. Delivery Times</h2>
          <p>
            Estimated delivery times are provided by the individual seller and the chosen shipping carrier. Anorha cannot guarantee delivery windows as we do not manage the logistics or fulfillment process.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">5. Shipping Restrictions</h2>
          <p>
            Sellers are responsible for complying with all shipping laws and regulations, including restrictions on hazardous materials or prohibited items. Anorha may restrict shipping options for certain categories of goods as required by law or marketplace partner policies.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">6. Contact</h2>
          <p>For questions about a specific order's delivery, please contact the seller directly. For general shipping policy inquiries, contact:</p>
          <p className="font-semibold text-primary">admin@anorha.app</p>
        </section>
      </>
    ),
  },

  'seller-terms': {
    title: 'Marketplace Seller Terms',
    description: 'Terms and conditions for sellers using Anorha to list on Facebook Marketplace and other channels',
    content: (
      <>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">1. Seller Relationship & Agreement</h2>
          <p>
            By using Anorha to list products on Facebook Marketplace, you agree to comply with the <strong>Facebook Seller Agreement</strong>
            and Meta's Commerce Policies. Anorha acts as a "Tech Provider" or "Service Provider" to facilitate these listings.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Merchant of Record:</strong> You are the sole seller of record. You are responsible for the entire transaction life cycle,
              including pricing, fulfillment, and customer service.
            </li>
            <li>
              <strong>No Partnership:</strong> Your use of Anorha does not create an agency, partnership, or joint venture between you and Anorha
              or between you and Meta.
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">2. License to Content</h2>
          <p>
            You grant Anorha a non-exclusive, transferable, sub-licensable, royalty-free, worldwide license to host, use, distribute, modify,
            and display your product data (images, descriptions, pricing) for the purpose of publishing your listings to marketplace partners.
          </p>
          <p>
            You acknowledge that by publishing through Anorha, you are also granting <strong>Meta</strong> a license to host and use this content
            under the terms of the Facebook Seller Agreement.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">3. Compliance & Prohibited Items</h2>
          <p>
            You represent and warrant that your products and Seller Content comply with all applicable laws and marketplace policies.
            You are strictly prohibited from listing:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Illegal drugs, prescription drugs, or weapons.</li>
            <li>Counterfeit or pirated products.</li>
            <li>Adult products or services.</li>
            <li>Stolen property or items subject to government sanctions.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">4. Taxes & Fees</h2>
          <p>
            As the seller of record, you are <strong>solely responsible</strong> for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Determining, calculating, and collecting all applicable sales taxes and fees.</li>
            <li>Remitting taxes to the appropriate taxing authorities.</li>
            <li>Complying with all local tax ordinances and reporting requirements.</li>
          </ul>
          <p>
            Anorha does not calculate or remit taxes on your behalf. You agree to hold Anorha harmless from any tax liabilities,
            penalties, or interest arising from your sales.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">5. Customer Service & Recalls</h2>
          <p>
            You are responsible for providing all customer service to buyers. You must also:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Promptly handle any product recalls or safety alerts.</li>
            <li>Honor all descriptions, prices, and shipping terms provided in your listings.</li>
            <li>Immediately remove any listing that is subject to a safety alert or intellectual property claim.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">6. Indemnification</h2>
          <p>
            You agree to <strong>indemnify and hold harmless Anorha and its marketplace partners (including Meta)</strong> from and against
            any claims, damages, or losses arising from:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your products or their use by buyers.</li>
            <li>Any breach of your obligations under these terms or the Facebook Seller Agreement.</li>
            <li>Any defect or non-conformity in the items you sell.</li>
            <li>Your handling of buyer data.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">7. Contact</h2>
          <p>For questions about seller terms, contact:</p>
          <p className="font-semibold text-primary">admin@anorha.app</p>
        </section>
      </>
    ),
  },

  terms: {
    title: 'Terms of Service',
    description: 'Terms of service for using Anorha inventory/liquidation platform',
    content: (
      <>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

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
          <h2 className="text-2xl font-bold">9. Governing Law</h2>
          <p>
            These terms shall be governed by the laws of the State of Delaware, without regard to its conflict of
            law provisions.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">10. Contact</h2>
          <p>For legal notices or questions, contact:</p>
          <p className="font-semibold text-primary">admin@anorha.app</p>
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

