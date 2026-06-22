import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/ui/App";

describe("App", () => {
  it("renders the template shell and opens the generated missions", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Pink Point Lab" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Experiment zone" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open missions" }));

    expect(screen.getByRole("button", { name: "Catch the Pink Point" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare Clear and Basic Samples" })).toBeInTheDocument();
  });
});
