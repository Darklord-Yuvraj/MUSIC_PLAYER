import { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Theme } from '@/constants/theme';

interface MiniVisualizerProps {
  getAnalyser: () => AnalyserNode | null;
  active: boolean;
  width?: number;
  height?: number;
}

export function MiniVisualizer({
  getAnalyser,
  active,
  width = 56,
  height = 24,
}: MiniVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    const BAR_COUNT = 14;
    const idleHeights = new Array(BAR_COUNT).fill(0).map(() => Math.random() * 0.3);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const analyser = getAnalyser();
      const barWidth = width / BAR_COUNT;
      const gap = barWidth * 0.2;
      const bw = barWidth - gap;

      let values: number[] = [];
      if (analyser && activeRef.current) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const step = Math.floor(data.length / BAR_COUNT);
        for (let i = 0; i < BAR_COUNT; i++) {
          values.push(data[i * step] / 255);
        }
      } else {
        const t = Date.now() / 600;
        for (let i = 0; i < BAR_COUNT; i++) {
          const target = activeRef.current
            ? 0.3 + Math.sin(t + i * 0.5) * 0.2 + Math.random() * 0.15
            : idleHeights[i] * (0.6 + Math.sin(t * 0.5 + i) * 0.3);
          values.push(Math.max(0.05, Math.min(1, target)));
        }
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        const v = values[i];
        const bh = v * height * 0.9;
        const x = i * barWidth + gap / 2;
        const y = height - bh;
        const grad = ctx.createLinearGradient(0, y, 0, height);
        grad.addColorStop(0, Theme.colors.cyan);
        grad.addColorStop(1, Theme.colors.violet + '80');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 4;
        ctx.shadowColor = Theme.colors.cyan + '80';
        ctx.beginPath();
        const r = Math.min(bw / 2, 1.5);
        ctx.moveTo(x, y + r);
        ctx.arcTo(x, y, x + bw, y, r);
        ctx.arcTo(x + bw, y, x + bw, y + bh, r);
        ctx.arcTo(x + bw, y + bh, x, y + bh, r);
        ctx.arcTo(x, y + bh, x, y, r);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(rafRef.current);
  }, [getAnalyser, width, height]);

  if (Platform.OS !== 'web') {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <canvas
        ref={canvasRef as any}
        style={{ width, height, display: 'block' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  placeholder: {
    backgroundColor: Theme.colors.zinc900,
    borderRadius: 4,
  },
});
