/**
 * Responsive DOM overlay shell.
 *
 * Menus, settings, accessible controls and text-heavy feedback live in the DOM
 * (PRD "Technical Direction"), layered above the Phaser canvas. The shell owns
 * the `#overlay` root and the contract for showing modal panels that block
 * gameplay input beneath them (PRD acceptance: "Menus and dialogs block
 * gameplay input correctly").
 */
export class OverlayShell {
  readonly root: HTMLElement;

  constructor(rootId = "overlay") {
    const el = document.getElementById(rootId);
    if (!el) throw new Error(`OverlayShell: #${rootId} not found in DOM`);
    this.root = el;
  }

  /** Mount a panel element. `modal` makes it block gameplay input beneath. */
  mountPanel(panel: HTMLElement, opts: { modal?: boolean } = {}): () => void {
    panel.classList.add("panel");
    if (opts.modal) panel.dataset.modal = "true";
    this.root.appendChild(panel);
    if (opts.modal) this.setModal(true);
    return () => {
      panel.remove();
      if (opts.modal && this.root.querySelectorAll(".panel[data-modal='true']").length === 0) {
        this.setModal(false);
      }
    };
  }

  /** Whether a modal panel is currently capturing input. */
  get isModalOpen(): boolean {
    return this.root.getAttribute("data-modal") === "true";
  }

  private setModal(on: boolean): void {
    this.root.setAttribute("data-modal", String(on));
  }

  clear(): void {
    this.root.replaceChildren();
    this.setModal(false);
  }
}
