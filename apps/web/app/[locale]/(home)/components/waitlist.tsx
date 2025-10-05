"use client";

import { useState, useTransition } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { cn } from '@repo/design-system/lib/utils';
import { MoveRight, Send, Mail } from 'lucide-react';

type WaitlistProps = {
  className?: string;
};

export function Waitlist({ className }: WaitlistProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        // simple client-side validation to avoid unnecessary requests
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error('Please enter a valid email address');
        }
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const contentType = res.headers.get('content-type') || '';
        let json: any = null;
        if (contentType.includes('application/json')) {
          json = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text.slice(0, 200));
        }
        if (!res.ok) throw new Error(json?.error || 'Failed to join waitlist');
        setSubmitted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  };

  return (
    <div className={cn('w-full rounded-xl border-white bg-background p-4', className)} style={{backgroundColor: '#FFFBF1B2'}}>
      {!submitted ? (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-black font-medium">Join our waitlist</p>
            <p className="text-gray-700 text-xs">You'll be the first to get access/to have features built around your needs.</p>
          </div>
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <span className="absolute left-3 flex items-center pointer-events-none">
                <Mail
                  width={16}
                  height={16}
                  className="text-gray-300"
                  style={{ color: '#D1D5DB' }} // Tailwind gray-300
                />
              </span>
              <Input
                type="email"
                placeholder="Johndoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="landing-input: pl-10 h-12 pr-24 "
                style={{
                  backgroundColor: '#647653',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  borderWidth: "2",
                  // placeholder color handled by Tailwind or global styles, but can be forced if needed
                }}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                style={{
                  backgroundColor: '#A7CE38',
                  color: 'white',
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: '32px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginRight: 4,
                }}
              >
                <Send width={12} height={12} />
                {isPending ? 'Submitting…' : 'Join'}
              </Button>
            </div>
          </form>
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">You're on the list!</p>
          <p className="text-muted-foreground text-xs">Optionally, tell us more so we can prioritize features for you.</p>
          <div className="flex flex-col gap-2">
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = 'https://anorha.fillout.com/t/o8WtoyuYDRus';
              }}
            >
              Take 5-min survey 
              <MoveRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}




