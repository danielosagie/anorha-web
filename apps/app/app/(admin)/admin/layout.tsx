import { env } from '@/env';
import { isAdminClerkUserId } from '@/lib/admin-auth';
import { auth } from '@repo/auth/server';
import { GeistMono } from '@repo/design-system/lib/fonts';
import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { AdminNav } from './_components/admin-nav';
import './admin.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--admin-font-sans',
});

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Founder operations',
};

export default async function AdminLayout({
  children,
}: { children: ReactNode }) {
  const { userId } = await auth();

  // The /admin segment is the internal/ops plane, the one surface allowed to show real
  // vendor/model names. Gate it hard, and 404 rather than 403 so its existence is not
  // disclosed to non-staff.
  if (!isAdminClerkUserId(userId, env.ADMIN_CLERK_USER_IDS)) {
    notFound();
  }

  return (
    <div className={`${interTight.variable} ${GeistMono.variable} admin-plane`}>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <span aria-hidden="true" className="admin-sidebar-avatar">
              A
            </span>
            <span className="admin-sidebar-brand-copy">
              <strong>Anorha</strong>
              <span>Founder ops</span>
            </span>
          </div>

          <div className="admin-sidebar-section-label">Operations</div>
          <AdminNav />

          <div className="admin-sidebar-spacer" />
          <Link className="admin-customer-link" href="/">
            Customer app
          </Link>
          <div className="admin-sidebar-profile">
            <span aria-hidden="true" className="admin-profile-avatar">
              F
            </span>
            <span>
              <strong>Founder</strong>
              <small>Admin</small>
            </span>
          </div>
        </aside>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
