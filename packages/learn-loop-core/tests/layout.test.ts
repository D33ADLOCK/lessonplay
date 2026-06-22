import { describe, expect, it } from "vitest";
import {
  computeStationLayout,
  type Rect,
  type StationBox,
} from "../src/stage/layout";

const W = 360;
const H = 360;

/** True when `inner` sits entirely within `outer` (allowing equal edges). */
function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

const sceneRect = (w: number, h: number): Rect => ({ x: 0, y: 0, w, h });

describe("computeStationLayout", () => {
  it("emits one box per requested station", () => {
    expect(computeStationLayout(W, H, 1).stations).toHaveLength(1);
    expect(computeStationLayout(W, H, 2).stations).toHaveLength(2);
    expect(computeStationLayout(W, H, 3).stations).toHaveLength(3);
  });

  it("clamps a non-positive count to a row of one", () => {
    expect(computeStationLayout(W, H, 0).stations).toHaveLength(1);
    expect(computeStationLayout(W, H, -4).stations).toHaveLength(1);
  });

  it("places columns left-to-right, centred and non-overlapping", () => {
    const { stations } = computeStationLayout(W, H, 3);
    const centres = stations.map((s) => s.cx);
    expect(centres[0]).toBeLessThan(centres[1]);
    expect(centres[1]).toBeLessThan(centres[2]);
    expect(centres[0] + centres[2]).toBeCloseTo(W, 6);
    expect(centres[1]).toBeCloseTo(W / 2, 6);
    for (let i = 1; i < stations.length; i++) {
      const prev = stations[i - 1].vessel;
      const cur = stations[i].vessel;
      expect(prev.x + prev.w).toBeLessThanOrEqual(cur.x);
    }
  });

  it("keeps every vessel and liquid rect inside the scene bounds", () => {
    const scene = sceneRect(W, H);
    for (const count of [1, 2, 3]) {
      for (const s of computeStationLayout(W, H, count).stations) {
        expect(contains(scene, s.vessel)).toBe(true);
        expect(contains(scene, s.liquid)).toBe(true);
      }
    }
  });

  it("nests each liquid rect strictly inside its own vessel", () => {
    for (const count of [1, 2, 3]) {
      for (const s of computeStationLayout(W, H, count).stations) {
        expect(contains(s.vessel, s.liquid)).toBe(true);
        expect(s.liquid.x).toBeGreaterThan(s.vessel.x);
        expect(s.liquid.x + s.liquid.w).toBeLessThan(s.vessel.x + s.vessel.w);
        expect(s.liquid.y).toBeGreaterThan(s.vessel.y);
      }
    }
  });

  it("draws a single station larger than one column of three", () => {
    const one = computeStationLayout(W, H, 1).stations[0];
    const three = computeStationLayout(W, H, 3).stations[0];
    expect(one.vessel.w).toBeGreaterThan(three.vessel.w);
    expect(one.vessel.h).toBeGreaterThan(three.vessel.h);
  });

  it("anchors the heat label above and the caption below the vessel", () => {
    for (const s of computeStationLayout(W, H, 3).stations) {
      expect(s.heatLabelY).toBeLessThan(s.vessel.y);
      expect(s.baseY).toBeCloseTo(s.vessel.y + s.vessel.h, 6);
      expect(s.labelY).toBeGreaterThan(s.baseY);
    }
  });

  it("is deterministic for identical inputs", () => {
    const a = computeStationLayout(W, H, 3);
    const b = computeStationLayout(W, H, 3);
    expect(a).toEqual(b);
  });

  it("reproduces the original vessel geometry", () => {
    const s: StationBox = computeStationLayout(360, 360, 3).stations[0];
    const colW = 360 / 3;
    const w = Math.min(colW * 0.62, 360 * 0.42);
    const h = 360 * 0.4;
    const y = 360 * 0.24;
    const cx = colW * 0.5;
    expect(s.vessel).toEqual({ x: cx - w / 2, y, w, h });
    expect(s.liquid.y).toBeCloseTo(y + h * 0.34, 6);
    expect(s.liquid.x).toBeCloseTo(cx - w / 2 + 4, 6);
  });
});
