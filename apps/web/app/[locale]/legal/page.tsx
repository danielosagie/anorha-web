import { redirect } from 'next/navigation';

export default async function LegalRootPage() {
    redirect('/legal/privacy');
}
