"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getAllLessons } from "@/content/m3/lessons";
import { Lesson, LessonPath } from "@/content/m3/lesson-schema";

// ---------------------------------------------------------------------------
// 1. Checkpoint Track Metadata (Minimal Initial Content per user requirement)
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

// Helper to provide icons for chapter items
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
    const baseFreq = 880 * pitchMultiplier;

    // Inharmonic partials characteristic of striking a resonant metal chime
    const partials = [
      { ratio: 1.0, type: "sine" as OscillatorType, gain: 0.12, decay: 0.28 },
      { ratio: 2.76, type: "sine" as OscillatorType, gain: 0.08, decay: 0.22 },
      { ratio: 5.4, type: "triangle" as OscillatorType, gain: 0.05, decay: 0.16 },
      { ratio: 8.9, type: "sine" as OscillatorType, gain: 0.02, decay: 0.10 },
    ];

    const masterGain = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(2200, now);
    bandpass.Q.setValueAtTime(3.5, now);

    bandpass.connect(masterGain);
    masterGain.connect(ctx.destination);

    partials.forEach(({ ratio, type, gain, decay }) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(baseFreq * ratio, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * ratio * 0.96, now + decay);

      g.gain.setValueAtTime(gain, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(g);
      g.connect(bandpass);

      osc.start(now);
      osc.stop(now + decay + 0.02);
    });
  } catch {
    // Graceful fallback
  }
}

