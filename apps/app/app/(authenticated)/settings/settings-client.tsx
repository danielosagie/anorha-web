'use client';

import React from 'react';
import Image, { type StaticImageData } from 'next/image';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Calendar } from '@repo/design-system/components/ui/calendar'
import { Separator } from '@repo/design-system/components/ui/separator';
import { ExternalLinkIcon, SettingsIcon, UsersIcon, Building2Icon, CreditCardIcon, LogOutIcon, NetworkIcon, MapIcon, BellIcon } from 'lucide-react';
import { cn } from '@repo/design-system/lib/utils';
import { NotificationSettings } from './components/NotificationSettings';
import { SignOutControl } from './components/SignOutControl';
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from '@repo/design-system/components/ui/popover'
import shopifyLogo from '../../assets/shopify.png';
import squareLogo from '../../assets/square.png';
import cloverLogo from '../../assets/clover.png';
import amazonLogo from '../../assets/amazon.png';
import ebayLogo from '../../assets/ebay.png';
import facebookLogo from '../../assets/facebook.png';
import whatnotLogo from '../../assets/whatnot.png';

type Connection = {
  Id: string;
  PlatformType: string;
  DisplayName: string;
  Status?: string | null;
  IsEnabled?: boolean | null;
  LastSyncSuccessAt?: string | null;
};

type PlatformLogo = {
  src: StaticImageData;
  alt: string;
};

const PLATFORM_LOGOS: Record<string, PlatformLogo> = {
  shopify: { src: shopifyLogo, alt: 'Shopify' },
  square: { src: squareLogo, alt: 'Square' },
  clover: { src: cloverLogo, alt: 'Clover' },
  amazon: { src: amazonLogo, alt: 'Amazon' },
  ebay: { src: ebayLogo, alt: 'eBay' },
  facebook: { src: facebookLogo, alt: 'Facebook' },
  whatnot: { src: whatnotLogo, alt: 'Whatnot' },
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  syncing: 'bg-blue-100 text-blue-800',
  reconciling: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-amber-100 text-amber-800',
  review: 'bg-amber-100 text-amber-800',
  ready_to_sync: 'bg-lime-100 text-lime-800',
};

type SettingsTab = 'profile' | 'integrations' | 'notifications';

interface SettingsClientProps {
  orgId: string;
  isAdmin: boolean;
  userId: string;
  subscription: any;
  nextDue: Date | null;
  pools: Array<{ id: string; name: string; description?: string }>;
}

