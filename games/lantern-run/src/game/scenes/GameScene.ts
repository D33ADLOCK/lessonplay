import Phaser from "phaser";

import { celebrationIntensity } from "../../emotional/celebration/CelebrationIntensity";
import { defaultFeedbackComposer } from "../../emotional/feedback/ContextualFeedback";
import { ReactionDirector } from "../../emotional/reactions/ReactionDirector";
import { WorldTransformer } from "../../emotional/world/WorldTransformer";
import { AudioDirector } from "../../platform/audio/AudioDirector";
import { loadContent } from "../../platform/content/ContentLoader";
import { scoreResult, updatePersonalBest } from "../../platform/progression/Progression";
import { SettingsStore } from "../../platform/settings/Settings";
import { LEVELS, validateLevel, type LevelContent, type RouteId } from "../content/LevelContent";
import { createSurfaceResolver, type Course } from "../course/Course";
import { classifyOutcome, predictionAccuracy } from "../outcome/Outcome";
import { createGameSaveService, type LanternRunSave } from "../save/GameSave";
import {
  FIXED_DT,
  createSimState,
  launch,
  stepSimulation,
  type SimState,
} from "../sim/LanternSim";
import { SURFACES } from "../sim/SurfaceModel";
import type { GameplayEventStream, OutcomeQuality } from "../../emotional/events/GameplayEvent";
import type { OverlayShell } from "../../platform/overlay/OverlayShell";
import type { SemanticInput } from "../../platform/input/SemanticInput";

interface RuntimeServices {
  readonly overlay: OverlayShell;
  readonly input: SemanticInput;
  readonly events: GameplayEventStream;
}

type Phase = "opening" | "predict" | "moving" | "result" | "celebration" | "complete";

const WIDTH = 960;
const HEIGHT = 540;
const TRACK_LEFT = 74;
const TRACK_RIGHT = 900;
const TRACK_Y = 365;
const TRACK_WIDTH = TRACK_RIGHT - TRACK_LEFT;

export class GameScene extends Phaser.Scene {
  private services!: RuntimeServices;
  private settings!: SettingsStore;
  private audio!: AudioDirector;
  private saveService = createGameSaveService();
  private save!: LanternRunSave;
  private world!: WorldTransformer;
  private reactions = new ReactionDirector();
  private levelIndex = 0;
  private level!: LevelContent;
  private routeId: RouteId = "safe";
  private course!: Course;
  private phase: Phase = "opening";
  private sim: SimState = createSimState();
  private accumulator = 0;
  private force = 0.52;
  private prediction = 50;
  private predictionPlaced = false;
  private attempts = 1;
  private lastSurface = "";
  private optionalGoalMet = false;

  private trackGraphics!: Phaser.GameObjects.Graphics;
  private worldGraphics!: Phaser.GameObjects.Graphics;
  private marker!: Phaser.GameObjects.Container;
  private cart!: Phaser.GameObjects.Container;
  private cartBody!: Phaser.GameObjects.Rectangle;
  private villager!: Phaser.GameObjects.Container;
  private needText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private musicNotes: Phaser.GameObjects.Text[] = [];
  private overlayCleanup?: () => void;
  private ui?: {
    root: HTMLElement;
    prediction: HTMLInputElement;
    force: HTMLInputElement;
    launch: HTMLButtonElement;
    retry: HTMLButtonElement;
    next: HTMLButtonElement;
    route: HTMLElement;
    status: HTMLElement;
    audio: HTMLInputElement;
    motion: HTMLInputElement;
    pause: HTMLButtonElement;
  };

  constructor() {
    super("game");
  }

