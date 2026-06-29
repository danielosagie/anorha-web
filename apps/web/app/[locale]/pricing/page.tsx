import { env } from '@/env';
import { Button } from '@repo/design-system/components/ui/button';
import { Check, Minus, MoveRight, PhoneCall, Sparkles } from 'lucide-react';
import Link from 'next/link';

const Pricing = () => (
  <div className="w-full min-h-screen bg-zinc-950 text-white selection:bg-[#A7CE38]/30">
    <div className="w-full py-20 lg:py-40 relative overflow-hidden">
      {/* Background Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#A7CE38] opacity-10 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="container mx-auto relative z-10 px-4">
        <div className="flex flex-col items-center justify-center gap-6 text-center mb-20">
          <div className="bg-[#647653]/30 border border-[#A7CE38]/30 px-3 py-1 rounded-full text-sm font-medium text-[#A7CE38] mb-2 shadow-[0_0_15px_rgba(167,206,56,0.2)] flex items-center gap-2">
            <Sparkles size={14} /> Clear, simple pricing
          </div>
          <h1 className="max-w-2xl text-center font-regular text-4xl tracking-tighter md:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
            Scale your inventory without scaling your costs.
          </h1>
          <p className="max-w-2xl text-center text-lg text-zinc-400 leading-relaxed tracking-tight mt-2">
            Whether you are just starting your reselling journey or managing a massive warehouse, we have a plan designed to give you hours of your life back.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-md">
          <div className="grid w-full grid-cols-3 divide-x divide-zinc-800 lg:grid-cols-4">

            {/* Headers row */}
            <div className="col-span-3 lg:col-span-1 p-6 flex flex-col justify-end">
              <h3 className="text-xl font-medium">Compare Plans</h3>
              <p className="text-sm text-zinc-500 mt-1">Find the perfect fit for your workflow.</p>
            </div>

            {/* Tiers */}
            <div className="flex flex-col gap-2 px-4 py-8 md:px-6 hover:bg-zinc-800/30 transition-colors">
              <p className="text-2xl font-medium text-white">Starter</p>
              <p className="text-zinc-500 text-sm min-h-[40px]">
                Perfect for casual sellers looking to save time on listings.
              </p>
              <div className="mt-8 flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold">$0</span>
                  <span className="text-zinc-500 text-sm">/ month</span>
                </div>
              </div>
              <Button variant="outline" className="mt-8 w-full bg-transparent border-zinc-700 hover:bg-zinc-800 text-white" asChild>
                <Link href={env.NEXT_PUBLIC_APP_URL}>
                  Get Started
                </Link>
              </Button>
            </div>

            <div className="flex flex-col gap-2 px-4 py-8 md:px-6 bg-[#A7CE38]/5 relative hover:bg-[#A7CE38]/10 transition-colors">
              <div className="absolute top-0 inset-x-0 h-1 bg-[#A7CE38]" />
              <p className="text-2xl font-medium text-[#A7CE38] flex items-center justify-between">
                Pro <span className="text-xs bg-[#A7CE38]/20 px-2 py-1 rounded-full text-[#A7CE38]">Popular</span>
              </p>
              <p className="text-zinc-500 text-sm min-h-[40px]">
                Built for dedicated resellers managing multiple channels.
              </p>
              <div className="mt-8 flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold">$49</span>
                  <span className="text-zinc-500 text-sm">/ month</span>
                </div>
              </div>
              <Button className="mt-8 w-full bg-[#A7CE38] hover:bg-[#96BB32] text-zinc-950 font-medium" asChild>
                <Link href={env.NEXT_PUBLIC_APP_URL}>
                  Try Pro Free
                </Link>
              </Button>
            </div>

            <div className="flex flex-col gap-2 px-4 py-8 md:px-6 hover:bg-zinc-800/30 transition-colors">
              <p className="text-2xl font-medium text-white">Scale</p>
              <p className="text-zinc-500 text-sm min-h-[40px]">
                For warehouses and teams that need absolute automation.
              </p>
              <div className="mt-8 flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold">$149</span>
                  <span className="text-zinc-500 text-sm">/ month</span>
                </div>
              </div>
              <Button variant="outline" className="mt-8 w-full bg-transparent border-zinc-700 hover:bg-zinc-800 text-white" asChild>
                <Link href="/contact">
                  Contact Sales <PhoneCall className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Feature Rows */}
            <div className="col-span-3 px-6 py-4 lg:col-span-4 bg-zinc-900/80 border-t border-zinc-800">
              <b className="text-[#A7CE38] font-medium text-sm tracking-wider uppercase">Core Features</b>
            </div>

            <div className="col-span-3 px-6 py-4 lg:col-span-1 border-t border-zinc-800 flex items-center text-zinc-300">
              Active Listings
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <span className="text-zinc-300 font-medium">Up to 100</span>
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800 bg-[#A7CE38]/5">
              <span className="text-zinc-300 font-medium">Up to 2,500</span>
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <span className="text-zinc-300 font-medium">Unlimited</span>
            </div>

            <div className="col-span-3 px-6 py-4 lg:col-span-1 border-t border-zinc-800 flex items-center text-zinc-300">
              AI Listing Generations
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <span className="text-zinc-300 font-medium">50 / mo</span>
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800 bg-[#A7CE38]/5">
              <span className="text-zinc-300 font-medium">1,000 / mo</span>
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <span className="text-zinc-300 font-medium">Unlimited</span>
            </div>

            <div className="col-span-3 px-6 py-4 lg:col-span-1 border-t border-zinc-800 flex items-center text-zinc-300">
              Market Pricing Data
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <Minus className="h-5 w-5 text-zinc-700" />
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800 bg-[#A7CE38]/5">
              <Check className="h-5 w-5 text-[#A7CE38]" />
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <Check className="h-5 w-5 text-[#A7CE38]" />
            </div>

            <div className="col-span-3 px-6 py-4 lg:col-span-4 bg-zinc-900/80 border-t border-zinc-800">
              <b className="text-[#A7CE38] font-medium text-sm tracking-wider uppercase">Integrations & Sync</b>
            </div>

            <div className="col-span-3 px-6 py-4 lg:col-span-1 border-t border-zinc-800 flex items-center text-zinc-300">
              Channels (Shopify, eBay, Square)
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <span className="text-zinc-300 font-medium">1 Channel</span>
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800 bg-[#A7CE38]/5">
              <span className="text-zinc-300 font-medium">All Channels</span>
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <span className="text-zinc-300 font-medium">All Channels</span>
            </div>

            <div className="col-span-3 px-6 py-4 lg:col-span-1 border-t border-zinc-800 flex items-center text-zinc-300">
              Real-Time Stock Sync
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <Minus className="h-5 w-5 text-zinc-700" />
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800 bg-[#A7CE38]/5">
              <Check className="h-5 w-5 text-[#A7CE38]" />
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <Check className="h-5 w-5 text-[#A7CE38]" />
            </div>

            <div className="col-span-3 px-6 py-4 lg:col-span-4 bg-zinc-900/80 border-t border-zinc-800">
              <b className="text-[#A7CE38] font-medium text-sm tracking-wider uppercase">Team & Support</b>
            </div>

            <div className="col-span-3 px-6 py-4 lg:col-span-1 border-t border-zinc-800 flex items-center text-zinc-300">
              Team Members
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <span className="text-zinc-300 font-medium">1 Seat</span>
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800 bg-[#A7CE38]/5">
              <span className="text-zinc-300 font-medium">3 Seats</span>
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <span className="text-zinc-300 font-medium">Unlimited</span>
            </div>

            <div className="col-span-3 px-6 py-4 lg:col-span-1 border-t border-zinc-800 flex items-center pl-6 rounded-bl-3xl">
              <span className="text-zinc-300">Priority Support</span>
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800">
              <Minus className="h-5 w-5 text-zinc-700" />
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800 bg-[#A7CE38]/5">
              <Check className="h-5 w-5 text-[#A7CE38]" />
            </div>
            <div className="flex justify-center items-center px-4 py-4 md:px-6 border-t border-zinc-800 rounded-br-3xl">
              <Check className="h-5 w-5 text-[#A7CE38]" />
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Pricing;
