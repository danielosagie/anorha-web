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

export const Hero = async ({ dictionary }: HeroProps) => (
  <div className="w-full relative">
    <div className="w-full overflow-hidden bg-gradient-to-br from-lime-600/30 to-lime-900/60 p-4 min-h-[100svh] flex items-center" style={{
    background: "linear-gradient(135deg, var(--anorhaGreen) 0%, var(--anorhaDarkGreen) 100%)"
  }}>  {/*rounded 2xl*/} 
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
                  <div className="h-[200px] md:h-[420px] lg:h-[420px] rounded-2xl bg-zinc-900" />
                </div>
                <div>
                  <div className="mb-2 rounded-lg bg-orange-500 px-4 py-2 text-center font-semibold text-white">After</div>
                  <div className="h-[200px] md:h-[420px] lg:h-[420px] rounded-2xl bg-zinc-900" />
                </div>
              </div>
            </div>
          </div>
            <div className="mt-6 h-px w-full border-t border-white" />

            

            {/* Desktop: single-open accordion with fixed body height */}
            <div className="hidden lg:block w-full">
              <Accordion type="single" defaultValue="item-1" className="w-full space-y-2">
                <AccordionItem value="item-1" className="rounded-lg bg-background/60 px-3" style={{backgroundColor: '#FFFBF1B2', borderColor: "#C1C8BA", borderWidth: "2px"}}>
                  <AccordionTrigger className="py-3 text-md ">Snap & Match</AccordionTrigger>
                  <AccordionContent className="pb-3 text-md">
                    <div className="h-32 overflow-auto text-gray-700 text-sm">
                    List products in seconds, not hours. Just snap a photo and let our AI do the heavy lifting. It automatically recognizes, matches, and tags your product with accurate details. No more copy-pasting descriptions or filling out endless forms.
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="rounded-lg bg-background/60 px-3" style={{backgroundColor: '#FFFBF1B2', borderColor: "#C1C8BA", borderWidth: "2px"}}>
                  <AccordionTrigger className="py-3 text-md ">Always in Sync</AccordionTrigger>
                  <AccordionContent className="pb-3 text-md">
                    <div className="h-32 overflow-auto text-gray-700 text-sm">
                    Manage all your channels from one simple dashboard. Update price, stock, or details once and it reflects instantly across all your platforms. Whether you’re selling online, in-store, or both, Anorha keeps everything in sync so you never miss a sale.
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="rounded-lg bg-background/60 px-3" style={{backgroundColor: '#FFFBF1B2', borderColor: "#C1C8BA", borderWidth: "2px"}}>
                  <AccordionTrigger className="py-3 text-md items-center"> 
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
                        <Avatar className="bg-white px-1.5 border-1 border-gray-300">  
                          <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5bGLqL8IRHnfzVBgFT0WMP9t8awbJ2rOESokd" />
                        <AvatarFallback>CN</AvatarFallback>
                        </Avatar>    
                        <Avatar className="bg-white px-1.5 border-1 border-gray-300">  
                          <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5r68Y3eDIWUX741uOAt8sNM3aKmjDlELbpfR2" />
                        <AvatarFallback>CN</AvatarFallback>
                        </Avatar>    
                      </div>
                    </div>
                    
                    </AccordionTrigger>
                  <AccordionContent className="pb-3 text-md">
                    <div className="h-32 overflow-auto text-gray-700 text-sm">
                    Anorha plugs into the platforms you already use. Whether your products live on Shopify, Square, Facebook Marketplace, eBay, or more, we’ve got you covered. Add once, sell everywhere — without switching systems or learning a new way to work. We’re constantly adding new integrations so your business never has to slow down just to keep up with the tools.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            {/* Mobile: convert to stacked sections with image placeholders */}
            <div className="flex flex-col gap-4 lg:hidden">
              <div className="rounded-lg border-white bg-background/60 p-3">
                <p className="font-semibold mb-2 font-white">Snap & Match</p>
                <p className="text-white text-sm mb-3">List products in seconds, not hours. Just snap a photo and let our AI do the heavy lifting. It automatically recognizes, matches, and tags your product with accurate details. No more copy-pasting descriptions or filling out endless forms.</p>
                <div className="aspect-video w-full rounded-md bg-zinc-900" />
              </div>
              <div className="rounded-lg border-white bg-background/60 p-3">
                <p className="font-semibold mb-2 font-white">Always in Sync</p>
                <p className="text-white text-sm mb-3">Manage all your channels from one simple dashboard. Update price, stock, or details once and it reflects instantly across all your platforms. Whether you’re selling online, in-store, or both, Anorha keeps everything in sync so you never miss a sale.</p>
                <div className="aspect-video w-full rounded-md bg-zinc-900" />
              </div>
              <div className="rounded-lg border-white bg-background/60 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold font-white">Works Where You Sell</p>
                  <div className="flex items-center z-10 flex -space-x-1.5 rtl:space-x-reverse">
                    <Avatar className="bg-white border-1 border-gray-300">
                      <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5MjfGso2zKhfNEjBx9Q2zpulADRPmGrvCHMeU" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar className="bg-white px-1.5 border-1 border-gray-300">
                      <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5uu4A1tRPuIMFSAwTZgvGC2BzXq5Hyk1DRNe8" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar className="bg-white px-1.5 border-1 border-gray-300">
                      <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5bGLqL8IRHnfzVBgFT0WMP9t8awbJ2rOESokd" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar className="bg-white px-1.5 border-1 border-gray-300">
                      <AvatarImage src="https://dxeikk2e6c.ufs.sh/f/0UWZWh8ye0t5r68Y3eDIWUX741uOAt8sNM3aKmjDlELbpfR2" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <p className="text-white text-sm mb-3">Anorha plugs into the platforms you already use. Whether your products live on Shopify, Square, Facebook Marketplace, eBay, or more, we’ve got you covered. Add once, sell everywhere — without switching systems or learning a new way to work. We’re constantly adding new integrations so your business never has to slow down just to keep up with the tools.</p>
                <div className="aspect-video w-full rounded-md bg-zinc-900" />
              </div>
            </div>
          </div>
          {/* Desktop/large screens: comparison on the right */}
          <div className="hidden md:block flex-1">
            <div className="rounded-3xl bg-amber-100 p-4 shadow-inner" style={{background: "linear-gradient(158deg, #FFFBF1 -8.56%, #FAE1A2 100.33%)", borderRadius: "20px"}} >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 rounded-lg bg-zinc-600 px-4 py-2 text-center font-semibold text-white">Before</div>
                  <div className="h-[540px] rounded-2xl bg-zinc-900" />
                </div>
                <div>
                  <div className="mb-2 rounded-lg bg-orange-500 px-4 py-2 text-center font-semibold text-white">After</div>
                  <div className="h-[540px] rounded-2xl bg-zinc-900" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
