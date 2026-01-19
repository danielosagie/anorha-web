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
  active: 'bg-[#647653] text-white',
  inactive: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  syncing: 'bg-blue-100 text-blue-800',
  reconciling: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-amber-100 text-amber-800',
  review: 'bg-amber-100 text-amber-800',
  ready_to_sync: 'bg-lime-100 text-lime-800',
};

type SettingsTab = 'profile' | 'business' | 'integrations' | 'notifications';

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

  // Notification Preferences State
  const [preferences, setPreferences] = React.useState({
    jobCompletions: true,
    inventorySharing: true,
    sproutInsights: true,
    syncAlerts: true,
    marketingUpdates: false,
  });
  const [isLoadingPreferences, setIsLoadingPreferences] = React.useState(false);

  // Business Address State
  const [businessAddress, setBusinessAddress] = React.useState({
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });
  const [isLoadingAddress, setIsLoadingAddress] = React.useState(false);
  const [addressSaved, setAddressSaved] = React.useState(false);

  const loadPreferences = React.useCallback(async () => {
    try {
      setIsLoadingPreferences(true);
      const res = await fetch('/api/notifications/preferences');
      if (res.ok) {
        const data = await res.json();
        setPreferences({
          jobCompletions: data.jobCompletions ?? true,
          inventorySharing: data.inventorySharing ?? true,
          sproutInsights: data.sproutInsights ?? true,
          syncAlerts: data.syncAlerts ?? true,
          marketingUpdates: data.marketingUpdates ?? false,
        });
      }
    } catch (err) {
      console.error('Failed to load prefs', err);
    } finally {
      setIsLoadingPreferences(false);
    }
  }, []);

  const togglePreference = async (key: keyof typeof preferences) => {
    const newValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    try {
      await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue })
      });
    } catch (err) {
      console.error('Failed to update preference:', err);
      setPreferences(prev => ({ ...prev, [key]: !newValue })); // Revert
    }
  };

  React.useEffect(() => {
    if (activeTab === 'notifications') {
      loadPreferences();
    }
    if (activeTab === 'business') {
      loadBusinessAddress();
    }
  }, [activeTab, loadPreferences]);

  const loadBusinessAddress = React.useCallback(async () => {
    try {
      setIsLoadingAddress(true);
      const res = await fetch(`/api/organizations/${orgId}/address`);
      if (res.ok) {
        const data = await res.json();
        if (data.address) {
          setBusinessAddress({
            street1: data.address.street1 || '',
            street2: data.address.street2 || '',
            city: data.address.city || '',
            state: data.address.state || '',
            postalCode: data.address.postalCode || '',
            country: data.address.country || 'US',
          });
        }
      }
    } catch (err) {
      console.error('Failed to load address', err);
    } finally {
      setIsLoadingAddress(false);
    }
  }, [orgId]);

  const saveBusinessAddress = async () => {
    try {
      setIsLoadingAddress(true);
      await fetch(`/api/organizations/${orgId}/address`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessAddress),
      });
      setAddressSaved(true);
      setTimeout(() => setAddressSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save address:', err);
    } finally {
      setIsLoadingAddress(false);
    }
  };

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
    { id: 'business', label: 'Business' },
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
                        onSelect={() => { }}
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

        {activeTab === 'business' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Business</h2>
              <p className="text-gray-600">Manage your business address for shipping, returns, and platform setup.</p>
            </div>

            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Business Address</CardTitle>
                <CardDescription>This address is used for eBay locations, return policies, and shipping.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAddress ? (
                  <p className="text-sm text-gray-500">Loading address...</p>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Street Address</label>
                      <input
                        type="text"
                        placeholder="123 Main Street"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#647653]"
                        value={businessAddress.street1}
                        onChange={(e) => setBusinessAddress(prev => ({ ...prev, street1: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Apt, Suite, Unit (optional)</label>
                      <input
                        type="text"
                        placeholder="Suite 100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#647653]"
                        value={businessAddress.street2}
                        onChange={(e) => setBusinessAddress(prev => ({ ...prev, street2: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">City</label>
                        <input
                          type="text"
                          placeholder="Los Angeles"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#647653]"
                          value={businessAddress.city}
                          onChange={(e) => setBusinessAddress(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">State</label>
                        <input
                          type="text"
                          placeholder="CA"
                          maxLength={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#647653] uppercase"
                          value={businessAddress.state}
                          onChange={(e) => setBusinessAddress(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">ZIP Code</label>
                        <input
                          type="text"
                          placeholder="90001"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#647653]"
                          value={businessAddress.postalCode}
                          onChange={(e) => setBusinessAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Country</label>
                        <input
                          type="text"
                          placeholder="US"
                          maxLength={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#647653] uppercase"
                          value={businessAddress.country}
                          onChange={(e) => setBusinessAddress(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <Button
                        className="bg-[#647653] hover:bg-[#556145] text-white"
                        onClick={saveBusinessAddress}
                        disabled={isLoadingAddress}
                      >
                        {isLoadingAddress ? 'Saving...' : 'Save Address'}
                      </Button>
                      {addressSaved && (
                        <span className="text-sm text-green-600">✓ Address saved!</span>
                      )}
                    </div>
                  </>
                )}
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



                              <Badge className={statusClasses}>
                                {connection.Status
                                  ? connection.Status.charAt(0).toUpperCase() +
                                  connection.Status.slice(1).replace('_', ' ')
                                  : 'Inactive'}
                              </Badge>



                              {connection.LastSyncSuccessAt && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Last synced:{' '}
                                  {new Date(connection.LastSyncSuccessAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">

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
              <p className="text-gray-600">Configure how you receive alerts and updates.</p>
            </div>

            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage which events trigger notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingPreferences ? (
                  <p className="text-sm text-gray-500">Loading preferences...</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <NetworkIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">Job Completions</div>
                          <div className="text-sm text-gray-600">Get notified when AI processing, matching, or scanning finishes.</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#647653]"
                        checked={preferences.jobCompletions}
                        onChange={() => togglePreference('jobCompletions')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <UsersIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">Inventory Sharing</div>
                          <div className="text-sm text-gray-600">When partners share new inventory with you.</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#647653]"
                        checked={preferences.inventorySharing}
                        onChange={() => togglePreference('inventorySharing')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <SettingsIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">Sprout Insights</div>
                          <div className="text-sm text-gray-600">AI-driven insights and opportunities.</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#647653]"
                        checked={preferences.sproutInsights}
                        onChange={() => togglePreference('sproutInsights')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <BellIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">Sync Alerts</div>
                          <div className="text-sm text-gray-600">Critical issues with platform connections.</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#647653]"
                        checked={preferences.syncAlerts}
                        onChange={() => togglePreference('syncAlerts')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <ExternalLinkIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">Marketing Updates</div>
                          <div className="text-sm text-gray-600">News and updates about Anorha.</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#647653]"
                        checked={preferences.marketingUpdates}
                        onChange={() => togglePreference('marketingUpdates')}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

