"use client";

import { useId } from "react";
import type { GradientState, MeshBlob } from "@/lib/gradient";
import { PlusIcon, TrashIcon, XIcon } from "@/components/Icons";

type Props = {
  state: GradientState;
  onChange: (next: GradientState) => void;
};

export default function Controls({ state, onChange }: Props) {
  const id = useId();

  if (state.type === "linear") {
    return (
      <div className="grid gap-3">
        <div className="grid gap-1">
          <label htmlFor={`${id}-angle`} className="text-sm text-foreground/80">
            Angle
          </label>
          <input
            id={`${id}-angle`}
            type="range"
            min={0}
            max={360}
            value={state.angleDeg}
            onChange={(e) =>
              onChange({ ...state, angleDeg: Number(e.target.value) })
            }
          />
        </div>
        <StopsEditor
          stops={state.stops}
          onChange={(stops) => onChange({ ...state, stops })}
        />
      </div>
    );
  }

  if (state.type === "radial") {
    return (
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <LabeledNumber
            id={`${id}-cx`}
            label="Center X"
            min={0}
            max={1}
            step={0.01}
            value={state.cx}
            onChange={(cx) => onChange({ ...state, cx })}
          />
          <LabeledNumber
            id={`${id}-cy`}
            label="Center Y"
            min={0}
            max={1}
            step={0.01}
            value={state.cy}
            onChange={(cy) => onChange({ ...state, cy })}
          />
          <LabeledNumber
            id={`${id}-r`}
            label="Radius"
            min={0}
            max={1}
            step={0.01}
            value={state.r}
            onChange={(r) => onChange({ ...state, r })}
          />
        </div>
        <StopsEditor
          stops={state.stops}
          onChange={(stops) => onChange({ ...state, stops })}
        />
      </div>
    );
  }

  // mesh
  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <label className="text-sm text-foreground/80">Background</label>
        <input
          type="color"
          value={state.background}
          onChange={(e) => onChange({ ...state, background: e.target.value })}
          className="h-9 w-full"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <LabeledNumber
          id={`${id}-soft`}
          label="Softness"
          min={0}
          max={1}
          step={0.01}
          value={state.softness ?? 0.75}
          onChange={(softness) => onChange({ ...state, softness })}
        />
        <LabeledNumber
          id={`${id}-noise`}
          label="Noise"
          min={0}
          max={0.25}
          step={0.005}
          value={state.noise ?? 0.03}
          onChange={(noise) => onChange({ ...state, noise })}
        />
        <div className="grid items-end">
          <label className="text-sm text-foreground/80">Vignette</label>
          <button
            type="button"
            className={`h-9 rounded border ${
              state.vignette ?? true
                ? "bg-foreground text-background"
                : "border-foreground/15"
            }`}
            onClick={() =>
              onChange({ ...state, vignette: !(state.vignette ?? true) })
            }>
            {state.vignette ?? true ? "On" : "Off"}
          </button>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground/80">Blobs</span>
          <button
            type="button"
            className="px-2 py-1 rounded bg-foreground text-background text-sm inline-flex items-center gap-2"
            onClick={() =>
              onChange({
                ...state,
                blobs: [
                  ...state.blobs,
                  { x: 0.3, y: 0.3, r: 0.35, color: "#4f46e5", alpha: 0.9 },
                ],
              })
            }>
            <PlusIcon /> Add
          </button>
        </div>
        <div className="grid gap-3">
          {state.blobs.map((blob, i) => (
            <BlobEditor
              key={i}
              blob={blob}
              onChange={(b) =>
                onChange({
                  ...state,
                  blobs: state.blobs.map((bb, idx) => (idx === i ? b : bb)),
                })
              }
              onRemove={() =>
                onChange({
                  ...state,
                  blobs: state.blobs.filter((_, idx) => idx !== i),
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LabeledNumber({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm text-foreground/80">
        {label}
      </label>
      <input
        id={id}
        type="number"
        className="h-9 rounded border border-foreground/15 bg-background px-2"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function StopsEditor({
  stops,
  onChange,
}: {
  stops: { offset: number; color: string }[];
  onChange: (stops: { offset: number; color: string }[]) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/80">Color Stops</span>
        <button
          type="button"
          className="px-2 py-1 rounded bg-foreground text-background text-sm"
          onClick={() =>
            onChange([...stops, { offset: 0.5, color: "#22d3ee" }])
          }>
          + Add
        </button>
      </div>
      <div className="grid gap-2">
        {stops.map((stop, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_80px_40px] gap-2 items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={stop.offset}
              onChange={(e) =>
                onChange(
                  stops.map((s, idx) =>
                    idx === i ? { ...s, offset: Number(e.target.value) } : s
                  )
                )
              }
            />
            <input
              type="color"
              value={stop.color}
              onChange={(e) =>
                onChange(
                  stops.map((s, idx) =>
                    idx === i ? { ...s, color: e.target.value } : s
                  )
                )
              }
            />
            <button
              className="h-9 rounded border border-foreground/15 inline-flex items-center justify-center"
              onClick={() => onChange(stops.filter((_, idx) => idx !== i))}
              aria-label="Remove stop">
              <XIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlobEditor({
  blob,
  onChange,
  onRemove,
}: {
  blob: MeshBlob;
  onChange: (b: MeshBlob) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border border-foreground/10 p-3 grid gap-2">
      <div className="grid grid-cols-2 gap-3">
        <LabeledNumber
          id="x"
          label="X"
          min={0}
          max={1}
          step={0.01}
          value={blob.x}
          onChange={(x) => onChange({ ...blob, x })}
        />
        <LabeledNumber
          id="y"
          label="Y"
          min={0}
          max={1}
          step={0.01}
          value={blob.y}
          onChange={(y) => onChange({ ...blob, y })}
        />
        <LabeledNumber
          id="r"
          label="Radius"
          min={0}
          max={1}
          step={0.01}
          value={blob.r}
          onChange={(r) => onChange({ ...blob, r })}
        />
        <LabeledNumber
          id="a"
          label="Alpha"
          min={0}
          max={1}
          step={0.01}
          value={blob.alpha ?? 0.9}
          onChange={(alpha) => onChange({ ...blob, alpha })}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={blob.color}
          onChange={(e) => onChange({ ...blob, color: e.target.value })}
        />
        <button
          className="ml-auto h-9 rounded border border-foreground/15 px-3 inline-flex items-center gap-2"
          onClick={onRemove}>
          <TrashIcon /> Remove
        </button>
      </div>
    </div>
  );
}
