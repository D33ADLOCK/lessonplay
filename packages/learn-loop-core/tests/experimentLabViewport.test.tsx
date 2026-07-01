import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExperimentLabViewport } from "../src/ui/ExperimentLabViewport";
import type { ExperimentGame } from "../src/model/experimentLab";

/**
 * A minimal one-level, no-prediction game so the smoke test drives the actual
 * observe-and-record flow the viewport renders: pick a sample, apply a tool, see
 * the reading land in the grid, then classify through to the reveal.
 */
const smokeGame: ExperimentGame = {
  id: "smoke",
  title: "Smoke Lab",
  definition: {
    samples: [
      { id: "control", label: "Water control", properties: { size: "tiny" }, categoryId: "control" },
      {
        id: "unknown-x",
        label: "Unknown X",
        properties: { size: "coarse" },
        categoryId: "suspension",
        revealLabel: "chalk water",
      },
    ],
    tools: [
      { id: "light", label: "Side light" },
      { id: "filter", label: "Filter" },
    ],
    ruleSet: {
      rules: [
        {
          toolId: "light",
          when: { size: "coarse" },
          effect: {
            observationId: "beam",
            observation: "A beam path glows across the liquid.",
            visual: "beam",
          },
        },
        {
          toolId: "filter",
          when: { size: "coarse" },
          effect: {
            observationId: "residue",
            observation: "Residue stays on the paper.",
            visual: "residue",
          },
        },
      ],
      defaultEffect: {
        observationId: "none",
        observation: "Nothing happens.",
        visual: "none",
      },
    },
  },
  categories: [
    { id: "control", label: "Control" },
    { id: "solution", label: "Solution" },
    { id: "suspension", label: "Suspension", definition: "Large particles settle out." },
    { id: "colloid", label: "Colloid" },
  ],
  levels: [
    {
      id: "only",
      title: "Find the unknown",
      intro: "Test the unknown and make the call.",
      outro: "Nicely done.",
      sampleIds: ["control", "unknown-x"],
      toolIds: ["light", "filter"],
      goal: {
        classifyIds: ["unknown-x"],
        categoryIds: ["solution", "suspension", "colloid"],
      },
      scaffolding: "open",
      predictionRequired: false,
      hints: [],
    },
  ],
};

