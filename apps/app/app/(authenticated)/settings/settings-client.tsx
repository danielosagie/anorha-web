'use client';

import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Calendar } from '@repo/design-system/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/design-system/components/ui/popover';
import { Switch } from '@repo/design-system/components/ui/switch';
import { cn } from '@repo/design-system/lib/utils';
import {
  BellIcon,
  Building2Icon,
  ExternalLinkIcon,
  NetworkIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import Image, { type StaticImageData } from 'next/image';
import React from 'react';
import amazonLogo from '../../assets/amazon.png';
import cloverLogo from '../../assets/clover.png';
import ebayLogo from '../../assets/ebay.png';
import facebookLogo from '../../assets/facebook.png';
import shopifyLogo from '../../assets/shopify.png';
import squareLogo from '../../assets/square.png';
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
  active: 'border-transparent bg-primary/15 text-accent-foreground',
  inactive: 'bg-muted text-muted-foreground',
  error: 'border-transparent bg-destructive/10 text-destructive',
  syncing: 'bg-muted text-foreground',
  reconciling: 'border-transparent bg-warning/10 text-warning',
  pending: 'border-transparent bg-warning/10 text-warning',
  review: 'border-transparent bg-warning/10 text-warning',
  ready_to_sync: 'border-transparent bg-primary/15 text-accent-foreground',
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
  const [connectionsError, setConnectionsError] = React.useState<string | null>(
    null
  );

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
    phone: '',
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
    setPreferences((prev) => ({ ...prev, [key]: newValue }));

    try {
      await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      });
    } catch (err) {
      console.error('Failed to update preference:', err);
      setPreferences((prev) => ({ ...prev, [key]: !newValue })); // Revert
    }
  };

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
            phone: data.address.phone || '',
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
    if (activeTab === 'notifications') {
      loadPreferences();
    }
    if (activeTab === 'business') {
      loadBusinessAddress();
    }
  }, [activeTab, loadPreferences, loadBusinessAddress]);

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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: SettingsIcon },
    { id: 'business', label: 'Business', icon: Building2Icon },
    { id: 'integrations', label: 'Integrations', icon: NetworkIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
  ];

  return (
    <div className="anorha-settings grid w-full gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] xl:gap-10">
      {/* Sidebar Navigation - Responsive */}
      <div className="min-w-0">
        <div className="lg:sticky lg:top-20">
          <nav
            className="flex gap-2 overflow-x-auto rounded-2xl bg-muted/70 p-1.5 lg:flex-col"
            aria-label="Settings sections"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={cn(
                  'flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring lg:w-full',
                  activeTab === tab.id
                    ? 'bg-card text-accent-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <div className="min-w-0 max-w-4xl">
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-extrabold text-xl tracking-[-0.02em]">
                Profile
              </h2>
              <p className="mt-1 font-medium text-muted-foreground text-sm">
                Set the identity and defaults Anorha uses for your account.
              </p>
            </div>

            <Card>
              <CardContent className="flex flex-col gap-5 px-5 py-5 md:px-6 md:py-6">
                <div>
                  <label className="mb-2 block font-medium text-sm">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#647653]"
                  />
                  <p className="mt-1 text-gray-500 text-xs">
                    This is the name that will be displayed on your profile and
                    in emails.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-sm">
                    Date of birth
                  </label>
                  {/* Use shadcn popover calendar with same input */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <input
                        type="date"
                        placeholder="Pick a date"
                        className="rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#647653]"
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
                  <p className="mt-1 text-gray-500 text-xs">
                    Your date of birth is used to calculate your age.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-sm">
                    Language
                  </label>
                  <select className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#647653]">
                    <option>Select Language</option>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                  <p className="mt-1 text-gray-500 text-xs">
                    This is the language that will be used in the dashboard.
                  </p>
                </div>

                <Button className="h-11 self-start px-5">Update account</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-extrabold text-xl tracking-[-0.02em]">
                Business
              </h2>
              <p className="mt-1 font-medium text-muted-foreground text-sm">
                Manage the address used for shipping, returns, and channel
                setup.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Business Address</CardTitle>
                <CardDescription>
                  This address is used for eBay locations, return policies, and
                  shipping.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAddress ? (
                  <p className="text-gray-500 text-sm">Loading address...</p>
                ) : (
                  <>
                    <div>
                      <label className="mb-2 block font-medium text-sm">
                        Street Address
                      </label>
                      <input
                        type="text"
                        placeholder="123 Main Street"
                        className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#647653]"
                        value={businessAddress.street1}
                        onChange={(e) =>
                          setBusinessAddress((prev) => ({
                            ...prev,
                            street1: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-medium text-sm">
                        Apt, Suite, Unit (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Suite 100"
                        className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#647653]"
                        value={businessAddress.street2}
                        onChange={(e) =>
                          setBusinessAddress((prev) => ({
                            ...prev,
                            street2: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-medium text-sm">
                        Business Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 555-5555"
                        className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#647653]"
                        value={businessAddress.phone}
                        onChange={(e) =>
                          setBusinessAddress((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                      <p className="mt-1 text-gray-500 text-xs">
                        Required for eBay location creation.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="mb-2 block font-medium text-sm">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="Los Angeles"
                          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#647653]"
                          value={businessAddress.city}
                          onChange={(e) =>
                            setBusinessAddress((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-2 block font-medium text-sm">
                          State
                        </label>
                        <select
                          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#647653]"
                          value={businessAddress.state}
                          onChange={(e) =>
                            setBusinessAddress((prev) => ({
                              ...prev,
                              state: e.target.value,
                            }))
                          }
                          autoComplete="address-level1"
                        >
                          <option value="">Select State</option>
                          <option value="AL">Alabama</option>
                          <option value="AK">Alaska</option>
                          <option value="AZ">Arizona</option>
                          <option value="AR">Arkansas</option>
                          <option value="CA">California</option>
                          <option value="CO">Colorado</option>
                          <option value="CT">Connecticut</option>
                          <option value="DE">Delaware</option>
                          <option value="FL">Florida</option>
                          <option value="GA">Georgia</option>
                          <option value="HI">Hawaii</option>
                          <option value="ID">Idaho</option>
                          <option value="IL">Illinois</option>
                          <option value="IN">Indiana</option>
                          <option value="IA">Iowa</option>
                          <option value="KS">Kansas</option>
                          <option value="KY">Kentucky</option>
                          <option value="LA">Louisiana</option>
                          <option value="ME">Maine</option>
                          <option value="MD">Maryland</option>
                          <option value="MA">Massachusetts</option>
                          <option value="MI">Michigan</option>
                          <option value="MN">Minnesota</option>
                          <option value="MS">Mississippi</option>
                          <option value="MO">Missouri</option>
                          <option value="MT">Montana</option>
                          <option value="NE">Nebraska</option>
                          <option value="NV">Nevada</option>
                          <option value="NH">New Hampshire</option>
                          <option value="NJ">New Jersey</option>
                          <option value="NM">New Mexico</option>
                          <option value="NY">New York</option>
                          <option value="NC">North Carolina</option>
                          <option value="ND">North Dakota</option>
                          <option value="OH">Ohio</option>
                          <option value="OK">Oklahoma</option>
                          <option value="OR">Oregon</option>
                          <option value="PA">Pennsylvania</option>
                          <option value="RI">Rhode Island</option>
                          <option value="SC">South Carolina</option>
                          <option value="SD">South Dakota</option>
                          <option value="TN">Tennessee</option>
                          <option value="TX">Texas</option>
                          <option value="UT">Utah</option>
                          <option value="VT">Vermont</option>
                          <option value="VA">Virginia</option>
                          <option value="WA">Washington</option>
                          <option value="WV">West Virginia</option>
                          <option value="WI">Wisconsin</option>
                          <option value="WY">Wyoming</option>
                          <option value="DC">District of Columbia</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block font-medium text-sm">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          placeholder="90001"
                          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#647653]"
                          value={businessAddress.postalCode}
                          onChange={(e) =>
                            setBusinessAddress((prev) => ({
                              ...prev,
                              postalCode: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-2 block font-medium text-sm">
                          Country
                        </label>
                        <select
                          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#647653]"
                          value={businessAddress.country}
                          onChange={(e) =>
                            setBusinessAddress((prev) => ({
                              ...prev,
                              country: e.target.value,
                            }))
                          }
                          autoComplete="country"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="AU">Australia</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="JP">Japan</option>
                          <option value="CN">China</option>
                          <option value="MX">Mexico</option>
                          <option value="BR">Brazil</option>
                          <option value="IN">India</option>
                          <option value="IT">Italy</option>
                          <option value="ES">Spain</option>
                          <option value="NL">Netherlands</option>
                          <option value="KR">South Korea</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <Button
                        className="h-11 px-5"
                        onClick={saveBusinessAddress}
                        disabled={isLoadingAddress}
                      >
                        {isLoadingAddress ? 'Saving...' : 'Save Address'}
                      </Button>
                      {addressSaved && (
                        <span className="font-semibold text-accent-foreground text-sm">
                          Address saved
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-extrabold text-xl tracking-[-0.02em]">
                Integrations
              </h2>
              <p className="mt-1 font-medium text-muted-foreground text-sm">
                See the channels that feed and publish your inventory.
              </p>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Connected Platforms</CardTitle>
                  <CardDescription>Your active integrations</CardDescription>
                </div>
                <Button variant="outline" disabled>
                  + Connect New Platform
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {isLoadingConnections && (
                    <p className="text-gray-500 text-sm">
                      Loading your integrations...
                    </p>
                  )}

                  {!isLoadingConnections && connectionsError && (
                    <p className="text-red-500 text-sm">{connectionsError}</p>
                  )}

                  {!isLoadingConnections &&
                    !connectionsError &&
                    connections.length === 0 && (
                      <p className="text-gray-500 text-sm">
                        No integrations connected yet.
                      </p>
                    )}

                  {!isLoadingConnections &&
                    !connectionsError &&
                    connections.map((connection) => {
                      const platformKey =
                        connection.PlatformType?.toLowerCase() || 'unknown';
                      const logo = PLATFORM_LOGOS[platformKey];
                      const statusKey = (
                        connection.Status || 'inactive'
                      ).toLowerCase();
                      const statusClasses =
                        STATUS_BADGE_CLASSES[statusKey] ||
                        'bg-gray-100 text-gray-800';
                      const displayName =
                        connection.DisplayName ||
                        connection.PlatformType ||
                        'Unknown connection';

                      return (
                        <div
                          key={connection.Id}
                          className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border bg-card p-3.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-xl border bg-card">
                              {logo ? (
                                <Image
                                  src={logo.src}
                                  alt={logo.alt}
                                  fill
                                  className="object-contain p-1"
                                />
                              ) : (
                                <span className="font-medium text-gray-500 text-xs">
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
                                <div className="mt-1 text-gray-400 text-xs">
                                  Last synced:{' '}
                                  {new Date(
                                    connection.LastSyncSuccessAt
                                  ).toLocaleString()}
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
                                  ? 'border-primary/30 bg-primary/10 text-accent-foreground'
                                  : 'bg-muted text-muted-foreground'
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
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-extrabold text-xl tracking-[-0.02em]">
                Notifications
              </h2>
              <p className="mt-1 font-medium text-muted-foreground text-sm">
                Choose the moments that are worth interrupting you for.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage which events trigger notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {isLoadingPreferences ? (
                  <p className="text-gray-500 text-sm">
                    Loading preferences...
                  </p>
                ) : (
                  <>
                    <div className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border p-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <NetworkIcon className="size-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            Job completions
                          </div>
                          <div className="font-medium text-muted-foreground text-sm">
                            When processing, matching, or scanning finishes.
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.jobCompletions}
                        onCheckedChange={() =>
                          togglePreference('jobCompletions')
                        }
                        aria-label="Job completion notifications"
                      />
                    </div>

                    <div className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border p-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <UsersIcon className="size-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            Inventory sharing
                          </div>
                          <div className="font-medium text-muted-foreground text-sm">
                            When a partner shares new inventory with you.
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.inventorySharing}
                        onCheckedChange={() =>
                          togglePreference('inventorySharing')
                        }
                        aria-label="Inventory sharing notifications"
                      />
                    </div>

                    <div className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border p-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <SettingsIcon className="size-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            Sprout insights
                          </div>
                          <div className="font-medium text-muted-foreground text-sm">
                            Useful opportunities surfaced by Sprout.
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.sproutInsights}
                        onCheckedChange={() =>
                          togglePreference('sproutInsights')
                        }
                        aria-label="Sprout insight notifications"
                      />
                    </div>

                    <div className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border p-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <BellIcon className="size-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">Sync alerts</div>
                          <div className="font-medium text-muted-foreground text-sm">
                            Problems that need attention on a connected channel.
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.syncAlerts}
                        onCheckedChange={() => togglePreference('syncAlerts')}
                        aria-label="Sync alert notifications"
                      />
                    </div>

                    <div className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border p-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <ExternalLinkIcon className="size-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            Product updates
                          </div>
                          <div className="font-medium text-muted-foreground text-sm">
                            Occasional news about what is new in Anorha.
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.marketingUpdates}
                        onCheckedChange={() =>
                          togglePreference('marketingUpdates')
                        }
                        aria-label="Product update notifications"
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
