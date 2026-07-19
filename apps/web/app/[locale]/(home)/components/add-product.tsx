"use client"

/**
 * Add Product, conveyor belt demo.
 * Raw items ride in on an isometric conveyor (left); a scripted pointer clicks
 * "Generate" and the listing result streams in like a research generation (right).
 *
 * Motion weighting: Jakub (polish) + Jhey (the conveyor + cursor delight).
 * Seen once per visit → expressive is earned, but it reads "nice", not "look at me".
 * Fully honors prefers-reduced-motion (static belt + finished result, no loop).
 */

import { useCallback, useEffect, useRef, useState } from "react"
import {
  motion,
  AnimatePresence,
  useAnimationFrame,
  useReducedMotion,
  useSpring,
} from "framer-motion"
import { cn } from "@repo/design-system/lib/utils"

/* ------------------------------------------------------------------ */
/* geometry                                                            */
/* ------------------------------------------------------------------ */

const STAGE_W = 600
const STAGE_H = 348

// belt axis: front (near, big) -> back (far, small)
const S = { x: 66, y: 252 }
const E = { x: 560, y: 88 }
const SCALE_NEAR = 1
const SCALE_FAR = 0.4
const CUBE = 104 // base cube px at scale 1
const N_CUBES = 5
const SPEED = 0.042 // phase / second

