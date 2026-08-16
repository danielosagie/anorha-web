'use client';

import {
  Activity,
  Building2,
  Gauge,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/admin', label: 'Overview', icon: Gauge },
  { href: '/admin/orgs', label: 'Organizations', icon: Building2 },
  { href: '/admin/testers', label: 'Testers', icon: Smartphone },
  { href: '/admin/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/admin/usage', label: 'Usage', icon: Activity },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="admin-nav-list">
      {links.map(({ href, icon: Icon, label }) => {
        const active =
          href === '/admin'
            ? pathname === href
            : pathname.startsWith(`${href}/`) || pathname === href;
        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className="admin-nav-link"
            href={href}
            key={href}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