describe("ExperimentLabViewport", () => {
  it("renders the dark-glow shell and applies the theme classes", () => {
    const { container } = render(
      <ExperimentLabViewport game={smokeGame} theme={{ accent: "violet" }} />,
    );

    const root = container.querySelector(".experiment-lab-app");
    expect(root).not.toBeNull();
    expect(root?.className).toContain("xl-accent-violet");
    // Unknown/omitted tokens fall back to the dark-glow default.
    expect(root?.className).toContain("xl-palette-night-lab");
    expect(screen.getByText("Smoke Lab")).toBeInTheDocument();
  });

  it("drives a probe into the grid and a correct call through to the reveal", async () => {
    const user = userEvent.setup();
    render(<ExperimentLabViewport game={smokeGame} />);

    // Intro overlay → enter the lab.
    await user.click(screen.getByRole("button", { name: "Enter the lab" }));

    // Select the unknown from the sample chips, then apply the side light.
    const samples = screen.getByRole("region", { name: "Samples" });
    await user.click(within(samples).getByRole("button", { name: /Unknown X/ }));
    const tools = screen.getByRole("region", { name: "Tools" });
    await user.click(within(tools).getByRole("button", { name: /Side light/ }));

    // The reading is recorded into the notebook grid immediately.
    const grid = screen.getByRole("region", { name: "Lab notebook" });
    expect(within(grid).getByText("beam")).toBeInTheDocument();

    // The evidence gate is met, so the call's label flips immediately, but it
    // stays disabled while the effect lingers and only re-enables once the bench
    // reopens (the observe beat).
    const makeCall = screen.getByRole("button", { name: "Make the call" });
    await waitFor(() => expect(makeCall).toBeEnabled(), { timeout: 3000 });
    await user.click(makeCall);
    await user.click(screen.getByRole("button", { name: "Suspension" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    // Correct classification reveals the identity and the concept.
    expect(screen.getByRole("heading", { name: "Right!" })).toBeInTheDocument();
    expect(screen.getByText("chalk water")).toBeInTheDocument();
  });

  it("runs the predict beat on a prediction-required level before the effect plays", async () => {
    const user = userEvent.setup();
    // Same world, but this level demands a prediction before each tool fires.
    const predictGame: ExperimentGame = {
      ...smokeGame,
      levels: [{ ...smokeGame.levels[0], predictionRequired: true }],
    };
    render(<ExperimentLabViewport game={predictGame} />);

    await user.click(screen.getByRole("button", { name: "Enter the lab" }));
    const samples = screen.getByRole("region", { name: "Samples" });
    await user.click(within(samples).getByRole("button", { name: /Unknown X/ }));
    const tools = screen.getByRole("region", { name: "Tools" });
    await user.click(within(tools).getByRole("button", { name: /Side light/ }));

    // The tool does not fire yet — the predict overlay asks first, offering the
    // effects the light can show (a beam) versus nothing.
    expect(
      screen.getByRole("heading", { name: "Predict first" }),
    ).toBeInTheDocument();
    const grid = screen.getByRole("region", { name: "Lab notebook" });
    expect(within(grid).queryByText("beam")).toBeNull();

    // Predicting "a beam" applies the tool, records the reading, and reconciles.
    await user.click(screen.getByRole("button", { name: "A beam lights up" }));
    expect(within(grid).getByText("beam")).toBeInTheDocument();
    expect(screen.getByText(/You called it/)).toBeInTheDocument();
  });

  it("plays a gas effect: records a 'gas' reading and shows the gas chip", async () => {
    const user = userEvent.setup();
    // A metal + acid world: the acid tool evolves a gas off the reactive sample.
    const gasGame: ExperimentGame = {
      id: "gas",
      title: "Acid Bench",
      definition: {
        samples: [
          { id: "inert", label: "Inert chip", properties: { reactive: "no" }, categoryId: "unreactive" },
          {
            id: "metal",
            label: "Mystery metal",
            properties: { reactive: "yes" },
            categoryId: "reactive",
            revealLabel: "zinc",
          },
        ],
        tools: [{ id: "acid", label: "Add dilute acid" }],
        ruleSet: {
          rules: [
            {
              toolId: "acid",
              when: { reactive: "yes" },
              effect: {
                observationId: "bubbles",
                observation: "Bubbles stream off the metal and a gas escapes.",
                visual: "gas",
                gasLabel: "H₂",
              },
            },
          ],
          defaultEffect: {
            observationId: "still",
            observation: "Nothing happens.",
            visual: "none",
          },
        },
      },
      categories: [
        { id: "unreactive", label: "Unreactive" },
        { id: "reactive", label: "Reactive", definition: "Gives off hydrogen with acid." },
      ],
      levels: [
        {
          id: "only",
          title: "Which one reacts?",
          intro: "Add acid and watch.",
          outro: "That gas was hydrogen.",
          sampleIds: ["inert", "metal"],
          toolIds: ["acid"],
          goal: { classifyIds: ["metal"], categoryIds: ["unreactive", "reactive"] },
          scaffolding: "open",
          predictionRequired: false,
          hints: [],
        },
      ],
    };
    render(<ExperimentLabViewport game={gasGame} />);

    await user.click(screen.getByRole("button", { name: "Enter the lab" }));
    const samples = screen.getByRole("region", { name: "Samples" });
    await user.click(within(samples).getByRole("button", { name: /Mystery metal/ }));
    const tools = screen.getByRole("region", { name: "Tools" });
    await user.click(within(tools).getByRole("button", { name: /Add dilute acid/ }));

    // The gas chip rides above the beaker while the effect plays.
    expect(screen.getByText(/H₂/)).toBeInTheDocument();
    // The reading lands in the notebook as a "gas" cell.
    const grid = screen.getByRole("region", { name: "Lab notebook" });
    expect(within(grid).getByText("gas")).toBeInTheDocument();
  });
});
