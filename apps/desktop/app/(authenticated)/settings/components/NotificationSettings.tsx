'use client';

import { useEffect, useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Switch } from '@repo/design-system/components/ui/switch';
import { Label } from '@repo/design-system/components/ui/label';
import { Input } from '@repo/design-system/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Separator } from '@repo/design-system/components/ui/separator';
import { BellIcon, AlertCircleIcon, PackageIcon, BarChartIcon } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface NotificationSettings {
  syncErrors: {
    enabled: boolean;
    channels: { inApp: boolean; email: boolean };
  };
  lowStock: {
    enabled: boolean;
    threshold: number;
    channels: { inApp: boolean; email: boolean };
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  reports: {
    enabled: boolean;
    cadence: 'daily' | 'weekly';
    timeUtc: string;
    channels: { inApp: boolean; email: boolean };
  };
}

const DEFAULT_SETTINGS: NotificationSettings = {
  syncErrors: {
    enabled: true,
    channels: { inApp: true, email: true },
  },
  lowStock: {
    enabled: true,
    threshold: 10,
    channels: { inApp: true, email: true },
    frequency: 'immediate',
  },
  reports: {
    enabled: true,
    cadence: 'daily',
    timeUtc: '09:00',
    channels: { inApp: true, email: true },
  },
};

interface NotificationSettingsProps {
  orgId: string;
  isAdmin: boolean;
  userId: string;
}

export function NotificationSettings({ orgId, isAdmin, userId }: NotificationSettingsProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgSettings, setOrgSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [userOverrides, setUserOverrides] = useState<Partial<NotificationSettings> | null>(null);
  const [useOrgDefaults, setUseOrgDefaults] = useState(true);

  // Merge org settings with user overrides, falling back to defaults
  const effectiveSettings = useOrgDefaults || !userOverrides
    ? orgSettings
    : {
        syncErrors: { ...orgSettings.syncErrors, ...userOverrides.syncErrors },
        lowStock: { ...orgSettings.lowStock, ...userOverrides.lowStock },
        reports: { ...orgSettings.reports, ...userOverrides.reports },
      };

  useEffect(() => {
    loadSettings();
  }, [orgId, userId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [orgRes, userRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}/notifications`),
        fetch(`/api/users/${userId}/notifications`),
      ]);

      let loadedOrgSettings = DEFAULT_SETTINGS;
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        loadedOrgSettings = { ...DEFAULT_SETTINGS, ...orgData };
      }
      setOrgSettings(loadedOrgSettings);

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.overrides) {
          setUserOverrides(userData.overrides);
          setUseOrgDefaults(false);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (isAdmin) {
        // Save org settings
        await fetch(`/api/organizations/${orgId}/notifications`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orgSettings),
        });
      }

      // Save user overrides
      await fetch(`/api/users/${userId}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overrides: useOrgDefaults ? null : userOverrides,
        }),
      });

      await loadSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateOrgSetting = (path: string[], value: any) => {
    const newSettings = { ...orgSettings };
    let current: any = newSettings;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setOrgSettings(newSettings);
  };

  const updateUserOverride = (path: string[], value: any) => {
    const newOverrides = { ...userOverrides } as any;
    let current: any = newOverrides;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setUserOverrides(newOverrides);
  };

  const updateSetting = (path: string[], value: any) => {
    if (useOrgDefaults && isAdmin) {
      updateOrgSetting(path, value);
    } else {
      updateUserOverride(path, value);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading notification settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Sync Errors */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircleIcon className="size-5 text-orange-500" />
          <div>
            <Label className="text-base font-semibold">Sync Errors</Label>
            <p className="text-sm text-muted-foreground">Receive notifications when platform syncs fail</p>
          </div>
        </div>
        <div className="ml-7 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="sync-errors-enabled">Enable sync error notifications</Label>
            <Switch
              id="sync-errors-enabled"
              checked={effectiveSettings.syncErrors.enabled}
              onCheckedChange={(checked) => updateSetting(['syncErrors', 'enabled'], checked)}
              disabled={!isAdmin && useOrgDefaults}
            />
          </div>
          {effectiveSettings.syncErrors.enabled && (
            <div className="ml-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sync-errors-inapp" className="text-sm">In-app notifications</Label>
                <Switch
                  id="sync-errors-inapp"
                  checked={effectiveSettings.syncErrors.channels.inApp}
                  onCheckedChange={(checked) => updateSetting(['syncErrors', 'channels', 'inApp'], checked)}
                  disabled={!isAdmin && useOrgDefaults}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sync-errors-email" className="text-sm">Email notifications</Label>
                <Switch
                  id="sync-errors-email"
                  checked={effectiveSettings.syncErrors.channels.email}
                  onCheckedChange={(checked) => updateSetting(['syncErrors', 'channels', 'email'], checked)}
                  disabled={!isAdmin && useOrgDefaults}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Low Stock Alerts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <PackageIcon className="size-5 text-blue-500" />
          <div>
            <Label className="text-base font-semibold">Low Stock Alerts</Label>
            <p className="text-sm text-muted-foreground">Get notified when inventory falls below threshold</p>
          </div>
        </div>
        <div className="ml-7 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="low-stock-enabled">Enable low stock alerts</Label>
            <Switch
              id="low-stock-enabled"
              checked={effectiveSettings.lowStock.enabled}
              onCheckedChange={(checked) => updateSetting(['lowStock', 'enabled'], checked)}
              disabled={!isAdmin && useOrgDefaults}
            />
          </div>
          {effectiveSettings.lowStock.enabled && (
            <div className="ml-4 space-y-3">
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="low-stock-threshold" className="text-sm">Stock threshold</Label>
                  <Input
                    id="low-stock-threshold"
                    type="number"
                    min="1"
                    value={effectiveSettings.lowStock.threshold}
                    onChange={(e) => updateSetting(['lowStock', 'threshold'], parseInt(e.target.value) || 10)}
                    disabled={useOrgDefaults && !isAdmin}
                    className="w-24"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm">Alert frequency</Label>
                <Select
                  value={effectiveSettings.lowStock.frequency}
                  onValueChange={(value) => updateSetting(['lowStock', 'frequency'], value)}
                  disabled={!isAdmin && useOrgDefaults}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="low-stock-inapp" className="text-sm">In-app notifications</Label>
                <Switch
                  id="low-stock-inapp"
                  checked={effectiveSettings.lowStock.channels.inApp}
                  onCheckedChange={(checked) => updateSetting(['lowStock', 'channels', 'inApp'], checked)}
                  disabled={!isAdmin && useOrgDefaults}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="low-stock-email" className="text-sm">Email notifications</Label>
                <Switch
                  id="low-stock-email"
                  checked={effectiveSettings.lowStock.channels.email}
                  onCheckedChange={(checked) => updateSetting(['lowStock', 'channels', 'email'], checked)}
                  disabled={!isAdmin && useOrgDefaults}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Inventory Reports */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChartIcon className="size-5 text-green-500" />
          <div>
            <Label className="text-base font-semibold">Inventory Reports</Label>
            <p className="text-sm text-muted-foreground">Receive periodic summaries of your inventory</p>
          </div>
        </div>
        <div className="ml-7 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="reports-enabled">Enable inventory reports</Label>
            <Switch
              id="reports-enabled"
              checked={effectiveSettings.reports.enabled}
              onCheckedChange={(checked) => updateSetting(['reports', 'enabled'], checked)}
              disabled={!isAdmin && useOrgDefaults}
            />
          </div>
          {effectiveSettings.reports.enabled && (
            <div className="ml-4 space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Report frequency</Label>
                <Select
                  value={effectiveSettings.reports.cadence}
                  onValueChange={(value) => updateSetting(['reports', 'cadence'], value)}
                  disabled={!isAdmin && useOrgDefaults}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="reports-time" className="text-sm">Report time (UTC)</Label>
                  <Input
                    id="reports-time"
                    type="time"
                    value={effectiveSettings.reports.timeUtc}
                    onChange={(e) => updateSetting(['reports', 'timeUtc'], e.target.value)}
                    disabled={useOrgDefaults && !isAdmin}
                    className="w-32"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="reports-inapp" className="text-sm">In-app notifications</Label>
                <Switch
                  id="reports-inapp"
                  checked={effectiveSettings.reports.channels.inApp}
                  onCheckedChange={(checked) => updateSetting(['reports', 'channels', 'inApp'], checked)}
                  disabled={!isAdmin && useOrgDefaults}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reports-email" className="text-sm">Email notifications</Label>
                <Switch
                  id="reports-email"
                  checked={effectiveSettings.reports.channels.email}
                  onCheckedChange={(checked) => updateSetting(['reports', 'channels', 'email'], checked)}
                  disabled={!isAdmin && useOrgDefaults}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {!isAdmin && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="use-org-defaults">Use organization defaults</Label>
              <p className="text-sm text-muted-foreground">Use the settings configured by your organization admin</p>
            </div>
            <Switch
              id="use-org-defaults"
              checked={useOrgDefaults}
              onCheckedChange={setUseOrgDefaults}
            />
          </div>
        </>
      )}

      <div className="pt-4">
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Update notifications'}
        </Button>
      </div>
    </div>
  );
}

