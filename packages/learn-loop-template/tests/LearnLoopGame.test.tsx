import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LearnLoopGame } from "../src";
import type { Scenario } from "@learn-loop/core";

const scenario: Scenario = {
  id: "salt-sand-separation",
  title: "Separate salt and sand",
  concept: "Separation of mixtures",
  grade: 9,
  entities: [
    {
      id: "salt",
      label: "Salt",
      color: "#f8fafc",
      kind: "salt",
      solubility: "soluble",
    },
    {
      id: "sand",
      label: "Sand",
      color: "#c9a66b",
      kind: "neutral",
      solubility: "insoluble",
    },
    {
      id: "water",
      label: "Water",
      color: "#93c5fd",
      kind: "neutral",
      solubility: "soluble",
    },
  ],
  shelf: ["water"],
  stations: {
    mixture: {
      contents: ["salt", "sand"],
      color: "#c9a66b",
      heat: "room",
      phase: "solid",
    },
    residue: {
      contents: [],
      color: "#f1f5f9",
      heat: "room",
      phase: "empty",
    },
    filtrate: {
      contents: [],
      color: "#f1f5f9",
      heat: "room",
      phase: "empty",
    },
  },
  rules: [
    {
      id: "dissolve",
      on: "pour",
      requires: ["salt", "sand"],
      transform: {
        kind: "react",
        consume: [],
        produce: [],
        newColor: "#d8d1b8",
      },
      observation: "The salt dissolves while the sand remains visible.",
      explanation: "Salt is soluble in water; sand is insoluble.",
    },
    {
      id: "filter",
      on: "filter",
      at: "source",
      requires: ["sand"],
      transform: { kind: "split", solidTo: "residue", liquidTo: "filtrate" },
      observation: "The sand collects on the filter paper.",
      explanation: "Filtration catches insoluble solids.",
    },
  ],
  steps: [
    {
      id: "add-water",
      predictPrompt: "What happens when water is added?",
      options: [
        {
          label: "Salt dissolves",
          correct: true,
          feedback: "Correct.",
        },
      ],
      goal: "Use the first separation clue.",
      hints: {
        filter: "There is nothing to filter before adding water.",
      },
      actionPrompt: "Pour water into the mixture.",
      expect: { type: "pour", reagent: "water", target: "mixture" },
      explanation: "Solubility lets us separate salt from sand.",
    },
    {
      id: "filter",
      predictPrompt: "How do we remove the sand?",
      options: [
        {
          label: "Filter it",
          correct: true,
          feedback: "Correct.",
        },
      ],
      goal: "Remove the sand.",
      actionPrompt: "Filter the mixture.",
      expect: { type: "filter", source: "mixture" },
      explanation: "The filter traps sand and lets liquid through.",
    },
  ],
};

describe("LearnLoopGame", () => {
  it("renders the fixed template regions from a scenario", () => {
    render(
      <LearnLoopGame
        title="Mixture Lab"
        eyebrow="Chapter 5"
        scenario={scenario}
        missionIndex={0}
        missionCount={2}
      />,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Mission" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Experiment zone" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Tools" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Feedback" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Notebook" })).toBeInTheDocument();
    expect(screen.getByText("Separate salt and sand")).toBeInTheDocument();
    expect(screen.getByText("Salt")).toBeInTheDocument();
    expect(screen.getByText("Sand")).toBeInTheDocument();
  });

  it("applies only normalized theme and variant classes", () => {
    const { container } = render(
      <LearnLoopGame
        title="Mixture Lab"
        scenario={scenario}
        config={{
          theme: {
            palette: "night-lab",
            accent: "rose",
            intensity: "high-contrast",
          },
          variants: {
            header: "compact",
            stage: "process-flow",
            feedback: "notebook",
          },
        }}
      />,
    );

    const shell = container.querySelector(".learn-loop-template");
    expect(shell).toHaveClass(
      "theme-night-lab",
      "accent-rose",
      "intensity-high-contrast",
      "header-compact",
      "stage-process-flow",
      "feedback-notebook",
    );
  });

  it("renders constrained station presentation without giving layout control", () => {
    const { container } = render(
      <LearnLoopGame
        title="Mixture Lab"
        scenario={scenario}
        presentation={{
          stations: [
            {
              stationId: "mixture",
              label: "Sample beaker",
              kind: "beaker",
              role: "source",
            },
            {
              stationId: "residue",
              label: "Filter paper",
              kind: "filter",
              role: "output",
            },
            {
              stationId: "filtrate",
              label: "Evaporating dish",
              kind: "dish",
              role: "output",
            },
          ],
        }}
      />,
    );

    expect(screen.getByLabelText("Sample beaker")).toHaveAttribute(
      "data-station-kind",
      "beaker",
    );
    expect(screen.getByLabelText("Filter paper")).toHaveAttribute(
      "data-station-kind",
      "filter",
    );
    expect(screen.getByLabelText("Evaporating dish")).toHaveAttribute(
      "data-station-role",
      "output",
    );
    expect(container.querySelectorAll(".learn-loop-region")).toHaveLength(6);
  });

  it("renders optional shared mission navigation", async () => {
    const user = userEvent.setup();
    const onSelectMission = vi.fn();

    render(
      <LearnLoopGame
        title="Mixture Lab"
        scenario={scenario}
        missionIndex={0}
        missionCount={3}
        missionTitles={["Salt and sand", "Crystals", "Chromatography"]}
        onSelectMission={onSelectMission}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open missions" }));

    expect(
      screen.getByRole("navigation", { name: "Mission list" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Chromatography" }));

    expect(onSelectMission).toHaveBeenCalledWith(2);
    expect(
      screen.queryByRole("navigation", { name: "Mission list" }),
    ).not.toBeInTheDocument();
  });

  it("falls back when an agent tries unsupported layout tokens", () => {
    const { container } = render(
      <LearnLoopGame
        title="Mixture Lab"
        scenario={scenario}
        config={{
          theme: { palette: "purple-orbs" },
          variants: { stage: "free-layout" },
        }}
        presentation={{
          stations: [{ stationId: "mixture", kind: "floating-3d-scene" }],
        }}
      />,
    );

    const shell = container.querySelector(".learn-loop-template");
    expect(shell).toHaveClass("theme-clean-lab", "stage-bench");
    expect(shell).not.toHaveClass("theme-purple-orbs", "stage-free-layout");
    expect(screen.getByLabelText("mixture")).toHaveAttribute(
      "data-station-kind",
      "beaker",
    );
  });

  it("routes tool choices through the core session controller", async () => {
    const user = userEvent.setup();
    render(<LearnLoopGame title="Mixture Lab" scenario={scenario} />);

    await user.click(screen.getByTitle("Filter"));
    expect(
      screen.getByText("There is nothing to filter before adding water."),
    ).toBeInTheDocument();

    await user.click(screen.getByTitle("Water"));
    expect(
      await screen.findByText("The salt dissolves while the sand remains visible."),
    ).toBeInTheDocument();
  });

  it("reflects engine workspace changes in station contents", async () => {
    const user = userEvent.setup();
    render(<LearnLoopGame title="Mixture Lab" scenario={scenario} />);

    await user.click(screen.getByTitle("Water"));
    await screen.findByText("The salt dissolves while the sand remains visible.");
    await user.click(screen.getByRole("button", { name: "Next step" }));
    await user.click(screen.getByTitle("Filter"));

    expect(await screen.findByText("The sand collects on the filter paper.")).toBeInTheDocument();
    expect(screen.getByLabelText("residue")).toHaveTextContent("Sand");
    expect(screen.getByLabelText("filtrate")).toHaveTextContent("Salt");
  });
});