// ---------------------------------------------------------------------------
// 3. Module III 3D Tech Path Discovery Page
// ---------------------------------------------------------------------------
export default function Module3DiscoveryPage() {
  const allLessons = getAllLessons();

  // State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [selectedTrackForChapters, setSelectedTrackForChapters] = useState<TrackMeta | null>(null);
  const [modalEli5, setModalEli5] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);

  // Refs for pure 3D Bezier scroll engine
  const containerRef = useRef<HTMLDivElement>(null);
  const svgLayerRef = useRef<SVGSVGElement>(null);
  const pathGroupRef = useRef<SVGGElement>(null);
  const trailGroupRef = useRef<SVGGElement>(null);
  const particleRef = useRef<SVGCircleElement>(null);

  // 6 nodes: 0: Origin, 1..5: Checkpoints (AI, Backend, Frontend, DevOps, Core CS)
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathsRef = useRef<SVGPathElement[]>([]);
  const pathLengthsRef = useRef<number[]>([]);
  const trailsRef = useRef<SVGCircleElement[]>([]);

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

  // Helper to compute node element center relative to SVG layer
  const getCenter = useCallback((el: HTMLElement, containerRect: DOMRect) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - containerRect.left,
      y: r.top + r.height / 2 - containerRect.top,
    };
  }, []);

  // Construct Bezier splines connecting bottom node of card[i] to top node of card[i+1]
  const drawPaths = useCallback(() => {
    if (!svgLayerRef.current || !containerRef.current || !pathGroupRef.current) return;
    const pathGroup = pathGroupRef.current;
    pathGroup.innerHTML = "";
    pathsRef.current = [];
    pathLengthsRef.current = [];

    const containerHeight = containerRef.current.scrollHeight;
    svgLayerRef.current.style.height = `${containerHeight}px`;
    const containerRect = svgLayerRef.current.getBoundingClientRect();

    const N = nodeRefs.current.length; // 6 nodes
    for (let i = 0; i < N - 1; i++) {
      const startCard = nodeRefs.current[i];
      const endCard = nodeRefs.current[i + 1];
      if (!startCard || !endCard) continue;

      const bottomNode = startCard.querySelector(".node-point.bottom") as HTMLElement;
      const topNode = endCard.querySelector(".node-point.top") as HTMLElement;
      if (!bottomNode || !topNode) continue;

      const start = getCenter(bottomNode, containerRect);
      const end = getCenter(topNode, containerRect);

      const offset = i % 2 === 0 ? 90 : -90;
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
  }, [getCenter]);

  // Compute exact coordinate on path with 15% dwell time at start and end
  const getPos = useCallback((p: number, N: number) => {
    p = Math.max(0, Math.min(p, N - 1));
    const idx = Math.min(Math.floor(p), N - 2);
    const frac = p - idx;
    const tt = Math.min(Math.max((frac - 0.15) / 0.7, 0), 1);
    const path = pathsRef.current[idx];
    const len = pathLengthsRef.current[idx];
    if (!path || !len) return { x: 0, y: 0 };
    return path.getPointAtLength(tt * len);
  }, []);

  // Update card activation and trigger chime
  const updateCards = useCallback((newActive: number) => {
    if (activeIndexRef.current === newActive) return;
    const prev = activeIndexRef.current;
    activeIndexRef.current = newActive;
    setActiveCardIndex(newActive);

    // Play chime when entering a valid checkpoint
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

      // 1. Draw glowing lines up to progress
      paths.forEach((p, i) => {
        if (i < idx) p.style.strokeDashoffset = "0";
        else if (i > idx) p.style.strokeDashoffset = `${pathLengths[i]}`;
        else {
          const tt = Math.min(Math.max((frac - 0.15) / 0.7, 0), 1);
          p.style.strokeDashoffset = `${pathLengths[i] * (1 - tt)}`;
        }
      });

      // 2. Move head particle
      const pt = getPos(P, N);
      if (particleRef.current) {
        particleRef.current.setAttribute("cx", `${pt.x}`);
        particleRef.current.setAttribute("cy", `${pt.y}`);
      }

      // 3. Move trail particles
      const trails = trailsRef.current;
      const trailCount = trails.length;
      trails.forEach((t, i) => {
        const trailP = Math.max(P - (i + 1) * 0.02, 0);
        const tp = getPos(trailP, N);
        t.setAttribute("cx", `${tp.x}`);
        t.setAttribute("cy", `${tp.y}`);
        const isResting = frac < 0.15 || frac > 0.85;
        t.style.opacity = isResting ? "0" : `${1 - i / trailCount}`;
      });

      // 4. Dwell / Hold logic: 15% dwell time at start and end of every path
      let newActive = -1;
      if (frac < 0.15) newActive = idx; // Top Hold
      else if (frac > 0.85) newActive = idx + 1; // Bottom Hold
      else newActive = -1; // Travelling between cards

      updateCards(newActive);
    },
    [getPos, updateCards]
  );

  // Initialize SVG Trail Particles (6 particles)
  useEffect(() => {
    if (!trailGroupRef.current) return;
    const trailGroup = trailGroupRef.current;
    trailGroup.innerHTML = "";
    trailsRef.current = [];

    const trailCount = 6;
    for (let i = 0; i < trailCount; i++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("r", `${5 - i * 0.6}`);
      c.setAttribute("fill", "#c084fc");
      trailGroup.appendChild(c);
      trailsRef.current.push(c);
    }
  }, []);

  // Initialize paths and smooth animation scrub loop
  useEffect(() => {
    const timer = setTimeout(() => {
      drawPaths();
      render(0, nodeRefs.current.length);
    }, 150);

    const onResize = () => {
      drawPaths();
      render(currentP.current, nodeRefs.current.length);
    };
    window.addEventListener("resize", onResize);

    // Scroll listener mapping container progress to P: [0 .. N - 1]
    const onScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // start: container top reaches 30% of viewport
      // end: container bottom reaches 85% of viewport
      const startY = windowHeight * 0.3;
      const endY = windowHeight * 0.85;
      const totalDist = rect.height - (endY - startY);
      const currentScroll = startY - rect.top;
      const rawProgress = Math.max(0, Math.min(1, currentScroll / Math.max(1, totalDist)));
      targetP.current = rawProgress * (nodeRefs.current.length - 1);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // 60fps/120fps smooth scrub interpolation loop (matching GSAP scrub: 0.1)
    let rafId: number;
    const loop = () => {
      const diff = targetP.current - currentP.current;
      if (Math.abs(diff) > 0.0005) {
        currentP.current += diff * 0.15;
        render(currentP.current, nodeRefs.current.length);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [drawPaths, render]);

  // Lessons inside the selected track modal
  const modalLessons = selectedTrackForChapters
    ? allLessons.filter((l) => l.paths.includes(selectedTrackForChapters.id))
    : [];

  return (
    <div className="relative min-h-screen py-4 max-w-4xl mx-auto space-y-10 select-none">
      {/* -------------------------------------------------------------------- */}
      {/* 1. Header Bar: Pick a path                                           */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10 text-center sm:text-left">
        <div className="space-y-2">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#A855F7] animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-purple-300 uppercase font-semibold">
              Module III · 15-Minute Tech Bites
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight">
            Pick a path.
          </h1>

          <p className="font-ui text-sm sm:text-base text-[var(--text-muted)] max-w-xl leading-relaxed">
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
                ? "bg-purple-950/40 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white"
            }`}
          >
            <span>{soundEnabled ? "🔊" : "🔇"}</span>
            <span>Sound {soundEnabled ? "ON" : "MUTED"}</span>
          </button>

          <Link
            href="/m3/retest"
            className="px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-xs font-mono font-bold text-purple-300 transition-all flex items-center gap-1.5"
          >
            <span>Retest Queue</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. 3D Perspective Container with SVG Wire Layer & Pop Cards          */}
      {/* -------------------------------------------------------------------- */}
      <div
        ref={containerRef}
        id="container"
        className="relative pb-[40vh]"
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
              <stop offset="50%" stopColor="#c084fc" />
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
        {/* Nodes Column: Origin [0, 0] at top -> 5 Tech Checkpoints below     */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="flex flex-col items-center gap-36 sm:gap-40 relative z-20"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Node 0: Origin Station (Start Point [0, 0]) */}
          <div
            ref={(el) => {
              nodeRefs.current[0] = el;
            }}
            className="relative w-[min(90%,420px)] rounded-2xl p-5 border backdrop-blur-xl transition-all duration-500 select-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(30, 20, 50, 0.85) 0%, rgba(19, 13, 34, 0.98) 100%)",
              transformStyle: "preserve-3d",
              transform:
                activeCardIndex === 0
                  ? "rotateX(0deg) rotateY(0deg) translateZ(40px) scale(1.03)"
                  : "rotateX(15deg) rotateY(0deg) translateZ(-40px) scale(0.95)",
              borderColor:
                activeCardIndex === 0 ? "rgba(192, 132, 252, 0.75)" : "rgba(255, 255, 255, 0.08)",
              boxShadow:
                activeCardIndex === 0
                  ? "0 30px 60px -15px rgba(139, 92, 246, 0.35), 0 0 25px rgba(139, 92, 246, 0.18) inset"
                  : "0 10px 30px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    <path strokeLinecap="round" strokeWidth="2" d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
                    ORIGIN · TRAIL START
                  </div>
                  <h3 className="font-display text-lg font-bold text-white tracking-tight">
                    Architecture Signal [0, 0]
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-[10px] font-mono font-bold text-purple-300">
                START
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
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
                backgroundColor: activeCardIndex === 0 ? "#c084fc" : "#0a0612",
                border:
                  activeCardIndex === 0
                    ? "2px solid #ffffff"
                    : "2px solid rgba(255, 255, 255, 0.15)",
                boxShadow: activeCardIndex === 0 ? "0 0 15px #c084fc" : "none",
                transition: "all 0.3s ease",
              }}
            />
          </div>

          {/* Nodes 1..5: Checkpoint Cards (Minimal initial layout per user prompt) */}
          {TRACKS.map((track, trackIdx) => {
            const nodeIndex = trackIdx + 1; // 1 to 5
            const isActive = activeCardIndex === nodeIndex;
            const dormantRotateY = trackIdx % 2 === 0 ? -6 : 6;

            return (
              <div
                key={`checkpoint-${track.id}`}
                ref={(el) => {
                  nodeRefs.current[nodeIndex] = el;
                }}
                className="relative w-[min(90%,420px)] rounded-2xl p-6 border backdrop-blur-xl transition-all duration-500 select-none group"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(30, 20, 50, 0.85) 0%, rgba(19, 13, 34, 0.98) 100%)",
                  transformStyle: "preserve-3d",
                  transform: isActive
                    ? "rotateX(0deg) rotateY(0deg) translateZ(40px) scale(1.03)"
                    : `rotateX(15deg) rotateY(${dormantRotateY}deg) translateZ(-40px) scale(0.95)`,
                  borderColor: isActive
                    ? "rgba(192, 132, 252, 0.75)"
                    : "rgba(255, 255, 255, 0.08)",
                  boxShadow: isActive
                    ? "0 30px 60px -15px rgba(139, 92, 246, 0.35), 0 0 25px rgba(139, 92, 246, 0.18) inset"
                    : "0 10px 30px rgba(0, 0, 0, 0.6)",
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
                    backgroundColor: isActive ? "#c084fc" : "#0a0612",
                    border: isActive
                      ? "2px solid #ffffff"
                      : "2px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: isActive ? "0 0 15px #c084fc" : "none",
                    transition: "all 0.3s ease",
                  }}
                />

                {/* ------------------------------------------------------------ */}
                {/* User Required Card Layout:                                   */}
                {/* ICONS | Checkpoint                                           */}
                {/*        TECH name                                             */}
                {/* [ learn ]                                                    */}
                {/* short description                                            */}
                {/* ------------------------------------------------------------ */}
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3.5">
                    {/* Icon Box */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                        isActive
                          ? "bg-purple-950/60 border-purple-400/80 text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.4)]"
                          : "bg-white/5 border-white/10 text-purple-400/80 group-hover:border-purple-400/40"
                      }`}
                    >
                      {track.iconSvg}
                    </div>

                    {/* Checkpoint & Tech Name */}
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
                        CHECKPOINT 0{trackIdx + 1}
                      </div>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
                        {track.title}
                      </h3>
                    </div>
                  </div>

                  {/* [ Learn → ] Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrackForChapters(track);
                      if (soundEnabledRef.current) playMetallicChime(1.3);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-b from-purple-500/25 to-purple-900/30 border border-purple-400/40 text-xs font-mono font-bold text-purple-200 hover:text-white hover:border-purple-300 hover:shadow-[0_0_16px_rgba(192,132,252,0.4)] active:scale-95 transition-all cursor-pointer"
                  >
                    Learn &rarr;
                  </button>
                </div>

                {/* Short Description */}
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mt-2">
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
                    backgroundColor: isActive ? "#c084fc" : "#0a0612",
                    border: isActive
                      ? "2px solid #ffffff"
                      : "2px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: isActive ? "0 0 15px #c084fc" : "none",
                    transition: "all 0.3s ease",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Trail Terminus Footer */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-24 text-center">
          <div className="w-9 h-9 rounded-xl border border-purple-500/40 bg-[#0d0e14] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <span className="text-base">🎯</span>
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="font-display text-base font-bold text-white">Curriculum Complete</h4>
            <p className="font-ui text-xs text-[var(--text-muted)]">
              You&apos;ve tracked all checkpoints. Enter the Spaced Repetition queue to lock in
              mastery.
            </p>
          </div>
          <Link
            href="/m3/retest"
            className="px-4 py-2 rounded-full bg-[var(--accent-grad)] text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 transition-all"
          >
            Open Retest Queue (SM-2) &rarr;
          </Link>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. Floating "Ask Gemini" Pill                                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setGeminiModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[#16181d]/90 backdrop-blur-xl border border-white/10 hover:border-purple-400 text-xs font-mono font-semibold text-white flex items-center gap-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] hover:scale-105 transition-all cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#C084FC] group-hover:scale-125 transition-transform" />
          <span>Ask Gemini</span>
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. Focused Chapter Drawer/Modal for the Selected Track                */}
      {/* -------------------------------------------------------------------- */}
      {selectedTrackForChapters && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedTrackForChapters(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-purple-500/30 bg-[#120d22]/95 p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  {selectedTrackForChapters.iconSvg}
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
                    15-MINUTE BITES
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
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
                      : "bg-white/5 border-white/15 text-white/60 hover:text-white"
                  }`}
                >
                  {modalEli5 ? "👶 ELI5" : "💡 Tech"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTrackForChapters(null)}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
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
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-purple-400/40 hover:bg-white/[0.06] transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getLessonIcon(lesson.id)}</span>
                        <h4 className="font-ui text-sm font-bold text-white">{lesson.title}</h4>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-2">
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

                    <Link
                      href={`/m3/lesson/${lesson.id}`}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-xs font-mono font-bold text-purple-200 hover:text-white hover:bg-purple-500/30 transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                    >
                      Start &rarr;
                    </Link>
                  </div>

                  {/* Outcome or ELI5 Metaphor */}
                  <div className="text-xs text-[var(--text-muted)] leading-relaxed">
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
                  <div className="flex items-center gap-1.5 pt-1 text-[9px] font-mono text-white/40">
                    <span className="text-purple-300 font-semibold">5 Stages:</span>
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
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#120d22] p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#C084FC]" />
                <h3 className="font-display text-lg font-bold text-white">
                  Ask Gemini · Tech Bites Curriculum
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGeminiModalOpen(false)}
                className="text-white/60 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-ui text-sm text-[var(--text-muted)] leading-relaxed">
              <p>
                <strong>Welcome to 15-Minute Tech Bites!</strong> Each bite builds an
                interview-ready mental model through 5 active stages without lecture fatigue.
              </p>
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-2 text-xs font-mono">
                <div className="text-purple-300 font-bold">Recommended Learning Trajectory:</div>
                <ul className="space-y-1 list-disc list-inside text-white/90">
                  <li>
                    <strong>AI Engineers:</strong> RAG Pipeline → LLM Basics → Tokens & BPE → Vector
                    Embeddings
                  </li>
                  <li>
                    <strong>Backend Engineers:</strong> Caching & Cache-Aside → HTTP/REST
                    Idempotency → Docker Containers
                  </li>
                  <li>
                    <strong>DevOps & Cloud:</strong> Docker Namespaces/Cgroups → CI/CD Canary
                    Deployments
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setGeminiModalOpen(false)}
                className="px-4 py-2 rounded-full bg-[var(--accent-grad)] text-white text-xs font-mono font-bold cursor-pointer"
              >
                Got it &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