  create(): void {
    this.services = (globalThis as typeof globalThis & { __lanternRun: RuntimeServices })
      .__lanternRun;
    this.save = this.saveService.load();
    this.settings = new SettingsStore(this.save.settings);
    this.audio = new AudioDirector(this.settings.get() as typeof this.save.settings);
    this.world = new WorldTransformer(this.save.restoredWorld);
    this.reactions.attach(this.services.events);
    this.world.onApply(() => this.persistWorld());
    this.settings.subscribe((settings) => {
      this.audio.updateSettings(settings);
      this.save = { ...this.save, settings: { ...settings } };
      this.saveService.save(this.save);
      document.documentElement.dataset.reducedMotion = String(
        this.settings.effectiveReducedMotion,
      );
    });

    this.drawBackdrop();
    this.createActors();
    this.mountUi();
    this.bindInputs();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.overlayCleanup?.();
      this.reactions.detach();
    });
    this.showOpening();
    document.documentElement.setAttribute("data-lr-ready", "true");
    document.documentElement.dataset.gamePhase = this.phase;
  }

  update(_time: number, deltaMs: number): void {
    if (this.phase !== "moving") {
      this.updateReaction();
      return;
    }
    this.accumulator += Math.min(deltaMs / 1000, 0.1);
    const resolve = createSurfaceResolver(this.course);
    while (this.accumulator >= FIXED_DT && !this.sim.atRest) {
      this.sim = stepSimulation(this.sim, resolve);
      this.accumulator -= FIXED_DT;
      if (this.sim.position > this.course.length + 12) {
        this.sim = { ...this.sim, atRest: true, velocity: 0 };
      }
    }
    this.positionCart();
    this.emitTravelFeedback();
    this.updateReaction();
    if (this.sim.atRest) this.resolveLaunch();
  }

  private drawBackdrop(): void {
    this.cameras.main.setBackgroundColor(0x07142f);
    this.worldGraphics = this.add.graphics();
    this.trackGraphics = this.add.graphics();
    this.redrawWorld();

    this.titleText = this.add
      .text(WIDTH / 2, 34, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        fontStyle: "bold",
        color: "#fff0c7",
      })
      .setOrigin(0.5);
    this.needText = this.add
      .text(WIDTH / 2, 78, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "17px",
        color: "#b8cae8",
        align: "center",
        wordWrap: { width: 740 },
      })
      .setOrigin(0.5);
    this.feedbackText = this.add
      .text(WIDTH / 2, 455, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        color: "#fff0c7",
        align: "center",
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5);
  }

  private redrawWorld(): void {
    const g = this.worldGraphics;
    g.clear();
    g.fillStyle(0x102044, 1).fillRect(0, 0, WIDTH, HEIGHT);
    g.fillStyle(0x172d50, 1);
    for (let x = 20; x < WIDTH; x += 105) {
      const buildingHeight = 65 + ((x * 17) % 55);
      g.fillRect(x, TRACK_Y - buildingHeight - 70, 78, buildingHeight);
      g.fillTriangle(x - 6, TRACK_Y - buildingHeight - 70, x + 39, TRACK_Y - buildingHeight - 105, x + 84, TRACK_Y - buildingHeight - 70);
    }
    const restored = this.world.restored.length;
    for (let i = 0; i < restored; i += 1) {
      const x = 52 + (i * 113) % 840;
      const y = 205 + (i % 2) * 38;
      g.fillStyle(0xffb548, 0.75).fillCircle(x, y, 8);
      g.fillStyle(0xffb548, 0.12).fillCircle(x, y, 24);
    }
    g.fillStyle(0x081126, 1).fillRect(0, TRACK_Y + 40, WIDTH, HEIGHT - TRACK_Y);
  }

  private createActors(): void {
    const cartBody = this.add.rectangle(0, 0, 50, 32, 0xffa83d).setStrokeStyle(3, 0x6b301c);
    const roof = this.add.triangle(0, -24, -25, 8, 0, -17, 25, 8, 0xffd56a);
    const leftWheel = this.add.circle(-17, 19, 8, 0x182238).setStrokeStyle(2, 0xe8b15e);
    const rightWheel = this.add.circle(17, 19, 8, 0x182238).setStrokeStyle(2, 0xe8b15e);
    const eyeLeft = this.add.circle(-8, -2, 4, 0xfff6dc);
    const eyeRight = this.add.circle(8, -2, 4, 0xfff6dc);
    const pupilLeft = this.add.circle(-7, -1, 1.8, 0x15203a);
    const pupilRight = this.add.circle(9, -1, 1.8, 0x15203a);
    this.cart = this.add.container(TRACK_LEFT, TRACK_Y - 28, [
      leftWheel,
      rightWheel,
      cartBody,
      roof,
      eyeLeft,
      eyeRight,
      pupilLeft,
      pupilRight,
    ]);
    this.cartBody = cartBody;

    const villagerBody = this.add.ellipse(0, 12, 30, 48, 0xd65b78);
    const villagerHead = this.add.circle(0, -18, 17, 0xf3b88d);
    const villagerEyes = this.add.text(-9, -24, "•  •", {
      fontSize: "13px",
      color: "#17233f",
    });
    this.villager = this.add.container(760, TRACK_Y - 43, [
      villagerBody,
      villagerHead,
      villagerEyes,
    ]);

    for (let i = 0; i < 5; i += 1) {
      this.musicNotes.push(
        this.add
          .text(710 + i * 35, 150 - (i % 2) * 18, i % 2 ? "♪" : "♫", {
            fontSize: "24px",
            color: "#ffcc66",
          })
          .setAlpha(0),
      );
    }
  }

  private mountUi(): void {
    const root = document.createElement("section");
    root.className = "game-hud panel";
    root.innerHTML = `
      <div class="hud-top">
        <div class="level-progress" aria-label="Level progress">Lantern 1 of 3</div>
        <div class="hud-actions">
          <button type="button" data-action="pause" aria-label="Pause game">Pause</button>
          <button type="button" data-action="settings" aria-label="Open settings">Settings</button>
        </div>
      </div>
      <div class="route-picker" aria-label="Route choice"></div>
      <div class="control-dock">
        <label>Prediction
          <input data-control="prediction" type="range" min="5" max="100" value="50" />
        </label>
        <label>Push strength
          <input data-control="force" type="range" min="20" max="90" value="52" />
        </label>
        <div class="control-buttons">
          <button class="primary" type="button" data-action="launch">Launch</button>
          <button type="button" data-action="retry" hidden>Try again</button>
          <button class="primary" type="button" data-action="next" hidden>Continue</button>
        </div>
        <output data-status aria-live="polite">Place a prediction marker.</output>
      </div>
      <dialog class="settings-dialog">
        <h2>Festival settings</h2>
        <label><input type="checkbox" data-setting="audio" checked /> Audio</label>
        <label><input type="checkbox" data-setting="motion" /> Reduce motion</label>
        <button type="button" data-action="close-settings">Back to game</button>
      </dialog>
      <div class="pause-card" hidden>
        <h2>Festival paused</h2>
        <p>Your lantern is waiting.</p>
        <button type="button" data-action="resume">Resume</button>
      </div>
    `;
    this.overlayCleanup = this.services.overlay.mountPanel(root);
    const query = <T extends Element>(selector: string): T => {
      const element = root.querySelector<T>(selector);
      if (!element) throw new Error(`Missing HUD element: ${selector}`);
      return element;
    };
    this.ui = {
      root,
      prediction: query('[data-control="prediction"]'),
      force: query('[data-control="force"]'),
      launch: query('[data-action="launch"]'),
      retry: query('[data-action="retry"]'),
      next: query('[data-action="next"]'),
      route: query(".route-picker"),
      status: query("[data-status]"),
      audio: query('[data-setting="audio"]'),
      motion: query('[data-setting="motion"]'),
      pause: query('[data-action="pause"]'),
    };
    this.ui.audio.checked = this.settings.get().audioEnabled;
    this.ui.motion.checked = this.settings.get().reducedMotion;

    this.ui.prediction.addEventListener("input", () => {
      this.prediction = Number(this.ui?.prediction.value ?? 50);
      this.predictionPlaced = true;
      this.updateMarker();
      this.services.input.emit({ action: "aim", value: this.prediction / 100, source: "pointer" });
    });
    this.ui.force.addEventListener("input", () => {
      this.force = Number(this.ui?.force.value ?? 52) / 100;
      this.services.input.emit({ action: "chargeChange", value: this.force, source: "pointer" });
      this.previewCharge();
    });
    this.ui.launch.addEventListener("click", () => this.requestLaunch("pointer"));
    this.ui.retry.addEventListener("click", () => this.retry());
    this.ui.next.addEventListener("click", () => this.advance());
    root.querySelector('[data-action="settings"]')?.addEventListener("click", () => {
      const dialog = query<HTMLDialogElement>(".settings-dialog");
      dialog.showModal();
      this.services.overlay.root.dataset.modal = "true";
    });
    root.querySelector('[data-action="close-settings"]')?.addEventListener("click", () => {
      query<HTMLDialogElement>(".settings-dialog").close();
      this.services.overlay.root.dataset.modal = "false";
    });
    this.ui.audio.addEventListener("change", () =>
      this.settings.update({ audioEnabled: this.ui?.audio.checked ?? true }),
    );
    this.ui.motion.addEventListener("change", () =>
      this.settings.update({ reducedMotion: this.ui?.motion.checked ?? false }),
    );
    this.ui.pause.addEventListener("click", () => this.togglePause(true));
    root.querySelector('[data-action="resume"]')?.addEventListener("click", () =>
      this.togglePause(false),
    );
  }

  private bindInputs(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== "predict" || this.services.overlay.isModalOpen) return;
      if (pointer.y < TRACK_Y - 85 || pointer.y > TRACK_Y + 70) return;
      this.prediction = Phaser.Math.Clamp(
        ((pointer.x - TRACK_LEFT) / TRACK_WIDTH) * 100,
        5,
        100,
      );
      this.predictionPlaced = true;
      if (this.ui) this.ui.prediction.value = String(Math.round(this.prediction));
      this.services.input.emit({
        action: "aim",
        value: this.prediction / 100,
        source: pointer.wasTouch ? "touch" : "pointer",
      });
      this.updateMarker();
    });

    this.input.keyboard?.addCapture("SPACE,LEFT,RIGHT,UP,DOWN,R,ESC");
    this.input.keyboard?.on("keydown-SPACE", () => this.requestLaunch("keyboard"));
    this.input.keyboard?.on("keydown-R", () => this.retry());
    this.input.keyboard?.on("keydown-ESC", () => this.togglePause(!this.scene.isPaused()));
    this.input.keyboard?.on("keydown-LEFT", () => this.adjustPrediction(-3));
    this.input.keyboard?.on("keydown-RIGHT", () => this.adjustPrediction(3));
    this.input.keyboard?.on("keydown-DOWN", () => this.adjustForce(-0.04));
    this.input.keyboard?.on("keydown-UP", () => this.adjustForce(0.04));
  }

  private showOpening(): void {
    this.phase = "opening";
    this.updatePhaseAttribute();
    this.titleText.setText("Lantern Run");
    this.needText.setText("The storm has passed, but the hillside festival is dark.");
    this.feedbackText.setText("Help Mira deliver the first surviving lantern.");
    this.cart.setVisible(false);
    this.villager.setVisible(true).setPosition(WIDTH / 2 + 120, TRACK_Y - 43);
    this.ui?.root.classList.add("opening");
    if (this.ui) {
      this.ui.launch.textContent = "Begin the first delivery";
      this.ui.launch.hidden = false;
      this.ui.prediction.closest("label")?.classList.add("lr-hidden");
      this.ui.force.closest("label")?.classList.add("lr-hidden");
      this.ui.status.textContent = "First meaningful launch is one tap away.";
    }
  }

  private startLevel(index: number): void {
    this.levelIndex = index;
    this.level = loadContent(LEVELS[index], validateLevel, `level ${index + 1}`);
    this.routeId = this.level.routes[0].id;
    this.attempts = 1;
    this.predictionPlaced = !this.level.predictionRequired;
    this.force = index === 0 ? 0.76 : index === 1 ? 0.76 : 0.71;
    this.prediction = this.level.course.target.center;
    this.phase = "predict";
    this.updatePhaseAttribute();
    this.ui?.root.classList.remove("opening");
    this.ui?.prediction.closest("label")?.classList.remove("lr-hidden");
    this.ui?.force.closest("label")?.classList.remove("lr-hidden");
    if (this.ui) {
      this.ui.launch.textContent = "Launch lantern";
      this.ui.launch.hidden = false;
      this.ui.retry.hidden = true;
      this.ui.next.hidden = true;
      this.ui.prediction.value = String(this.prediction);
      this.ui.force.value = String(Math.round(this.force * 100));
      this.ui.prediction.disabled = false;
      this.ui.force.disabled = false;
      const progress = this.ui.root.querySelector(".level-progress");
      if (progress) progress.textContent = `Lantern ${index + 1} of ${LEVELS.length}`;
      this.ui.status.textContent = this.level.predictionPrompt;
    }
    this.titleText.setText(this.level.title);
    this.needText.setText(this.level.need);
    this.feedbackText.setText(this.level.hint);
    this.cart.setVisible(true);
    this.villager.setVisible(true);
    this.setupRoutePicker();
    this.setCourse();
    this.resetCart();
    this.updateMarker();
    this.redrawWorld();
  }

  private setupRoutePicker(): void {
    if (!this.ui) return;
    this.ui.route.replaceChildren();
    this.level.routes.forEach((route) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.route = route.id;
      button.textContent = route.label;
      button.title = route.description;
      button.classList.toggle("selected", route.id === this.routeId);
      button.addEventListener("click", () => {
        if (this.phase !== "predict") return;
        this.routeId = route.id;
        if (this.level.id === "frozen-shortcut") {
          this.force = route.id === "risky" ? 0.5 : 0.76;
          if (this.ui) this.ui.force.value = String(Math.round(this.force * 100));
        }
        this.setupRoutePicker();
        this.setCourse();
        this.resetCart();
      });
      this.ui?.route.appendChild(button);
    });
    this.ui.route.hidden = this.level.routes.length < 2;
  }

  private setCourse(): void {
    const route = this.level.routes.find((candidate) => candidate.id === this.routeId);
    if (!route) throw new Error(`Missing route ${this.routeId}`);
    this.course = { ...this.level.course, segments: route.segments };
    this.drawCourse();
  }

  private drawCourse(): void {
    const g = this.trackGraphics;
    g.clear();
    this.course.segments.forEach((segment) => {
      const x = this.courseToX(segment.from);
      const width = this.courseToX(segment.to) - x;
      const surface = SURFACES[segment.surfaceId] ?? SURFACES.wood;
      g.fillStyle(surface.color, 1).fillRoundedRect(x, TRACK_Y, width + 1, 30, 5);
      if (segment.surfaceId === "ice") {
        g.lineStyle(2, 0xd9f6ff, 0.65);
        for (let ix = x + 18; ix < x + width; ix += 38) g.lineBetween(ix, TRACK_Y + 8, ix + 14, TRACK_Y + 19);
      } else if (segment.surfaceId === "grass") {
        g.lineStyle(2, 0x9bc36a, 0.7);
        for (let ix = x + 12; ix < x + width; ix += 24) g.lineBetween(ix, TRACK_Y + 24, ix + 3, TRACK_Y + 12);
      } else {
        g.lineStyle(2, 0x7b4d2c, 0.5);
        for (let ix = x + 25; ix < x + width; ix += 54) g.lineBetween(ix, TRACK_Y + 2, ix, TRACK_Y + 28);
      }
    });
    const targetX = this.courseToX(this.course.target.center);
    const radius = (this.course.target.radius / this.course.length) * TRACK_WIDTH;
    const perfect = (this.course.target.perfectRadius / this.course.length) * TRACK_WIDTH;
    g.fillStyle(0xffd95e, 0.2).fillRect(targetX - radius, TRACK_Y - 10, radius * 2, 50);
    g.fillStyle(0xffd95e, 0.4).fillRect(targetX - perfect, TRACK_Y - 14, perfect * 2, 58);
    g.lineStyle(3, 0xffdc6b, 0.9).strokeRect(targetX - radius, TRACK_Y - 10, radius * 2, 50);
    this.villager.x = Math.min(TRACK_RIGHT - 20, targetX + radius + 28);
  }

  private resetCart(): void {
    this.sim = createSimState(this.course.start);
    this.sim = { ...this.sim, surfaceId: this.course.segments[0]?.surfaceId ?? "wood" };
    this.accumulator = 0;
    this.lastSurface = "";
    this.optionalGoalMet = false;
    this.positionCart();
    this.cart.setScale(1).setRotation(0).setAlpha(1);
    this.cartBody.setFillStyle(0xffa83d);
  }

  private updateMarker(): void {
    this.marker?.destroy(true);
    const x = this.courseToX(this.prediction);
    const line = this.add.rectangle(0, 0, 3, 64, 0x76e6ff, 0.9);
    const flag = this.add.triangle(10, -26, 0, 0, 0, 17, 24, 7, 0x76e6ff);
    this.marker = this.add.container(x, TRACK_Y - 25, [line, flag]);
    this.marker.setAlpha(this.predictionPlaced ? 1 : 0.38);
  }

  private requestLaunch(source: "pointer" | "keyboard" | "touch"): void {
    if (this.phase === "opening") {
      this.startLevel(0);
      return;
    }
    if (this.phase !== "predict" || this.services.overlay.isModalOpen) return;
    if (this.level.predictionRequired && !this.predictionPlaced) {
      if (this.ui) this.ui.status.textContent = "Place your prediction marker first.";
      this.cameras.main.shake(90, 0.002);
      return;
    }
    this.services.input.emit({ action: "launch", source });
    this.phase = "moving";
    this.updatePhaseAttribute();
    this.sim = launch(this.sim, this.force);
    this.services.events.emit({
      type: "launch",
      force: this.force,
      from: this.sim.position / this.course.length,
    });
    this.audio.play("launch");
    this.launchFeel();
    if (this.ui) {
      this.ui.launch.hidden = true;
      this.ui.status.textContent = "Watch the surfaces change the lantern's motion.";
      this.ui.prediction.disabled = true;
      this.ui.force.disabled = true;
    }
  }

  private resolveLaunch(): void {
    const outcome = classifyOutcome(
      this.sim.position,
      this.course.target,
      this.course.length,
    );
    const normalizedPosition = this.sim.position / this.course.length;
    this.services.events.emit({
      type: "landing",
      position: normalizedPosition,
      speed: this.sim.velocity,
    });
    const surfaceName = SURFACES[this.sim.surfaceId]?.name ?? this.sim.surfaceId;
    const feedback = defaultFeedbackComposer({
      quality: outcome.quality,
      predicted: this.prediction / this.course.length,
      actual: normalizedPosition,
      surfaceName,
    });
    this.feedbackText.setText(feedback.message);
    if (outcome.quality === "perfect" || outcome.quality === "success") {
      this.services.events.emit({
        type: "success",
        position: normalizedPosition,
        quality: outcome.quality,
        deliveryAccuracy: outcome.deliveryAccuracy,
      });
      this.completeLevel(outcome.quality, outcome.deliveryAccuracy);
    } else {
      this.services.events.emit({
        type: "failure",
        position: normalizedPosition,
        quality: outcome.quality,
      });
      this.showFailure(outcome.quality);
    }
  }

  private completeLevel(quality: Extract<OutcomeQuality, "perfect" | "success">, delivery: number): void {
    this.phase = "celebration";
    this.updatePhaseAttribute();
    const route = this.level.routes.find((candidate) => candidate.id === this.routeId);
    this.optionalGoalMet = this.routeId === "risky" || quality === "perfect";
    const scored = scoreResult(
      {
        levelId: this.level.id,
        predictionAccuracy: predictionAccuracy(
          this.prediction,
          this.sim.position,
          this.course.length,
        ),
        deliveryAccuracy: delivery,
        optionalGoalMet: this.optionalGoalMet,
        attempts: this.attempts,
      },
      this.level.scoreThresholds,
      route?.bonus ?? 0,
    );
    this.level.transformations.forEach((transformation) => this.world.apply(transformation));
    const completed = new Set(this.save.completedLevelIds);
    completed.add(this.level.id);
    this.save = {
      ...this.save,
      completedLevelIds: [...completed],
      restoredWorld: this.world.restored,
      personalBests: {
        ...this.save.personalBests,
        [this.level.id]: updatePersonalBest(this.save.personalBests[this.level.id], scored),
      },
    };
    this.saveService.save(this.save);
    this.feedbackText.setText(
      `${this.level.successText}\n${"★".repeat(scored.stars)}${"☆".repeat(3 - scored.stars)} · ${scored.score} points`,
    );
    if (this.ui) {
      this.ui.status.textContent = quality === "perfect" ? "Perfect delivery!" : "Lantern delivered!";
      this.ui.next.hidden = false;
      this.ui.next.textContent =
        this.levelIndex === LEVELS.length - 1 ? "See the restored festival" : "Continue";
    }
    this.audio.play(quality);
    this.celebrate(quality);
    this.redrawWorld();
  }

  private showFailure(quality: Exclude<OutcomeQuality, "perfect" | "success">): void {
    this.phase = "result";
    this.updatePhaseAttribute();
    this.audio.play("failure");
    this.failureFeel(quality);
    if (this.ui) {
      this.ui.retry.hidden = false;
      this.ui.status.textContent =
        quality === "crash" ? "The lantern cart is fine and ready for another try." : "Adjust your prediction or push.";
    }
  }

  private retry(): void {
    if (this.phase !== "result") return;
    this.attempts += 1;
    this.phase = "predict";
    this.updatePhaseAttribute();
    this.predictionPlaced = !this.level.predictionRequired;
    this.resetCart();
    this.updateMarker();
    if (this.ui) {
      this.ui.retry.hidden = true;
      this.ui.launch.hidden = false;
      this.ui.prediction.disabled = false;
      this.ui.force.disabled = false;
      this.ui.status.textContent = `Attempt ${this.attempts}: revise your prediction from what you observed.`;
    }
  }

  private advance(): void {
    if (this.phase !== "celebration") return;
    if (this.levelIndex < LEVELS.length - 1) this.startLevel(this.levelIndex + 1);
    else this.showClosing();
  }

  private showClosing(): void {
    this.phase = "complete";
    this.updatePhaseAttribute();
    this.titleText.setText("The Festival Lives Again");
    this.needText.setText("Mira, Tavi, and Niko gather beneath the restored lights.");
    this.feedbackText.setText(
      "Across the valley, another dark district flickers into view. The next delivery awaits.",
    );
    this.trackGraphics.clear();
    this.cart.setVisible(false);
    this.villager.setPosition(WIDTH / 2, TRACK_Y - 43);
    this.musicNotes.forEach((note, index) => {
      note.setAlpha(1);
      if (!this.settings.effectiveReducedMotion) {
        this.tweens.add({
          targets: note,
          y: note.y - 18,
          alpha: 0.45,
          duration: 850 + index * 100,
          yoyo: true,
          repeat: -1,
        });
      }
    });
    if (this.ui) {
      this.ui.next.hidden = true;
      this.ui.status.textContent = "All three lanterns delivered. Progress saved.";
      this.ui.route.hidden = true;
      this.ui.prediction.closest("label")?.classList.add("lr-hidden");
      this.ui.force.closest("label")?.classList.add("lr-hidden");
    }
  }

  private positionCart(): void {
    this.cart.x = this.courseToX(this.sim.position);
    const speedTilt = Phaser.Math.Clamp(this.sim.velocity / 100, -0.12, 0.12);
    this.cart.rotation = speedTilt;
  }

  private emitTravelFeedback(): void {
    const normalizedPosition = this.sim.position / this.course.length;
    this.services.events.emit({
      type: "travel",
      position: normalizedPosition,
      speed: Math.min(1, this.sim.velocity / 30),
      surfaceId: this.sim.surfaceId,
    });
    if (this.sim.surfaceId !== this.lastSurface) {
      this.lastSurface = this.sim.surfaceId;
      const sound = this.sim.surfaceId as "wood" | "grass" | "ice";
      if (sound === "wood" || sound === "grass" || sound === "ice") this.audio.play(sound);
    }
    if (!this.settings.effectiveReducedMotion && this.sim.velocity > 12 && Math.random() < 0.08) {
      const color = SURFACES[this.sim.surfaceId]?.color ?? 0xffd56a;
      const trail = this.add.circle(this.cart.x - 22, this.cart.y + 18, 5, color, 0.5);
      this.tweens.add({
        targets: trail,
        alpha: 0,
        scale: 0.2,
        duration: 320,
        onComplete: () => trail.destroy(),
      });
    }
  }

  private updateReaction(): void {
    const reaction = this.reactions.reaction;
    const targetScale = 1 + reaction.intensity * 0.08;
    this.villager.setScale(targetScale);
    if (reaction.kind === "worry") this.villager.setRotation(-0.08);
    else if (reaction.kind === "amusement") this.villager.setRotation(0.1);
    else this.villager.setRotation(0);
  }

  private previewCharge(): void {
    if (this.phase !== "predict") return;
    const squash = 1 - this.force * 0.12;
    this.cart.setScale(1 + this.force * 0.08, squash);
  }

  private launchFeel(): void {
    this.cart.setScale(1.22, 0.78);
    if (!this.settings.effectiveReducedMotion) {
      this.tweens.add({
        targets: this.cart,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: "Back.out",
      });
      for (let i = 0; i < 8; i += 1) {
        const spark = this.add.circle(this.cart.x - 20, this.cart.y + 15, 3, 0xffcf62);
        this.tweens.add({
          targets: spark,
          x: spark.x - Phaser.Math.Between(15, 48),
          y: spark.y + Phaser.Math.Between(-18, 18),
          alpha: 0,
          duration: 260,
          onComplete: () => spark.destroy(),
        });
      }
    }
  }

  private failureFeel(quality: Exclude<OutcomeQuality, "perfect" | "success">): void {
    const color = quality === "crash" ? 0xff6a6a : 0x76e6ff;
    this.cartBody.setFillStyle(color);
    if (!this.settings.effectiveReducedMotion) {
      this.cameras.main.shake(quality === "crash" ? 180 : 80, quality === "crash" ? 0.006 : 0.002);
      this.tweens.add({
        targets: this.cart,
        angle: quality === "crash" ? 16 : -7,
        yoyo: true,
        duration: 130,
      });
    }
  }

  private celebrate(quality: Extract<OutcomeQuality, "perfect" | "success">): void {
    const intensity = celebrationIntensity(quality);
    const count = Math.round(12 + intensity * 20);
    if (!this.settings.effectiveReducedMotion) {
      this.cameras.main.flash(220, 255, 211, 92, false);
      for (let i = 0; i < count; i += 1) {
        const particle = this.add.circle(
          this.cart.x,
          this.cart.y,
          Phaser.Math.Between(2, 5),
          i % 2 ? 0xffd45e : 0xff6f91,
        );
        this.tweens.add({
          targets: particle,
          x: particle.x + Phaser.Math.Between(-120, 120),
          y: particle.y + Phaser.Math.Between(-140, 30),
          alpha: 0,
          duration: Phaser.Math.Between(500, 900),
          onComplete: () => particle.destroy(),
        });
      }
    }
  }

  private togglePause(paused: boolean): void {
    if (!this.ui) return;
    const card = this.ui.root.querySelector<HTMLElement>(".pause-card");
    if (!card) return;
    card.hidden = !paused;
    this.services.overlay.root.dataset.modal = String(paused);
    if (paused) this.scene.pause();
    else this.scene.resume();
  }

  private adjustPrediction(delta: number): void {
    if (this.phase !== "predict") return;
    this.prediction = Phaser.Math.Clamp(this.prediction + delta, 5, 100);
    this.predictionPlaced = true;
    if (this.ui) this.ui.prediction.value = String(Math.round(this.prediction));
    this.services.input.emit({ action: "aim", value: this.prediction / 100, source: "keyboard" });
    this.updateMarker();
  }

  private adjustForce(delta: number): void {
    if (this.phase !== "predict") return;
    this.force = Phaser.Math.Clamp(
      this.force + delta,
      this.level.forceRange[0],
      this.level.forceRange[1],
    );
    if (this.ui) this.ui.force.value = String(Math.round(this.force * 100));
    this.services.input.emit({ action: "chargeChange", value: this.force, source: "keyboard" });
    this.previewCharge();
  }

  private courseToX(position: number): number {
    return TRACK_LEFT + (position / 100) * TRACK_WIDTH;
  }

  private persistWorld(): void {
    this.save = { ...this.save, restoredWorld: this.world.restored };
    this.saveService.save(this.save);
  }

  private updatePhaseAttribute(): void {
    document.documentElement.dataset.gamePhase = this.phase;
  }
}
