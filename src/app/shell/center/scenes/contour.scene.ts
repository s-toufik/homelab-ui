import * as THREE from 'three';
import type { CenterScene, MountScene, SceneTarget } from './center-scene';
import {
  SceneShell,
  TAU,
  V,
  claimSpot,
  dimmer,
  spotsAround,
  ease,
  glowSprite,
  hdr,
  lerp,
} from './scene-kit';

const PEAKS = 8;
/* Where each scope's mountain stands, and how wide it is; scopes the map does not know go round the edge. */
const PLACES: Readonly<Record<string, readonly [number, number, number]>> = {
  assistant: [0, -5.6, 4.2],
  operate: [6.6, -2.4, 3.6],
  observe: [-6.6, -2.0, 3.6],
  home: [-4.4, 5.0, 3.2],
  automate: [0.8, 1.6, 2.2],
  life: [5.2, 5.6, 2.4],
};

export const mountContour: MountScene = (host, allScopes, events, options): CenterScene => {
  const scopes = allScopes.slice(0, PEAKS);
  const shell = new SceneShell(host, events, options.reducedMotion, {
    fov: 34,
    background: 0x020405,
    minDistance: 8,
    maxDistance: 60,
    polar: [0.2, 1.22],
    autoRotateSpeed: 0.22,
    bloom: { strength: 0.6, radius: 0.5, threshold: 0.42 },
  });
  const { scene, camera, controls, fly, labels } = shell;
  const far = () => (shell.portrait ? V(0, 30, 32) : V(0, 17, 23));
  const home = V(0, 0.6, 0);
  const place = () => {
    camera.fov = shell.portrait ? 48 : 34;
  };
  place();
  shell.onResize = place;
  camera.position.copy(far());
  controls.target.copy(home);
  const time = { value: 0 };

  // Heights: a Gaussian mountain per scope, as tall as its pages, over gentle ground; the same function runs in the shader and here.
  const peaks = scopes.map((scope, i) => {
    const angle = (i / Math.max(scopes.length, 1)) * TAU;
    const [x, z, r] = PLACES[scope.id] ?? [Math.cos(angle) * 9, Math.sin(angle) * 7, 2.4];
    return { scope, x, z, r, height: 1.3 + scope.parts.length * 0.36, boost: 1, tint: 0.35 };
  });
  const ground = (x: number, z: number) =>
    0.35 * Math.sin(x * 0.35 + 1.3) * Math.cos(z * 0.3 - 0.7) + 0.16 * Math.sin(x * 0.9 + z * 0.6);
  const heightAt = (x: number, z: number) =>
    peaks.reduce(
      (h, pk) =>
        h + pk.height * pk.boost * Math.exp(-((x - pk.x) ** 2 + (z - pk.z) ** 2) / (pk.r * pk.r)),
      ground(x, z),
    );
  const peakData = {
    value: Array.from(
      { length: PEAKS },
      (_, i) =>
        new THREE.Vector4(
          peaks[i]?.x ?? 999,
          peaks[i]?.z ?? 999,
          peaks[i]?.height ?? 0,
          peaks[i]?.r ?? 1,
        ),
    ),
  };
  const boosts = { value: new Float32Array(PEAKS).fill(1) };
  const tints = { value: new Float32Array(PEAKS) };
  const colors = {
    value: Array.from({ length: PEAKS }, (_, i) => new THREE.Color(scopes[i]?.color ?? '#000000')),
  };
  const terrain = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 44, shell.small ? 220 : 320, shell.small ? 220 : 320),
    new THREE.ShaderMaterial({
      uniforms: { uPeaks: peakData, uBoost: boosts, uTint: tints, uColors: colors, uTime: time },
      vertexShader: `uniform vec4 uPeaks[${PEAKS}]; uniform float uBoost[${PEAKS}]; varying float vH; varying vec3 vW;
        float heightAt(vec2 p) {
          float h = 0.35 * sin(p.x * 0.35 + 1.3) * cos(p.y * 0.3 - 0.7) + 0.16 * sin(p.x * 0.9 + p.y * 0.6);
          for (int i = 0; i < ${PEAKS}; i++) { vec2 d = p - uPeaks[i].xy; h += uPeaks[i].z * uBoost[i] * exp(-dot(d, d) / (uPeaks[i].w * uPeaks[i].w)); }
          return h;
        }
        void main() {
          vec3 p = position;
          p.z = heightAt(vec2(p.x, -p.y));
          vH = p.z;
          vec4 w = modelMatrix * vec4(p, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: `uniform vec4 uPeaks[${PEAKS}]; uniform float uTint[${PEAKS}]; uniform vec3 uColors[${PEAKS}]; uniform float uTime; varying float vH; varying vec3 vW;
        float band(float v, float width) { float d = abs(fract(v - 0.5) - 0.5) / max(fwidth(v), 1e-4); return 1.0 - smoothstep(width - 0.75, width + 0.75, d); }
        void main() {
          float minor = band(vH * 3.2, 0.7), major = band(vH * 0.64, 1.7);
          vec3 cyan = vec3(0.04, 0.85, 0.78), pale = vec3(0.32, 0.6, 0.66);
          float weight = 0.0; vec3 tint = vec3(0.0);
          for (int i = 0; i < ${PEAKS}; i++) { vec2 d = vW.xz - uPeaks[i].xy; float w = exp(-dot(d, d) / (uPeaks[i].w * uPeaks[i].w * 1.3)) * uTint[i]; weight += w; tint += uColors[i] * w; }
          vec3 tinted = tint / max(weight, 1e-4);
          float k = clamp(weight, 0.0, 1.0);
          float sweepDist = (vW.x + vW.z * 0.4) - (mod(uTime * 2.2, 70.0) - 35.0);
          float sweep = exp(-sweepDist * sweepDist * 0.05);
          vec2 cell = abs(fract(vW.xz / 1.6 + 0.5) - 0.5) * 1.6;
          float grid = (1.0 - smoothstep(0.025, 0.05, length(cell))) * 0.5;
          vec3 color = vec3(0.004, 0.009, 0.012) + mix(pale, tinted, k * 0.6) * minor * 0.24 * (1.0 + sweep) + mix(cyan, tinted, k * 0.9) * major * (0.85 + sweep * 0.7) + pale * grid;
          float edge = 1.0 - smoothstep(12.0, 20.0, length(vW.xz));
          gl_FragColor = vec4(mix(vec3(0.0006, 0.0012, 0.0015), color, edge), 1.0);
        }`,
    }),
  );
  terrain.rotation.x = -Math.PI / 2;
  scene.add(terrain);

  // Survey markers: one per page, on the slopes of its scope's mountain; summit rings that also take clicks for their scope.
  const hits: THREE.Object3D[] = [];
  const stemGeometry = new THREE.CylinderGeometry(0.008, 0.008, 1, 6).translate(0, 0.5, 0);
  const headGeometry = new THREE.OctahedronGeometry(0.075);
  const markers = peaks.flatMap((pk, i) =>
    pk.scope.parts.map((part, k) => {
      const n = pk.scope.parts.length;
      const a = (k / n) * TAU + i * 0.7;
      const ring = n === 1 ? 0.15 : pk.r * (0.42 + (k % 2) * 0.12);
      const x = pk.x + Math.cos(a) * ring;
      const z = pk.z + Math.sin(a) * ring;
      const g = new THREE.Group();
      const stem = new THREE.Mesh(
        stemGeometry,
        new THREE.MeshBasicMaterial({
          color: hdr(part.color, 1.1),
          transparent: true,
          opacity: 0.8,
        }),
      );
      stem.scale.y = 0.75;
      const head = new THREE.Mesh(
        headGeometry,
        new THREE.MeshBasicMaterial({ color: hdr(part.color, 1.8), transparent: true }),
      );
      head.position.y = 0.8;
      const glow = glowSprite(part.color, 1.1, 0.5);
      glow.position.y = 0.8;
      g.add(
        stem,
        head,
        glow,
        new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 8, 6).translate(0, 0.6, 0),
          new THREE.MeshBasicMaterial({ visible: false }),
        ),
      );
      g.userData['part'] = part.id;
      scene.add(g);
      hits.push(g);
      const chip = labels.chip(part.label, part.color, {
        onClick: () => events.pick(part.id),
        onEnter: () => hoverPart(part.id),
        onLeave: () => hoverPart(null),
      });
      return {
        g,
        id: part.id,
        color: part.color,
        scope: pk.scope.id,
        k,
        x,
        z,
        head,
        glow,
        fade: dimmer(g),
        level: 1,
        chip,
      };
    }),
  );
  const summits = peaks.map((pk) => {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.19, 48),
      new THREE.MeshBasicMaterial({
        color: hdr(pk.scope.color, 1.4),
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    g.add(
      ring,
      new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 6),
        new THREE.MeshBasicMaterial({ visible: false }),
      ),
    );
    g.userData['scope'] = pk.scope.id;
    scene.add(g);
    hits.push(g);
    const chip = labels.chip(pk.scope.name, pk.scope.color, {
      count: pk.scope.parts.length,
      scope: true,
      onClick: () => events.focus(pk.scope.id),
    });
    return { g, peak: pk, ring, chip };
  });

  let target: SceneTarget = { scope: null, part: null };
  let hovered: string | null = null;
  let hoverPeak: string | null = null;
  const hoverPart = (id: string | null) => {
    hovered = id;
    events.hover(id);
  };
  const leadId = (): string | null =>
    markers.find((m) => m.id === target.part)?.scope ?? target.scope;
  let shown: string | null = null;
  const bring = () => {
    const id = leadId();
    if (id === shown) return;
    shown = id;
    const pk = peaks.find((p) => p.scope.id === id);
    if (!pk) {
      fly.to(far(), home, 1.6);
      return;
    }
    const aim = V(pk.x, pk.height * 1.45 * 0.72, pk.z);
    fly.to(aim.clone().add(shell.portrait ? V(0, 12, 16) : V(1.5, 6.5, 11.5)), aim, 1.6);
  };

  shell.pointer({
    hover(x, y) {
      const hit = x === null || y === null ? null : shell.cast(x, y, hits);
      if ((hit?.part ?? null) !== hovered) hoverPart(hit?.part ?? null);
      hoverPeak = hit?.scope ?? null;
      shell.renderer.domElement.style.cursor = hit ? 'pointer' : '';
    },
    click(x, y) {
      const hit = shell.cast(x, y, hits);
      if (hit?.part) events.pick(hit.part);
      else if (hit?.scope) events.focus(hit.scope);
      else events.pick(null);
    },
  });

  const spot = V();
  shell.start((dt, t) => {
    time.value = t;
    const lead = leadId();
    peaks.forEach((pk, i) => {
      const isOut = pk.scope.id === lead;
      pk.boost = ease(pk.boost, isOut ? 1.45 : lead ? 0.85 : 1, dt, 2.6);
      pk.tint = ease(pk.tint, isOut ? 1 : lead ? 0.08 : 0.35, dt, 3);
      boosts.value[i] = pk.boost;
      tints.value[i] = pk.tint;
      summits[i].g.position.set(pk.x, heightAt(pk.x, pk.z) + 0.03, pk.z);
      summits[i].ring.scale.setScalar(1 + 0.15 * Math.sin(t * 2 + i));
    });
    for (const m of markers) {
      m.g.position.set(m.x, heightAt(m.x, m.z), m.z);
      const goal = lead && m.scope !== lead ? 0.15 : 1;
      if (Math.abs(m.level - goal) > 0.002) {
        m.level = ease(m.level, goal, dt, 4);
        m.fade(m.level);
      }
      const hot =
        m.id === target.part
          ? 1
          : m.id === hovered
            ? 0.6
            : events.isWaiting(m.id)
              ? 0.3 + 0.3 * Math.sin(t * 3)
              : 0;
      m.head.scale.setScalar(lerp(m.head.scale.x, 1 + hot * 0.8, 0.2));
      m.glow.scale.setScalar(0.5 + hot * 0.6);
    }

    const { width, height } = shell;
    labels.clear(width, height);
    const taken: number[][] = [];
    const nameSummit = (summit: (typeof summits)[number]) => {
      const pk = summit.peak;
      const chip = summit.chip;
      const screen = shell.screenOf(spot.set(pk.x, heightAt(pk.x, pk.z) + 0.45, pk.z));
      const where = screen
        ? claimSpot(
            taken,
            chip,
            [
              [screen[0] - chip.w / 2, screen[1] - chip.h - 4],
              [screen[0] + 10, screen[1] - chip.h / 2],
              [screen[0] - chip.w - 10, screen[1] - chip.h / 2],
              ...spotsAround(screen[0], screen[1], chip, 26, 2),
            ],
            width,
            height,
          )
        : null;
      chip.place(where?.[0] ?? 0, where?.[1] ?? 0, !!where);
      chip.flag('is-dim', !!lead && pk.scope.id !== lead);
      chip.flag('is-on', pk.scope.id === hoverPeak);
    };
    // The scope in front and its pages claim room first; the other scopes take what is left.
    for (const summit of summits) if (!lead || summit.peak.scope.id === lead) nameSummit(summit);
    for (const m of markers) {
      if (m.scope !== lead) {
        m.chip.place(0, 0, false);
        continue;
      }
      const at = shell.screenOf(m.g.localToWorld(spot.set(0, 0.8, 0)));
      const where = at
        ? claimSpot(taken, m.chip, spotsAround(at[0], at[1], m.chip), width, height)
        : null;
      m.chip.place(where?.[0] ?? 0, where?.[1] ?? 0, !!where, m.k * 50);
      m.chip.flag('is-on', m.id === target.part || m.id === hovered);
      if (where && at)
        labels.leader(
          at[0],
          at[1],
          where[0] < at[0] ? where[0] + m.chip.w : where[0],
          where[1] + m.chip.h / 2,
          m.color,
          0.4,
        );
    }
    if (lead) for (const summit of summits) if (summit.peak.scope.id !== lead) nameSummit(summit);
  });

  return {
    show(next) {
      target = next;
      bring();
    },
    idle(on) {
      shell.idle = on;
    },
    zoom(factor) {
      shell.zoom(factor);
    },
    turn(left, up) {
      shell.turn(left, up);
    },
    reset() {
      shown = '';
      target = { scope: null, part: null };
      bring();
    },
    dispose() {
      shell.dispose();
    },
  };
};
