import { describe, expect, it } from "vitest";
import { apparatusFor } from "../src/scene/apparatus";

describe("apparatusFor", () => {
  it("draws the salt+sand residue station as a funnel with filter paper", () => {
    expect(apparatusFor("salt-sand-separation", "residue")).toBe("funnel");
  });

  it("draws the other salt+sand stations as beakers", () => {
    expect(apparatusFor("salt-sand-separation", "mixture")).toBe("beaker");
    expect(apparatusFor("salt-sand-separation", "filtrate")).toBe("beaker");
  });

  it("defaults single-station experiments to a beaker", () => {
    expect(apparatusFor("acid-base-neutralisation", "beaker")).toBe("beaker");
    expect(apparatusFor("metal-acid-hydrogen", "beaker")).toBe("beaker");
  });

  it("falls back to a beaker for an unknown experiment or station", () => {
    expect(apparatusFor("does-not-exist", "whatever")).toBe("beaker");
    expect(apparatusFor("salt-sand-separation", "ghost-station")).toBe("beaker");
    expect(() => apparatusFor("", "")).not.toThrow();
  });
});
