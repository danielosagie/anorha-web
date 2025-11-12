'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Header } from '../components/header';
import MemberPermissionsPage from './components/MemberPermissionsPage';
import { Settings } from 'lucide-react';

import { OrganizationProfile, OrganizationSwitcher } from '@clerk/nextjs';


export default function TeamPage() {
  const [borderColor, setBorderColor] = useState('rgba(0, 0, 0, 0)');

  return (
    <div className="flex flex-1 flex-col p-2 min-h-[100vh]" style={{ backgroundColor: '#FEF4DD' }}>
      <div className="bg-[#FFFCF5] rounded-lg border-2 p-4 flex flex-col flex-1 overflow-hidden" style={{ borderColor: '#AFAFAF' }}>
        <Header page="Team"></Header>
        <div className="flex flex-1 min-h-0 flex-col rounded-lg border-2 border-[#E4E4E7]">
              <OrganizationProfile
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: {
                      boxShadow: 'none',
                      width: '100%',
                      height: '100%',
                      minWidth: '100%',
                      minHeight: 0,
                      margin: 0,
                      padding: 0,
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
                      minWidth: "100%",
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
              >
                {/* @ts-ignore - OrganizationProfile.Page exists at runtime per Clerk docs */}
                <OrganizationProfile.Page
                  label="Permissions"
                  url="permissions"
                  labelIcon={<Settings className="w-4 h-4" />}
                >
                  <MemberPermissionsPage />
                </OrganizationProfile.Page>
              </OrganizationProfile>
        </div>
      </div>
    </div>
  );
}

