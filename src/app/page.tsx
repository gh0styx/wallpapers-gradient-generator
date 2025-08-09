"use client";

import { useMemo, useState } from "react";
import GradientCanvas from "@/components/GradientCanvas";
import Controls from "@/components/Controls";
import ExportPanel from "@/components/ExportPanel";
import type { GradientState } from "@/lib/gradient";
import { generateRandomGradient } from "@/lib/gradient";
import { ShuffleIcon } from "@/components/Icons";

export default function Home() {
  const [mode, setMode] = useState<GradientState["type"]>("mesh");

  const [state, setState] = useState<GradientState>(() => ({
    type: "mesh",
    background: "#0b1026",
    blobs: [
      { x: 0.2, y: 0.8, r: 0.6, color: "#06b6d4", alpha: 0.95 },
      { x: 0.35, y: 0.35, r: 0.45, color: "#1e40af", alpha: 0.85 },
      { x: 0.72, y: 0.35, r: 0.45, color: "#7c3aed", alpha: 0.9 },
    ],
    blendMode: "lighter",
  }));

  // Keep state shape in sync with selected mode
  const normalized = useMemo<GradientState>(() => {
    if (mode === "linear") {
      if (state.type === "linear") return state;
      return {
        type: "linear",
        angleDeg: 45,
        stops: [
          { offset: 0, color: "#06b6d4" },
          { offset: 1, color: "#7c3aed" },
        ],
      };
    }
    if (mode === "radial") {
      if (state.type === "radial") return state;
      return {
        type: "radial",
        cx: 0.5,
        cy: 0.5,
        r: 0.7,
        stops: [
          { offset: 0, color: "#3b82f6" },
          { offset: 1, color: "#111827" },
        ],
      };
    }
    if (state.type === "mesh") return state;
    return {
      type: "mesh",
      background: "#0b1026",
      blobs: [
        { x: 0.2, y: 0.8, r: 0.6, color: "#06b6d4", alpha: 0.95 },
        { x: 0.35, y: 0.35, r: 0.45, color: "#1e40af", alpha: 0.85 },
        { x: 0.72, y: 0.35, r: 0.45, color: "#7c3aed", alpha: 0.9 },
      ],
      blendMode: "lighter",
    };
  }, [mode, state]);

  return (
    <div className="min-h-dvh p-6 md:p-10 grid gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
          Gradient Wallpapers
        </h1>
        <nav className="flex gap-2">
          {(["mesh", "linear", "radial"] as const).map((t) => (
            <button
              key={t}
              className={`h-9 rounded px-3 border ${
                mode === t
                  ? "bg-foreground text-background"
                  : "border-foreground/15"
              }`}
              onClick={() => setMode(t)}>
              {t}
            </button>
          ))}
          <button
            className="h-9 rounded px-3 border border-foreground/15 inline-flex items-center gap-2"
            onClick={() => setState(generateRandomGradient(mode))}
            title="Random">
            <ShuffleIcon /> Random
          </button>
        </nav>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="rounded-2xl border glass-surface p-3 md:p-4 shadow-[0_8px_40px_-16px_rgba(0,0,0,0.4)]">
          <div
            className="relative w-full overflow-hidden rounded-xl border"
            style={{ aspectRatio: "16/9" }}>
            <GradientCanvas
              state={normalized}
              width={1280}
              height={720}
              responsive
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>

        <aside className="grid gap-6 rounded-xl border glass-surface p-4">
          <Controls
            state={normalized}
            onChange={setState as (s: GradientState) => void}
          />
          <div className="h-px bg-foreground/10" />
          <ExportPanel state={normalized} />
        </aside>
      </div>
    </div>
  );
}
