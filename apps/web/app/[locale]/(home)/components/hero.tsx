import { env } from '@/env';
import { Button } from '@repo/design-system/components/ui/button';
import type { Dictionary } from '@repo/internationalization';
import { MoveRight, PhoneCall } from 'lucide-react';
import { FlickeringGrid } from '@repo/design-system/components/ui/flickering-grid';
import Link from 'next/link';
import { GradientBars } from '@repo/design-system/components/ui/gradient-bars';
import { TextReveal } from '@repo/design-system/components/ui/text-reveal';
import { Waitlist } from './waitlist';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/design-system/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/design-system/components/ui/avatar';

type HeroProps = {
  dictionary: Dictionary;
};

export const Hero = async ({ dictionary }: HeroProps) => {
  return (
  <div className="w-full relative">
    <div className="w-full overflow-hidden bg-gradient-to-br from-lime-600/30 to-lime-900/60 p-4 min-h-[100svh] flex items-center" style={{background: "linear-gradient(135deg, var(--anorhaGreen) 0%, var(--anorhaDarkGreen) 100%)"}}>  {/*rounded 2xl*/} 
      <div className="container mx-auto">
        <div className="flex h-full flex-col items-center gap-8 lg:flex-row mt-12">
          <div className="flex h-full w-full max-w-lg flex-col gap-6 p-4">
            <h1 className="font-semibold text-center font-white text-3xl text-white leading-tight md:text-4xl">
              A platform to help you sell anything, everywhere, fast.
            </h1>
            <Waitlist />
            {/* Mobile-only comparison under text */}
            <div className="flex-1 w-full lg:w-auto lg:hidden justify-content: Center" style={{background: "linear-gradient(158deg, #FFFBF1 -8.56%, #FAE1A2 100.33%)", borderRadius: "20px", boxShadow: "10px 12px 35px 3px rgba(0, 0, 0, 0.25)"}}>
            <div className="rounded-3xl bg-amber-100 p-4 shadow-inner" style={{background: "linear-gradient(158deg, #FFFBF1 -8.56%, #FAE1A2 100.33%)", borderRadius: "20px"}}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 rounded-lg bg-zinc-600 px-4 py-2 text-center font-semibold text-white">Before</div>
                  <div className="relative aspect-[7.5/16] w-full rounded-4xl border-4 bg-zinc-900 overflow-hidden">
                    {env.NEXT_PUBLIC_HERO_VIDEO_BEFORE_URL ? (
                      <video
                        src={env.NEXT_PUBLIC_HERO_VIDEO_BEFORE_URL}
                        className="absolute inset-0 h-full w-full object-cover rounded-4xl border-4 border-zinc-900"
                        autoPlay
                        muted
                        playsInline
                        preload="metadata"
                        controls
                      />
                    ) : null}
                  </div>
              </div>
                <div>
                  <div className="mb-2 rounded-lg bg-orange-500 px-4 py-2 text-center font-semibold text-white">After</div>
                  <div className="relative aspect-[7.5/16] border-4 border-zinc-900 w-full rounded-4xl bg-zinc-900 overflow-hidden">
                    {env.NEXT_PUBLIC_HERO_VIDEO_URL ? (
                      <video
                        src={env.NEXT_PUBLIC_HERO_VIDEO_URL}
                        className="absolute inset-0 h-full w-full object-cover rounded-4xl border-4 border-zinc-900"
                        autoPlay
                        muted
                        playsInline
                        preload="metadata"
                        controls
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
            <div className="mt-6 h-px w-full border-t border-white" />

            

            {/* Desktop: single-open accordion with fixed body height */}
            <div className="hidden lg:block w-full">
              <Accordion type="single" defaultValue="item-1" className="w-full space-y-2">
                <AccordionItem value="item-1" className="rounded-lg bg-background/60 px-3" style={{backgroundColor: '#FFFBF1B2', borderColor: "#C1C8BA", borderWidth: "2px"}}>
                  <AccordionTrigger className="py-3 text-md text-black">Snap & Match</AccordionTrigger>
                  <AccordionContent className="pb-3 text-md text-black">
                    <div className="h-32 overflow-auto text-gray-700 text-sm">
                    List products in seconds, not hours. Just snap a photo and let our AI do the heavy lifting. It automatically recognizes, matches, and tags your product with accurate details. No more copy-pasting descriptions or filling out endless forms.
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="rounded-lg bg-background/60 px-3" style={{backgroundColor: '#FFFBF1B2', borderColor: "#C1C8BA", borderWidth: "2px"}}>
                  <AccordionTrigger className="py-3 text-md text-black">Always in Sync</AccordionTrigger>
                  <AccordionContent className="pb-3 text-md text-black">
                    <div className="h-32 overflow-auto text-gray-700 text-sm">
                    Manage all your channels from one simple dashboard. Update price, stock, or details once and it reflects instantly across all your platforms. Whether you’re selling online, in-store, or both, Anorha keeps everything in sync so you never miss a sale.
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="rounded-lg bg-background/60 px-3" style={{backgroundColor: '#FFFBF1B2', borderColor: "#C1C8BA", borderWidth: "2px"}}>
                  <AccordionTrigger className="py-3 text-md text-black items-center"> 
                    <div className="flex items-center gap-2">
                      Works Where You Sell 
                      <div className="flex items-center z-10 flex -space-x-1.5 rtl:space-x-reverse">
                        <Avatar className="bg-white border-1 border-gray-300">  
                          <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5MjfGso2zKhfNEjBx9Q2zpulADRPmGrvCHMeU" />
                        <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <Avatar className="bg-white px-1.5 border-1 border-gray-300">  
                          <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5uu4A1tRPuIMFSAwTZgvGC2BzXq5Hyk1DRNe8" />
                        <AvatarFallback>CN</AvatarFallback>
                        </Avatar>    

                        {/*
                        Amazon
                        <Avatar className="bg-white px-1.5 border-1 border-gray-300">  
                          <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5bGLqL8IRHnfzVBgFT0WMP9t8awbJ2rOESokd" />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>    
                        */}
                        
                        <Avatar className="bg-white px-1.5 border-1 border-gray-300">  
                          <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5r68Y3eDIWUX741uOAt8sNM3aKmjDlELbpfR2" />
                        <AvatarFallback>CN</AvatarFallback>
                        </Avatar>    
                        <Avatar className="bg-white px-1.5 border-1 border-gray-300">
                          <AvatarImage src="https://dxiqonv894.ufs.sh/f/47mT5CowzZs8JR0QzKVN6JSsKq5WEYw7LcUiyPf0MORkVeo8" />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    
                    </AccordionTrigger>
                  <AccordionContent className="pb-3 text-md text-black">
                    <div className="h-32 overflow-auto text-gray-700 text-sm">
                    Anorha plugs into the platforms you already use. Whether your products live on Shopify, Square, Facebook Marketplace, eBay, or more, we’ve got you covered. Add once, sell everywhere — without switching systems or learning a new way to work. We’re constantly adding new integrations so your business never has to slow down just to keep up with the tools.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            {/* Mobile: convert to stacked sections with image placeholders */}
            <div className="flex flex-col gap-4 lg:hidden">
              <div className="rounded-lg bg-background/60 px-3 pt-3 pb-3" style={{backgroundColor: '#FFFBF1B2', borderColor: "#C1C8BA", borderWidth: "2px"}}>
                <p className="font-semibold mb-2">Snap & Match</p>
                <p className="text-gray-700 text-sm mb-3">List products in seconds, not hours. Just snap a photo and let our AI do the heavy lifting. It automatically recognizes, matches, and tags your product with accurate details. No more copy-pasting descriptions or filling out endless forms.</p>
                {/*
                <div className="h-[200px] md:h-[420px] lg:h-[420px] rounded-2xl bg-zinc-900">
                */}
              </div>   
              <div className="rounded-lg bg-background/60 px-3 pt-3 pb-3" style={{backgroundColor: '#FFFBF1B2', borderColor: "#C1C8BA", borderWidth: "2px"}}>
                <p className="font-semibold mb-2">Always in Sync</p>
                <p className="text-gray-700 text-sm mb-3">Manage all your channels from one simple dashboard. Update price, stock, or details once and it reflects instantly across all your platforms. Whether you're selling online, in-store, or both, Anorha keeps everything in sync so you never miss a sale.</p>
                {/*
                <div className="h-[200px] md:h-[420px] lg:h-[420px] rounded-2xl bg-zinc-900">
                */}
              </div>
              <div className="rounded-lg bg-background/60 px-3 pt-3 pb-3" style={{backgroundColor: '#FFFBF1B2', borderColor: "#C1C8BA", borderWidth: "2px"}}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold">Works Where You Sell</p>
                  <div className="flex items-center z-10 flex -space-x-1.5 rtl:space-x-reverse">
                    <Avatar className="bg-white border-1 border-gray-300">
                      <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5MjfGso2zKhfNEjBx9Q2zpulADRPmGrvCHMeU" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar className="bg-white px-1.5 border-1 border-gray-300">
                      <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5uu4A1tRPuIMFSAwTZgvGC2BzXq5Hyk1DRNe8" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    {/*
                        Amazon
                        <Avatar className="bg-white px-1.5 border-1 border-gray-300">  
                          <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5bGLqL8IRHnfzVBgFT0WMP9t8awbJ2rOESokd" />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>    
                        */}
                    <Avatar className="bg-white px-1.5 border-1 border-gray-300">
                      <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5r68Y3eDIWUX741uOAt8sNM3aKmjDlELbpfR2" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar className="bg-white px-1.5 border-1 border-gray-300">
                      <AvatarImage src="https://dxiqonv894.ufs.sh/f/47mT5CowzZs8JR0QzKVN6JSsKq5WEYw7LcUiyPf0MORkVeo8" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-3">Anorha plugs into the platforms you already use. Whether your products live on Shopify, Square, Facebook Marketplace, eBay, or more, we've got you covered. Add once, sell everywhere — without switching systems or learning a new way to work. We're constantly adding new integrations so your business never has to slow down just to keep up with the tools.</p>
                {/*
                <div className="h-[200px] md:h-[420px] lg:h-[420px] rounded-2xl bg-zinc-900" >
                 */}
              </div>
            </div>
          </div>
          {/* Desktop/large screens: comparison on the right */}
          <div className="hidden lg:block flex-1 w-auto">
            <div className="rounded-3xl w-auto bg-amber-100 p-4 shadow-inner my-10" style={{background: "linear-gradient(158deg, #FFFBF1 -8.56%, #FAE1A2 100.33%)", borderRadius: "20px"}} >
              <div className="grid grid-cols-2 gap-1">
                <div className="flex flex-col items-center">
                  <div className="mb-2 rounded-lg bg-zinc-600  w-full max-w-[360px] px-4 py-2 text-center font-semibold text-white">5+ Mins of Manual Work</div>
                  <div className="flex w-full justify-center">
                    <div className="relative aspect-[7.5/16]  w-full max-w-[360px] rounded-4xl overflow-hidden bg-zinc-900 border-4 border-zinc-900">
                      {env.NEXT_PUBLIC_HERO_VIDEO_BEFORE_URL ? (
                        <video
                          src={env.NEXT_PUBLIC_HERO_VIDEO_BEFORE_URL}
                          className="absolute inset-0 h-full w-full object-cover rounded-4xl border-4 border-zinc-900 rounded-4xl border-4 border-zinc-900"
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          controls
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-2 rounded-lg  w-full max-w-[360px] bg-orange-500 px-4 py-2 text-center font-semibold text-white">1 Min w/ Anorha</div>
                  <div className="flex w-full justify-center">
                    <div className="relative aspect-[7.5/16] w-full max-w-[360px] rounded-4xl overflow-hidden bg-zinc-900 border-4 border-zinc-900">
                      {env.NEXT_PUBLIC_HERO_VIDEO_URL ? (
                        <video
                          src={env.NEXT_PUBLIC_HERO_VIDEO_URL}
                          className="absolute inset-0 h-full w-full object-cover rounded-4xl border-4 border-zinc-900 rounded-4xl border-4 border-zinc-900"
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          controls
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
