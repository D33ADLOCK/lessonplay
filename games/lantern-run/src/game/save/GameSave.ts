import { DEFAULT_SETTINGS, type GameSettings } from "../../platform/settings/Settings";
import { SaveService } from "../../platform/save/SaveService";
import type { PersonalBest } from "../../platform/progression/Progression";

export interface LanternRunSave {
  readonly completedLevelIds: string[];
  readonly personalBests: Record<string, PersonalBest>;
  readonly restoredWorld: string[];
  readonly settings: GameSettings;
}

export const DEFAULT_SAVE: LanternRunSave = {
  completedLevelIds: [],
  personalBests: {},
  restoredWorld: [],
  settings: DEFAULT_SETTINGS,
};

export function createGameSaveService(
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">,
): SaveService<LanternRunSave> {
  return new SaveService({
    key: "lantern-run-save",
    version: 2,
    defaults: DEFAULT_SAVE,
    migrations: {
      1: (data) => ({
        ...(data as object),
        settings: DEFAULT_SETTINGS,
      }),
    },
    storage,
  });
}
