"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getAllLessons } from "@/content/m3/lessons";
import { LessonPath } from "@/content/m3/lesson-schema";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// 1. Checkpoint Track Metadata
// ---------------------------------------------------------------------------
interface TrackMeta {
  id: LessonPath;
  title: string;
  shortInfo: string;
  iconSvg: React.ReactNode;
}

const TRACKS: TrackMeta[] = [
  {
    id: "ai",
    title: "AI & LLM Systems",
    shortInfo: "Transformer architectures, RAG pipelines, and vector embeddings.",
    iconSvg: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm1-13h-2v4H7v2h4v4h2v-4h4V9h-4V7z" />
      </svg>
    ),
  },
  {
    id: "backend",
    title: "Backend & Distributed",
    shortInfo: "Idempotency, cache stampede prevention, and high-throughput APIs.",
    iconSvg: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 6h16v4H4zm0 8h16v4H4z" />
      </svg>
    ),
  },
  {
    id: "frontend",
    title: "Frontend Architecture",
    shortInfo: "Robust client-server contracts and optimistic UI updates.",
    iconSvg: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 4h18v12H3zm2 2v8h14V6zm4 10h6v2H9z" />
      </svg>
    ),
  },
  {
    id: "devops",
    title: "DevOps & Cloud",
    shortInfo: "Automated pipelines, multi-stage image optimization, and blue-green delivery.",
    iconSvg: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3z" />
      </svg>
    ),
  },
  {
    id: "foundations",
    title: "Core CS Foundations",
    shortInfo: "Data structures, algorithmic complexity, and memory management.",
    iconSvg: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5" />
      </svg>
    ),
  },
];

function getLessonIcon(lessonId: string): string {
  switch (lessonId) {
    case "rag-pipeline":
      return "⚡";
    case "llm-basics":
      return "🧠";
    case "tokens-context":
      return "🔢";
    case "embeddings-similarity":
      return "🌐";
    case "caching-fundamentals":
      return "💾";
    case "http-rest":
      return "🔌";
    case "docker-containers":
      return "🐳";
    case "cicd-pipelines":
      return "🚀";
    default:
      return "⚡";
  }
}

// ---------------------------------------------------------------------------
// 2. Web Audio API: Zero-Asset Synthesized Metallic Chime
// ---------------------------------------------------------------------------
let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playMetallicChime(pitchMultiplier = 1) {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const baseFreq = 587.33 * pitchMultiplier; // D5 base
    const ratios = [1.0, 1.498, 2.0, 2.76, 4.07];

    ratios.forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const bandpass = ctx.createBiquadFilter();

      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(baseFreq * ratio, now);
      bandpass.Q.setValueAtTime(14, now);

      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(baseFreq * ratio, now);

      const decay = 0.45 / (1 + i * 0.4);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.06 / (i + 1), now + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(g);
      g.connect(bandpass);
      bandpass.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.02);
    });
  } catch {
    // Graceful fallback
  }
}

