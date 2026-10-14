"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Chip, ChipTone } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { getAllLessons } from "@/content/m3/lessons";
import { Lesson, LessonPath } from "@/content/m3/lesson-schema";

// ---------------------------------------------------------------------------
// Tracks metadata with distinctive Aurora tones & icons
// ---------------------------------------------------------------------------
interface TrackMeta {
  id: LessonPath;
  title: string;
  subtitle: string;
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
    tone: "accent",
    accentHex: "#2BB7FF",
    gradient: "from-[#2BB7FF] to-[#8B7CFF]",
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
    tone: "tint1",
    accentHex: "#8B7CFF",
    gradient: "from-[#8B7CFF] to-[#E056FD]",
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
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(-1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [svgPathD, setSvgPathD] = useState<string>("");
  const [containerHeightPx, setContainerHeightPx] = useState(2400);

  // Refs for scrollytelling path calculation
  const trailContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
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

  // Build trail items: grouping lessons by track or alternating sequentially
  const trailItems: Array<
    | { type: "track"; track: TrackMeta }
    | { type: "lesson"; lesson: Lesson; track: TrackMeta; indexInTrack: number }
  > = [];

  const visibleTracks =
    selectedPath === "all"
      ? TRACKS
      : TRACKS.filter((t) => t.id === selectedPath);

  visibleTracks.forEach((track) => {
    const trackLessons = filteredLessons.filter((l) =>
      l.paths.includes(track.id)
    );
    if (trackLessons.length > 0 || selectedPath !== "all") {
      trailItems.push({ type: "track", track });
      trackLessons.forEach((lesson, idx) => {
        trailItems.push({
          type: "lesson",
          lesson,
          track,
          indexInTrack: idx,
        });
      });
    }
  });

  // Dynamic SVG wavy S-curve calculation based on real DOM node coordinates
  useEffect(() => {
    const calculatePath = () => {
      if (!trailContainerRef.current) return;
      const containerRect = trailContainerRef.current.getBoundingClientRect();
      const height = Math.max(containerRect.height, 1200);
      setContainerHeightPx(height);

      const isDesktop = window.innerWidth >= 768;
      const points: Array<{ x: number; y: number }> = [];

      // Starting point at top center
      points.push({ x: 50, y: 0 });

      nodeRefs.current.forEach((el, idx) => {
        if (!el) return;
        const elRect = el.getBoundingClientRect();
        const relativeY = elRect.top - containerRect.top + elRect.height / 2;
        const item = trailItems[idx];
        const isTrack = item?.type === "track";

        let x = 50;
        if (!isTrack && isDesktop && item && item.type === "lesson") {
          // Lessons alternate left (28%) and right (72%) on desktop
          const isLeft = item.indexInTrack % 2 === 0;
          x = isLeft ? 28 : 72;
        } else if (!isTrack && !isDesktop && item && item.type === "lesson") {
          // Subtle wave on mobile (44% and 56%)
          const isLeft = item.indexInTrack % 2 === 0;
          x = isLeft ? 44 : 56;
        }

        points.push({ x, y: relativeY });
      });

      // Terminal point at bottom center
      points.push({ x: 50, y: height });

      if (points.length < 2) return;

      // Construct smooth continuous cubic Bezier spline
      let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const dy = p1.y - p0.y;

        const cp1x = p0.x;
        const cp1y = p0.y + dy * 0.45;
        const cp2x = p1.x;
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
  }, [trailItems, selectedPath]);

  // Scroll tracking & metallic chime trigger (plays both scrolling downwards & upwards)
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

    // Identify which node is currently near the center trigger line
    const triggerY = windowHeight * 0.45;
    let closestIndex = -1;
    let closestDistance = Infinity;

    nodeRefs.current.forEach((el, index) => {
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
        // Metallic chime pitch changes melodically as you advance down or up the trail
        const pitch = 0.95 + ((closestIndex % 6) * 0.08);
        playMetallicChime(pitch);
      }
    }
  }, [soundEnabled]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, trailItems.length]);

  return (
    <div className="relative min-h-screen py-4 max-w-6xl mx-auto space-y-8 select-none">
      {/* -------------------------------------------------------------------- */}
      {/* 1. Header Bar: Minimal, Spacious & Elegant (No Clutter)              */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-bright)] shadow-[0_0_10px_var(--accent-bright)] animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-[var(--accent-bright)] uppercase font-semibold">
              Module III · 15-Minute Tech Bites
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text)] tracking-tight">
            Pick a path. Learn one idea in 15 minutes.
          </h1>

          <p className="font-ui text-sm sm:text-base text-[var(--text-2)] max-w-2xl leading-relaxed">
            Scroll the trail, choose a track, then open any topic. Every lesson
            has five short stages and a switch that explains it like you are
            five.
          </p>
        </div>

        {/* Global Controls: Sound Toggle (Image 4) + Retest Queue + Global ELI5 */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Sound Toggle Button (Matches Image 4 Top-Right Button) */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Mute metallic sounds" : "Enable metallic sounds"}
            className="px-3.5 py-1.5 rounded-full border text-xs font-mono font-medium flex items-center gap-2 bg-[#121316]/80 border-[#2a2d35] hover:border-[var(--accent-bright)] transition-all cursor-pointer shadow-md"
          >
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                soundEnabled
                  ? "bg-[#2EE6C5] shadow-[0_0_8px_#2EE6C5]"
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
      <div className="sticky top-16 z-30 py-2.5 px-4 rounded-2xl bg-[var(--bg-base)]/85 backdrop-blur-xl border border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Track Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
          <button
            type="button"
            onClick={() => {
              setSelectedPath("all");
              if (soundEnabled) playMetallicChime(1.0);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedPath === "all"
                ? "bg-[var(--accent-grad)] text-white shadow-[0_0_12px_rgba(94,78,240,0.5)]"
                : "bg-[var(--glass-subtle)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--border)]"
            }`}
          >
            All Tracks ({allLessons.length})
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
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[var(--accent-grad)] text-white shadow-[0_0_12px_rgba(94,78,240,0.5)]"
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
            className="w-full pl-8 pr-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--glass-subtle)] text-xs text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:border-[var(--accent-bright)]"
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
      {/* 3. The Scrollytelling Trail with Dynamic Wavy Line & Tech Cards      */}
      {/* -------------------------------------------------------------------- */}
      <div ref={trailContainerRef} className="relative pt-8 pb-32">
        {/* Dynamic SVG Wavy Line (Background + Active Glow Stroke) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox={`0 0 100 ${containerHeightPx}`}
          >
            <defs>
              {/* Aurora Gradient for the active trail */}
              <linearGradient id="aurora-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2BB7FF" stopOpacity="0.95" />
                <stop offset="25%" stopColor="#8B7CFF" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#FFB547" stopOpacity="0.95" />
                <stop offset="75%" stopColor="#2EE6C5" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FF6584" stopOpacity="0.95" />
              </linearGradient>

              {/* Laser glow filter */}
              <filter id="neon-blur" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Ambient Background Wavy Path */}
            <path
              d={
                svgPathD ||
                `M 50,0 Q 75,${containerHeightPx * 0.15} 50,${containerHeightPx * 0.3} T 50,${containerHeightPx * 0.6} T 50,${containerHeightPx * 0.9} L 50,${containerHeightPx}`
              }
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="2.5"
              strokeDasharray="6 6"
            />

            {/* 2. Active Illuminated Scroll Path */}
            <path
              d={
                svgPathD ||
                `M 50,0 Q 75,${containerHeightPx * 0.15} 50,${containerHeightPx * 0.3} T 50,${containerHeightPx * 0.6} T 50,${containerHeightPx * 0.9} L 50,${containerHeightPx}`
              }
              fill="none"
              stroke="url(#aurora-glow)"
              strokeWidth="3.5"
              filter="url(#neon-blur)"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - Math.min(1, Math.max(0, scrollProgress * 1.15))}
              className="transition-[stroke-dashoffset] duration-75 ease-out"
            />
          </svg>
        </div>

        {/* Trail Items: Alternating Cards Along the Curve (Inspired by Image 4) */}
        <div className="relative space-y-16 sm:space-y-24">
          {trailItems.map((item, index) => {
            const isActive = activeNodeIndex === index;
            const isTrackHeader = item.type === "track";

            if (isTrackHeader) {
              const { track } = item;
              return (
                <div
                  key={`track-${track.id}`}
                  ref={(el) => {
                    nodeRefs.current[index] = el;
                  }}
                  id={`track-${track.id}`}
                  className="relative flex flex-col items-center justify-center text-center px-4 pt-6"
                >
                  {/* Waypoint Marker on the Trail */}
                  <div
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-500 shadow-2xl ${
                      isActive
                        ? "border-[var(--accent-bright)] bg-[var(--bg-base)] scale-110 shadow-[0_0_32px_rgba(43,183,255,0.45)] ring-4 ring-[var(--accent-bright)]/20"
                        : "border-[var(--border-strong)] bg-[var(--glass)] shadow-md"
                    }`}
                  >
                    <div style={{ color: track.accentHex }}>{track.iconSvg}</div>
                  </div>

                  {/* Waypoint Label */}
                  <div className="mt-4 space-y-1 max-w-lg">
                    <span
                      className="text-[11px] font-mono uppercase tracking-widest font-bold"
                      style={{ color: track.accentHex }}
                    >
                      Track Station
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                      {track.title}
                    </h2>
                    <p className="font-ui text-xs sm:text-sm text-[var(--text-2)]">
                      {track.subtitle}
                    </p>
                  </div>
                </div>
              );
            }

            // Lesson Card Item (Alternating Left & Right)
            const { lesson, track, indexInTrack } = item;
            const isLeft = indexInTrack % 2 === 0;
            const isEli5Active = cardEli5State[lesson.id] ?? globalEli5;

            return (
              <div
                key={`lesson-${lesson.id}`}
                ref={(el) => {
                  nodeRefs.current[index] = el;
                }}
                className={`relative flex items-center ${
                  isLeft
                    ? "justify-start md:pr-[50%]"
                    : "justify-end md:pl-[50%]"
                }`}
              >
                {/* Node Anchor on the curve */}
                <div
                  className={`hidden md:block absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all duration-300 z-10 ${
                    isActive
                      ? "bg-[var(--accent-bright)] border-white scale-125 shadow-[0_0_16px_var(--accent-bright)]"
                      : "bg-[var(--bg-base)] border-[var(--border-strong)]"
                  }`}
                />

                {/* Card Container (Styled with Image 4's clean dark aesthetics) */}
                <div className="w-full md:max-w-[460px] px-2 sm:px-4">
                  <GlassCard
                    tone="strong"
                    padding="lg"
                    className={`relative space-y-5 transition-all duration-300 group ${
                      isActive
                        ? "border-[var(--accent-bright)] shadow-[0_0_36px_rgba(43,183,255,0.25)] ring-1 ring-[var(--accent-bright)]/30 scale-[1.01]"
                        : "hover:border-[var(--border-strong)] shadow-xl"
                    }`}
                  >
                    {/* Top Row: Glowing Icon Box (as in Image 4), Track Chip & ELI5 Toggle */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Glowing Icon Square (like JS/TS boxes in Image 4) */}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10 relative transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: "#1c1e24",
                            color: track.accentHex,
                            boxShadow: `0 0 20px ${track.accentHex}25`,
                          }}
                        >
                          <div
                            className="absolute inset-0 rounded-xl blur-sm opacity-30"
                            style={{ backgroundColor: track.accentHex }}
                          />
                          <div className="relative z-10">{track.iconSvg}</div>
                        </div>

                        <div>
                          <Chip v={track.title} tone={track.tone} />
                        </div>
                      </div>

                      {/* ELI5 Switch on Card */}
                      <button
                        type="button"
                        onClick={() => toggleCardEli5(lesson.id)}
                        className={`px-2.5 py-1 rounded-full border text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isEli5Active
                            ? "bg-[#FFB547]/20 border-[#FFB547] text-[#FFB547] shadow-[0_0_10px_rgba(255,181,71,0.3)]"
                            : "bg-[var(--glass-subtle)] border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)]"
                        }`}
                      >
                        <span>{isEli5Active ? "👶 ELI5" : "💡 Tech"}</span>
                      </button>
                    </div>

                    {/* Lesson Title & Outcome / ELI5 Metaphor */}
                    <div className="space-y-2">
                      <h3 className="font-display text-xl font-bold text-[var(--text)] group-hover:text-[var(--accent-bright)] transition-colors">
                        {lesson.title}
                      </h3>

                      {isEli5Active ? (
                        <div className="p-3 rounded-xl bg-[#FFB547]/10 border border-[#FFB547]/25 text-xs sm:text-sm text-[#FFB547] leading-relaxed transition-all animate-fadeIn">
                          <span className="font-bold mr-1">👶 ELI5 Metaphor:</span>
                          {lesson.eli5 || lesson.outcome}
                        </div>
                      ) : (
                        <p className="font-ui text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                          {lesson.outcome}
                        </p>
                      )}
                    </div>

                    {/* 5-Stage Step Visualizer */}
                    <div className="pt-2 border-t border-[var(--border)] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-3)]">
                        <span className="font-semibold uppercase tracking-wider">
                          5 Short Stages (15 min)
                        </span>
                        <span className="text-[var(--state-done)] font-bold">
                          +{lesson.xpAward} XP
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
                        <div className="py-1 px-1 rounded bg-[var(--glass-subtle)] border border-[var(--border)] text-[var(--text-2)]">
                          1. Why
                        </div>
                        <div className="py-1 px-1 rounded bg-[var(--glass-subtle)] border border-[var(--border)] text-[var(--text-2)]">
                          2. Model
                        </div>
                        <div className="py-1 px-1 rounded bg-[var(--glass-subtle)] border border-[var(--border)] text-[var(--text-2)]">
                          3. See
                        </div>
                        <div className="py-1 px-1 rounded bg-[var(--glass-subtle)] border border-[var(--border)] text-[var(--text-2)]">
                          4. Try
                        </div>
                        <div className="py-1 px-1 rounded bg-[var(--glass-subtle)] border border-[var(--border)] text-[var(--text-2)]">
                          5. Recall
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-mono text-[var(--text-3)]">
                        {lesson.prerequisites.length > 0
                          ? `Prereq: ${lesson.prerequisites[0]}`
                          : "No prerequisites"}
                      </span>

                      <Button
                        variant="primary"
                        size="sm"
                        href={`/m3/lesson/${lesson.id}`}
                        className="shadow-[0_0_14px_rgba(94,78,240,0.3)]"
                      >
                        Start 15-Min Bite &rarr;
                      </Button>
                    </div>
                  </GlassCard>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. Floating "Ask Gemini" Pill & Quick Jump (As in User Image 4)      */}
      {/* -------------------------------------------------------------------- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setGeminiModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[#16181d]/90 backdrop-blur-xl border border-[#2a2d35] hover:border-[var(--accent-bright)] text-xs font-mono font-semibold text-white flex items-center gap-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] hover:scale-105 transition-all cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--accent-bright)] shadow-[0_0_8px_var(--accent-bright)] group-hover:scale-125 transition-transform" />
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
                <strong>Welcome to 15-Minute Tech Bites!</strong> Each bite is
                engineered to build an interview-ready mental model through 5
                active stages without lecture fatigue.
              </p>
              <div className="p-3 rounded-xl bg-[var(--glass-subtle)] border border-[var(--border)] space-y-2 text-xs font-mono">
                <div className="text-[var(--accent-bright)] font-bold">
                  Recommended Learning Trajectory:
                </div>
                <ul className="space-y-1 list-disc list-inside text-[var(--text)]">
                  <li>
                    <strong>AI Engineers:</strong> RAG Pipeline → LLM Basics → Tokens & BPE → Embeddings
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
