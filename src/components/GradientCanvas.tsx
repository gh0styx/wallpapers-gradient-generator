"use client";

import { useEffect, useRef, useState } from "react";
import type { GradientState } from "@/lib/gradient";
import { renderGradient } from "@/lib/gradient";

type Props = {
  state: GradientState;
  width: number;
  height: number;
  devicePixelRatio?: number;
  className?: string;
  responsive?: boolean; // fill container and resize
};

export default function GradientCanvas({
  state,
  width,
  height,
  devicePixelRatio = typeof window !== "undefined"
    ? window.devicePixelRatio
    : 1,
  className,
  responsive = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: width,
    h: height,
  });

  useEffect(() => {
    if (!responsive) {
      setSize({ w: width, h: height });
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const update = () => {
      const target = canvas.parentElement ?? canvas;
      const rect = target.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      setSize({ w, h });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(canvas.parentElement ?? canvas);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [responsive, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.max(1, Math.floor(devicePixelRatio));
    const drawW = responsive ? size.w : width;
    const drawH = responsive ? size.h : height;
    canvas.width = Math.floor(drawW * dpr);
    canvas.height = Math.floor(drawH * dpr);
    canvas.style.width = `${drawW}px`;
    canvas.style.height = `${drawH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderGradient(ctx, state, drawW, drawH);
  }, [state, width, height, devicePixelRatio, responsive, size.w, size.h]);

  return <canvas ref={canvasRef} className={className} />;
}
