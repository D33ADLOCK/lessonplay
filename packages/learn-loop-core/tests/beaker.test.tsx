import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Beaker } from "../src/ui/Beaker";

/**
 * The Beaker is pure presentation: it draws the distinguishing element for the
 * `visual` it is handed. These tests pin that each animated visual renders its
 * own marker so the readings grid and the live "money shot" stay legible.
 */
describe("Beaker", () => {
  it("renders the Tyndall beam for the beam visual", () => {
    const { container } = render(<Beaker visual="beam" cloudy />);
    expect(container.querySelector(".beam")).not.toBeNull();
  });

  it("renders sediment for settle and residue for residue", () => {
    const { container: settle } = render(<Beaker visual="settle" cloudy />);
    expect(settle.querySelector(".sediment")).not.toBeNull();
    const { container: residue } = render(<Beaker visual="residue" cloudy={false} />);
    expect(residue.querySelector(".residue")).not.toBeNull();
  });

  it("renders rising bubbles for fizz", () => {
    const { container } = render(<Beaker visual="fizz" cloudy={false} />);
    const bubbles = container.querySelector(".bubbles");
    expect(bubbles).not.toBeNull();
    expect(bubbles?.classList.contains("bubbles--gas")).toBe(false);
    expect(container.querySelectorAll(".bubble").length).toBeGreaterThan(0);
  });

  it("tints the liquid for color-change", () => {
    const { container } = render(<Beaker visual="color-change" cloudy={false} />);
    expect(container.querySelector(".beaker__liquid.is-colour")).not.toBeNull();
  });

  it("renders escaping bubbles and a gas chip when a gasLabel is given", () => {
    const { container, queryByText } = render(
      <Beaker visual="gas" cloudy={false} gasLabel="H₂" />,
    );
    expect(container.querySelector(".bubbles--gas")).not.toBeNull();
    expect(queryByText(/H₂/)).not.toBeNull();
  });

  it("omits the gas chip when no gasLabel is given", () => {
    const { container } = render(<Beaker visual="gas" cloudy={false} />);
    expect(container.querySelector(".bubbles--gas")).not.toBeNull();
    expect(container.querySelector(".gas-chip")).toBeNull();
  });

  it("turns the liquid milky with curd flecks for precipitate", () => {
    const { container } = render(<Beaker visual="precipitate" cloudy={false} />);
    expect(container.querySelector(".beaker__liquid.is-milky")).not.toBeNull();
    expect(container.querySelectorAll(".curd").length).toBeGreaterThan(0);
  });
});
