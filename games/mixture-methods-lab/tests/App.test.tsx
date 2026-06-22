import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/ui/App";

describe("App", () => {
  it("renders the chapter lab and opens all five missions from the drawer", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Mixture Methods Lab" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open missions" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open missions" }));

    expect(screen.getByRole("button", { name: /Classify the Mixture/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Separate Salt and Sand/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Grow Pure Crystals/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Recover Both Liquids/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ink Detective/ })).toBeInTheDocument();
  });
});
