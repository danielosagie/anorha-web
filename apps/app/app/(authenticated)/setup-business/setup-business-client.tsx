'use client';

import { COUNTRIES, US_STATES } from '@/lib/address-options';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useState } from 'react';

type BusinessAddress = {
  city: string;
  country: string;
  phone: string;
  postalCode: string;
  state: string;
  street1: string;
  street2: string;
};

const EMPTY_ADDRESS: BusinessAddress = {
  city: '',
  country: 'US',
  phone: '',
  postalCode: '',
  state: '',
  street1: '',
  street2: '',
};

const CONTROL_CLASS = 'h-11 w-full rounded-[0.875rem] bg-card shadow-none';

function Field({
  children,
  hint,
  htmlFor,
  label,
  optional,
}: {
  readonly children: ReactNode;
  readonly hint?: string;
  readonly htmlFor: string;
  readonly label: string;
  readonly optional?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label className="text-muted-foreground text-xs" htmlFor={htmlFor}>
        {label}
        {optional ? (
          <span className="font-normal text-muted-foreground/70">Optional</span>
        ) : null}
      </Label>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

export function SetupBusinessClient({
  orgId,
}: {
  readonly orgId: string;
}) {
  const router = useRouter();
  const [address, setAddress] = useState<BusinessAddress>(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const update = useCallback(
    <Key extends keyof BusinessAddress>(key: Key, value: string) => {
      setAddress((previous) => ({ ...previous, [key]: value }));
      setSaveError('');
    },
    []
  );

  // Prefill from whatever is already stored so a return visit cannot blank out
  // a saved address. A failed read is not surfaced: it only costs the prefill.
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/organizations/${orgId}/address`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const saved = data?.address;
        if (cancelled || !saved) {
          return;
        }
        setAddress({
          city: saved.city ?? '',
          country: saved.country ?? 'US',
          phone: saved.phone ?? '',
          postalCode: saved.postalCode ?? '',
          state: saved.state ?? '',
          street1: saved.street1 ?? '',
          street2: saved.street2 ?? '',
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const canSave =
    address.street1.trim() !== '' &&
    address.city.trim() !== '' &&
    address.state !== '' &&
    address.postalCode.trim() !== '';

  const save = async () => {
    if (!canSave || saving) {
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const response = await fetch(`/api/organizations/${orgId}/address`, {
        body: JSON.stringify(address),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setSaveError(data.error ?? `Save failed (${response.status}).`);
        return;
      }

      router.push('/');
    } catch {
      setSaveError('Could not reach the server. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-[42rem]">
      <CardContent className="flex flex-col gap-4 px-4 md:px-6">
        <Field htmlFor="street1" label="Street">
          <Input
            autoComplete="address-line1"
            className={CONTROL_CLASS}
            id="street1"
            onChange={(event) => update('street1', event.target.value)}
            placeholder="123 Main Street"
            value={address.street1}
          />
        </Field>

        <Field htmlFor="street2" label="Apt, suite" optional>
          <Input
            autoComplete="address-line2"
            className={CONTROL_CLASS}
            id="street2"
            onChange={(event) => update('street2', event.target.value)}
            placeholder="Suite 100"
            value={address.street2}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Field htmlFor="city" label="City">
            <Input
              autoComplete="address-level2"
              className={CONTROL_CLASS}
              id="city"
              onChange={(event) => update('city', event.target.value)}
              placeholder="Los Angeles"
              value={address.city}
            />
          </Field>
          <Field htmlFor="state" label="State">
            <Select
              onValueChange={(value) => update('state', value)}
              value={address.state}
            >
              <SelectTrigger className={CONTROL_CLASS} id="state">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="postal-code" label="ZIP">
            <Input
              autoComplete="postal-code"
              className={CONTROL_CLASS}
              id="postal-code"
              onChange={(event) => update('postalCode', event.target.value)}
              placeholder="90001"
              value={address.postalCode}
            />
          </Field>
          <Field htmlFor="country" label="Country">
            <Select
              onValueChange={(value) => update('country', value)}
              value={address.country}
            >
              <SelectTrigger className={CONTROL_CLASS} id="country">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field
          hint="Needed for eBay locations."
          htmlFor="business-phone"
          label="Phone"
        >
          <Input
            autoComplete="tel"
            className={CONTROL_CLASS}
            id="business-phone"
            onChange={(event) => update('phone', event.target.value)}
            placeholder="+1 (555) 555-5555"
            type="tel"
            value={address.phone}
          />
        </Field>

        {saveError ? (
          <div
            className="rounded-[0.875rem] border border-destructive/30 bg-destructive/8 px-4 py-3"
            role="alert"
          >
            <p className="font-semibold text-sm">Not saved</p>
            <p className="mt-0.5 text-muted-foreground text-xs">{saveError}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center">
          <Button
            className="h-11 w-full sm:h-9 sm:w-auto"
            disabled={!canSave}
            isLoading={saving}
            onClick={save}
            type="button"
          >
            Save
          </Button>
          <Button
            className="h-11 w-full sm:h-9 sm:w-auto"
            onClick={() => router.push('/')}
            type="button"
            variant="ghost"
          >
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
