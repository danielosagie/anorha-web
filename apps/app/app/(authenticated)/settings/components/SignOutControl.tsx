'use client';

import { SignOutButton } from '@clerk/nextjs';
import { Button } from '@repo/design-system/components/ui/button';
import { LogOutIcon } from 'lucide-react';

export function SignOutControl() {
  return (
    <SignOutButton>
      <Button variant="destructive" size="sm" className="gap-2">
        <LogOutIcon className="w-4 h-4" />
        Logout
      </Button>
    </SignOutButton>
  );
}


