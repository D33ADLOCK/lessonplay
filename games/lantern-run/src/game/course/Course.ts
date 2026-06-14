import { SURFACES, type Surface } from "../sim/SurfaceModel";

/**
 * Course geometry (game-specific data).
 *
 * A 1D track measured in "course units". Surface segments tile the track left
 * to right; the cart launches from `start` and must come to rest inside the
 * target. Routes let a level offer a safe vs. risky path (PRD user story 10);
 * Slice 2 only needs the primary lane, richer routing arrives with the content
 * contract in Slice 4 (#14).
 */
export interface SurfaceSegment {
  readonly surfaceId: string;
  /** Inclusive start position in course units. */
  readonly from: number;
  /** Exclusive end position in course units. */
  readonly to: number;
}

export interface Target {
  /** Center of the landing zone, in course units. */
  readonly center: number;
  /** Half-width of the "success" zone. */
  readonly radius: number;
  /** Half-width of the tighter "perfect" zone (<= radius). */
  readonly perfectRadius: number;
}

export interface Course {
  /** Total track length in course units. */
  readonly length: number;
  /** Cart start position. */
  readonly start: number;
  readonly segments: readonly SurfaceSegment[];
  readonly target: Target;
}

/** Resolve the surface under a given position (clamps to the nearest segment). */
export function surfaceAt(course: Course, position: number): Surface {
  for (const seg of course.segments) {
    if (position >= seg.from && position < seg.to) {
      return SURFACES[seg.surfaceId] ?? SURFACES.wood;
    }
  }
  // Past the last segment: reuse the final segment's surface.
  const last = course.segments[course.segments.length - 1];
  return (last && SURFACES[last.surfaceId]) || SURFACES.wood;
}

/** A simple demo course used by the Slice 2 tracer scene. */
export const DEMO_COURSE: Course = {
  length: 100,
  start: 6,
  segments: [
    { surfaceId: "wood", from: 0, to: 34 },
    { surfaceId: "grass", from: 34, to: 64 },
    { surfaceId: "ice", from: 64, to: 100 },
  ],
  target: { center: 82, radius: 7, perfectRadius: 2.5 },
};
