"use client";

import { useState } from "react";
import type { ExportFormat, GradientState } from "@/lib/gradient";
import { downloadBlob, exportImage } from "@/lib/gradient";

const PRESETS = [
  { label: "HD 1080p", w: 1920, h: 1080 },
  { label: "2K QHD", w: 2560, h: 1440 },
  { label: "4K UHD", w: 3840, h: 2160 },
  { label: "Ultrawide", w: 3440, h: 1440 },
  { label: "5K", w: 5120, h: 2880 },
  { label: "Square 1:1", w: 3000, h: 3000 },
];

type Props = {
  state: GradientState;
};

export default function ExportPanel({ state }: Props) {
  const [presetIdx, setPresetIdx] = useState(2);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(0.95);
  const [busy, setBusy] = useState(false);

  const { w, h } =
    PRESETS[Math.max(0, Math.min(PRESETS.length - 1, presetIdx))];

  const onExport = async () => {
    try {
      setBusy(true);
      const blob = await exportImage(state, w, h, format, quality);
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      downloadBlob(blob, `gradient-${w}x${h}-${ts}.${format}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <label className="text-sm text-foreground/80">Resolution</label>
        <select
          className="h-9 rounded border border-foreground/15 bg-background px-2"
          value={presetIdx}
          onChange={(e) => setPresetIdx(Number(e.target.value))}>
          {PRESETS.map((p, i) => (
            <option key={i} value={i}>{`${p.label} (${p.w}×${p.h})`}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm text-foreground/80">Format</label>
          <select
            className="h-9 rounded border border-foreground/15 bg-background px-2"
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WEBP</option>
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-foreground/80">Quality</label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
        </div>
      </div>
      <button
        className="h-10 rounded bg-foreground text-background disabled:opacity-50"
        disabled={busy}
        onClick={onExport}>
        {busy ? "Exporting..." : `Export `}
      </button>
    </div>
  );
}
