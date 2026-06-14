export type AssetCategory = "background" | "ui" | "portrait";

export interface AssetRecord {
  readonly id: string;
  readonly category: AssetCategory;
  readonly localPath: string;
  readonly source: "project-original";
  readonly license: "CC0-1.0";
  readonly treatmentNotes: string;
  readonly permittedUsage: string;
}

