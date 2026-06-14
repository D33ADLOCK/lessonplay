import type { AssetRecord } from "../contracts/assets";

export const assetCatalog: readonly AssetRecord[] = [
  {
    id: "field-station-blackout",
    category: "background",
    localPath: "/assets/backgrounds/field-station-blackout.svg",
    source: "project-original",
    license: "CC0-1.0",
    treatmentNotes:
      "Warm cartoon workbench shapes under cool navy storm lighting and amber emergency accents.",
    permittedUsage: "Reusable in this template and derivative repair adventures.",
  },
  {
    id: "field-radio",
    category: "ui",
    localPath: "/assets/ui/field-radio.svg",
    source: "project-original",
    license: "CC0-1.0",
    treatmentNotes:
      "Rounded field radio with the same navy, coral, cream, and amber palette.",
    permittedUsage: "Reusable for radio dialogue and story status UI.",
  },
  {
    id: "mira-portraits",
    category: "portrait",
    localPath: "src/ui/Portrait.tsx",
    source: "project-original",
    license: "CC0-1.0",
    treatmentNotes:
      "Programmatic SVG portrait with five expression states and coral field jacket.",
    permittedUsage: "Reusable and recolorable in derivative template games.",
  },
  {
    id: "kabir-portraits",
    category: "portrait",
    localPath: "src/ui/Portrait.tsx",
    source: "project-original",
    license: "CC0-1.0",
    treatmentNotes:
      "Programmatic SVG portrait with five expression states and teal field jacket.",
    permittedUsage: "Reusable and recolorable in derivative template games.",
  },
];

