'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { MoveRight, Mail, MessageSquare } from 'lucide-react';
import { Textarea } from '@repo/design-system/components/ui/textarea';

export const ContactForm = () => {
  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white selection:bg-[#A7CE38]/30">
      <div className="w-full py-20 lg:py-40 relative overflow-hidden">
        {/* Background Glow */}
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-[#A7CE38] opacity-5 rounded-full blur-[120px] pointer-events-none"
        />

        <div className="container mx-auto max-w-6xl relative z-10 px-4">
          <div className="grid gap-16 lg:grid-cols-2 items-center">

            {/* Left Copy */}
            <div className="flex flex-col gap-6">
              <div className="bg-[#647653]/30 border border-[#A7CE38]/30 px-3 py-1 rounded-full text-sm font-medium text-[#A7CE38] mb-2 self-start shadow-[0_0_15px_rgba(167,206,56,0.2)] flex items-center gap-2">
                <Mail size={14} /> Get in touch
              </div>
              <h1 className="max-w-xl text-left font-regular text-4xl tracking-tighter md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
                Let's scale your operations together.
              </h1>
              <p className="max-w-md text-left text-lg text-zinc-400 leading-relaxed tracking-tight">
                Whether you have a question about integrating with your warehouse or want to explore enterprise pricing, our team is ready to help you sync your world.
              </p>

              <div className="flex flex-col gap-6 mt-8">
                <div className="flex flex-row items-center gap-4 text-left p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <div className="bg-[#A7CE38]/10 p-3 rounded-xl border border-[#A7CE38]/20">
                    <MessageSquare className="h-6 w-6 text-[#A7CE38]" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-white font-medium">Enterprise Support</p>
                    <p className="text-zinc-500 text-sm">Priority onboarding and custom workflows.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md">
                <div className="flex flex-col gap-1">
                  <h3 className="text-2xl font-medium text-white">Send a message</h3>
                  <p className="text-zinc-400 text-sm">We'll get back to you within 24 hours.</p>
                </div>

                <form className="flex flex-col gap-4 mt-2" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="name" className="text-zinc-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jane Doe"
                      className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#A7CE38]/50"
                    />
                  </div>

                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="email" className="text-zinc-300">
                      Work Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jane@company.com"
                      className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#A7CE38]/50"
                    />
                  </div>

                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="message" className="text-zinc-300">
                      How can we help?
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your inventory needs..."
                      className="min-h-[120px] bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#A7CE38]/50 resize-none"
                    />
                  </div>

                  <Button className="w-full mt-4 bg-[#A7CE38] hover:bg-[#96BB32] text-zinc-950 font-medium h-12 rounded-xl text-base">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
