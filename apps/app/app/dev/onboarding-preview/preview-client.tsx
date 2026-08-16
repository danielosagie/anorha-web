'use client';

/**
 * DEV-ONLY visual harness for the onboarding screens. Not linked from anywhere
 * and 404s outside development (see ./page.tsx). Onboarding needs a signed-in
 * Clerk user plus a live android-access request row, so this renders the same
 * presentational components against fixed props to make every state
 * screenshottable.
 */

import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import type { FormEvent } from 'react';
import {
  type AndroidRequestStatus,
  CREATE_ORGANIZATION_APPEARANCE,
  CreateWorkspaceScreen,
  type InstallPlatform,
  LoadingScreen,
  WorkspaceReadyScreen,
} from '../../(unauthenticated)/onboarding/onboarding-screens';
import type { PreviewState } from './preview-states';

const PREVIEW_EMAIL = 'daniel@anorha.app';

function noop() {
  return undefined;
}

function noopSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

// Clerk's <CreateOrganization/> renders nothing without a session, so the
// preview stands in a form carrying the same appearance classes.
function CreateOrganizationStandIn() {
  const { elements } = CREATE_ORGANIZATION_APPEARANCE;

  return (
    <form className={`flex flex-col ${elements.card}`} onSubmit={noopSubmit}>
      <div className="flex flex-col gap-2">
        <Label className={elements.formFieldLabel} htmlFor="preview-org-name">
          Name
        </Label>
        <Input
          className={elements.formFieldInput}
          defaultValue="Muffins Market"
          id="preview-org-name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label className={elements.formFieldLabel} htmlFor="preview-org-slug">
          Slug
        </Label>
        <Input
          className={elements.formFieldInput}
          defaultValue="muffins-market"
          id="preview-org-slug"
        />
      </div>
      <Button className="h-11 w-full sm:h-9 sm:w-auto" type="submit">
        Create organization
      </Button>
    </form>
  );
}

const ANDROID_STATUS: Partial<Record<PreviewState, AndroidRequestStatus>> = {
  'android-error': 'error',
  'android-idle': 'idle',
  'android-loading': 'loading',
  'android-saved': 'saved',
  'android-sent': 'sent',
};

function previewPlatform(state: PreviewState): InstallPlatform | null {
  if (state === 'ready-ios') {
    return 'ios';
  }
  return state.startsWith('android-') ? 'android' : null;
}

export function PreviewClient({ state }: { readonly state: PreviewState }) {
  if (state === 'loading') {
    return <LoadingScreen />;
  }

  if (state === 'create') {
    return (
      <CreateWorkspaceScreen>
        <CreateOrganizationStandIn />
      </CreateWorkspaceScreen>
    );
  }

  return (
    <WorkspaceReadyScreen
      androidError="That Google Play email already has a request."
      androidStatus={ANDROID_STATUS[state] ?? 'idle'}
      emailIsValid
      onAndroidSubmit={noopSubmit}
      onEmailChange={noop}
      onSelectAndroid={noop}
      onSelectIos={noop}
      platform={previewPlatform(state)}
      playEmail={PREVIEW_EMAIL}
    />
  );
}
