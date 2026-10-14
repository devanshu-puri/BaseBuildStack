"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip, ChipTone } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { getAllLessons } from "@/content/m3/lessons";
import { Lesson, LessonPath } from "@/content/m3/lesson-schema";

// ---------------------------------------------------------------------------
// Tracks metadata with distinctive Aurora tones, icons, and tech descriptions
// ---------------------------------------------------------------------------
interface TrackMeta {
  id: LessonPath;
  title: string;
  subtitle: string;
  about: string;
  tone: ChipTone;
  accentHex: string;
  gradient: string;
  iconSvg: React.ReactNode;
}

const TRACKS: TrackMeta[] = [
  {
    id: "ai",
    title: "AI & LLM Systems",
    subtitle: "RAG architectures, autoregressive sampling, context windows & vector geometry",
    about:
      "Foundational architectures powering modern AI applications. Learn how transformer decoders generate autoregressive text, how subword tokenization bounds memory, how dense vector embeddings map semantic intent, and how retrieval-augmented generation (RAG) grounds models in verified truth without fine-tuning.",
    tone: "accent",
    accentHex: "#8B7CFF",
    gradient: "from-[#8B7CFF] to-[#C084FC]",
    iconSvg: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "backend",
    title: "Backend & Distributed Systems",
    subtitle: "Cache-aside strategies, HTTP safe/idempotent semantics & load shedding",
    about:
      "Resilient, high-throughput backend infrastructure. Master distributed cache-aside patterns, cache stampede prevention, idempotent HTTP/REST semantics for financial APIs, and graceful degradation under concurrent load.",
    tone: "tint1",
    accentHex: "#A855F7",
    gradient: "from-[#A855F7] to-[#E056FD]",
    iconSvg: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
  },
  {
    id: "frontend",
    title: "Frontend Architecture",
    subtitle: "Client-server contracts, optimistic updates & state caching semantics",
    about:
      "Robust client-server contracts and high-performance UI systems. Learn HTTP idempotency semantics, safe vs mutating verbs, optimistic updates, and cache synchronization between browser and distributed servers.",
    tone: "tint2",
    accentHex: "#FFB547",
    gradient: "from-[#FFB547] to-[#FF7675]",
    iconSvg: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    id: "devops",
    title: "DevOps & Cloud",
    subtitle: "Linux namespaces, cgroups containerization & zero-downtime Canary CI/CD",
    about:
      "Cloud-native isolation and automated deployment pipelines. Master Linux kernel primitives (Namespaces & cgroups) that power Docker containers, multi-stage image optimization, and zero-downtime Canary vs Blue-Green delivery strategies.",
    tone: "tint4",
    accentHex: "#2EE6C5",
    gradient: "from-[#2EE6C5] to-[#00CEC9]",
    iconSvg: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: "foundations",
    title: "Core CS Foundations",
    subtitle: "Subword BPE encodings, high-dimensional vector math & memory hierarchies",
    about:
      "The enduring theoretical primitives beneath all modern stacks. Explore Byte-Pair Encoding algorithms, high-dimensional vector spaces, memory caching hierarchies, and state machine idempotency.",
    tone: "tint3",
    accentHex: "#FF6584",
    gradient: "from-[#FF6584] to-[#FDA7DF]",
    iconSvg: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
];

// Helper to provide distinctive icons for chapter buttons
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
// Web Audio API: Zero-Asset Synthesized Metallic Chime
// Reusable singleton audio context with crisp inharmonic partials
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

    // Harmonic / Inharmonic partials characteristic of striking metal (chime/bell)
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
    // Graceful fallback if audio is restricted by autoplay policy
  }
}

