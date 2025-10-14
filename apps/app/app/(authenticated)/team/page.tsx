'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import dynamic from 'next/dynamic';

// Dynamically import Clerk components to avoid server-side issues
const OrganizationProfile = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.OrganizationProfile),
  { ssr: false }
);

const OrganizationSwitcher = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.OrganizationSwitcher),
  { ssr: false }
);

export default function TeamPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your organization and team members
          </p>
        </div>

        <OrganizationSwitcher 
          hidePersonal={false}
          appearance={{
            elements: {
              rootBox: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              },
            },
          }}
        />
      </div>
    
      {/* Clerk Organization Profile Component */}
      <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <CardContent className="p-6">
          <OrganizationProfile 
            appearance={{
              elements: {
                rootBox: {
                  boxShadow: 'none',
                  width: '100%',
                },
                card: {
                  border: 'none',
                  boxShadow: 'none',
                  backgroundColor: 'transparent',
                },
                cardBox: {
                  border: 'none',
                },
                pageScrollBox: {
                  padding: 0,
                },
                navbar: {
                  borderBottom: '1px solid hsl(var(--border))',
                },
              },
              variables: {
                colorPrimary: 'hsl(var(--primary))',
                colorText: 'hsl(var(--foreground))',
                colorTextSecondary: 'hsl(var(--muted-foreground))',
                colorBackground: 'transparent',
                colorInputBackground: 'hsl(var(--background))',
                colorInputText: 'hsl(var(--foreground))',
                borderRadius: '0.5rem',
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
