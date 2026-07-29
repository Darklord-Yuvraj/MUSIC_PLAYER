import { useCallback, useEffect, useRef, useState } from 'react';
import type { VisualizerPreset } from '@/types';
import { Theme } from '@/constants/theme';

interface UseVisualizerOptions {
  getAnalyser: () => AnalyserNode | null;
  preset: VisualizerPreset;
  active: boolean;
  color?: string;
  glowColor?: string;
}

export function useVisualizer({
  getAnalyser,
  preset,
  active,
  color = Theme.colors.cyan,
  glowColor = Theme.colors.violet,
}: UseVisualizerOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const presetRef = useRef(preset);
  const activeRef = useRef(active);
  const colorRef = useRef(color);
  const glowRef = useRef(glowColor);

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    glowRef.current = glowColor;
  }, [glowColor]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }
    const analyser = getAnalyser();
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!analyser || !activeRef.current) {
      // Idle animation: gentle wave
      drawIdle(ctx, width, height, colorRef.current);
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(timeData);

    switch (presetRef.current) {
      case 'bars':
        drawBars(ctx, freqData, width, height, colorRef.current, glowRef.current);
        break;
      case 'waves':
        drawWaves(ctx, timeData, width, height, colorRef.current, glowRef.current);
        break;
      case 'circular':
        drawCircular(ctx, freqData, width, height, colorRef.current, glowRef.current);
        break;
    }
    rafRef.current = requestAnimationFrame(draw);
  }, [getAnalyser]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  const setCanvasSize = useCallback((w: number, h: number) => {
    if (canvasRef.current) {
      canvasRef.current.width = w;
      canvasRef.current.height = h;
    }
  }, []);

  return { canvasRef, setCanvasSize };
}

function drawIdle(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const t = Date.now() / 1000;
  ctx.lineWidth = 2;
  ctx.strokeStyle = color + '40';
  ctx.beginPath();
  for (let x = 0; x < w; x += 4) {
    const y = h / 2 + Math.sin(x * 0.02 + t * 2) * 8;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  w: number,
  h: number,
  color: string,
  glow: string,
) {
  const barCount = 64;
  const step = Math.floor(data.length / barCount);
  const barWidth = (w / barCount) * 0.7;
  const gap = (w / barCount) * 0.3;
  for (let i = 0; i < barCount; i++) {
    const v = data[i * step] / 255;
    const barH = v * h * 0.8;
    const x = i * (barWidth + gap);
    const y = h - barH;
    const grad = ctx.createLinearGradient(0, y, 0, h);
    grad.addColorStop(0, color);
    grad.addColorStop(1, glow);
    ctx.fillStyle = grad;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    roundRect(ctx, x, y, barWidth, barH, 3);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawWaves(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  w: number,
  h: number,
  color: string,
  glow: string,
) {
  ctx.lineWidth = 3;
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, color);
  grad.addColorStop(0.5, glow);
  grad.addColorStop(1, color);
  ctx.strokeStyle = grad;
  ctx.beginPath();
  const slice = w / data.length;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128.0;
    const y = (v * h) / 2;
    const x = i * slice;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawCircular(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  w: number,
  h: number,
  color: string,
  glow: string,
) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.22;
  const bars = 80;
  const step = Math.floor(data.length / bars);
  for (let i = 0; i < bars; i++) {
    const v = data[i * step] / 255;
    const angle = (i / bars) * Math.PI * 2;
    const len = v * radius * 1.2;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * (radius + len);
    const y2 = cy + Math.sin(angle) * (radius + len);
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, color);
    grad.addColorStop(1, glow);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
