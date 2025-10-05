import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { UsersIcon, UserPlusIcon, CrownIcon, SettingsIcon } from 'lucide-react';

export default async function TeamPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage team members and permissions
          </p>
        </div>

        <Button>
          <UserPlusIcon className="mr-2 size-4" />
          Invite Member
        </Button>
      </div>
    
      {/* Team Overview */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Team Members */}
        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="size-5" />
              Team Members
            </CardTitle>
            <CardDescription>Current team members and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">JD</span>
                  </div>
                  <div>
                    <div className="font-medium">John Doe</div>
                    <div className="text-sm text-muted-foreground">john@company.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                    <CrownIcon className="mr-1 size-3" />
                    Owner
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <SettingsIcon className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">SM</span>
                  </div>
                  <div>
                    <div className="font-medium">Sarah Miller</div>
                    <div className="text-sm text-muted-foreground">sarah@company.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Admin</Badge>
                  <Button variant="ghost" size="sm">
                    <SettingsIcon className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">MJ</span>
                  </div>
                  <div>
                    <div className="font-medium">Mike Johnson</div>
                    <div className="text-sm text-muted-foreground">mike@company.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Member</Badge>
                  <Button variant="ghost" size="sm">
                    <SettingsIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invitations */}
        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Invitations waiting for response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">alex@design.co</div>
                  <div className="text-sm text-muted-foreground">Invited 2 days ago</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700">Pending</Badge>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="text-center py-8 text-muted-foreground">
                <UserPlusIcon className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending invitations</p>
              </div>
            </div>

            <Button className="w-full mt-6">
              <UserPlusIcon className="mr-2 size-4" />
              Send New Invitation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
