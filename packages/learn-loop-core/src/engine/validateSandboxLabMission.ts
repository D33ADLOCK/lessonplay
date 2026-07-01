import type { SandboxLabMission } from "../model/sandboxLab";
import { validateSandboxLabPresentation } from "../model/sandboxLab";
import type { ValidationResult } from "../model/scenario";
import { solveSandboxLabMission } from "./solveSandboxLabMission";

/**
 * The single build-time gate for a SandboxLab mission.
 *
 * It runs the structural presentation check first (referential integrity,
 * shape, investigation contract), and only if that passes does it run the
 * deterministic {@link solveSandboxLabMission} reachability check. Solvability
 * is only meaningful on structurally valid data, so a structural failure is
 * primary: the structural errors are returned alone and the solver is skipped.
 *
 * When structural validation passes, the result reflects solvability, so a
 * mission that "looks fine" but has no winning path still fails here. This keeps
 * structural errors strictly before solvability errors for any caller that
 * surfaces them to the generating agent.
 */
export function validateSandboxLabMission(
  mission: SandboxLabMission,
): ValidationResult {
  const structural = validateSandboxLabPresentation(
    mission.scenario,
    mission.presentation,
  );
  if (!structural.ok) {
    return structural;
  }

  const solved = solveSandboxLabMission(mission);
  return { ok: solved.solvable, errors: solved.errors };
}
