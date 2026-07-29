import { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useVisualizer } from '@/hooks/useVisualizer';
import { Theme } from '@/constants/theme';
import type { VisualizerPreset } from '@/types';

interface VisualizerProps {
  getAnalyser: () => AnalyserNode | null;
  preset: VisualizerPreset;
  active: boolean;
  height?: number;
  color?: string;
  glowColor?: string;
}

export function Visualizer({
  getAnalyser,
  preset,
  active,
  height = 120,
  color,
  glowColor,
}: VisualizerProps) {
  const { canvasRef, setCanvasSize } = useVisualizer({
    getAnalyser,
    preset,
    active,
    color,
    glowColor,
  });
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const update = () => {
      const el = (containerRef.current as any)?._nativeTag as HTMLElement | undefined;
      // On web, react-native-web exposes the DOM node via measure or ref
      const domNode = (canvasRef.current?.parentElement) as HTMLElement | undefined;
      const parent = domNode || el;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        setCanvasSize(rect.width, height);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [setCanvasSize, height]);

  if (Platform.OS !== 'web') {
    return <View style={[styles.placeholder, { height }]} />;
  }

  return (
    <View ref={containerRef} style={[styles.container, { height }]}>
      <canvas
        ref={canvasRef as any}
        style={{ width: '100%', height, display: 'block' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  placeholder: {
    width: '100%',
    backgroundColor: Theme.colors.zinc900,
    borderRadius: Theme.radius.md,
  },
});