const dx = E.x - S.x
const dy = E.y - S.y
const len = Math.hypot(dx, dy)
const dhat = { x: dx / len, y: dy / len }
const nhat = { x: -dhat.y, y: dhat.x } // perpendicular (points to lower-left)
const HALF_NEAR = 96
const HALF_FAR = 44

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const at = (t: number) => ({ x: lerp(S.x, E.x, t), y: lerp(S.y, E.y, t) })
const halfAt = (t: number) => lerp(HALF_NEAR, HALF_FAR, t)
const edge = (t: number, side: 1 | -1) => {
  const c = at(t)
  const h = halfAt(t)
  return { x: c.x + side * nhat.x * h, y: c.y + side * nhat.y * h }
}
const pt = (p: { x: number; y: number }) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`

// Cube hues use the Anorha olive family with gentle variety.
const HUES = [
  { stroke: "#5E8E3E", light: "#9CC24A", dark: "#7BB304" }, // olive
  { stroke: "#3E6E8E", light: "#7FB0E0", dark: "#5A93C4" }, // blue nod
  { stroke: "#4F7E86", light: "#77BCC6", dark: "#5FA8B3" }, // teal
  { stroke: "#6F8F2E", light: "#B4D06A", dark: "#94B84A" }, // lime
  { stroke: "#57813E", light: "#9EC178", dark: "#84B45B" }, // sage
]

/* ------------------------------------------------------------------ */
/* iso cube                                                            */
/* ------------------------------------------------------------------ */

function IsoCube({
  uid,
  hue,
  size,
}: {
  uid: number
  hue: (typeof HUES)[number]
  size: number
}) {
  const id = `hx-${uid}`
  return (
    <svg
      width={size}
      height={size * 1.06}
      viewBox="0 0 100 106"
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <pattern
          id={id}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="7" stroke={hue.light} strokeWidth="1.5" />
        </pattern>
        <pattern
          id={`${id}-d`}
          width="5.5"
          height="5.5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="5.5" stroke={hue.dark} strokeWidth="1.6" />
        </pattern>
      </defs>
      {/* right face (darker / denser hatch) */}
      <polygon
        points="50,53 100,28 100,78 50,103"
        fill={`url(#${id}-d)`}
        stroke={hue.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* left face */}
      <polygon
        points="0,28 50,53 50,103 0,78"
        fill={`url(#${id})`}
        stroke={hue.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* top face */}
      <polygon
        points="50,3 100,28 50,53 0,28"
        fill="#ffffff"
        stroke={hue.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* belt                                                                */
/* ------------------------------------------------------------------ */

function Belt() {
  const treads = Array.from({ length: 9 }, (_, i) => (i + 0.5) / 9)
  const nearL = edge(-0.06, 1)
  const nearR = edge(-0.06, -1)
  const farL = edge(1.05, 1)
  const farR = edge(1.05, -1)
  // Side thickness drops the lower (+n) edge down a touch.
  const drop = 16
  return (
    <svg
      className="absolute inset-0"
      width={STAGE_W}
      height={STAGE_H}
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      fill="none"
    >
      <defs>
        <linearGradient id="beltTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F4F6" />
          <stop offset="1" stopColor="#EBEBEF" />
        </linearGradient>
      </defs>
      {/* thickness */}
      <polygon
        points={`${pt(nearL)} ${pt(farL)} ${pt({ x: farL.x, y: farL.y + drop })} ${pt({ x: nearL.x, y: nearL.y + drop })}`}
        fill="#DEDEE3"
      />
      {/* top surface */}
      <polygon
        points={`${pt(nearL)} ${pt(nearR)} ${pt(farR)} ${pt(farL)}`}
        fill="url(#beltTop)"
      />
      {/* treads */}
      {treads.map((u, i) => {
        const a = edge(u, 1)
        const b = edge(u, -1)
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#FFFFFF"
            strokeWidth={lerp(9, 4, u)}
            strokeLinecap="round"
            opacity={0.9}
          />
        )
      })}
      {/* edge lines */}
      <line x1={nearL.x} y1={nearL.y} x2={farL.x} y2={farL.y} stroke="#D3D3D9" strokeWidth="1.5" />
      <line x1={nearR.x} y1={nearR.y} x2={farR.x} y2={farR.y} stroke="#D3D3D9" strokeWidth="1.5" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* scripted pointer (the reference "cursor clicks Generate")           */
/* ------------------------------------------------------------------ */

function DemoPointer({ x, y, pressed }: { x: any; y: any; pressed: boolean }) {
  return (
    <motion.div
      style={{ left: x, top: y, position: "absolute" }}
      className="pointer-events-none z-50 -translate-x-[3px] -translate-y-[2px]"
    >
      <motion.div animate={{ scale: pressed ? 0.82 : 1 }} transition={{ duration: 0.12 }}>
        <svg width="26" height="28" viewBox="0 0 50 54" fill="none" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.18))" }}>
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
            animate={{ width: 40, height: 40, x: -20, y: -20, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* right-side result (streams like a generation)                       */
/* ------------------------------------------------------------------ */

type Phase = "idle" | "scanning" | "streaming" | "done"

const FIELD = {
  hidden: { opacity: 0, y: 8, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
}

function ResultPanel({ phase }: { phase: Phase }) {
  const busy = phase === "scanning" || phase === "streaming"
  const reveal = phase === "streaming" || phase === "done"
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* header */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-6 w-6 items-center justify-center">
          {busy ? (
            <motion.span
              className="block h-4 w-4 rounded-full border-[2px] border-neutral-300 border-t-[#7BB304]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 0.7 }}
            />
          ) : phase === "done" ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7BB304]/15">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M4 13l5 5L20 6" stroke="#5E8E3E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          ) : (
            <span className="block h-2 w-2 rounded-full bg-neutral-300" />
          )}
        </span>
        <span className="font-mono text-[12px] tracking-tight text-neutral-500">
          {phase === "idle" && "Ready to generate"}
          {phase === "scanning" && "Reading the item…"}
          {phase === "streaming" && "Writing the listing…"}
          {phase === "done" && "Listing ready"}
        </span>
      </div>

      {/* result card */}
      <div className="flex min-h-[248px] flex-1 flex-col gap-3 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        {/* photo */}
        <motion.div
          className="h-[92px] w-full overflow-hidden rounded-lg"
          initial={false}
          animate={{
            background: reveal
              ? "linear-gradient(135deg,#E9EDDF,#93B45E)"
              : "linear-gradient(135deg,#F1F1F3,#E7E7EB)",
          }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {reveal && (
              <motion.div
                className="flex h-full w-full items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <span className="h-11 w-[92px] rotate-[-8deg] rounded-full bg-white/85 shadow-[0_6px_10px_-4px_rgba(0,0,0,0.15)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* title + price */}
        <motion.div
          className="flex items-start justify-between gap-3"
          variants={FIELD}
          initial="hidden"
          animate={reveal ? "show" : "hidden"}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <span className="text-[15px] font-semibold text-neutral-900">
            Air Max 90, “OG White”
          </span>
          <span className="text-[15px] font-bold text-neutral-900">$74</span>
        </motion.div>

        {/* condition */}
        <motion.div
          variants={FIELD}
          initial="hidden"
          animate={reveal ? "show" : "hidden"}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <span className="rounded-md bg-[#7BB304]/12 px-2 py-1 text-[11px] font-semibold text-[#4A6B2A]">
            Used · Good
          </span>
        </motion.div>

        {/* bullets */}
        {[0.28, 0.4].map((d, i) => (
          <motion.div
            key={i}
            className="h-2 rounded bg-neutral-200"
            style={{ width: i === 0 ? "86%" : "68%" }}
            variants={FIELD}
            initial="hidden"
            animate={reveal ? "show" : "hidden"}
            transition={{ duration: 0.4, delay: d }}
          />
        ))}

        <div className="flex-1" />

        {/* platform chips */}
        <motion.div
          className="flex items-center gap-2 pt-1"
          variants={FIELD}
          initial="hidden"
          animate={reveal ? "show" : "hidden"}
          transition={{ duration: 0.4, delay: 0.52 }}
        >
          <span className="font-mono text-[9.5px] uppercase tracking-wider text-neutral-400">
            Live on
          </span>
          {["#E53238", "#95BF46", "#2C2E36", "#3CAD46"].map((c, i) => (
            <span
              key={i}
              className="h-4 w-4 rounded-[5px]"
              style={{ background: c, opacity: 0.9 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

export function AddProductConveyor({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const cubeRefs = useRef<Array<HTMLDivElement | null>>([])
  const cardRef = useRef<HTMLDivElement | null>(null)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const [phase, setPhase] = useState<Phase>(reduced ? "done" : "idle")
  const [pressed, setPressed] = useState(false)

  // Scripted pointer springs toward a target.
  const REST = { x: 150, y: 262 }
  const px = useSpring(REST.x, { stiffness: 120, damping: 20, mass: 1 })
  const py = useSpring(REST.y, { stiffness: 120, damping: 20, mass: 1 })

  /* Belt loop uses imperative transforms with no re-render. */
  useAnimationFrame((tMs) => {
    if (reduced) return
    const t = tMs / 1000
    for (let i = 0; i < N_CUBES; i++) {
      const el = cubeRefs.current[i]
      if (!el) continue
      const p = (i / N_CUBES + t * SPEED) % 1
      const c = at(p)
      const s = lerp(SCALE_NEAR, SCALE_FAR, p)
      el.style.transform = `translate(-50%,-64%) translate(${c.x}px,${c.y}px) scale(${s})`
      el.style.zIndex = String(Math.round((1 - p) * 100))
      el.style.opacity = p > 0.94 ? String((1 - p) / 0.06) : p < 0.04 ? String(p / 0.04) : "1"
    }
  })

  // static placement for reduced-motion (frame loop is skipped)
  useEffect(() => {
    if (!reduced) return
    for (let i = 0; i < N_CUBES; i++) {
      const el = cubeRefs.current[i]
      if (!el) continue
      const p = (i + 0.5) / N_CUBES
      const c = at(p)
      const s = lerp(SCALE_NEAR, SCALE_FAR, p)
      el.style.transform = `translate(-50%,-64%) translate(${c.x}px,${c.y}px) scale(${s})`
      el.style.zIndex = String(Math.round((1 - p) * 100))
    }
  }, [reduced])

  /* generation cycle */
  const moveTo = useCallback(
    (clientTarget: { x: number; y: number }) => {
      const card = cardRef.current?.getBoundingClientRect()
      if (!card) return
      px.set(clientTarget.x - card.left)
      py.set(clientTarget.y - card.top)
    },
    [px, py],
  )

  useEffect(() => {
    if (reduced) return
    let alive = true
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

    const loop = async () => {
      // let springs settle to rest first
      await wait(700)
      while (alive) {
        setPhase("idle")
        px.set(REST.x)
        py.set(REST.y)
        await wait(1100)
        if (!alive) return

        // pointer glides to the Generate button
        const b = btnRef.current?.getBoundingClientRect()
        if (b) moveTo({ x: b.left + b.width / 2, y: b.top + b.height / 2 })
        await wait(720)
        if (!alive) return

        // click
        setPressed(true)
        await wait(140)
        setPressed(false)
        setPhase("scanning")
        await wait(820)
        if (!alive) return

        // result streams in
        setPhase("streaming")
        await wait(1150)
        if (!alive) return

        setPhase("done")
        await wait(2400)
        if (!alive) return
      }
    }
    loop()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  const scanC = at(0.24)
  const scanSize = CUBE * lerp(SCALE_NEAR, SCALE_FAR, 0.24) * 1.35
  const showScan = phase === "scanning" || phase === "streaming"

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative flex w-full max-w-[1040px] overflow-hidden rounded-[22px] border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_50px_-24px_rgba(0,0,0,0.22)]",
        className,
      )}
    >
      {/* ---------------- LEFT: conveyor ---------------- */}
      <div className="relative w-[58%] overflow-hidden border-r border-neutral-200/70 bg-gradient-to-b from-[#FBFBFC] to-[#F4F4F6]">
        <div
          className="relative"
          style={{ width: STAGE_W, height: STAGE_H, maxWidth: "100%" }}
        >
          <Belt />

          {/* cubes */}
          {Array.from({ length: N_CUBES }).map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                cubeRefs.current[i] = el
              }}
              className="absolute left-0 top-0"
              style={{ width: CUBE, height: CUBE, willChange: "transform" }}
            >
              <IsoCube uid={i} hue={HUES[i % HUES.length]} size={CUBE} />
            </div>
          ))}

          {/* scan box */}
          <AnimatePresence>
            {showScan && (
              <motion.div
                className="absolute z-[90]"
                style={{
                  left: scanC.x,
                  top: scanC.y - scanSize * 0.18,
                  width: scanSize,
                  height: scanSize,
                  translateX: "-50%",
                  translateY: "-50%",
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
              >
                <div className="absolute inset-0 rounded-[4px]" style={{ boxShadow: "0 0 0 1.5px rgba(123,179,4,0.9)" }} />
                {/* corner ticks */}
                {[
                  "left-[-2px] top-[-2px] border-l-2 border-t-2",
                  "right-[-2px] top-[-2px] border-r-2 border-t-2",
                  "left-[-2px] bottom-[-2px] border-l-2 border-b-2",
                  "right-[-2px] bottom-[-2px] border-r-2 border-b-2",
                ].map((c, i) => (
                  <span key={i} className={cn("absolute h-3 w-3 border-[#5E8E3E]", c)} />
                ))}
                <span className="absolute -top-5 left-0 font-mono text-[11px] font-medium text-[#5E8E3E]">
                  item · 98%
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* New badge */}
          <span className="absolute left-5 top-5 z-[95] rounded-md bg-[#7BB304]/12 px-2.5 py-1 text-[12px] font-semibold text-[#4A6B2A]">
            New
          </span>

          {/* scripted pointer */}
          {!reduced && <DemoPointer x={px} y={py} pressed={pressed} />}
        </div>
      </div>

      {/* ---------------- RIGHT: result ---------------- */}
      <div className="flex w-[42%] flex-col">
        <div className="flex items-center justify-between border-b border-neutral-200/70 px-6 py-4">
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-neutral-900">Add a product</span>
            <span className="text-[12.5px] text-neutral-500">Snap it. We write the listing.</span>
          </div>
          <button
            ref={btnRef}
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-neutral-800"
          >
            {phase === "done" ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M4 13l5 5L20 6" stroke="#7BB304" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Done
              </>
            ) : (
              "Generate"
            )}
          </button>
        </div>
        <ResultPanel phase={phase} />
      </div>
    </div>
  )
}

export default AddProductConveyor
