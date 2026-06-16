import { useEffect, useRef } from "react";
import { draw, type LabScene } from "../scene/labRenderer";

interface LabCanvasProps {
  readonly scene: LabScene;
  /** Target tween progress, 0 → 1. The canvas eases toward it each frame. */
  readonly target: number;
}

/**
 * Renders the lab scene to a canvas and eases the animation progress toward
 * `target`. The logical scene size (scene.width/height) is mapped to the
 * element's pixel size with devicePixelRatio for crisp drawing on phones.
 */
export function LabCanvas({ scene, target }: LabCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(target);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(
        canvas.width / scene.width,
        0,
        0,
        canvas.height / scene.height,
        0,
        0,
      );

      // Ease current progress toward the target.
      const p = progressRef.current;
      progressRef.current = p + (targetRef.current - p) * 0.12;
      draw(ctx, scene, progressRef.current);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  return <canvas ref={canvasRef} className="lab-canvas" aria-hidden="true" />;
}
