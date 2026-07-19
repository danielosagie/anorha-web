import { redirect } from 'next/navigation';

export default async function LegalRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/legal/privacy`);
}
