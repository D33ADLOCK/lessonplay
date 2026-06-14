/**
 * Game lifecycle & scene transitions (PRD "Architecture Boundaries").
 *
 * The canonical scene keys for the slice. Phaser owns the actual scene manager;
 * routing through these constants keeps transitions discoverable and typed, and
 * lets tests reason about flow without booting Phaser. Slice 7 (#17) wires the
 * opening → level → celebration → hub transitions.
 */
export const SceneKeys = {
  Boot: "boot",
  Opening: "opening",
  Hub: "hub",
  Level: "level",
  Celebration: "celebration",
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