// ---------------------------------------------------------------------------
// 3. Module III Discovery Page
// ---------------------------------------------------------------------------
export default function Module3DiscoveryPage() {
  const allLessons = getAllLessons();

  // State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [selectedTrackForChapters, setSelectedTrackForChapters] = useState<TrackMeta | null>(null);
  const [modalEli5, setModalEli5] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);

  // Layout Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const svgLayerRef = useRef<SVGSVGElement>(null);
  const pathGroupRef = useRef<SVGGElement>(null);
  const trailGroupRef = useRef<SVGGElement>(null);
  const particleRef = useRef<SVGCircleElement>(null);

  // STATIC anchor elements (never transformed — eliminates jitter feedback loop)
  const anchorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathsRef = useRef<SVGPathElement[]>([]);
  const pathLengthsRef = useRef<number[]>([]);
  const trailsRef = useRef<SVGCircleElement[]>([]);

  // Smooth scroll tracking
  const currentP = useRef(0);
  const targetP = useRef(0);
  const activeIndexRef = useRef(0);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Load sound setting from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("basebuildstack_sound_enabled");
      if (saved !== null) {
        setSoundEnabled(saved === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playMetallicChime(1.1);
    try {
      localStorage.setItem("basebuildstack_sound_enabled", String(next));
    } catch {
      // Ignore
    }
  };

  // Construct Bezier splines connecting bottom of anchor[i] to top of anchor[i+1]
  const drawPaths = useCallback(() => {
    if (!svgLayerRef.current || !containerRef.current || !pathGroupRef.current) return;
    const pathGroup = pathGroupRef.current;
    pathGroup.innerHTML = "";
    pathsRef.current = [];
    pathLengthsRef.current = [];

    const containerHeight = containerRef.current.scrollHeight;
    svgLayerRef.current.style.height = `${containerHeight}px`;
    const containerRect = svgLayerRef.current.getBoundingClientRect();

    const N = anchorRefs.current.length; // 6 nodes
    for (let i = 0; i < N - 1; i++) {
      const startAnchor = anchorRefs.current[i];
      const endAnchor = anchorRefs.current[i + 1];
      if (!startAnchor || !endAnchor) continue;

      const rStart = startAnchor.getBoundingClientRect();
      const rEnd = endAnchor.getBoundingClientRect();

      const start = {
        x: rStart.left + rStart.width / 2 - containerRect.left,
        y: rStart.bottom - containerRect.top,
      };
      const end = {
        x: rEnd.left + rEnd.width / 2 - containerRect.left,
        y: rEnd.top - containerRect.top,
      };

      const maxOffset = Math.min(80, Math.max(35, containerRect.width * 0.18));
      const offset = i % 2 === 0 ? maxOffset : -maxOffset;
      const cp1X = start.x + offset;
      const cp1Y = start.y + (end.y - start.y) * 0.4;
      const cp2X = end.x - offset;
      const cp2Y = end.y - (end.y - start.y) * 0.4;

      const d = `M ${start.x} ${start.y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${end.x} ${end.y}`;

      const dimPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      dimPath.setAttribute("d", d);
      dimPath.setAttribute("fill", "none");
      dimPath.setAttribute("stroke", "rgba(255, 255, 255, 0.08)");
      dimPath.setAttribute("stroke-width", "2");
      dimPath.setAttribute("stroke-dasharray", "4 6");

      const activePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      activePath.setAttribute("d", d);
      activePath.setAttribute("fill", "none");
      activePath.setAttribute("stroke", "url(#glow-grad)");
      activePath.setAttribute("stroke-width", "3");
      activePath.setAttribute("stroke-linecap", "round");
      activePath.setAttribute("filter", "url(#glow)");

      pathGroup.appendChild(dimPath);
      pathGroup.appendChild(activePath);

      const len = activePath.getTotalLength();
      activePath.style.strokeDasharray = `${len}`;
      activePath.style.strokeDashoffset = `${len}`;

      pathsRef.current.push(activePath);
      pathLengthsRef.current.push(len);
    }
  }, []);

  // Compute exact coordinate of the ball tracker
  const getPos = useCallback((p: number, N: number) => {
    p = Math.max(0, Math.min(p, N - 1));
    const idx = Math.min(Math.floor(p), N - 2);
    const frac = p - idx;

    const path = pathsRef.current[idx];
    const len = pathLengthsRef.current[idx];
    if (!path || !len) return { x: 0, y: 0 };

    // Stage 1: [0.00 .. 0.18] — Passing across card idx (from top to bottom)
    if (frac <= 0.18) {
      if (idx > 0 && pathsRef.current[idx - 1] && pathLengthsRef.current[idx - 1]) {
        const prevPath = pathsRef.current[idx - 1];
        const prevLen = pathLengthsRef.current[idx - 1];
        const topPt = prevPath.getPointAtLength(prevLen);
        const botPt = path.getPointAtLength(0);
        const tCard = frac / 0.18;
        return {
          x: topPt.x + (botPt.x - topPt.x) * tCard,
          y: topPt.y + (botPt.y - topPt.y) * tCard,
        };
      }
      return path.getPointAtLength(0);
    }
    // Stage 3: [0.82 .. 1.00] — Reached top of destination card idx + 1
    else if (frac >= 0.82) {
      return path.getPointAtLength(len);
    }
    // Stage 2: (0.18 .. 0.82) — Traveling along the Bezier wire in open space
    else {
      const tWire = (frac - 0.18) / 0.64;
      return path.getPointAtLength(tWire * len);
    }
  }, []);

  // Update card activation and trigger chime
  const updateCards = useCallback((newActive: number) => {
    if (activeIndexRef.current === newActive) return;
    const prev = activeIndexRef.current;
    activeIndexRef.current = newActive;
    setActiveCardIndex(newActive);

    // Play chime strictly when entering a valid checkpoint
    if (newActive > 0 && newActive !== prev && soundEnabledRef.current) {
      const pitch = 0.95 + (newActive % 5) * 0.12;
      playMetallicChime(pitch);
    }
  }, []);

  // Render SVG paths, main particle, and trailing comet
  const render = useCallback(
    (P: number, N: number) => {
      const paths = pathsRef.current;
      const pathLengths = pathLengthsRef.current;
      if (paths.length === 0) return;

      const idx = Math.min(Math.floor(P), N - 2);
      const frac = P - idx;

      // 1. Draw glowing line in sync with the ball tracker
      paths.forEach((p, i) => {
        if (i < idx) {
          p.style.strokeDashoffset = "0"; // fully illuminated
        } else if (i > idx) {
          p.style.strokeDashoffset = `${pathLengths[i]}`; // dormant
        } else {
          // Current wire (idx)
          if (frac <= 0.18) {
            p.style.strokeDashoffset = `${pathLengths[i]}`;
          } else if (frac >= 0.82) {
            p.style.strokeDashoffset = "0";
          } else {
            const tWire = (frac - 0.18) / 0.64;
            p.style.strokeDashoffset = `${pathLengths[i] * (1 - tWire)}`;
          }
        }
      });

      // 2. Move head particle
      const pt = getPos(P, N);
      if (particleRef.current) {
        particleRef.current.setAttribute("cx", `${pt.x}`);
        particleRef.current.setAttribute("cy", `${pt.y}`);
      }

      // 3. Move trail particles (only visible during wire transit)
      const isWireTransit = frac > 0.18 && frac < 0.82;
      const trails = trailsRef.current;
      const trailCount = trails.length;
      trails.forEach((t, i) => {
        const trailP = Math.max(P - (i + 1) * 0.02, 0);
        const tp = getPos(trailP, N);
        t.setAttribute("cx", `${tp.x}`);
        t.setAttribute("cy", `${tp.y}`);
        t.style.opacity = isWireTransit ? `${1 - i / trailCount}` : "0";
      });

      // 4. Card Activation:
      // When ball reaches the rectangle of the card, THEN ONLY it pops out!
      // On the wire between cards (0.18 < frac < 0.82), NEITHER card is popped.
      let newActive = -1;
      if (frac >= 0.82) {
        newActive = idx + 1; // Ball reached the destination card rectangle
      } else if (frac <= 0.18) {
        newActive = idx; // Ball is on the current card
      } else {
        newActive = -1; // Ball is traveling on the wire in open space
      }

      updateCards(newActive);
    },
    [getPos, updateCards]
  );

  // Static Anchor-based viewport focus tracker (immune to card 3D transforms — zero jitter)
  const updateScrollP = useCallback(() => {
    const anchors = anchorRefs.current;
    const N = anchors.length;
    if (N < 2) return;

    // Viewport natural focus line (48% down the viewport)
    const targetY = window.innerHeight * 0.48;

    const centers: number[] = [];
    for (let i = 0; i < N; i++) {
      const a = anchors[i];
      if (!a) {
        centers.push(0);
        continue;
      }
      const r = a.getBoundingClientRect();
      centers.push(r.top + r.height / 2);
    }

    // 1. Above Origin
    if (targetY <= centers[0]) {
      targetP.current = 0;
      return;
    }

    // 2. Below final Checkpoint
    if (targetY >= centers[N - 1]) {
      targetP.current = N - 1;
      return;
    }

    // 3. Interpolate between Anchor i and Anchor i + 1
    for (let i = 0; i < N - 1; i++) {
      const y0 = centers[i];
      const y1 = centers[i + 1];
      if (targetY >= y0 && targetY <= y1) {
        const dist = y1 - y0;
        const frac = dist > 0 ? (targetY - y0) / dist : 0;
        targetP.current = i + frac;
        return;
      }
    }
  }, []);

  // Initialize Trail Particles
  useEffect(() => {
    if (!trailGroupRef.current) return;
    const trailGroup = trailGroupRef.current;
    trailGroup.innerHTML = "";
    trailsRef.current = [];

    const trailCount = 6;
    for (let i = 0; i < trailCount; i++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("r", `${5 - i * 0.6}`);
      c.setAttribute("fill", "#9C8FFF");
      trailGroup.appendChild(c);
      trailsRef.current.push(c);
    }
  }, []);

  // Initialize paths and smooth animation scrub loop
  useEffect(() => {
    const timer = setTimeout(() => {
      drawPaths();
      updateScrollP();
      currentP.current = targetP.current;
      render(currentP.current, anchorRefs.current.length);
    }, 120);

    const onResize = () => {
      drawPaths();
      updateScrollP();
      render(currentP.current, anchorRefs.current.length);
    };
    window.addEventListener("resize", onResize);

    const onScroll = () => {
      updateScrollP();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });

    // 60fps/120fps smooth scrub loop without feedback oscillations
    let rafId: number;
    const loop = () => {
      updateScrollP();
      const diff = targetP.current - currentP.current;
      if (Math.abs(diff) > 0.0001) {
        currentP.current += diff * 0.18;
        render(currentP.current, anchorRefs.current.length);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [drawPaths, render, updateScrollP]);

  const modalLessons = selectedTrackForChapters
    ? allLessons.filter((l) => l.paths.includes(selectedTrackForChapters.id))
    : [];

  return (
    <div className="relative min-h-screen py-4 max-w-4xl mx-auto space-y-10 select-none pb-36">
      {/* -------------------------------------------------------------------- */}
      {/* 1. Header Bar: Pick a path                                           */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[var(--border)] text-center sm:text-left">
        <div className="space-y-2">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <Chip k="MODULE" v="III" tone="accent" />
            <span className="text-xs font-mono tracking-widest text-[var(--text-3)] uppercase font-semibold">
              15-Minute Tech Bites
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight">
            Pick a path.
          </h1>

          <p className="font-ui text-sm sm:text-base text-[var(--text-2)] max-w-xl leading-relaxed">
            Scroll to explore the architecture checkpoints. Follow the glowing signal
            from Origin down to each station.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center justify-center sm:justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleSound}
            aria-label="Toggle Sound Effects"
            className={`px-3.5 py-1.5 rounded-full border text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              soundEnabled
                ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] border-[var(--accent-bright)] text-[var(--accent-bright)] shadow-[0_0_12px_rgba(156,143,255,0.25)]"
                : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)]"
            }`}
          >
            <span>{soundEnabled ? "🔊" : "🔇"}</span>
            <span>Sound {soundEnabled ? "ON" : "MUTED"}</span>
          </button>

          <Button
            href="/m3/retest"
            variant="secondary"
            size="sm"
            className="text-xs font-mono font-bold"
          >
            Retest Queue &rarr;
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. 3D Perspective Container with SVG Wire Layer & Pop Cards          */}
      {/* -------------------------------------------------------------------- */}
      <div
        ref={containerRef}
        id="container"
        className="relative pb-[65vh]"
        style={{
          perspective: "1200px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* SVG Wire Layer with Bezier curves, glow filter & comet particles */}
        <svg
          ref={svgLayerRef}
          id="svg-layer"
          className="absolute top-0 left-0 w-full pointer-events-none z-10"
          style={{ transform: "translateZ(-50px)" }}
        >
          <defs>
            <linearGradient id="glow-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="45%" stopColor="#5E4EF0" />
              <stop offset="85%" stopColor="#9C8FFF" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g ref={pathGroupRef} id="path-group" />
          <g ref={trailGroupRef} id="trail-group" />
          <circle ref={particleRef} id="particle" r="6" fill="#fff" filter="url(#glow)" />
        </svg>

        {/* ------------------------------------------------------------------ */}
        {/* Static Anchors Column with Module II Obsidian Glass Cards Inside   */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="flex flex-col items-center gap-36 sm:gap-40 relative z-20"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Node 0: Origin Station (Anchor 0) */}
          <div
            ref={(el) => {
              anchorRefs.current[0] = el;
            }}
            className="relative w-[min(90%,440px)] min-h-[130px] flex items-center justify-center"
          >
            {/* Inner Popped Card (Module II Glass Design) */}
            <div
              className="w-full rounded-2xl p-5 border backdrop-blur-xl transition-all duration-400 select-none relative"
              style={{
                background:
                  activeCardIndex === 0
                    ? "linear-gradient(180deg, rgba(26, 29, 43, 0.94) 0%, rgba(16, 18, 27, 0.98) 100%)"
                    : "linear-gradient(180deg, rgba(20, 22, 32, 0.75) 0%, rgba(13, 15, 23, 0.85) 100%)",
                transformStyle: "preserve-3d",
                transform:
                  activeCardIndex === 0
                    ? "rotateX(0deg) rotateY(0deg) translateZ(36px) scale(1.03)"
                    : "rotateX(12deg) rotateY(0deg) translateZ(-30px) scale(0.96)",
                borderColor:
                  activeCardIndex === 0 ? "var(--accent-bright)" : "var(--border)",
                boxShadow:
                  activeCardIndex === 0
                    ? "0 24px 60px -12px rgba(94, 78, 240, 0.35), 0 0 20px rgba(156, 143, 255, 0.12) inset, inset 0 1px 0 rgba(255, 255, 255, 0.25)"
                    : "0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 var(--rim)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      activeCardIndex === 0
                        ? "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] border-[var(--accent-bright)] text-[var(--accent-bright)] shadow-[0_0_16px_rgba(156,143,255,0.4)]"
                        : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-3)]"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                      <path strokeLinecap="round" strokeWidth="2" d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Chip k="ORIGIN" v="TRAIL START" tone={activeCardIndex === 0 ? "accent" : "muted"} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-[var(--text)] tracking-tight mt-1">
                      Architecture Signal [0, 0]
                    </h3>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] border border-[var(--accent-bright)] text-[10px] font-mono font-bold text-[var(--accent-bright)]">
                  START
                </span>
              </div>

              <p className="font-ui text-xs text-[var(--text-2)] mt-2.5 leading-relaxed">
                Scroll down to track the pulse across architecture checkpoints.
              </p>

              {/* Bottom node connector point */}
              <div
                className="node-point bottom"
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "-6px",
                  transform: "translateX(-50%) translateZ(10px)",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: activeCardIndex === 0 ? "var(--accent-bright)" : "var(--surface-solid)",
                  border:
                    activeCardIndex === 0
                      ? "2px solid #ffffff"
                      : "2px solid var(--border)",
                  boxShadow: activeCardIndex === 0 ? "0 0 14px var(--accent-bright)" : "none",
                  transition: "all 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Nodes 1..5: Checkpoint Cards (Anchors 1..5) */}
          {TRACKS.map((track, trackIdx) => {
            const nodeIndex = trackIdx + 1; // 1 to 5
            const isActive = activeCardIndex === nodeIndex;
            const dormantRotateY = trackIdx % 2 === 0 ? -6 : 6;

            return (
              <div
                key={`anchor-${track.id}`}
                ref={(el) => {
                  anchorRefs.current[nodeIndex] = el;
                }}
                className="relative w-[min(90%,440px)] min-h-[160px] flex items-center justify-center"
              >
                {/* Inner Popped Card (Module II Glass Design) */}
                <div
                  className="w-full rounded-2xl p-6 border backdrop-blur-xl transition-all duration-400 select-none relative group"
                  style={{
                    background: isActive
                      ? "linear-gradient(180deg, rgba(26, 29, 43, 0.94) 0%, rgba(16, 18, 27, 0.98) 100%)"
                      : "linear-gradient(180deg, rgba(20, 22, 32, 0.75) 0%, rgba(13, 15, 23, 0.85) 100%)",
                    transformStyle: "preserve-3d",
                    transform: isActive
                      ? "rotateX(0deg) rotateY(0deg) translateZ(36px) scale(1.03)"
                      : `rotateX(12deg) rotateY(${dormantRotateY}deg) translateZ(-30px) scale(0.96)`,
                    borderColor: isActive
                      ? "var(--accent-bright)"
                      : "var(--border)",
                    boxShadow: isActive
                      ? "0 24px 60px -12px rgba(94, 78, 240, 0.35), 0 0 20px rgba(156, 143, 255, 0.12) inset, inset 0 1px 0 rgba(255, 255, 255, 0.25)"
                      : "0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 var(--rim)",
                  }}
                >
                  {/* Top node connector point */}
                  <div
                    className="node-point top"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "-6px",
                      transform: "translateX(-50%) translateZ(10px)",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: isActive ? "var(--accent-bright)" : "var(--surface-solid)",
                      border: isActive
                        ? "2px solid #ffffff"
                        : "2px solid var(--border)",
                      boxShadow: isActive ? "0 0 14px var(--accent-bright)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  />

                  {/* Header Row */}
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                          isActive
                            ? "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] border-[var(--accent-bright)] text-[var(--accent-bright)] shadow-[0_0_16px_rgba(156,143,255,0.4)]"
                            : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-3)] group-hover:border-[var(--border-strong)]"
                        }`}
                      >
                        {track.iconSvg}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <Chip k="CHECKPOINT" v={`0${trackIdx + 1}`} tone={isActive ? "accent" : "muted"} />
                        </div>
                        <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--text)] tracking-tight mt-1">
                          {track.title}
                        </h3>
                      </div>
                    </div>

                    {/* Module II Button */}
                    <Button
                      variant={isActive ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        setSelectedTrackForChapters(track);
                        if (soundEnabledRef.current) playMetallicChime(1.3);
                      }}
                      className="text-xs shrink-0"
                    >
                      Learn &rarr;
                    </Button>
                  </div>

                  {/* Short Description */}
                  <p className="font-ui text-xs sm:text-sm text-[var(--text-2)] leading-relaxed mt-2.5">
                    {track.shortInfo}
                  </p>

                  {/* Bottom node connector point */}
                  <div
                    className="node-point bottom"
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: "-6px",
                      transform: "translateX(-50%) translateZ(10px)",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: isActive ? "var(--accent-bright)" : "var(--surface-solid)",
                      border: isActive
                        ? "2px solid #ffffff"
                        : "2px solid var(--border)",
                      boxShadow: isActive ? "0 0 14px var(--accent-bright)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. Floating "Ask Gemini" Pill                                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setGeminiModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[var(--surface-solid)]/90 backdrop-blur-xl border border-[var(--border)] hover:border-[var(--accent-bright)] text-xs font-mono font-semibold text-[var(--text)] flex items-center gap-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] hover:scale-105 transition-all cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--accent-bright)] shadow-[0_0_8px_var(--accent-bright)] group-hover:scale-125 transition-transform" />
          <span>Ask Gemini</span>
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. Focused Chapter Drawer/Modal (Module II Glass Card Style)          */}
      {/* -------------------------------------------------------------------- */}
      {selectedTrackForChapters && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedTrackForChapters(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-solid)] p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] border border-[var(--accent-bright)] flex items-center justify-center text-[var(--accent-bright)]">
                  {selectedTrackForChapters.iconSvg}
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent-bright)] font-bold">
                    15-MINUTE BITES
                  </div>
                  <h3 className="font-display text-xl font-bold text-[var(--text)]">
                    {selectedTrackForChapters.title}
                  </h3>
                </div>
              </div>

              {/* ELI5 Switch + Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalEli5(!modalEli5);
                    if (soundEnabledRef.current) playMetallicChime(1.3);
                  }}
                  className={`px-3 py-1 rounded-full border text-xs font-mono font-semibold transition-all cursor-pointer ${
                    modalEli5
                      ? "bg-[#FFB547]/20 border-[#FFB547] text-[#FFB547]"
                      : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
                  }`}
                >
                  {modalEli5 ? "👶 ELI5" : "💡 Tech"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTrackForChapters(null)}
                  className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--glass-subtle)] cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chapters List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {modalLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--glass-subtle)] hover:border-[var(--accent-bright)] hover:bg-[var(--glass)] transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getLessonIcon(lesson.id)}</span>
                        <h4 className="font-ui text-sm font-bold text-[var(--text)]">{lesson.title}</h4>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-3)] flex items-center gap-2">
                        <span>15m bite</span>
                        <span>•</span>
                        <span className="text-emerald-400">+{lesson.xpAward} XP</span>
                        {lesson.prerequisites.length > 0 && (
                          <>
                            <span>•</span>
                            <span>Prereq: {lesson.prerequisites[0]}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      href={`/m3/lesson/${lesson.id}`}
                      variant="primary"
                      size="sm"
                      className="shrink-0 text-xs"
                    >
                      Start &rarr;
                    </Button>
                  </div>

                  {/* Outcome or ELI5 Metaphor */}
                  <div className="text-xs text-[var(--text-2)] leading-relaxed">
                    {modalEli5 ? (
                      <div className="p-2.5 rounded-lg bg-[#FFB547]/10 border border-[#FFB547]/30 text-[#FFB547]">
                        <span className="font-bold mr-1">👶 ELI5:</span>
                        {lesson.eli5 || lesson.outcome}
                      </div>
                    ) : (
                      <p>{lesson.outcome}</p>
                    )}
                  </div>

                  {/* 5 Stages indicator */}
                  <div className="flex items-center gap-1.5 pt-1 text-[9px] font-mono text-[var(--text-3)]">
                    <span className="text-[var(--accent-bright)] font-semibold">5 Stages:</span>
                    <span>1. Why</span>
                    <span>&rarr;</span>
                    <span>2. Model</span>
                    <span>&rarr;</span>
                    <span>3. See</span>
                    <span>&rarr;</span>
                    <span>4. Try</span>
                    <span>&rarr;</span>
                    <span>5. Recall</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 5. Ask Gemini Modal Dialog                                           */}
      {/* -------------------------------------------------------------------- */}
      {geminiModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
          onClick={() => setGeminiModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-bright)] shadow-[0_0_8px_var(--accent-bright)]" />
                <h3 className="font-display text-lg font-bold text-[var(--text)]">
                  Ask Gemini · Tech Bites Curriculum
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGeminiModalOpen(false)}
                className="text-[var(--text-3)] hover:text-[var(--text)] font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-ui text-sm text-[var(--text-2)] leading-relaxed">
              <p>
                <strong>Welcome to 15-Minute Tech Bites!</strong> Each bite builds an
                interview-ready mental model through 5 active stages without lecture fatigue.
              </p>
              <div className="p-3 rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] space-y-2 text-xs font-mono">
                <div className="text-[var(--accent-bright)] font-bold">Recommended Learning Trajectory:</div>
                <ul className="space-y-1 list-disc list-inside text-[var(--text)]">
                  <li>
                    <strong>AI Engineers:</strong> RAG Pipeline → LLM Basics → Tokens &amp; BPE → Vector
                    Embeddings
                  </li>
                  <li>
                    <strong>Backend Engineers:</strong> Caching &amp; Cache-Aside → HTTP/REST
                    Idempotency → Docker Containers
                  </li>
                  <li>
                    <strong>DevOps &amp; Cloud:</strong> Docker Namespaces/Cgroups → CI/CD Canary
                    Deployments
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setGeminiModalOpen(false)}
              >
                Got it &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
