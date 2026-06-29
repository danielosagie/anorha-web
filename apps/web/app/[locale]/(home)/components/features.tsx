"use client";

import type { Dictionary } from '@repo/internationalization';
import { Sparkles, RefreshCw, BarChart3, Truck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

type FeaturesProps = {
  dictionary: Dictionary;
};

const DrawStar = () => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#A7CE38] opacity-30">
      <motion.path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        initial={reduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
        viewport={{ once: false, margin: "-50px" }}
      />
    </motion.svg>
  );
};

const DrawSyncLine = () => (
  <motion.svg width="100%" height="60" viewBox="0 0 200 60" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#A7CE38]">
    <motion.path
      d="M20 30 C 60 30, 80 10, 100 30 C 120 50, 140 30, 180 30"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      viewport={{ once: true }}
      strokeDasharray="4 4"
    />
    <motion.circle cx="20" cy="30" r="4" fill="currentColor" initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 0.2 }} />
    <motion.circle cx="100" cy="30" r="4" fill="currentColor" initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 0.8 }} />
    <motion.circle cx="180" cy="30" r="4" fill="currentColor" initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 1.4 }} />
  </motion.svg>
);

const DrawChart = () => (
  <div className="flex items-end gap-2 h-24 mt-4">
    {[30, 50, 40, 70, 60, 90].map((height, i) => (
      <motion.div
        key={i}
        className="w-8 bg-[#A7CE38]/20 rounded-t-sm border-t-2 border-[#A7CE38]"
        initial={{ height: 0 }}
        whileInView={{ height: `${height}%` }}
        transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
        viewport={{ once: true }}
        whileHover={{ backgroundColor: "rgba(167, 206, 56, 0.4)" }}
      />
    ))}
  </div>
);

const DrawRoute = () => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.svg width="100%" height="80" viewBox="0 0 300 80" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
      <motion.path
        d="M20 60 Q 80 20, 150 40 T 280 20"
        initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 2, ease: "easeInOut" }}
        viewport={{ once: true }}
        strokeDasharray="6 6"
      />
      <motion.g
        initial={reduceMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 2, type: "spring" }}
      >
        <circle cx="280" cy="20" r="8" fill="#A7CE38" />
        <circle cx="280" cy="20" r="4" fill="#18181b" />
      </motion.g>
    </motion.svg>
  );
};


export const Features = ({ dictionary }: FeaturesProps) => {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.15 }
    }
  };

  const item = {
    hidden: reduceMotion ? { opacity: 0, y: 0 } : { opacity: 0, y: 30 },
    show: reduceMotion
      ? { opacity: 1, y: 0, transition: { duration: 0 } }
      : { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }
  };

  return (
    <div className="w-full py-20 lg:py-40 bg-zinc-950 text-white overflow-hidden relative">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A7CE38] opacity-5 rounded-full blur-[100px] pointer-events-none"
        animate={reduceMotion ? undefined : { scale: [1, 1.1, 1] }}
        transition={reduceMotion ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="container mx-auto relative z-10 px-4">
        <div className="flex flex-col gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col items-center text-center gap-4"
          >
            <div className="bg-[#647653]/30 border border-[#A7CE38]/30 px-3 py-1 rounded-full text-sm font-medium text-[#A7CE38] mb-2 shadow-[0_0_15px_rgba(167,206,56,0.2)]">
              Powerful Automation
            </div>
            <h2 className="max-w-2xl font-regular text-4xl tracking-tighter md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
              Everything you need to scale your inventory.
            </h2>
            <p className="max-w-xl text-lg text-zinc-400 leading-relaxed tracking-tight mt-2">
              We replace hours of tedious data entry with an effortless, AI-driven workflow that runs your cross-platform business on autopilot.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[420px]"
          >
            {/* Bento Box 1: Large Span */}
            <motion.div
              variants={item}
              className="group relative flex flex-col justify-between rounded-3xl p-8 lg:col-span-2 overflow-hidden bg-zinc-900 border border-zinc-800"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#A7CE38]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="bg-[#647653]/30 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-[#A7CE38]/30">
                    <Sparkles className="text-[#A7CE38]" size={28} />
                  </div>
                  <h3 className="text-3xl font-medium tracking-tight mb-3">AI Context Understanding</h3>
                  <p className="max-w-md text-lg text-zinc-400 leading-relaxed">
                    Snap a photo. Our vision models automatically extract details, categorize perfectly, and generate compelling titles in seconds.
                  </p>
                </div>

                <div className="relative h-32 w-full mt-6 rounded-2xl bg-zinc-950 border border-zinc-800 p-4 overflow-hidden flex items-center justify-center shadow-inner">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                  <div className="z-10 absolute right-8 top-2">
                    <DrawStar />
                  </div>
                  <div className="z-10 w-full max-w-sm">
                    <motion.div
                      className="bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300 border border-zinc-700 shadow-xl"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <span className="text-[#A7CE38] font-mono mr-2">{"{"}</span>
                      <span className="text-blue-300">"brand"</span>: "Nike",
                      <span className="text-blue-300 ml-2">"condition"</span>: "Used",
                      <span className="text-[#A7CE38] font-mono ml-2">{"}"}</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bento Box 2: Square */}
            <motion.div
              variants={item}
              className="group relative flex flex-col justify-between rounded-3xl p-8 overflow-hidden bg-zinc-900 border border-zinc-800"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-[#A7CE38]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="bg-zinc-800 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-zinc-700">
                    <RefreshCw className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-medium tracking-tight mb-2">Omnichannel Sync</h3>
                  <p className="text-base text-zinc-400">
                    Connect Shopify, Square, and eBay. Never double-sell an item again with real-time stock sync.
                  </p>
                </div>
                <div className="w-full mt-4">
                  <DrawSyncLine />
                </div>
              </div>
            </motion.div>

            {/* Bento Box 3: Square */}
            <motion.div
              variants={item}
              className="group relative flex flex-col justify-between rounded-3xl p-8 overflow-hidden bg-zinc-900 border border-zinc-800"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#A7CE38]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="bg-zinc-800 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-zinc-700">
                    <BarChart3 className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-medium tracking-tight mb-2">Market Pricing</h3>
                  <p className="text-base text-zinc-400">
                    Aggregated real-time data to price your items perfectly and maximize your margins.
                  </p>
                </div>
                <div className="w-full mt-2">
                  <DrawChart />
                </div>
              </div>
            </motion.div>

            {/* Bento Box 4: Large Span */}
            <motion.div
              variants={item}
              className="group relative flex flex-col justify-between rounded-3xl p-8 lg:col-span-2 overflow-hidden bg-zinc-900 border border-zinc-800"
            >
              <div className="absolute inset-0 bg-gradient-to-tl from-[#647653]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="bg-[#647653]/30 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-[#A7CE38]/30">
                    <Truck className="text-[#A7CE38]" size={28} />
                  </div>
                  <h3 className="text-3xl font-medium tracking-tight mb-3">Effortless Fulfillment</h3>
                  <p className="max-w-md text-lg text-zinc-400 leading-relaxed">
                    Manage shipping profiles from a single dashboard. Print labels directly and trigger automatic tracking updates everywhere.
                  </p>
                </div>
                <div className="w-full mt-4 bg-zinc-950/50 rounded-xl border border-zinc-800 p-6">
                  <DrawRoute />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
