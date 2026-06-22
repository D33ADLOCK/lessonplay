/**
 * The three-layer **Stage** compositor — domain-agnostic.
 *
 * Every guided-sim game paints its bench in three stacked layers that must share
 * one coordinate system (see `computeStationLayout`): a static `backdrop` (SVG
 * scenery), an animated middle layer (`children` — typically a Canvas), and a
 * static `foreground` (SVG apparatus / captions). This component owns only the
 * `.stage` box and the back-to-front stacking order; it knows nothing about what
 * each layer draws. A game injects its own skin as the three nodes (render-prop
 * style), so the chemistry diorama/apparatus stay in the chemistry game while a
 * different subject supplies its own art.
 *
 * The injected layers are expected to position themselves absolutely within the
 * `.stage` box (e.g. `position: absolute; inset: 0`), exactly as the chemistry
 * skin's `.diorama-layer` / `.lab-canvas` / `.apparatus-layer` classes do — so the
 * apparatus layer can stay `pointer-events: none` and taps fall through. Stage
 * deliberately does *not* wrap them, so that contract is preserved.
 */

import type { CSSProperties, ReactNode } from "react";

export interface StageProps {
  /** Static layer painted behind everything (e.g. an SVG scene backdrop). */
  readonly backdrop?: ReactNode;
  /** The animated middle layer (e.g. a Canvas of fluid/energy). */
  readonly children?: ReactNode;
  /** Static layer painted in front (e.g. SVG apparatus + captions). */
  readonly foreground?: ReactNode;
  /** Extra class names appended to the default `stage` class. */
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function Stage({
  backdrop,
  children,
  foreground,
  className,
  style,
}: StageProps) {
  return (
    <div className={className ? `stage ${className}` : "stage"} style={style}>
      {backdrop}
      {children}
      {foreground}
    </div>
  );
}
