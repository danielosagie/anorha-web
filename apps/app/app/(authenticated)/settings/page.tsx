import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Separator } from '@repo/design-system/components/ui/separator';
import { UserIcon, BellIcon, ShieldIcon, CreditCardIcon, TrashIcon, SettingsIcon, ExternalLinkIcon, CheckCircleIcon } from 'lucide-react';

export default async function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5" />
            Profile
          </CardTitle>
          <CardDescription>Manage your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <div className="mt-1 p-3 border rounded-lg bg-muted/50">
                <div className="font-medium">John Doe</div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email Address</label>
              <div className="mt-1 p-3 border rounded-lg bg-muted/50">
                <div className="font-medium">john@company.com</div>
                <div className="text-sm text-green-600 mt-1">✓ Verified</div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Company</label>
              <div className="mt-1 p-3 border rounded-lg bg-muted/50">
                <div className="font-medium">Acme Corp</div>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="size-5" />
            Integrations
          </CardTitle>
          <CardDescription>Connect your favorite platforms and tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Shopify Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Shopify</div>
                  <div className="text-sm text-muted-foreground">Sync your store data</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {/* eBay Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">eBay</div>
                  <div className="text-sm text-muted-foreground">Import listings</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {/* Etsy Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium">Etsy</div>
                  <div className="text-sm text-muted-foreground">Sync shop inventory</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {/* Amazon Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium">Amazon</div>
                  <div className="text-sm text-muted-foreground">Seller Central sync</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {/* WooCommerce Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">WooCommerce</div>
                  <div className="text-sm text-muted-foreground">WordPress store sync</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {/* BigCommerce Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-medium">BigCommerce</div>
                  <div className="text-sm text-muted-foreground">Enterprise sync</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>

          <Separator />

          <Button variant="outline" className="w-full">
            Browse More Integrations
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="size-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Order updates and alerts</div>
              </div>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Usage Alerts</div>
                <div className="text-sm text-muted-foreground">When approaching limits</div>
              </div>
              <Badge variant="outline">Disabled</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Weekly Reports</div>
                <div className="text-sm text-muted-foreground">Performance summaries</div>
              </div>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Configure Notifications
          </Button>
        </CardContent>
      </Card>

      {/* Security & Billing */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldIcon className="size-5" />
              Security
            </CardTitle>
            <CardDescription>Protect your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Password</div>
                  <div className="text-sm text-muted-foreground">Last changed 30 days ago</div>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Active Sessions</div>
                  <div className="text-sm text-muted-foreground">Manage your login sessions</div>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="size-5" />
              Billing
            </CardTitle>
            <CardDescription>Manage your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Current Plan</div>
                  <div className="text-sm text-muted-foreground">Pro Plan - $79/month</div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Payment Method</div>
                  <div className="text-sm text-muted-foreground">•••• 4242</div>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Billing History</div>
                  <div className="text-sm text-muted-foreground">View past invoices</div>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>

            <Button className="w-full">
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <TrashIcon className="size-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
            <div>
              <div className="font-medium text-red-600 dark:text-red-400">Delete Account</div>
              <div className="text-sm text-muted-foreground">Permanently delete your account and all data</div>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
