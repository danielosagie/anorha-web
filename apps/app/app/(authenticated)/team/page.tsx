'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Header } from '../components/header';

// Dynamically import Clerk component`s to avoid server-side issues
const OrganizationProfile = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.OrganizationProfile),
  { ssr: false }
);

const OrganizationSwitcher = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.OrganizationSwitcher),
  { ssr: false }
);


export default function TeamPage() {
  const [borderColor, setBorderColor] = useState('rgba(0, 0, 0, 0)');

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Header pages={['Team']} page="Team" />

      <div className="flex items-center gap-2 flex-wrap mb-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your organization and team members
          </p>
        </div>
      </div>
      

      {/* Keep this card FLEX - min-h-0 ensure no overflow; all sensible flex settings for perfect fit */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden p-0" style={{borderColor: 'rgb(255,255,255)', boxShadow: 'none'}}>
        <CardContent
          className="h-full flex flex-col min-h-0 p-0 border-0"
          style={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0, border: 'none' }}
        >
          <div className="flex-1 min-h-0 flex flex-col p-0 w-fit border-gray-100 border-2 rounded-md">
            <OrganizationProfile 
              routing="hash"
              appearance={{
                elements: {
                  rootBox: {
                    boxShadow: 'none',
                    width: '100%',
                    height: '100%',
                    minWidth: 0,
                    minHeight: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 1 0%',
                    overflow: 'hidden',
                 
                    backgroundColor: 'rgb(255, 255, 255)',
                  },
                  card: {
                    border: 'none',
                    boxShadow: 'none',
                    backgroundColor: 'rgb(255, 255, 255)',
                    height: '100%',
                    
                    minHeight: 0,
                    minWidth: 0,
                    flex: '1 1 0%',
                    display: 'flex',
                    flexDirection: 'column',
                  },
                  cardBox: {
                    border: 'none',
                
                    minHeight: 0,
                    minWidth: 0,
                    flex: '1 1 0%',
                    backgroundColor: 'rgb(255, 255, 255)',
                  },
                  pageScrollBox: {
                    backgroundColor: 'rgb(255, 255, 255)',
                    paddingTop: '1rem',
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    paddingBottom: '1rem',
                    gap: "10px",
                    height: 'auto',
                    minHeight: 0,
                    flex: '1 1 0%',
                    overflowY: 'auto',
                    '@media (min-width: 768px)': {
                      paddingTop: '2rem',
                      paddingLeft: '2rem',
                      paddingRight: '2rem',
                      paddingBottom: '2rem',
                    },
                    '@media (max-width: 700px)': {
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      paddingLeft: '0.5rem',
                      paddingRight: '0.5rem',
                    },
           
                  },
                  navbar: {
                    borderBottom: `0px solid ${borderColor}`,
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    '@media (min-width: 768px)': {
                      paddingLeft: '2rem',
                      paddingRight: '2rem',
                    },
                    backgroundColor: 'rgb(255, 255, 255)',
                  },
                  navbarMobileMenuButton: {
                    display: 'flex',
                    backgroundColor: 'rgb(255, 255, 255)',
                  },
                  navbarMobileTrigger: {
                    display: 'flex',
                    backgroundColor: 'rgb(255, 255, 255)',
                  },
                },
                variables: {
                  colorPrimary: 'hsl(var(--primary))',
                  colorText: 'hsl(var(--foreground))',
                  colorTextSecondary: 'hsl(var(--muted-foreground))',
                  colorBackground: 'hsl(var(--background))',
                  colorInputBackground: 'hsl(var(--background))',
                  colorInputText: 'hsl(var(--foreground))',
                  borderRadius: '0.2rem',
                },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

