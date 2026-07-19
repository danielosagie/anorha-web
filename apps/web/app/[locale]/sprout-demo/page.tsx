"use client";

import { SmoothCursor } from "@repo/design-system/components/ui/smooth-cursor";
import { Sprout } from "@/app/[locale]/(home)/components/sprout";

export default function SproutDemoPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#F7F7F8]">
      <SmoothCursor />
      <Sprout />
    </div>
  );
}