// ---------------------------------------------------------------------------
// Main Module III Discovery Page
// ---------------------------------------------------------------------------
export default function Module3DiscoveryPage() {
  const allLessons = getAllLessons();

  // State
  const [selectedPath, setSelectedPath] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [globalEli5, setGlobalEli5] = useState(false);
  const [cardEli5State, setCardEli5State] = useState<Record<string, boolean>>({});
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(-1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [svgPathD, setSvgPathD] = useState<string>("");
  const [containerWidthPx, setContainerWidthPx] = useState(1000);
  const [containerHeightPx, setContainerHeightPx] = useState(2400);
  const [beadPos, setBeadPos] = useState<{ x: number; y: number } | null>(null);

  // Refs for scrollytelling path calculation
  const trailContainerRef = useRef<HTMLDivElement>(null);
  const checkpointRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activePathRef = useRef<SVGPathElement>(null);
  const prevActiveNodeRef = useRef<number>(-1);

  // Load sound setting from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("basebuildstack_sound_enabled");
      if (saved !== null) {
        setSoundEnabled(saved === "true");
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      playMetallicChime(1.1);
    }
    try {
      localStorage.setItem("basebuildstack_sound_enabled", String(next));
    } catch {
      // Ignore
    }
  };

  // Toggle individual card ELI5
  const toggleCardEli5 = (lessonId: string) => {
    setCardEli5State((prev) => ({
      ...prev,
      [lessonId]: !(prev[lessonId] ?? globalEli5),
    }));
    if (soundEnabled) {
      playMetallicChime(1.3);
    }
  };

  // Filter lessons based on path and search query
  const filteredLessons = allLessons.filter((l) => {
    const matchesPath =
      selectedPath === "all" || l.paths.includes(selectedPath as LessonPath);
    const matchesSearch =
      searchQuery.trim() === "" ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.outcome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.eli5 && l.eli5.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPath && matchesSearch;
  });

  // Checkpoints: The Track Stations along the path
  const visibleTracks = (
    selectedPath === "all"
      ? TRACKS
      : TRACKS.filter((t) => t.id === selectedPath)
  ).filter((track) => {
    const lessonsInTrack = filteredLessons.filter((l) =>
      l.paths.includes(track.id)
    );
    return lessonsInTrack.length > 0 || selectedPath !== "all";
  });

  // Dynamic SVG Metallic Spline Calculation based on real DOM checkpoints
  useEffect(() => {
    const calculatePath = () => {
      if (!trailContainerRef.current) return;
      const containerRect = trailContainerRef.current.getBoundingClientRect();
      const width = Math.max(containerRect.width, 320);
      const height = Math.max(containerRect.height, 1200);
      setContainerWidthPx(width);
      setContainerHeightPx(height);

      const points: Array<{ x: number; y: number }> = [];

      // 1. Origin point at top center (null)
      points.push({ x: width / 2, y: 0 });

      // 2. Waypoints through each checkpoint card
      checkpointRefs.current.forEach((el, idx) => {
        if (!el) return;
        const elRect = el.getBoundingClientRect();
        const topY = elRect.top - containerRect.top;
        const bottomY = elRect.bottom - containerRect.top;

        // Enter connector at top of card
        points.push({ x: width / 2, y: topY });
        // Exit connector at bottom of card
        points.push({ x: width / 2, y: bottomY });
      });

      // 3. Terminus point at bottom center
      points.push({ x: width / 2, y: height });

      if (points.length < 2) return;

      // Construct smooth continuous cubic Bezier spline with gentle metallic curvature
      let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const dy = p1.y - p0.y;

        // For segments between cards, sweep with a graceful curved arc
        const isInterCardSegment = i % 2 === 1 && i > 0 && i < points.length - 1;
        const sweep = isInterCardSegment
          ? (i % 4 === 1 ? 40 : -40)
          : 0;

        const cp1x = p0.x + sweep;
        const cp1y = p0.y + dy * 0.45;
        const cp2x = p1.x + sweep;
        const cp2y = p1.y - dy * 0.45;

        d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
      }

      setSvgPathD(d);
    };

    calculatePath();
    window.addEventListener("resize", calculatePath);
    const timer = setTimeout(calculatePath, 150);
    return () => {
      window.removeEventListener("resize", calculatePath);
      clearTimeout(timer);
    };
  }, [visibleTracks.length, expandedLessonId]);

  // Scroll tracking & metallic chime trigger
  const handleScroll = useCallback(() => {
    if (!trailContainerRef.current) return;
    const container = trailContainerRef.current;
    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate progress between container top entering viewport and bottom leaving
    const totalDistance = rect.height + windowHeight;
    const currentDistance = windowHeight - rect.top;
    const progress = Math.max(0, Math.min(1, currentDistance / totalDistance));
    setScrollProgress(progress);

    // Update bead coordinate along the active path
    if (activePathRef.current) {
      try {
        const pathLen = activePathRef.current.getTotalLength();
        const clampedProgress = Math.min(1, Math.max(0, progress * 1.12));
        const pt = activePathRef.current.getPointAtLength(clampedProgress * pathLen);
        setBeadPos({ x: pt.x, y: pt.y });
      } catch {
        // Fallback
      }
    }

    // Identify which checkpoint is currently near the center trigger line
    const triggerY = windowHeight * 0.45;
    let closestIndex = -1;
    let closestDistance = Infinity;

    checkpointRefs.current.forEach((el, index) => {
      if (!el) return;
      const elRect = el.getBoundingClientRect();
      const elCenter = elRect.top + elRect.height / 2;
      const dist = Math.abs(elCenter - triggerY);

      if (dist < closestDistance && dist < elRect.height * 0.75) {
        closestDistance = dist;
        closestIndex = index;
      }
    });

    if (closestIndex !== -1 && closestIndex !== prevActiveNodeRef.current) {
      setActiveNodeIndex(closestIndex);
      prevActiveNodeRef.current = closestIndex;
      if (soundEnabled) {
        // Metallic chime pitch changes harmonically as you advance down the checkpoints
        const pitch = 0.95 + (closestIndex % 5) * 0.09;
        playMetallicChime(pitch);
      }
    }
  }, [soundEnabled]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, visibleTracks.length, expandedLessonId]);

  const expandedLesson = expandedLessonId ? allLessons.find((l) => l.id === expandedLessonId) : null;

  return (
    <div className="relative min-h-screen py-4 max-w-5xl mx-auto space-y-8 select-none">
      {/* Inline styles for the smooth purple aurora flow along the metallic path */}
      <style jsx global>{`
        @keyframes purpleAuroraFlow {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -48;
          }
        }
        .animate-aurora-stream {
          animation: purpleAuroraFlow 3.2s linear infinite;
        }
      `}</style>

      {/* -------------------------------------------------------------------- */}
      {/* 1. Header Bar: Minimal, Spacious & Elegant (No Clutter)              */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#A855F7] animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-purple-300 uppercase font-semibold">
              Module III · 15-Minute Tech Bites
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text)] tracking-tight">
            Pick a path. Learn one idea in 15 minutes.
          </h1>

          <p className="font-ui text-sm sm:text-base text-[var(--text-2)] max-w-2xl leading-relaxed">
            Scroll the metallic trail from origin. Explore each tech checkpoint,
            open boxy chapters on-demand, and toggle ELI5 to build intuition.
          </p>
        </div>

        {/* Global Controls: Sound Toggle + Global ELI5 + Retest Queue */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Mute metallic sounds" : "Enable metallic sounds"}
            className="px-3.5 py-1.5 rounded-full border text-xs font-mono font-medium flex items-center gap-2 bg-[#121316]/80 border-[#2a2d35] hover:border-purple-400 transition-all cursor-pointer shadow-md"
          >
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                soundEnabled
                  ? "bg-purple-400 shadow-[0_0_8px_#C084FC]"
                  : "bg-[#565c69]"
              }`}
            />
            <span className={soundEnabled ? "text-white" : "text-[var(--text-3)]"}>
              {soundEnabled ? "Sound ON" : "Sound OFF"}
            </span>
          </button>

          {/* Global ELI5 Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !globalEli5;
              setGlobalEli5(next);
              setCardEli5State({});
              if (soundEnabled) playMetallicChime(1.4);
            }}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              globalEli5
                ? "bg-[rgba(255,181,71,0.15)] border-[#FFB547] text-[#FFB547] shadow-[0_0_14px_rgba(255,181,71,0.25)]"
                : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)]"
            }`}
          >
            <span>👶</span>
            <span>ELI5 All {globalEli5 ? "ON" : "OFF"}</span>
          </button>

          {/* Retest Queue Link */}
          <Link
            href="/m3/retest"
            className="px-4 py-1.5 rounded-full bg-[var(--accent-grad)] text-white text-xs font-mono font-bold shadow-[0_0_16px_rgba(94,78,240,0.4)] hover:brightness-110 transition-all flex items-center gap-2"
          >
            <span>Retest Queue</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              SM-2
            </span>
          </Link>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. Sticky Track Filter Bar & Search                                  */}
      {/* -------------------------------------------------------------------- */}
      <div className="sticky top-16 z-30 py-2.5 px-4 rounded-2xl bg-[var(--bg-base)]/90 backdrop-blur-xl border border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
        {/* Track Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
          <button
            type="button"
            onClick={() => {
              setSelectedPath("all");
              if (soundEnabled) playMetallicChime(1.0);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedPath === "all"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_14px_rgba(168,85,247,0.45)]"
                : "bg-[var(--glass-subtle)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--border)]"
            }`}
          >
            All Tracks ({TRACKS.length})
          </button>

          {TRACKS.map((t) => {
            const count = allLessons.filter((l) => l.paths.includes(t.id)).length;
            const isSelected = selectedPath === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedPath(t.id);
                  if (soundEnabled) playMetallicChime(1.15);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_14px_rgba(168,85,247,0.45)]"
                    : "bg-[var(--glass-subtle)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--border)]"
                }`}
              >
                <span>{t.title}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <input
            type="text"
            placeholder="Search RAG, Cache, Docker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--glass-subtle)] text-xs text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:border-purple-400"
          />
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. The Scrollytelling Trail with Metallic Curved Line & Purple Aurora */}
      {/* -------------------------------------------------------------------- */}
      <div ref={trailContainerRef} className="relative pt-4 pb-24">
        {/* Origin Marker at Null (Top of Trail) */}
        <div className="flex flex-col items-center justify-center space-y-2 mb-12">
          <div className="px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-[10px] font-mono text-purple-300 uppercase tracking-widest flex items-center gap-2 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>ORIGIN (NULL) · CURRICULUM ENTRY</span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/50 bg-[#0d0e14] flex items-center justify-center shadow-[0_0_16px_rgba(168,85,247,0.4)]">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          </div>
        </div>

        {/* Dynamic SVG Metallic Curved Line with Purple Aurora Gradient */}
        <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${containerWidthPx} ${containerHeightPx}`}
          >
            <defs>
              {/* Metallic Titanium / Chrome Gradient for base track */}
              <linearGradient id="metallic-chrome" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#252830" />
                <stop offset="25%" stopColor="#4f5666" />
                <stop offset="50%" stopColor="#b4bcc9" />
                <stop offset="75%" stopColor="#4f5666" />
                <stop offset="100%" stopColor="#252830" />
              </linearGradient>

              {/* Purple Aurora Gradient for the active flowing trail */}
              <linearGradient id="purple-aurora-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4318FF" stopOpacity="0.9" />
                <stop offset="25%" stopColor="#7047EB" stopOpacity="1" />
                <stop offset="50%" stopColor="#9D4EDD" stopOpacity="1" />
                <stop offset="75%" stopColor="#C084FC" stopOpacity="1" />
                <stop offset="100%" stopColor="#F472B6" stopOpacity="0.95" />
              </linearGradient>

              {/* Refined Purple Aurora Bloom Filter (crisp 2.5px, not a 70px blob) */}
              <filter id="purple-aurora-filter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="softGlow" />
                <feMerge>
                  <feMergeNode in="softGlow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Bead Pulse Glow */}
              <filter id="bead-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Outer Metallic Bevel Rail */}
            <path
              d={svgPathD}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* 2. Metallic Titanium/Chrome Spine Line */}
            <path
              d={svgPathD}
              fill="none"
              stroke="url(#metallic-chrome)"
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* 3. Active Illuminated Purple Aurora Trail */}
            <path
              ref={activePathRef}
              d={svgPathD}
              fill="none"
              stroke="url(#purple-aurora-glow)"
              strokeWidth="2.5"
              filter="url(#purple-aurora-filter)"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - Math.min(1, Math.max(0, scrollProgress * 1.12))}
              style={{
                transition: "stroke-dashoffset 0.2s ease-out",
              }}
              vectorEffect="non-scaling-stroke"
            />

            {/* 4. Animated Flowing Purple Aurora Energy Stream */}
            <path
              d={svgPathD}
              fill="none"
              stroke="#E879F9"
              strokeWidth="2"
              filter="url(#purple-aurora-filter)"
              strokeLinecap="round"
              strokeDasharray="10 16"
              className="animate-aurora-stream"
              pathLength="1"
              style={{
                strokeDashoffset: 1 - Math.min(1, Math.max(0, scrollProgress * 1.12)),
                opacity: scrollProgress > 0.02 ? 0.85 : 0,
                transition: "stroke-dashoffset 0.2s ease-out, opacity 0.3s ease",
              }}
              vectorEffect="non-scaling-stroke"
            />

            {/* 5. Glowing Head Bead visibly traveling down the curve to the card */}
            {beadPos && scrollProgress > 0.02 && (
              <g transform={`translate(${beadPos.x}, ${beadPos.y})`}>
                <circle r="14" fill="rgba(192, 132, 252, 0.25)" className="animate-ping" />
                <circle r="7" fill="none" stroke="#F472B6" strokeWidth="1.5" />
                <circle r="4" fill="#C084FC" filter="url(#bead-glow)" />
                <circle r="1.5" fill="#FFFFFF" />
              </g>
            )}
          </svg>
        </div>

        {/* Checkpoint Stations Along the Trail */}
        <div className="relative space-y-20 sm:space-y-28">
          {visibleTracks.map((track, index) => {
            const isActive = activeNodeIndex === index;
            const trackLessons = filteredLessons.filter((l) =>
              l.paths.includes(track.id)
            );
            const isAnyChapterActive = trackLessons.some(
              (l) => l.id === expandedLessonId
            );

            return (
              <div
                key={`track-station-${track.id}`}
                ref={(el) => {
                  checkpointRefs.current[index] = el;
                }}
                id={`track-${track.id}`}
                className="relative max-w-3xl mx-auto px-4"
              >
                {/* Input Connector Port at Top of Card */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-lg ${
                      isActive
                        ? "bg-[#180e29] border-[#C084FC] scale-110 shadow-[0_0_16px_#C084FC]"
                        : "bg-[#0f1117] border-white/20"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        isActive ? "bg-[#F472B6]" : "bg-white/40"
                      }`}
                    />
                  </div>
                </div>

                {/* Main Checkpoint Card (Compact & Organized) */}
                <GlassCard
                  tone="strong"
                  padding="lg"
                  className={`relative space-y-5 transition-all duration-400 group rounded-3xl ${
                    isActive
                      ? "border-purple-500/70 shadow-[0_0_40px_rgba(168,85,247,0.28)] ring-1 ring-purple-400/40 scale-[1.01]"
                      : "border-white/10 hover:border-purple-500/30 shadow-2xl"
                  }`}
                >
                  {/* Station Header with Metallic Icon Box & Title */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Metallic 3D-styled Icon Box */}
                      <div
                        className={`w-13 h-13 rounded-2xl flex items-center justify-center border transition-all duration-300 relative ${
                          isActive
                            ? "bg-[#1f1633] border-purple-400/80 shadow-[0_0_24px_rgba(168,85,247,0.4)] text-purple-300"
                            : "bg-[#15171e] border-white/10 text-[var(--text-2)] group-hover:border-purple-400/30"
                        }`}
                      >
                        <div className="relative z-10">{track.iconSvg}</div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-purple-400">
                            CHECKPOINT 0{index + 1}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-[10px] font-mono text-[var(--text-3)]">
                            {trackLessons.length} Bites
                          </span>
                        </div>
                        <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
                          {track.title}
                        </h2>
                      </div>
                    </div>

                    <Chip v={track.title} tone={track.tone} />
                  </div>

                  {/* "About this tech" Section */}
                  <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs sm:text-sm text-[var(--text-2)] leading-relaxed space-y-1">
                    <div className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                      <span>💡</span>
                      <span>About This Tech</span>
                    </div>
                    <p>{track.about}</p>
                  </div>

                  {/* Chapters Inside (Small Boxy Content - Compact, Not Scattered) */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-3)]">
                      <span className="uppercase tracking-widest text-purple-300 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                        Chapters in this Station
                      </span>
                      <span>Click a chapter to explore</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {trackLessons.map((lesson) => {
                        const isExpanded = expandedLessonId === lesson.id;
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => {
                              const next = isExpanded ? null : lesson.id;
                              setExpandedLessonId(next);
                              if (soundEnabled) playMetallicChime(isExpanded ? 1.0 : 1.3);
                            }}
                            className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                              isExpanded
                                ? "bg-purple-950/40 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-400 text-white"
                                : "bg-[#111318]/90 border-white/10 hover:border-purple-400/40 hover:bg-[#181a22] text-[var(--text-2)]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-base shrink-0">
                                {getLessonIcon(lesson.id)}
                              </span>
                              <div className="min-w-0">
                                <div className="font-ui text-xs font-semibold text-white truncate">
                                  {lesson.title}
                                </div>
                                <div className="text-[10px] font-mono text-[var(--text-3)] flex items-center gap-2 mt-0.5">
                                  <span>15m bite</span>
                                  <span>•</span>
                                  <span className="text-emerald-400">+{lesson.xpAward} XP</span>
                                </div>
                              </div>
                            </div>

                            <span
                              className={`text-xs font-mono text-purple-400 shrink-0 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            >
                              ▾
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded Chapter Content in Card Form (Revealed On-Demand) */}
                  {expandedLesson && isAnyChapterActive && (
                    <div className="mt-4 p-5 rounded-2xl bg-[#0e1017]/95 border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)] space-y-4 animate-fadeIn">
                      {/* Active Chapter Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {getLessonIcon(expandedLesson.id)}
                            </span>
                            <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
                              Active Chapter Focus
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              +{expandedLesson.xpAward} XP
                            </span>
                          </div>
                          <h3 className="font-display text-lg font-bold text-white">
                            {expandedLesson.title}
                          </h3>
                        </div>

                        {/* ELI5 Switch */}
                        <button
                          type="button"
                          onClick={() => toggleCardEli5(expandedLesson.id)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            (cardEli5State[expandedLesson.id] ?? globalEli5)
                              ? "bg-[#FFB547]/20 border-[#FFB547] text-[#FFB547] shadow-[0_0_12px_rgba(255,181,71,0.3)]"
                              : "bg-[#181a22] border-white/10 text-[var(--text-3)] hover:text-white"
                          }`}
                        >
                          <span>
                            {(cardEli5State[expandedLesson.id] ?? globalEli5)
                              ? "👶 ELI5"
                              : "💡 Tech"}
                          </span>
                        </button>
                      </div>

                      {/* Content: Outcome or ELI5 Metaphor */}
                      {(cardEli5State[expandedLesson.id] ?? globalEli5) ? (
                        <div className="p-3.5 rounded-xl bg-[#FFB547]/10 border border-[#FFB547]/30 text-xs sm:text-sm text-[#FFB547] leading-relaxed">
                          <span className="font-bold mr-1.5">👶 ELI5 Metaphor:</span>
                          {expandedLesson.eli5 || expandedLesson.outcome}
                        </div>
                      ) : (
                        <p className="font-ui text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                          {expandedLesson.outcome}
                        </p>
                      )}

                      {/* 5 Short Stages Indicator */}
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-3)]">
                          <span className="uppercase tracking-wider font-semibold text-purple-300">
                            5 Short Stages (15 Min Total)
                          </span>
                          <span>Interactive Step Progression</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
                          <div className="py-1.5 px-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                            1. Why
                          </div>
                          <div className="py-1.5 px-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                            2. Model
                          </div>
                          <div className="py-1.5 px-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                            3. See
                          </div>
                          <div className="py-1.5 px-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                            4. Try
                          </div>
                          <div className="py-1.5 px-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                            5. Recall
                          </div>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
                        <span className="text-[11px] font-mono text-[var(--text-3)]">
                          {expandedLesson.prerequisites.length > 0
                            ? `Prereq: ${expandedLesson.prerequisites[0]}`
                            : "No prerequisites required"}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedLessonId(null)}
                            className="px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-[var(--text-3)] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                          >
                            ▲ Collapse
                          </button>

                          <Button
                            variant="primary"
                            size="sm"
                            href={`/m3/lesson/${expandedLesson.id}`}
                            className="shadow-[0_0_18px_rgba(168,85,247,0.4)]"
                          >
                            Start 15-Min Bite &rarr;
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>

                {/* Output Connector Port at Bottom of Card */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-lg ${
                      isActive
                        ? "bg-[#180e29] border-[#C084FC] shadow-[0_0_14px_#C084FC]"
                        : "bg-[#0f1117] border-white/20"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        isActive ? "bg-[#F472B6]" : "bg-white/40"
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trail Terminus at Bottom */}
        <div className="flex flex-col items-center justify-center space-y-4 pt-20 pb-8 text-center">
          <div className="w-10 h-10 rounded-2xl border border-purple-500/40 bg-[#0d0e14] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <span className="text-lg">🎯</span>
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-display text-lg font-bold text-white">
              Curriculum Complete
            </h3>
            <p className="font-ui text-xs text-[var(--text-3)]">
              You&apos;ve explored the curriculum checkpoints. Open the Spaced
              Repetition queue to lock in your active recall.
            </p>
          </div>
          <Link
            href="/m3/retest"
            className="px-5 py-2 rounded-full bg-[var(--accent-grad)] text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(94,78,240,0.4)] hover:brightness-110 transition-all"
          >
            Open Retest Queue (SM-2) &rarr;
          </Link>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. Floating "Ask Gemini" Pill & Quick Jump                           */}
      {/* -------------------------------------------------------------------- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setGeminiModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[#16181d]/90 backdrop-blur-xl border border-[#2a2d35] hover:border-purple-400 text-xs font-mono font-semibold text-white flex items-center gap-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] hover:scale-105 transition-all cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#C084FC] group-hover:scale-125 transition-transform" />
          <span>Ask Gemini</span>
        </button>
      </div>

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
            className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-base)] p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#C084FC]" />
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
                <strong>Welcome to 15-Minute Tech Bites!</strong> Each bite is
                engineered to build an interview-ready mental model through 5
                active stages without lecture fatigue.
              </p>
              <div className="p-3 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)] space-y-2 text-xs font-mono">
                <div className="text-purple-300 font-bold">
                  Recommended Learning Trajectory:
                </div>
                <ul className="space-y-1 list-disc list-inside text-[var(--text)]">
                  <li>
                    <strong>AI Engineers:</strong> RAG Pipeline → LLM Basics → Tokens & BPE → Vector Embeddings
                  </li>
                  <li>
                    <strong>Backend Engineers:</strong> Caching & Cache-Aside → HTTP/REST Idempotency → Docker Containers
                  </li>
                  <li>
                    <strong>DevOps & Cloud:</strong> Docker Namespaces/Cgroups → CI/CD Canary Deployments
                  </li>
                </ul>
              </div>
              <p className="text-xs text-[var(--text-3)]">
                Pro Tip: Toggle the <strong>👶 ELI5</strong> switch on any card to
                unlock the simplified 5-year-old metaphor before diving into code!
              </p>
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
