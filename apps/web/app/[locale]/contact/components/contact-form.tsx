'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { type FormEvent, useState, useTransition } from 'react';
import { contact } from '../actions/contact';

export const ContactForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    startTransition(async () => {
      const { error } = await contact(name, email, message);
      if (error) {
        setStatus({ msg: error, ok: false });
        return;
      }
      setStatus({
        msg: "Message sent. We'll get back to you within 24 hours.",
        ok: true,
      });
      setName('');
      setEmail('');
      setMessage('');
    });
  };

  return (
    <div className="marketing-page contact-page">
      <section className="contact-shell">
        <div className="contact-copy">
          <span className="marketing-hand-label">Get in touch</span>
          <h1>Let&apos;s scale your operations together.</h1>
          <p>
            Whether you have a question about integrating with your warehouse or
            want to explore enterprise pricing, our team is ready to help you
            sync your world.
          </p>
          <div className="contact-support-note">
            <span>
              <MessageSquare aria-hidden="true" size={22} />
            </span>
            <div>
              <strong>Enterprise Support</strong>
              <p>Priority onboarding and custom workflows.</p>
            </div>
          </div>
        </div>

        <div className="contact-form-card">
          <div>
            <h2>Send a message</h2>
            <p>We&apos;ll get back to you within 24 hours.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="marketing-field">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
                required
                type="text"
                value={name}
              />
            </div>
            <div className="marketing-field">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jane@company.com"
                required
                type="email"
                value={email}
              />
            </div>
            <div className="marketing-field">
              <Label htmlFor="message">How can we help?</Label>
              <Textarea
                id="message"
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell us about your inventory needs..."
                required
                value={message}
              />
            </div>
            <Button disabled={isPending} type="submit">
              {isPending ? 'Sending...' : 'Send Message'}
            </Button>
            {status ? (
              <output className={status.ok ? 'form-success' : 'form-error'}>
                {status.msg}
              </output>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
};
