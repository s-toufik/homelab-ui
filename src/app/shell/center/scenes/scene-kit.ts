import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { SceneEvents } from './center-scene';

export const TAU = Math.PI * 2;
/* The longest step a frame may take, so a pause never makes a scene jump. */
export const MAX_DT = 0.05;
export const V = (x = 0, y = 0, z = 0): THREE.Vector3 => new THREE.Vector3(x, y, z);
export const hdr = (color: THREE.ColorRepresentation, k = 1): THREE.Color =>
  new THREE.Color(color).multiplyScalar(k);
export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
export const clamp = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, x));
export const smooth = (a: number, b: number, x: number): number => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};
export const ease = (current: number, goal: number, dt: number, rate = 5): number =>
  lerp(current, goal, 1 - Math.exp(-dt * rate));
export const inOut = (k: number): number =>
  k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
export function gauss(): number {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

let dot: THREE.Texture | null = null;
/* A soft round light, shared by every glow in every scene. */
export function softDot(): THREE.Texture {
  if (dot) return dot;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const g = canvas.getContext('2d');
  if (g) {
    const gradient = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gradient;
    g.fillRect(0, 0, 64, 64);
  }
  dot = new THREE.CanvasTexture(canvas);
  dot.colorSpace = THREE.SRGBColorSpace;
  return dot;
}

export function glowSprite(color: THREE.ColorRepresentation, k = 1.2, scale = 1): THREE.Sprite {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: softDot(),
      color: hdr(color, k),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  sprite.scale.setScalar(scale);
  return sprite;
}

export function stars(count: number, radius: number, size: number): THREE.Points {
  const position = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const tints = ['#9db4ff', '#d4ddff', '#f8f7ff', '#bfefff'].map((c) => new THREE.Color(c));
  const v = V();
  for (let i = 0; i < count; i++) {
    v.set(gauss(), gauss(), gauss()).normalize().multiplyScalar(radius);
    position.set([v.x, v.y, v.z], i * 3);
    const c = tints[(Math.random() * tints.length) | 0];
    color.set([c.r, c.g, c.b], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size,
      sizeAttenuation: false,
      vertexColors: true,
      map: softDot(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      opacity: 0.7,
    }),
  );
}

export function sphereGrid(
  r: number,
  color: THREE.ColorRepresentation,
  opacity: number,
  meridians = 12,
  parallels = 7,
): THREE.LineSegments {
  const points: number[] = [];
  const seg = 96;
  for (let m = 0; m < meridians; m++) {
    const lon = (m / meridians) * TAU;
    for (let k = 0; k < seg / 2; k++) {
      const a0 = (k / (seg / 2)) * Math.PI;
      const a1 = ((k + 1) / (seg / 2)) * Math.PI;
      points.push(
        Math.sin(a0) * Math.cos(lon) * r,
        Math.cos(a0) * r,
        Math.sin(a0) * Math.sin(lon) * r,
        Math.sin(a1) * Math.cos(lon) * r,
        Math.cos(a1) * r,
        Math.sin(a1) * Math.sin(lon) * r,
      );
    }
  }
  for (let j = 1; j < parallels; j++) {
    const lat = (j / parallels) * Math.PI;
    const y = Math.cos(lat) * r;
    const rr = Math.sin(lat) * r;
    for (let k = 0; k < seg; k++) {
      const a0 = (k / seg) * TAU;
      const a1 = ((k + 1) / seg) * TAU;
      points.push(Math.cos(a0) * rr, y, Math.sin(a0) * rr, Math.cos(a1) * rr, y, Math.sin(a1) * rr);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color: hdr(color, 1.2),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
}

/* Fades everything under a root together, from each material's own opacity. */
export function dimmer(root: THREE.Object3D): (level: number) => void {
  const items: { target: { value: number } | THREE.Material; base: number; uniform: boolean }[] =
    [];
  root.traverse((object) => {
    const materials = (object as THREE.Mesh).material;
    for (const material of ([] as THREE.Material[]).concat(materials ?? [])) {
      const uniform = (material as THREE.ShaderMaterial).uniforms?.['uOpacity'];
      if (uniform)
        items.push({
          target: uniform as { value: number },
          base: uniform.value as number,
          uniform: true,
        });
      else if (material.transparent)
        items.push({ target: material, base: material.opacity, uniform: false });
    }
  });
  return (level) => {
    for (const item of items) {
      if (item.uniform) (item.target as { value: number }).value = item.base * level;
      else (item.target as THREE.Material).opacity = item.base * level;
    }
  };
}

export function disposeScene(root: THREE.Object3D): void {
  root.traverse((object) => {
    (object as THREE.Mesh).geometry?.dispose();
    const materials = (object as THREE.Mesh).material;
    for (const material of ([] as THREE.Material[]).concat(materials ?? [])) {
      const map = (material as THREE.MeshBasicMaterial).map;
      if (map && map !== dot) map.dispose();
      material.dispose();
    }
  });
}

/* Glides an orbiting camera to a new viewpoint round a target that may move too, eased in and out. */
export class Flyer {
  private flight: {
    from: THREE.Spherical;
    to: THREE.Spherical;
    turn: number;
    t0: THREE.Vector3;
    t1: THREE.Vector3;
    k: number;
    duration: number;
  } | null = null;
  private readonly offset = V();
  private readonly now = new THREE.Spherical();

  constructor(
    private readonly camera: THREE.Camera,
    private readonly controls: OrbitControls,
    private readonly reducedMotion: boolean,
  ) {}

  to(position: THREE.Vector3, target = V(), duration = 1.4): void {
    const from = new THREE.Spherical().setFromVector3(
      this.offset.copy(this.camera.position).sub(this.controls.target),
    );
    const to = new THREE.Spherical().setFromVector3(this.offset.copy(position).sub(target));
    this.flight = {
      from,
      to,
      turn: Math.atan2(Math.sin(to.theta - from.theta), Math.cos(to.theta - from.theta)),
      t0: this.controls.target.clone(),
      t1: target.clone(),
      k: 0,
      duration: this.reducedMotion ? 0.01 : duration,
    };
  }

  update(dt: number): boolean {
    const flight = this.flight;
    if (!flight) return false;
    flight.k = Math.min(1, flight.k + dt / flight.duration);
    const e = inOut(flight.k);
    this.controls.target.lerpVectors(flight.t0, flight.t1, e);
    this.now.set(
      lerp(flight.from.radius, flight.to.radius, e),
      lerp(flight.from.phi, flight.to.phi, e),
      flight.from.theta + flight.turn * e,
    );
    this.camera.position.setFromSpherical(this.now).add(this.controls.target);
    if (flight.k >= 1) this.flight = null;
    return true;
  }

  cancel(): void {
    this.flight = null;
  }
}

/* A glass name chip that follows a point in the scene. */
export class Chip {
  readonly el: HTMLButtonElement;
  w = 0;
  h = 0;
  private shown = false;

  constructor(
    parent: HTMLElement,
    text: string,
    color: string,
    options: { count?: number; scope?: boolean },
  ) {
    this.el = document.createElement('button');
    this.el.type = 'button';
    this.el.className = `scene-chip is-off${options.scope ? ' is-scope' : ''}`;
    this.el.style.setProperty('--c', color);
    this.el.append(document.createElement('i'), text);
    if (options.count !== undefined) {
      const count = document.createElement('small');
      count.textContent = String(options.count);
      this.el.append(count);
    }
    parent.append(this.el);
  }

  measure(): void {
    if (this.w) return;
    this.w = this.el.offsetWidth;
    this.h = this.el.offsetHeight;
  }

  place(x: number, y: number, show: boolean, delay = 0): void {
    this.measure();
    if (show !== this.shown) {
      this.el.style.transitionDelay = show ? `${delay}ms` : '0ms';
      this.el.classList.toggle('is-off', !show);
      this.shown = show;
    }
    if (show) this.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  flag(name: string, on: boolean): void {
    this.el.classList.toggle(name, on);
  }
}

/* Name chips and the hairlines that tie them to their objects. */
export class LabelLayer {
  readonly el: HTMLDivElement;
  private readonly lines: HTMLCanvasElement;
  private readonly g: CanvasRenderingContext2D | null;

  constructor(host: HTMLElement) {
    this.lines = document.createElement('canvas');
    this.lines.className = 'scene-leaders';
    host.append(this.lines);
    this.g = this.lines.getContext('2d');
    this.el = document.createElement('div');
    this.el.className = 'scene-labels';
    host.append(this.el);
  }

  fit(w: number, h: number): void {
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
    this.lines.width = Math.round(w * ratio);
    this.lines.height = Math.round(h * ratio);
    this.g?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  clear(w: number, h: number): void {
    this.g?.clearRect(0, 0, w, h);
  }

  leader(x0: number, y0: number, x1: number, y1: number, color: string, alpha = 0.45): void {
    const g = this.g;
    if (!g) return;
    g.globalAlpha = alpha;
    g.strokeStyle = color;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
    g.globalAlpha = 1;
    g.fillStyle = color;
    g.beginPath();
    g.arc(x0, y0, 2, 0, TAU);
    g.fill();
  }

  chip(
    text: string,
    color: string,
    options: {
      count?: number;
      scope?: boolean;
      onClick: () => void;
      onEnter?: () => void;
      onLeave?: () => void;
    },
  ): Chip {
    const chip = new Chip(this.el, text, color, options);
    chip.el.addEventListener('click', options.onClick);
    chip.el.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') options.onEnter?.();
    });
    chip.el.addEventListener('pointerleave', () => options.onLeave?.());
    return chip;
  }

  dispose(): void {
    this.el.remove();
    this.lines.remove();
  }
}

/* Greedy placement: each label tries its spots in order and takes the first one nothing else holds. */
/* Spots for a name round the point it labels: beside, above and below it, then the same farther out. */
export function spotsAround(
  x: number,
  y: number,
  chip: Chip,
  gap = 12,
  rings = 3,
): [number, number][] {
  const spots: [number, number][] = [];
  for (let ring = 0; ring < rings; ring++) {
    const d = gap + ring * 34;
    spots.push(
      [x + d, y - chip.h / 2],
      [x - chip.w - d, y - chip.h / 2],
      [x - chip.w / 2, y - chip.h - d],
      [x - chip.w / 2, y + d],
    );
  }
  return spots;
}

/* Spreads names stacked in a column so none overlap, each run of names centred on the rows it labels.
   Rows are [wanted top, height] from top to bottom; returns each name's top. */
export function spreadRows(
  rows: readonly (readonly [number, number])[],
  gap: number,
  top: number,
  bottom: number,
): number[] {
  const offsets = rows.map(() => 0);
  const runs: { first: number; size: number; sum: number; count: number }[] = [];
  rows.forEach(([want, h], i) => {
    let run = { first: i, size: h, sum: want, count: 1 };
    let before = runs.at(-1);
    while (before && before.sum / before.count + before.size + gap > run.sum / run.count) {
      runs.pop();
      const shift = before.size + gap;
      for (let k = run.first; k <= i; k++) offsets[k] += shift;
      run = {
        first: before.first,
        size: shift + run.size,
        sum: before.sum + run.sum - run.count * shift,
        count: before.count + run.count,
      };
      before = runs.at(-1);
    }
    runs.push(run);
  });
  const tops = rows.map(() => 0);
  runs.forEach((run, r) => {
    const end = runs[r + 1]?.first ?? rows.length;
    const y = clamp(run.sum / run.count, top, Math.max(top, bottom - run.size));
    for (let k = run.first; k < end; k++) tops[k] = y + offsets[k];
  });
  for (let k = 1; k < tops.length; k++)
    tops[k] = Math.max(tops[k], tops[k - 1] + rows[k - 1][1] + gap);
  return tops;
}

export function claimSpot(
  taken: number[][],
  chip: Chip,
  spots: readonly (readonly [number, number])[],
  width: number,
  height: number,
): [number, number] | null {
  chip.measure();
  for (const [wantX, wantY] of spots) {
    // A spot a little off the screen moves inside; one far off is skipped.
    const x = clamp(wantX, 6, width - 6 - chip.w);
    const y = clamp(wantY, 6, height - 6 - chip.h);
    if (Math.abs(x - wantX) > chip.w / 2 || Math.abs(y - wantY) > chip.h) continue;
    const box = [x - 3, y - 3, x + chip.w + 3, y + chip.h + 3];
    if (taken.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]))
      continue;
    taken.push(box);
    return [x, y];
  }
  return null;
}

export interface ShellOptions {
  readonly fov: number;
  readonly background: number;
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly polar: readonly [number, number];
  readonly autoRotateSpeed: number;
  readonly bloom: {
    readonly strength: number;
    readonly radius: number;
    readonly threshold: number;
  };
}

export interface Hit {
  readonly part: string | null;
  readonly scope: string | null;
  readonly point: THREE.Vector3;
}

/* What every 3D style shares: renderer and glow, an orbiting camera with flights, picking, labels and resizing. */
export class SceneShell {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly composer: EffectComposer;
  readonly labels: LabelLayer;
  readonly fly: Flyer;
  width = 1;
  height = 1;
  idle = false;
  onResize: () => void = () => undefined;
  private readonly bloom: UnrealBloomPass;
  private readonly clock = new THREE.Clock();
  private readonly ray = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly observer: ResizeObserver | null;
  private readonly cleanups: (() => void)[] = [];
  private time = 0;

  constructor(
    readonly host: HTMLElement,
    readonly events: SceneEvents,
    readonly reducedMotion: boolean,
    options: ShellOptions,
  ) {
    this.measure();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, this.small ? 1.75 : 2));
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.append(this.renderer.domElement);
    this.scene.background = new THREE.Color(options.background);
    this.camera = new THREE.PerspectiveCamera(options.fov, this.width / this.height, 0.1, 800);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, {
      enableDamping: true,
      dampingFactor: 0.05,
      rotateSpeed: 0.6,
      zoomSpeed: 0.7,
      enablePan: false,
      minDistance: options.minDistance,
      maxDistance: options.maxDistance,
      minPolarAngle: options.polar[0],
      maxPolarAngle: options.polar[1],
      autoRotateSpeed: options.autoRotateSpeed,
    });
    this.fly = new Flyer(this.camera, this.controls, reducedMotion);
    this.composer = new EffectComposer(
      this.renderer,
      new THREE.WebGLRenderTarget(this.width, this.height, {
        type: THREE.HalfFloatType,
        samples: 4,
      }),
    );
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      options.bloom.strength,
      options.bloom.radius,
      options.bloom.threshold,
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(this.width, this.height);
    this.labels = new LabelLayer(host);
    this.labels.fit(this.width, this.height);
    this.observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.resize());
    this.observer?.observe(host);
  }

  get portrait(): boolean {
    return this.width / this.height < 0.8;
  }

  get small(): boolean {
    return Math.min(this.width, this.height) < 700;
  }

  /* Hover for mice; a click is a press that did not drag. Any press, drag or wheel counts as the viewer at work. */
  pointer(handlers: {
    hover(x: number | null, y: number | null): void;
    click(x: number, y: number): void;
  }): void {
    const canvas = this.renderer.domElement;
    let down: [number, number] | null = null;
    const local = (event: PointerEvent): [number, number] => {
      const box = canvas.getBoundingClientRect();
      return [event.clientX - box.left, event.clientY - box.top];
    };
    const touched = () => {
      this.fly.cancel();
      this.events.interact();
    };
    const onDown = (event: PointerEvent) => {
      down = [event.clientX, event.clientY];
      touched();
    };
    const onMove = (event: PointerEvent) => {
      if (event.buttons) {
        touched();
        return;
      }
      if (event.pointerType === 'mouse') handlers.hover(...local(event));
    };
    const onUp = (event: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(event.clientX - down[0], event.clientY - down[1]);
      down = null;
      if (moved < 6) handlers.click(...local(event));
    };
    const onLeave = () => handlers.hover(null, null);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('wheel', touched, { passive: true });
    this.cleanups.push(() => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('wheel', touched);
    });
  }

  /* The nearest object under a point that stands for a part or a scope. */
  cast(x: number, y: number, objects: THREE.Object3D[]): Hit | null {
    this.ndc.set((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    for (const hit of this.ray.intersectObjects(objects, true)) {
      let object: THREE.Object3D | null = hit.object;
      while (object && !object.userData['part'] && !object.userData['scope'])
        object = object.parent;
      if (object) {
        return {
          part: (object.userData['part'] as string | undefined) ?? null,
          scope: (object.userData['scope'] as string | undefined) ?? null,
          point: hit.point,
        };
      }
    }
    return null;
  }

  ray3(x: number, y: number): THREE.Raycaster {
    this.ndc.set((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    return this.ray;
  }

  screenOf(world: THREE.Vector3): [number, number] | null {
    const p = world.clone().project(this.camera);
    if (p.z > 1 || p.z < -1) return null;
    return [((p.x + 1) / 2) * this.width, ((1 - p.y) / 2) * this.height];
  }

  /* Moves the camera toward the point it looks at, within the scene's distances. */
  zoom(factor: number): void {
    const { camera, controls } = this;
    const offset = V().subVectors(camera.position, controls.target);
    offset.setLength(clamp(offset.length() / factor, controls.minDistance, controls.maxDistance));
    this.fly.to(controls.target.clone().add(offset), controls.target.clone(), 0.5);
  }

  /* Turns the camera round the point it looks at, as dragging left and up would. */
  turn(left: number, up: number): void {
    const { camera, controls } = this;
    const view = new THREE.Spherical().setFromVector3(
      V().subVectors(camera.position, controls.target),
    );
    view.theta += left;
    view.phi = clamp(
      view.phi + up,
      Math.max(0.05, controls.minPolarAngle),
      Math.min(Math.PI - 0.05, controls.maxPolarAngle),
    );
    this.fly.to(
      controls.target.clone().add(V().setFromSpherical(view)),
      controls.target.clone(),
      0.35,
    );
  }

  /* Runs the frame loop: camera flights, the idle spin, the scene's own frame, then the render. */
  start(frame: (dt: number, t: number) => void): void {
    this.renderer.setAnimationLoop(() => {
      const dt = Math.min(this.clock.getDelta(), MAX_DT);
      this.time += dt;
      const flying = this.fly.update(dt);
      this.controls.autoRotate = !flying && this.idle && !this.reducedMotion;
      this.controls.update();
      frame(dt, this.time);
      this.composer.render(dt);
    });
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.observer?.disconnect();
    for (const cleanup of this.cleanups) cleanup();
    this.controls.dispose();
    disposeScene(this.scene);
    this.scene.environment?.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labels.dispose();
  }

  private measure(): void {
    const box = this.host.getBoundingClientRect();
    this.width = Math.max(1, Math.round(box.width));
    this.height = Math.max(1, Math.round(box.height));
  }

  private resize(): void {
    this.measure();
    this.renderer.setSize(this.width, this.height, false);
    this.composer.setSize(this.width, this.height);
    this.bloom.resolution.set(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.labels.fit(this.width, this.height);
    this.onResize();
    this.camera.updateProjectionMatrix();
  }
}
