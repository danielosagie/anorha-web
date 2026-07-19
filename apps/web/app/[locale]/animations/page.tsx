'use client';

import { AddProductConveyor } from '@/app/[locale]/(home)/components/add-product';
import { ConveyorScene } from '@/app/[locale]/(home)/components/motion/conveyor-scene';
import { GsapScrollStrip } from '@/app/[locale]/(home)/components/motion/gsap-scroll-strip';
import { HeroField } from '@/app/[locale]/(home)/components/motion/hero-field';
import { Sprout } from '@/app/[locale]/(home)/components/sprout';
import { SmoothCursor } from '@repo/design-system/components/ui/smooth-cursor';

export default function AnimationsPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center gap-24 bg-[#F7F7F8] px-6 py-16">
      <SmoothCursor />

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="rounded-md bg-[#7BB304]/12 px-2.5 py-1 font-semibold text-[#4A6B2A] text-[12px]">
          Animations
        </span>
        <h1 className="font-semibold text-[26px] text-neutral-900 tracking-tight">
          Landing page motion foundation
        </h1>
      </div>

      <section className="w-full max-w-[1120px]">
        <h2 className="mb-5 font-semibold text-lg text-neutral-900 tracking-tight">
          Hero field
        </h2>
        <div className="relative isolate flex min-h-[420px] overflow-hidden rounded-[24px] border border-black/8 bg-white px-8 py-20 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_70px_-42px_rgba(0,0,0,0.28)] md:px-16">
          <HeroField className="-z-10 pointer-events-none absolute inset-0 opacity-90" />
          <div className="m-auto max-w-2xl text-center">
            <p className="font-mono text-[var(--anorhaDarkGreen)] text-xs uppercase tracking-[0.18em]">
              One listing, every marketplace
            </p>
            <p className="mt-5 font-semibold text-4xl text-neutral-900 tracking-[-0.04em] md:text-6xl">
              Inventory that moves as fast as you do.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full max-w-[1120px]">
        <h2 className="mb-5 font-semibold text-lg text-neutral-900 tracking-tight">
          Conveyor scene
        </h2>
        <div className="overflow-hidden rounded-[24px] border border-black/8 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_70px_-42px_rgba(0,0,0,0.28)]">
          <ConveyorScene speed={0.9} />
        </div>
      </section>

      <section className="w-full max-w-[1120px]">
        <h2 className="mb-5 font-semibold text-lg text-neutral-900 tracking-tight">
          GSAP scroll strip
        </h2>
        <GsapScrollStrip />
      </section>

      <section className="w-full max-w-[1040px]">
        <h2 className="mb-5 font-semibold text-lg text-neutral-900 tracking-tight">
          Add product sequence
        </h2>
        <AddProductConveyor />
      </section>

      <section className="w-full max-w-[1040px]">
        <h2 className="mb-5 font-semibold text-lg text-neutral-900 tracking-tight">
          Sprout agent
        </h2>
        <Sprout />
      </section>
    </main>
  );
}
