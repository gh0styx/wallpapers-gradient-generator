export type LinearColorStop = {
  offset: number; // 0..1
  color: string; // CSS color
};

export type LinearGradientState = {
  type: "linear";
  angleDeg: number; // degrees
  stops: LinearColorStop[];
};

export type RadialGradientState = {
  type: "radial";
  cx: number; // 0..1
  cy: number; // 0..1
  r: number; // 0..1 of min(width, height)
  stops: LinearColorStop[];
};

export type MeshBlob = {
  x: number; // 0..1
  y: number; // 0..1
  r: number; // 0..1 of min(width, height)
  color: string; // CSS color
  alpha?: number; // 0..1
};

export type MeshGradientState = {
  type: "mesh";
  background: string; // CSS color
  blobs: MeshBlob[];
  blendMode?: GlobalCompositeOperation;
  // 0..1 softness controls how slowly the blob fades at the edges
  softness?: number;
  // vignette on/off
  vignette?: boolean;
  // 0..0.3 noise strength to fight banding
  noise?: number;
};

export type GradientState =
  | LinearGradientState
  | RadialGradientState
  | MeshGradientState;

export type ExportFormat = "png" | "jpeg" | "webp";

function degreesToVector(angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad), y: Math.sin(rad) };
}

function hexToRgba(hex: string, alpha: number): string {
  // Accepts #rgb, #rrggbb, or any CSS color: if not hex, return with rgba wrapper using currentColor? Fallback: just return the original
  const match = hex.replace(/^#/i, "");
  if (match.length === 3) {
    const r = parseInt(match[0] + match[0], 16);
    const g = parseInt(match[1] + match[1], 16);
    const b = parseInt(match[2] + match[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (match.length === 6) {
    const r = parseInt(match.slice(0, 2), 16);
    const g = parseInt(match.slice(2, 4), 16);
    const b = parseInt(match.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // If hex is not recognized, attempt to return rgba(color, alpha) is not possible without parsing; just return hex itself
  return hex;
}

// ---------------- Random generation helpers ----------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function hslToHex(h: number, s: number, l: number): string {
  // h 0..360, s 0..1, l 0..1
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v: number) => {
    const n = Math.round((v + m) * 255);
    return n.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function pickPalette(baseHue?: number): string[] {
  const h = baseHue ?? rand(200, 340); // bias cool hues
  const hues = [h + rand(-25, 25), h + rand(20, 60), h + rand(-60, -20)];
  return hues.map((hh) => hslToHex(hh, rand(0.6, 0.95), rand(0.45, 0.68)));
}

export function generateRandomGradient(
  type: GradientState["type"]
): GradientState {
  if (type === "linear") {
    const palette = pickPalette();
    const count = randInt(2, 4);
    const stops = Array.from({ length: count }, (_, i) => ({
      offset: i === 0 ? 0 : i === count - 1 ? 1 : rand(0.15, 0.85),
      color: palette[i % palette.length],
    }))
      .sort((a, b) => a.offset - b.offset)
      .map((s, idx, arr) => ({
        ...s,
        offset: idx === 0 ? 0 : idx === arr.length - 1 ? 1 : s.offset,
      }));
    return { type: "linear", angleDeg: rand(0, 360), stops };
  }
  if (type === "radial") {
    const palette = pickPalette();
    const count = randInt(2, 3);
    const stops = Array.from({ length: count }, (_, i) => ({
      offset: i === 0 ? 0 : i === count - 1 ? 1 : rand(0.2, 0.85),
      color: palette[i % palette.length],
    })).sort((a, b) => a.offset - b.offset);
    return {
      type: "radial",
      cx: rand(0.35, 0.65),
      cy: rand(0.35, 0.65),
      r: rand(0.6, 0.95),
      stops,
    };
  }
  // mesh
  const baseHue = rand(200, 320);
  const background = hslToHex(
    baseHue + rand(-10, 10),
    rand(0.6, 0.85),
    rand(0.06, 0.12)
  );
  const numBlobs = randInt(3, 5);
  const palette = pickPalette(baseHue);
  const blobs: MeshBlob[] = Array.from({ length: numBlobs }, () => ({
    x: rand(0.1, 0.9),
    y: rand(0.1, 0.9),
    r: rand(0.35, 0.7),
    color: palette[randInt(0, palette.length - 1)],
    alpha: rand(0.8, 0.95),
  }));
  return { type: "mesh", background, blobs, blendMode: "lighter" };
}

export function renderGradient(
  ctx: CanvasRenderingContext2D,
  state: GradientState,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  if (state.type === "linear") {
    const { x, y } = degreesToVector(state.angleDeg);
    // compute gradient start/end across canvas
    const halfW = width / 2;
    const halfH = height / 2;
    const len = Math.max(width, height);
    const gx0 = halfW - (x * len) / 2;
    const gy0 = halfH - (y * len) / 2;
    const gx1 = halfW + (x * len) / 2;
    const gy1 = halfH + (y * len) / 2;
    const gradient = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    for (const stop of state.stops) {
      gradient.addColorStop(Math.max(0, Math.min(1, stop.offset)), stop.color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (state.type === "radial") {
    const minDim = Math.min(width, height);
    const cx = state.cx * width;
    const cy = state.cy * height;
    const r = state.r * minDim;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    for (const stop of state.stops) {
      gradient.addColorStop(Math.max(0, Math.min(1, stop.offset)), stop.color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else {
    // mesh — improved look: multi-stop falloff, 'screen' blending, vignette and subtle dithering
    ctx.fillStyle = state.background;
    ctx.fillRect(0, 0, width, height);

    const minDim = Math.min(width, height);

    // Use screen blending for softer, more photogenic mixing
    const previousOp = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = state.blendMode ?? "screen";

    const softness = clamp(state.softness ?? 0.75, 0, 1);

    for (const blob of state.blobs) {
      const cx = blob.x * width;
      const cy = blob.y * height;
      const r = blob.r * minDim;
      const alpha = blob.alpha ?? 0.9;

      // Multi-stop radial to emulate Gaussian falloff
      // positions depend on softness; closer to 1 => slower falloff
      const mid = 0.45 + softness * 0.25; // 0.45..0.70
      const soft = 0.78 + softness * 0.12; // 0.78..0.90
      const edge = 0.92 + softness * 0.05; // 0.92..0.97
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, hexToRgba(blob.color, alpha));
      g.addColorStop(mid, hexToRgba(blob.color, alpha * 0.55));
      g.addColorStop(soft, hexToRgba(blob.color, alpha * 0.16));
      g.addColorStop(edge, hexToRgba(blob.color, alpha * 0.04));
      g.addColorStop(1, hexToRgba(blob.color, 0));
      ctx.fillStyle = g;
      // Важно: НЕ клипуем окружностью, а заливаем весь холст, чтобы край мягко уходил в прозрачность
      ctx.fillRect(0, 0, width, height);
    }

    ctx.globalCompositeOperation = previousOp;

    // Subtle vignette to add depth
    if (state.vignette ?? true) {
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.55,
        Math.min(width, height) * 0.4,
        width * 0.5,
        height * 0.55,
        Math.max(width, height) * 0.9
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.55)");
      const prevOp2 = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = prevOp2;
    }

    // Dither/noise overlay (very subtle) to hide banding
    const noiseStrength = clamp(state.noise ?? 0.03, 0, 0.25);
    if (noiseStrength > 0) drawNoiseOverlay(ctx, width, height, noiseStrength);
  }

  ctx.restore();
}

export async function exportImage(
  state: GradientState,
  width: number,
  height: number,
  format: ExportFormat,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width));
  canvas.height = Math.max(1, Math.floor(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  renderGradient(ctx, state, canvas.width, canvas.height);
  const type = `image/${format}`;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to export image"))),
      type,
      // Only JPEG/WEBP honor quality param
      format === "png" ? undefined : Math.max(0, Math.min(1, quality))
    );
  });
  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------------- Internals: noise overlay ----------------
let noiseCanvas: HTMLCanvasElement | null = null;

function getNoiseCanvas(): HTMLCanvasElement {
  if (noiseCanvas) return noiseCanvas;
  const size = 128;
  const can = document.createElement("canvas");
  can.width = size;
  can.height = size;
  const ctx = can.getContext("2d");
  if (!ctx) return can;
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.random() * 255;
    imageData.data[i] = v; // r
    imageData.data[i + 1] = v; // g
    imageData.data[i + 2] = v; // b
    imageData.data[i + 3] = 255; // a
  }
  ctx.putImageData(imageData, 0, 0);
  noiseCanvas = can;
  return can;
}

function drawNoiseOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number
): void {
  const can = getNoiseCanvas();
  const pattern = ctx.createPattern(can, "repeat");
  if (!pattern) return;
  const prevAlpha = ctx.globalAlpha;
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalAlpha = strength; // very low opacity
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = pattern as unknown as string; // TS: Pattern acceptable
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = prevAlpha;
  ctx.globalCompositeOperation = prevOp;
}
