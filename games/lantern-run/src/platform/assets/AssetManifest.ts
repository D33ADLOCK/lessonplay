/**
 * Asset manifest (contract).
 *
 * A declarative list of assets the preloader will load (PRD "Architecture
 * Boundaries → asset manifest and loading"). Keeping it data-driven means the
 * boot/preload scene never hard-codes paths. Slice 1 defines the shape and an
 * empty manifest (the slice boots with procedurally drawn graphics); art assets
 * are added alongside the story slice (#17).
 */
export type AssetKind = "image" | "spritesheet" | "audio" | "json";

export interface AssetEntry {
  readonly key: string;
  readonly kind: AssetKind;
  readonly url: string;
  /** Spritesheet frame config, when kind === "spritesheet". */
  readonly frame?: { readonly frameWidth: number; readonly frameHeight: number };
}

export type AssetManifest = readonly AssetEntry[];

export const EMPTY_MANIFEST: AssetManifest = [];
