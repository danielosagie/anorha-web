"use client";

/**
 * Sprout, "your shelf has its own agent".
 * Sprout proposes the next move; a scripted cursor accepts it and it collapses
 * to a done chip. Pairs with the site-wide SmoothCursor for the real pointer.
 *
 * Beat 4 of the landing storyboard, in code. Honors prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@repo/design-system/lib/utils";

const OLIVE = "#7BB304";
const OLIVE_DK = "#5E8E3E";

type Phase = "typing" | "proposal" | "running" | "done";

/* ---------- sprout avatar (leaf) ---------- */
function SproutAvatar({ size = 34 }: { size?: number }) {
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: OLIVE }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
        <path d="M12 22 V11" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 13 C 12 8 8.5 5 4 5 C 4 9.5 7.5 13 12 13 Z" fill="#fff" />
        <path d="M12 11 C 12 7.2 15 4.4 19.5 4.4 C 19.5 8.2 16.5 11 12 11 Z" fill="#EAF3D6" />
      </svg>
    </span>
  );
}

/* ---------- scripted cursor ---------- */
function Cursor({ x, y, pressed }: { x: any; y: any; pressed: boolean }) {
  return (
    <motion.div
      style={{ left: x, top: y, position: "absolute" }}
      className="pointer-events-none z-50 -translate-x-[3px] -translate-y-[2px]"
    >
      <motion.div animate={{ scale: pressed ? 0.82 : 1 }} transition={{ duration: 0.12 }}>
        <svg
          width="26"
          height="28"
          viewBox="0 0 50 54"
          fill="none"
          style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.18))" }}
        >
          <path
            d="M42.68 41.15L27.51 6.80c-.78-1.77-3.3-1.77-4.12 0L7.60 41.15c-.84 1.83.93 3.74 2.81 3.05l13.96-5.15c.51-.19 1.06-.19 1.57 0l13.87 5.15c1.87.69 3.68-1.22 2.87-3.05Z"
            fill="#18181B"
            stroke="#fff"
            strokeWidth="2.4"
          />
        </svg>
      </motion.div>
      <AnimatePresence>
        {pressed && (
          <motion.span
            className="absolute left-0 top-0 block rounded-full"
            style={{ background: "rgba(123,179,4,0.35)" }}
            initial={{ width: 8, height: 8, x: -4, y: -4, opacity: 0.7 }}
            animate={{ width: 44, height: 44, x: -22, y: -22, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const RISE = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
};

/* ---------- demo card ---------- */
function SproutDemo() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduced ? "done" : "typing");
  const [pressed, setPressed] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const yesRef = useRef<HTMLButtonElement | null>(null);

  const REST = { x: 54, y: 232 };
  const px = useSpring(REST.x, { stiffness: 120, damping: 20, mass: 1 });
  const py = useSpring(REST.y, { stiffness: 120, damping: 20, mass: 1 });

  useEffect(() => {
    if (reduced) return;
    let alive = true;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const run = async () => {
      await wait(600);
      while (alive) {
        setPhase("typing");
        px.set(REST.x);
        py.set(REST.y);
        await wait(1400);
        if (!alive) return;

        setPhase("proposal");
        await wait(950);
        if (!alive) return;

        // glide to "Yes, run it"
        const b = yesRef.current?.getBoundingClientRect();
        const c = cardRef.current?.getBoundingClientRect();
        if (b && c) {
          px.set(b.left - c.left + b.width / 2);
          py.set(b.top - c.top + b.height / 2);
        }
        await wait(780);
        if (!alive) return;

        setPressed(true);
        await wait(150);
        setPressed(false);
        setPhase("running");
        await wait(1150);
        if (!alive) return;

        setPhase("done");
        await wait(2600);
        if (!alive) return;
      }
    };
    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const showProposalBubble = phase !== "typing";

  return (
    <div
      ref={cardRef}
      className="relative w-full max-w-[440px] rounded-[20px] border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_50px_-24px_rgba(0,0,0,0.22)]"
    >
      {/* header */}
      <div className="mb-4 flex items-center gap-2.5">
        <SproutAvatar />
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-neutral-900">Sprout</span>
          <span className="text-[11.5px] text-neutral-400">watching your shelf</span>
        </div>
      </div>

      {/* conversation */}
      <div className="flex min-h-[212px] flex-col gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === "typing" ? (
            <motion.div
              key="typing"
              {...RISE}
              transition={{ duration: 0.3 }}
              className="flex w-fit items-center gap-1.5 rounded-[13px] rounded-tl-[4px] bg-neutral-100 px-4 py-3"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="block h-[7px] w-[7px] rounded-full bg-neutral-400"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="bubble"
              {...RISE}
              transition={{ duration: 0.4 }}
              className="w-fit max-w-[340px] rounded-[13px] rounded-tl-[4px] bg-neutral-100 px-4 py-3"
            >
              <span className="text-[13px] leading-[19px] text-neutral-700">
                3 denim jackets have sat 30 days. Want me to run a{" "}
                <span className="font-semibold text-neutral-900">15% liquidation</span> across every
                channel?
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* action / running / done */}
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === "proposal" && (
            <motion.div
              key="action"
              {...RISE}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-3 rounded-[14px] border border-[#7BB304]/25 bg-white p-3.5 shadow-[0_8px_22px_-12px_rgba(0,0,0,0.25)]"
            >
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 13l5 5L20 6"
                    stroke={OLIVE}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[12.5px] font-semibold text-neutral-900">
                  Liquidation · 3 items · −15%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  ref={yesRef}
                  type="button"
                  className="whitespace-nowrap rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white"
                  style={{ background: OLIVE }}
                >
                  Yes, run it
                </button>
                <button
                  type="button"
                  className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-neutral-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
                >
                  Tweak
                </button>
                <button
                  type="button"
                  className="whitespace-nowrap px-2 py-2 text-[12.5px] font-medium text-neutral-400"
                >
                  Not now
                </button>
              </div>
            </motion.div>
          )}

          {phase === "running" && (
            <motion.div
              key="running"
              {...RISE}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-2.5 rounded-[14px] border border-neutral-200 bg-white p-3.5"
            >
              <motion.span
                className="block h-4 w-4 rounded-full border-[2px] border-neutral-300"
                style={{ borderTopColor: OLIVE }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: "linear", duration: 0.7 }}
              />
              <span className="text-[12.5px] font-medium text-neutral-600">
                Running across 5 channels…
              </span>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" {...RISE} transition={{ duration: 0.4 }} className="flex flex-col gap-2.5">
              <div className="flex w-fit items-center gap-2 rounded-[13px] rounded-tl-[4px] bg-neutral-100 px-4 py-2.5">
                <span className="text-[13px] text-neutral-700">On it, live across every channel.</span>
              </div>
              <div className="flex w-fit items-center gap-2.5 rounded-[12px] bg-white p-3 shadow-[0_4px_14px_-8px_rgba(0,0,0,0.22)] ring-1 ring-black/5">
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(123,179,4,0.15)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 13l5 5L20 6"
                      stroke={OLIVE}
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-neutral-900">Liquidation live</span>
                  <span className="text-[11.5px] text-neutral-500">3 items · −15% · 5 channels</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!reduced && <Cursor x={px} y={py} pressed={pressed} />}
    </div>
  );
}

/* ---------- section ---------- */
export function Sprout() {
  return (
    <section className="w-full py-20 lg:py-28">
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-5">
          <span
            className="w-fit rounded-md px-2.5 py-1 text-[12px] font-semibold"
            style={{ background: "rgba(123,179,4,0.12)", color: OLIVE_DK }}
          >
            Meet Sprout
          </span>
          <h2 className="max-w-[15ch] text-3xl font-semibold tracking-tight text-neutral-900 md:text-[42px] md:leading-[1.05]">
            Your shelf has its own agent now.
          </h2>
          <p className="max-w-[42ch] text-[16px] leading-relaxed text-neutral-500">
            Sprout watches what&rsquo;s selling and what&rsquo;s stuck, proposes the next move, and
            does the busywork. You just say the word.
          </p>
          <ul className="mt-1 flex flex-col gap-2.5">
            {[
              "Spots slow movers and drafts the fix",
              "Reprices, relists, and runs campaigns",
              "Always asks before it touches anything live",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[14.5px] text-neutral-700">
                <span
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(123,179,4,0.15)" }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 13l5 5L20 6"
                      stroke={OLIVE}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center lg:justify-end">
          <SproutDemo />
        </div>
      </div>
    </section>
  );
}

export default Sprout;
