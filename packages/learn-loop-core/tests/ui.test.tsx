import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToolTray } from "../src/ui/ToolTray";
import { GuidedLabViewport } from "../src/ui/GuidedLabViewport";
import { SandboxLabViewport } from "../src/ui/SandboxLabViewport";
import { apparatusLabel, reactionLabel, stationVisualClasses } from "../src/ui";
import { CuePanel, ResultPanel } from "../src/ui/panels";
import { titleCase } from "../src/ui/titleCase";
import type { Entity } from "../src/model/entity";
import { saltSandScenario } from "./fixtures/saltSand";
import { sandboxSaltSandMission } from "./fixtures/sandboxMixtures";
import { sandboxIndicatorMission } from "./fixtures/sandboxIndicator";

const reagents: Entity[] = [
  { id: "water", label: "Water", color: "#bcd7ef", kind: "neutral" },
];

describe("titleCase", () => {
  it("sentence-cases a plain id", () => {
    expect(titleCase("mixture")).toBe("Mixture");
  });
  it("splits and sentence-cases a camelCase id", () => {
    expect(titleCase("acetoneJar")).toBe("Acetone jar");
    expect(titleCase("waterJar")).toBe("Water jar");
  });
});

describe("ToolTray", () => {
  it("dispatches the right callback when a tool is tapped", async () => {
    const onPour = vi.fn();
    const onFilter = vi.fn();
    const onHeat = vi.fn();
    const onShineLight = vi.fn();
    render(
      <ToolTray
        reagents={reagents}
        hasFilter
        hasHeat
        hasShineLight
        hint={null}
        pendingReagent={null}
        busy={null}
        disabled={false}
        onPour={onPour}
        onFilter={onFilter}
        onHeat={onHeat}
        onShineLight={onShineLight}
      />,
    );

    await userEvent.click(screen.getByTitle("Water"));
    await userEvent.click(screen.getByTitle("Filter"));
    await userEvent.click(screen.getByTitle("Heat"));
    await userEvent.click(screen.getByTitle("Light test"));

    expect(onPour).toHaveBeenCalledWith("water");
    expect(onFilter).toHaveBeenCalledTimes(1);
    expect(onHeat).toHaveBeenCalledTimes(1);
    expect(onShineLight).toHaveBeenCalledTimes(1);
  });

  it("does not fire callbacks while disabled", async () => {
    const onPour = vi.fn();
    render(
      <ToolTray
        reagents={reagents}
        hasFilter={false}
        hasHeat={false}
        hint={null}
        pendingReagent={null}
        busy={null}
        disabled
        onPour={onPour}
        onFilter={vi.fn()}
        onHeat={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByTitle("Water"));
    expect(onPour).not.toHaveBeenCalled();
  });

  it("glows the hinted reagent tool", () => {
    const { container } = render(
      <ToolTray
        reagents={reagents}
        hasFilter={false}
        hasHeat={false}
        hint={{ kind: "reagent", reagentId: "water" }}
        pendingReagent={null}
        busy={null}
        disabled={false}
        onPour={vi.fn()}
        onFilter={vi.fn()}
        onHeat={vi.fn()}
      />,
    );
    expect(container.querySelector(".reagent-tool.live")).not.toBeNull();
  });
});

describe("panels", () => {
  it("CuePanel shows the prompt and an optional nudge", () => {
    render(<CuePanel prompt="Heat the flask" nudge="Nothing to filter here" />);
    expect(screen.getByText("Heat the flask")).toBeInTheDocument();
    expect(screen.getByText("Nothing to filter here")).toBeInTheDocument();
  });

  it("ResultPanel labels the advance button and fires onAdvance", async () => {
    const onAdvance = vi.fn();
    render(
      <ResultPanel
        observation="The acetone distils over."
        explanation="Lower boiling point comes over first."
        isLast={false}
        onAdvance={onAdvance}
      />,
    );
    const button = screen.getByRole("button", { name: "Next step" });
    await userEvent.click(button);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("ResultPanel says Finish on the last step", () => {
    render(
      <ResultPanel
        observation="done"
        explanation="why"
        isLast
        onAdvance={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Finish" })).toBeInTheDocument();
  });
});

describe("GuidedLabViewport", () => {
  it("renders the fixed lab shell with mission controls and tool dock", () => {
    render(
      <GuidedLabViewport
        title="Mixture Methods Lab"
        eyebrow="Chapter 5"
        scenario={saltSandScenario}
        presentation={{
          scenarioId: saltSandScenario.id,
          badge: "Dissolve + filter",
          stationVisuals: [
            { stationId: "beaker", kind: "beaker", label: "Beaker" },
            { stationId: "residue", kind: "filter", label: "Residue" },
            { stationId: "filtrate", kind: "dish", label: "Filtrate" },
          ],
        }}
        missionIndex={0}
        missionCount={2}
        missionTitles={["Separate Salt and Sand", "Next mission"]}
        onSelectMission={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Mixture Methods Lab" })).toBeInTheDocument();
    expect(screen.getByText("Dissolve + filter")).toBeInTheDocument();
    expect(screen.getByText("Step 1/3")).toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Tools" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next mission" })).toBeInTheDocument();
  });
});

describe("SandboxLabViewport", () => {
  it("exposes stable apparatus and reaction helpers for generated games", () => {
    expect(apparatusLabel("evaporating-dish")).toBe("Evaporating dish");
    expect(reactionLabel("filter-residue")).toBe("Filter catches residue");
    expect(reactionLabel("gas-bubbles")).toBe("Gas bubbles form");
    expect(
      stationVisualClasses(
        { stationId: "filtrate", kind: "evaporating-dish", effectTags: ["vapour"] },
        "solution",
        true,
        ["crystals"],
      ),
    ).toContain("station-evaporating-dish");
  });

  it("lets learners open missions, collect evidence, and use conclusion cards", async () => {
    const user = userEvent.setup();
    const onSelectMission = vi.fn();
    render(
      <SandboxLabViewport
        title="Mixture Methods Lab"
        eyebrow="Chapter 5"
        mission={sandboxSaltSandMission}
        missionIndex={0}
        missionCount={2}
        missionTitles={["Separate Salt and Sand", "Next mission"]}
        onSelectMission={onSelectMission}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Mission briefing" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start experiment" }));
    expect(screen.queryByRole("button", { name: /Next mission/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Mixture")).toHaveAttribute("data-apparatus", "beaker");
    await user.click(screen.getByRole("button", { name: "Open missions" }));
    await user.click(screen.getByRole("button", { name: /Next mission/ }));
    expect(onSelectMission).toHaveBeenCalledWith(1);

    expect(screen.getByRole("region", { name: "Current material" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Tools" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "?" }));
    expect(screen.getByText("How can we get sand and salt apart?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start experiment" }));
    expect(screen.getByText("Mission 1/2 · Stage 1/3")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Conclusions" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Add water/ }));
    expect(screen.getByRole("dialog", { name: "Action feedback" })).toBeInTheDocument();
    expect(screen.getByText("You added water to the salt and sand.")).toBeInTheDocument();
    expect(screen.getByText("Mission 1/2 · Stage 1/3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add evidence" }));
    expect(
      screen.getAllByText(
        "The salt dissolves into a cloudy solution; the sand stays as undissolved grains.",
      ),
    ).toHaveLength(1);
    expect(screen.getByText("Mission 1/2 · Stage 2/3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open notebook" }));
    expect(screen.getByText("Water dissolves salt. Sand does not dissolve.")).toBeInTheDocument();
  });

  it("keeps mystery identities hidden until an evidence-backed conclusion", async () => {
    const user = userEvent.setup();
    render(
      <SandboxLabViewport
        title="Indicator Detective"
        eyebrow="Class 9"
        mission={sandboxIndicatorMission}
        missionIndex={0}
        missionCount={1}
        missionTitles={["Identify Unknown A"]}
        onSelectMission={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Dilute hydrochloric acid/)).not.toBeInTheDocument();
    expect(screen.getByText("Identity hidden")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start experiment" }));
    await user.click(
      screen.getByRole("button", { name: /Sodium hydroxide/ }),
    );
    await user.click(screen.getByRole("button", { name: "Add evidence" }));
    await user.click(screen.getByRole("button", { name: "Unknown A was an acid." }));

    expect(
      screen.getAllByText("Unknown A: Dilute hydrochloric acid").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Identity hidden")).not.toBeInTheDocument();
  });

  it("closes shared overlays from outside click and Escape", async () => {
    const user = userEvent.setup();
    render(
      <SandboxLabViewport
        title="Mixture Methods Lab"
        eyebrow="Chapter 5"
        mission={sandboxSaltSandMission}
        missionIndex={0}
        missionCount={2}
        missionTitles={["Separate Salt and Sand", "Next mission"]}
        onSelectMission={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Start experiment" }));
    await user.click(screen.getByRole("button", { name: "Open missions" }));
    expect(screen.getByRole("dialog", { name: "Missions" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close panel" }));
    expect(screen.queryByRole("dialog", { name: "Missions" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open notebook" }));
    expect(screen.getByRole("dialog", { name: "Notebook" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Notebook" })).not.toBeInTheDocument();
  });
});