export function SettingsClient({
  orgId,
  isAdmin,
  userId,
  subscription,
  nextDue,
  pools: _pools,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('profile');
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = React.useState(false);
  const [connectionsError, setConnectionsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadConnections = async () => {
      try {
        setIsLoadingConnections(true);
        setConnectionsError(null);

        const res = await fetch('/api/connections', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Failed to load connections (${res.status})`);
        }

        const data = await res.json();
        if (!isMounted) return;

        setConnections(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        console.error('[SettingsClient] Error loading connections:', error);
        setConnectionsError('Unable to load integrations right now.');
        setConnections([]);
      } finally {
        if (isMounted) {
          setIsLoadingConnections(false);
        }
      }
    };

    loadConnections();

    return () => {
      isMounted = false;
    };
  }, []);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="flex flex-col lg:flex-row border-t-2 border-gray-100 gap-6 w-full">
      
      {/* Sidebar Navigation - Responsive */}
      <div className="w-full lg:w-48 flex-shrink-0 h-full">
        <div className=" rounded-lg p-4 text-align-l lg:sticky lg:top-0">
          <nav className="space-y-2 flex flex-row lg:flex-col flex-wrap lg:flex-nowrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 lg:flex-none lg:w-full text-left px-4 py-2 rounded-md transition-colors font-medium text-sm',
                  activeTab === tab.id
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <div className="flex-1 space-y-6 h-full pt-4">
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Profile</h2>
              <p className="text-gray-600">Update your account settings. Set your preferred language and timezone.</p>
            </div>

            <Card className="border border-gray-200">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#647653]"
                  />
                  <p className="text-xs text-gray-500 mt-1">This is the name that will be displayed on your profile and in emails.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date of birth</label>
                  {/* Use shadcn popover calendar with same input */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <input
                        type="date"
                        placeholder="Pick a date"
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#647653]"
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={undefined}
                        onSelect={() => {}}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-500 mt-1">Your date of birth is used to calculate your age.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#647653]">
                    <option>Select Language</option>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">This is the language that will be used in the dashboard.</p>
                </div>

                <Button className="bg-[#647653] hover:bg-[#556145] text-white">Update account</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-4 h-full">
            <div>
              <h2 className="text-2xl font-bold">Integrations</h2>
              <p className="text-gray-600">Manage your connected inventory sources/marketplaces</p>
            </div>

            <Card className="border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Connected Platforms</CardTitle>
                  <CardDescription>Your active integrations</CardDescription>
                </div>
                <Button
                  className="bg-[#647653] hover:bg-[#556145] text-white opacity-70 cursor-not-allowed"
                  disabled
                >
                  + Connect New Platform
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoadingConnections && (
                    <p className="text-sm text-gray-500">Loading your integrations...</p>
                  )}

                  {!isLoadingConnections && connectionsError && (
                    <p className="text-sm text-red-500">{connectionsError}</p>
                  )}

                  {!isLoadingConnections && !connectionsError && connections.length === 0 && (
                    <p className="text-sm text-gray-500">No integrations connected yet.</p>
                  )}

                  {!isLoadingConnections &&
                    !connectionsError &&
                    connections.map((connection) => {
                      const platformKey = connection.PlatformType?.toLowerCase() || 'unknown';
                      const logo = PLATFORM_LOGOS[platformKey];
                      const statusKey = (connection.Status || 'inactive').toLowerCase();
                      const statusClasses =
                        STATUS_BADGE_CLASSES[statusKey] || 'bg-gray-100 text-gray-800';
                      const displayName =
                        connection.DisplayName || connection.PlatformType || 'Unknown connection';

                      return (
                        <div
                          key={connection.Id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-md overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                              {logo ? (
                                <Image
                                  src={logo.src}
                                  alt={logo.alt}
                                  fill
                                  className="object-contain p-1"
                                />
                              ) : (
                                <span className="text-xs font-medium text-gray-500">
                                  {platformKey.charAt(0).toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{displayName}</div>
                              <div className="text-xs text-gray-500">
                                {platformKey.charAt(0).toUpperCase() + platformKey.slice(1)}{' '}
                                Account
                              </div>
                              {connection.LastSyncSuccessAt && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Last synced:{' '}
                                  {new Date(connection.LastSyncSuccessAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <Badge className={statusClasses}>
                              {connection.Status
                                ? connection.Status.charAt(0).toUpperCase() +
                                  connection.Status.slice(1).replace('_', ' ')
                                : 'Inactive'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className={
                                connection.IsEnabled
                                  ? 'bg-[#647653] text-white opacity-80 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-600 opacity-80 cursor-not-allowed'
                              }
                            >
                              {connection.IsEnabled ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4 h-full">
            <div>
              <h2 className="text-2xl font-bold">Notifications</h2>
              <p className="text-gray-600">Configure how you receive notifications.</p>
            </div>

            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">Communication emails</div>
                    <div className="text-sm text-gray-600">Receive emails about your account activity.</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">Marketing emails</div>
                    <div className="text-sm text-gray-600">Receive emails about new products, features, and more.</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">Social emails</div>
                    <div className="text-sm text-gray-600">Receive emails for friend requests, follows, and more.</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">Security emails</div>
                    <div className="text-sm text-gray-600">Receive emails about your account activity and security.</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>

                <Button className="bg-[#647653] hover:bg-[#556145] text-white">Update notifications</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

