import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CenterScene, MountScene, SceneTarget } from './center-scene';
import {
  SceneShell,
  TAU,
  V,
  clamp,
  claimSpot,
  spotsAround,
  disposeScene,
  ease,
  gauss,
  glowSprite,
  hdr,
  inOut,
  softDot,
  stars,
  type Chip,
} from './scene-kit';

const FIELDS = 8;
const SPIKES = 16;

/* The liquid's surface: slow waves everywhere; where a scope's field is on, a bed of cone spikes (one per cell of a
   Worley pattern) plus one tall spike per page. Normals come from the displaced surface itself. */
const FLUID_VERTEX = `
uniform float uTime; uniform float uR; uniform vec4 uScopes[${FIELDS}]; uniform vec4 uParts[${SPIKES}]; uniform float uTremble;
varying vec3 vDir;
vec3 fluidHash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float fluidCells(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float d = 8.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 r = g + fluidHash(i + g) * 0.8 + 0.1 - f;
    d = min(d, dot(r, r));
  }
  return sqrt(d);
}
float fluidHeight(vec3 n) {
  float h = 0.028 * sin(n.x * 5.0 + uTime * 0.6) * sin(n.y * 4.0 - uTime * 0.45) * sin(n.z * 6.0 + uTime * 0.5);
  float field = 0.0;
  for (int s = 0; s < ${FIELDS}; s++) field += max(uScopes[s].w, 0.0) * smoothstep(0.78, 0.95, dot(n, uScopes[s].xyz));
  if (field > 0.002) {
    float cone = 1.0 - clamp(fluidCells(n * 15.0) / 0.62, 0.0, 1.0);
    h += pow(cone, 2.3) * 0.6 * field * uTremble + field * 0.1;
  }
  for (int k = 0; k < ${SPIKES}; k++) {
    if (uParts[k].w <= 0.0) continue;
    float c = dot(n, uParts[k].xyz);
    if (c < 0.996) continue;
    float cone = 1.0 - clamp(acos(min(c, 1.0)) / 0.08, 0.0, 1.0);
    h += pow(cone, 1.7) * uParts[k].w;
  }
  return h;
}
vec3 fluidPoint(vec3 n) { return n * (uR + fluidHeight(n)); }
`;

/* A dark studio for reflections: a black room lit only by thin light strips, so the mirror-black liquid shows crisp lines. */
function stripStudio(renderer: THREE.WebGLRenderer): THREE.Texture {
  const room = new THREE.Scene();
  room.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(24, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x010204, side: THREE.BackSide }),
    ),
  );
  const strips: [number, number, number, number, [number, number, number], number][] = [
    [0xffffff, 4.5, 16, 0.45, [0, 9, 3], 0],
    [0xffffff, 2.2, 0.3, 14, [-9, 1, 4], 0],
    [0xffffff, 1.7, 0.25, 14, [9, 0, 2], 0],
    [0x4fd8ff, 2.4, 16, 0.18, [-7, -2, -8], 0.4],
    [0xa47bff, 2, 16, 0.18, [8, 3, -7], -0.5],
    [0xffffff, 2.5, 6, 0.25, [2, -8, 5], 0.2],
  ];
  for (const [color, k, w, h, at, roll] of strips) {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(k),
        side: THREE.DoubleSide,
      }),
    );
    strip.position.set(...at);
    strip.lookAt(0, 0, 0);
    strip.rotateZ(roll);
    room.add(strip);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(room, 0.015).texture;
  pmrem.dispose();
  disposeScene(room);
  return texture;
}

/* Where each scope's field sits: the faces of a turned cube while there are six or fewer, spread evenly beyond. */
function fieldDirections(n: number): THREE.Vector3[] {
  if (n <= 6) {
    const turn = new THREE.Euler(0.55, 0.35, 0.15);
    return [V(0, 0, 1), V(1, 0, 0), V(0, 1, 0), V(-1, 0, 0), V(0, -1, 0), V(0, 0, -1)]
      .slice(0, n)
      .map((d) => d.applyEuler(turn).normalize());
  }
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    return V(Math.cos(i * 2.399963) * r, y, Math.sin(i * 2.399963) * r);
  });
}

function across(d: THREE.Vector3): [THREE.Vector3, THREE.Vector3] {
  const t1 = V(0, 1, 0).cross(d);
  if (t1.lengthSq() < 0.01) t1.set(1, 0, 0).cross(d);
  t1.normalize();
  return [t1, d.clone().cross(t1).normalize()];
}

function toward(d: THREE.Vector3, rho: number, az: number): THREE.Vector3 {
  const [t1, t2] = across(d);
  return d
    .clone()
    .multiplyScalar(Math.cos(rho))
    .add(t1.multiplyScalar(Math.cos(az) * Math.sin(rho)))
    .add(t2.multiplyScalar(Math.sin(az) * Math.sin(rho)))
    .normalize();
}

export const mountFerrofluid: MountScene = (host, allScopes, events, options): CenterScene => {
  const scopes = allScopes.slice(0, FIELDS);
  const shell = new SceneShell(host, events, options.reducedMotion, {
    fov: 36,
    background: 0x020306,
    minDistance: 6.5,
    maxDistance: 30,
    polar: [0.25, 2.9],
    autoRotateSpeed: 0.32,
    bloom: { strength: 0.7, radius: 0.55, threshold: 0.6 },
  });
  const { scene, camera, controls, fly, labels } = shell;
  scene.environment = stripStudio(shell.renderer);
  const R = 3;
  const far = () => (shell.portrait ? 17.5 : 12.5);
  const place = () => {
    camera.fov = shell.portrait ? 50 : 36;
  };
  place();
  shell.onResize = place;
  camera.position.set(0, 2.4, far());
  const time = { value: 0 };
  const fluid = new THREE.Group();
  scene.add(fluid);
  const dirs = fieldDirections(scopes.length);

  const uniforms = {
    uTime: time,
    uR: { value: R },
    uTremble: { value: 1 },
    uScopes: {
      value: Array.from(
        { length: FIELDS },
        (_, i) => new THREE.Vector4(...(dirs[i] ?? V(0, 1, 0)).toArray(), 0),
      ),
    },
    uParts: { value: Array.from({ length: SPIKES }, () => new THREE.Vector4(0, 1, 0, 0)) },
    uScopeColors: {
      value: Array.from(
        { length: FIELDS },
        (_, i) => new THREE.Color(scopes[i]?.color ?? '#000000'),
      ),
    },
    uWave: { value: new Float32Array(FIELDS).fill(-1) },
    uHover: { value: new Float32Array(FIELDS) },
  };
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x030304,
    metalness: 1,
    roughness: 0.11,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.1,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${FLUID_VERTEX}`)
      .replace(
        '#include <beginnormal_vertex>',
        `vec3 fluidDir = normalize(position);
        vec3 fluidT = normalize(cross(fluidDir, abs(fluidDir.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
        vec3 fluidB = cross(fluidDir, fluidT);
        vec3 fluidP = fluidPoint(fluidDir);
        vec3 objectNormal = normalize(cross(fluidPoint(normalize(fluidDir + fluidT * 0.0035)) - fluidP, fluidPoint(normalize(fluidDir + fluidB * 0.0035)) - fluidP));
        vDir = fluidDir;`,
      )
      .replace('#include <begin_vertex>', 'vec3 transformed = fluidP;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform vec4 uScopes[${FIELDS}]; uniform vec3 uScopeColors[${FIELDS}]; uniform float uWave[${FIELDS}]; uniform float uHover[${FIELDS}]; varying vec3 vDir;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        vec3 fluidDir = normalize(vDir);
        for (int s = 0; s < ${FIELDS}; s++) {
          float c = dot(fluidDir, uScopes[s].xyz);
          float e = (c - 0.8) * 70.0;
          float w = (acos(clamp(c, -1.0, 1.0)) - uWave[s] * 2.4) * 14.0;
          float wave = uWave[s] >= 0.0 ? exp(-w * w) * (1.0 - clamp(uWave[s], 0.0, 1.0)) : 0.0;
          float on = max(uScopes[s].w, 0.0);
          totalEmissiveRadiance += uScopeColors[s] * (exp(-e * e) * (0.1 + uHover[s] * 0.45 + on * 0.4) + wave * 1.4 + smoothstep(0.86, 1.0, c) * (uHover[s] * 0.1 + on * 0.06));
        }`,
      );
  };
  material.customProgramCacheKey = () => 'center-ferrofluid';
  const raw = new THREE.IcosahedronGeometry(R, shell.small ? 60 : 96);
  raw.deleteAttribute('normal');
  raw.deleteAttribute('uv');
  const geometry = mergeVertices(raw);
  raw.dispose();
  geometry.computeVertexNormals();
  const liquid = new THREE.Mesh(geometry, material);
  liquid.frustumCulled = false;
  fluid.add(liquid);
  const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(R + 0.05, 48, 32),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  fluid.add(hitSphere);

  // The instrument round it: a glowing rim, a geodesic wire shell, orbit rings, an axis and drifting debris.
  const rim = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0x3fb6ff) } },
    vertexShader:
      'varying vec3 vN; varying vec3 vV; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader:
      'uniform vec3 uColor; varying vec3 vN; varying vec3 vV; void main() { float f = pow(max(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0), 5.0); gl_FragColor = vec4(uColor, f * 0.9); }',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 96, 64), rim));
  const frame = new THREE.Group();
  scene.add(frame);
  const line = (opacity: number) =>
    new THREE.LineBasicMaterial({
      color: hdr(0x5fc8ff, 1),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  frame.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(5.6, 3), 1),
      line(0.1),
    ),
  );
  for (const [radius, tilt, roll, opacity] of [
    [6.3, 0.16, 0.05, 0.28],
    [6.0, -0.95, 0.4, 0.18],
  ]) {
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 257 }, (_, k) =>
          V(Math.cos((k / 256) * TAU) * radius, 0, Math.sin((k / 256) * TAU) * radius),
        ),
      ),
      line(opacity),
    );
    ring.rotation.set(tilt, 0, roll);
    frame.add(ring);
  }
  frame.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([V(0, -6.4, 0), V(0, 6.4, 0)]),
      line(0.16),
    ),
  );
  const debrisCount = shell.small ? 150 : 260;
  const debris = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshBasicMaterial({
      color: hdr(0x6fd0ff, 1),
      wireframe: true,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
    debrisCount,
  );
  debris.frustumCulled = false;
  scene.add(debris);
  const rocks = Array.from({ length: debrisCount }, () => ({
    r: R + 1 + Math.random() * 2.5,
    theta: Math.random() * TAU,
    phi: Math.acos(2 * Math.random() - 1),
    speed: (0.03 + Math.random() * 0.07) * (Math.random() < 0.5 ? 1 : -1),
    size: 0.02 + Math.pow(Math.random(), 3) * 0.075,
    spin: V(Math.random(), Math.random(), Math.random()),
  }));
  const dust = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) {
    const d = V(gauss(), gauss(), gauss())
      .normalize()
      .multiplyScalar(R + 0.8 + Math.random() * 2.9);
    dust.set([d.x, d.y, d.z], i * 3);
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  frame.add(
    new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        size: 0.035,
        map: softDot(),
        color: hdr(0x7fd8ff, 1.2),
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );
  scene.add(stars(1000, 300, 1.2));
  const fieldLight = new THREE.PointLight(0xffffff, 0, 12, 1.6);
  scene.add(fieldLight);

  // Field lines that arc out of an active field, drawn on as the spikes rise.
  const fieldLines = scopes.map((scope, i) => {
    const lineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(scope.color) },
        uDraw: { value: 0 },
        uTime: time,
      },
      vertexShader:
        'attribute float aT; varying float vT; void main() { vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:
        'uniform vec3 uColor; uniform float uDraw; uniform float uTime; varying float vT; void main() { if (vT > uDraw) discard; float d = fract(vT * 3.0 - uTime * 0.7); float pulse = smoothstep(0.0, 0.08, d) * (1.0 - smoothstep(0.08, 0.45, d)); gl_FragColor = vec4(uColor * (0.8 + pulse * 2.2), (0.18 + pulse * 0.6) * min(uDraw * 1.6, 1.0)); }',
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    for (let j = 0; j < 12; j++) {
      const az = (j / 12) * TAU + i;
      const p0 = toward(dirs[i], 0.1, az).multiplyScalar(R + 0.25);
      const p2 = toward(dirs[i], 1.05, az).multiplyScalar(R + 0.05);
      const mid = p0
        .clone()
        .add(p2)
        .normalize()
        .multiplyScalar(R + 1.5 + (j % 3) * 0.45);
      const points = new THREE.QuadraticBezierCurve3(p0, mid, p2).getPoints(64);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      lineGeometry.setAttribute(
        'aT',
        new THREE.Float32BufferAttribute(
          points.map((_, k) => k / 64),
          1,
        ),
      );
      fluid.add(new THREE.Line(lineGeometry, lineMaterial));
    }
    return lineMaterial;
  });

  // Sparks thrown off when a field switches on.
  const sparkCount = 360;
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkVelocity = new Float32Array(sparkCount * 3);
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  const sparkMaterial = new THREE.PointsMaterial({
    size: 0.06,
    map: softDot(),
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
  sparks.frustumCulled = false;
  fluid.add(sparks);
  let sparkAge = 9;
  const burst = (i: number) => {
    for (let k = 0; k < sparkCount; k++) {
      const d = toward(dirs[i], Math.random() * 0.5, Math.random() * TAU);
      sparkPositions.set([d.x * (R + 0.05), d.y * (R + 0.05), d.z * (R + 0.05)], k * 3);
      const speed = 0.8 + Math.random() * 2.6;
      sparkVelocity.set(
        [d.x * speed + gauss() * 0.3, d.y * speed + gauss() * 0.3, d.z * speed + gauss() * 0.3],
        k * 3,
      );
    }
    sparkMaterial.color.set(scopes[i].color).multiplyScalar(1.6);
    sparkAge = 0;
  };

  // Each page rises out of its field on a tall spike, a bead of light at the tip.
  const parts = scopes.flatMap((scope, i) =>
    scope.parts.map((part, k) => {
      const n = scope.parts.length;
      const dir = toward(
        dirs[i],
        n === 1 ? 0 : 0.12 + 0.3 * Math.sqrt((k + 0.5) / n),
        k * 2.39996 + i,
      );
      const bead = new THREE.Group();
      bead.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 16, 12),
          new THREE.MeshBasicMaterial({ color: hdr(part.color, 2) }),
        ),
        glowSprite(part.color, 1.1, 0.3),
        new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 8, 6),
          new THREE.MeshBasicMaterial({ visible: false }),
        ),
      );
      bead.userData['part'] = part.id;
      bead.visible = false;
      fluid.add(bead);
      const chip = labels.chip(part.label, part.color, {
        onClick: () => events.pick(part.id),
        onEnter: () => hoverPart(part.id),
        onLeave: () => hoverPart(null),
      });
      return { id: part.id, scope: i, k, dir, bead, chip, h: 0, v: 0 };
    }),
  );
  const scopeChips: Chip[] = scopes.map((scope) =>
    labels.chip(scope.name, scope.color, {
      count: scope.parts.length,
      scope: true,
      onClick: () => events.focus(scope.id),
    }),
  );

  const fields = scopes.map(() => ({ a: 0, v: 0, hover: 0, since: -1, at: -9 }));
  const turning = { from: new THREE.Quaternion(), to: new THREE.Quaternion(), k: 1 };
  let target: SceneTarget = { scope: null, part: null };
  let shown: string | null = null;
  let hovered: string | null = null;
  let hoverField = -1;
  let t = 0;
  const hoverPart = (id: string | null) => {
    hovered = id;
    events.hover(id);
  };
  /* The field to switch on: the picked page's, else the scope on show. */
  const leadIndex = () => {
    const picked = parts.find((p) => p.id === target.part);
    return picked ? picked.scope : scopes.findIndex((s) => s.id === target.scope);
  };
  const bring = () => {
    const i = leadIndex();
    const id = i >= 0 ? scopes[i].id : null;
    if (id === shown) return;
    shown = id;
    const towardViewer = V().subVectors(camera.position, controls.target).normalize();
    if (i < 0) {
      fly.to(towardViewer.multiplyScalar(far()), V(), 1.6);
      return;
    }
    fields[i].since = 0;
    fields[i].at = t;
    burst(i);
    const up = V(0, 1, 0).sub(towardViewer.clone().multiplyScalar(towardViewer.y)).normalize();
    const present = towardViewer
      .clone()
      .multiplyScalar(Math.cos(0.68))
      .add(up.multiplyScalar(Math.sin(0.68)))
      .normalize();
    turning.from.copy(fluid.quaternion);
    turning.to
      .setFromUnitVectors(dirs[i].clone().applyQuaternion(fluid.quaternion), present)
      .multiply(fluid.quaternion);
    turning.k = options.reducedMotion ? 1 : 0;
    if (options.reducedMotion) fluid.quaternion.copy(turning.to);
    const aim = present.clone().multiplyScalar(R + 0.45);
    fly.to(aim.clone().add(towardViewer.multiplyScalar(shell.portrait ? 12.5 : 8.6)), aim, 1.5);
  };

  const regionAt = (x: number, y: number): number => {
    const hit = shell.ray3(x, y).intersectObject(hitSphere)[0];
    if (!hit) return -1;
    const d = fluid.worldToLocal(hit.point.clone()).normalize();
    let best = -1;
    let bestDot = 0.7;
    dirs.forEach((dir, i) => {
      const c = d.dot(dir);
      if (c > bestDot) {
        bestDot = c;
        best = i;
      }
    });
    return best;
  };
  const shownBeads = () => parts.filter((p) => p.bead.visible).map((p) => p.bead);
  shell.pointer({
    hover(x, y) {
      if (x === null || y === null) {
        hoverPart(null);
        hoverField = -1;
        return;
      }
      const bead = shell.cast(x, y, shownBeads());
      if (bead?.part !== hovered) hoverPart(bead?.part ?? null);
      hoverField = bead ? -1 : regionAt(x, y);
      shell.renderer.domElement.style.cursor = bead || hoverField >= 0 ? 'pointer' : '';
    },
    click(x, y) {
      const bead = shell.cast(x, y, shownBeads());
      if (bead?.part) {
        events.pick(bead.part);
        return;
      }
      const region = regionAt(x, y);
      if (region >= 0) events.focus(scopes[region].id);
      else events.pick(null);
    },
  });

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const at = V();
  const scale = V();
  const spot = V();
  const worldDir = V();
  shell.start((dt) => {
    t += dt;
    time.value = t;
    if (turning.k < 1) {
      turning.k = Math.min(1, turning.k + dt / 1.5);
      fluid.quaternion.slerpQuaternions(turning.from, turning.to, inOut(turning.k));
    }
    const active = leadIndex();
    fields.forEach((field, i) => {
      const goal = i === active ? 1 : i === hoverField ? 0.16 : 0;
      for (let s = 0, n = Math.ceil(dt / 0.016), h = dt / n; s < n; s++) {
        field.v += (70 * (goal - field.a) - 10 * field.v) * h;
        field.a += field.v * h;
      }
      uniforms.uScopes.value[i].w = field.a;
      field.hover = ease(field.hover, i === hoverField || i === active ? 1 : 0, dt, 6);
      uniforms.uHover.value[i] = field.hover;
      if (field.since >= 0) {
        field.since += dt;
        uniforms.uWave.value[i] = field.since / 1.3;
        if (field.since > 1.3) {
          field.since = -1;
          uniforms.uWave.value[i] = -1;
        }
      }
      fieldLines[i].uniforms['uDraw'].value = ease(
        fieldLines[i].uniforms['uDraw'].value as number,
        i === active && t - field.at > 0.5 ? 1 : 0,
        dt,
        i === active ? 1.6 : 5,
      );
    });
    let slot = 0;
    for (const p of parts) {
      const on = p.scope === active && t - fields[p.scope].at > 0.3 + p.k * 0.09;
      const goal = on
        ? 0.8 + (p.k % 3) * 0.13 + (p.id === target.part ? 0.28 : p.id === hovered ? 0.14 : 0)
        : 0;
      for (let s = 0, n = Math.ceil(dt / 0.016), h = dt / n; s < n; s++) {
        p.v += (80 * (goal - p.h) - 11 * p.v) * h;
        p.h += p.v * h;
      }
      const height = Math.max(0, p.h);
      if (height > 0.001 && slot < SPIKES)
        uniforms.uParts.value[slot++].set(p.dir.x, p.dir.y, p.dir.z, height);
      p.bead.visible = height > 0.12;
      if (p.bead.visible) {
        p.bead.position
          .copy(p.dir)
          .multiplyScalar(R + height + 0.1 * Math.max(fields[p.scope].a, 0) + 0.06);
        const beat = events.isWaiting(p.id) ? 1 + 0.25 * Math.max(0, Math.sin(t * 3)) : 1;
        p.bead.scale.setScalar(
          clamp(height / 0.8, 0, 1.2) * beat * (p.id === target.part || p.id === hovered ? 1.5 : 1),
        );
      }
    }
    for (; slot < SPIKES; slot++) uniforms.uParts.value[slot].w = 0;
    uniforms.uTremble.value = 1 + 0.035 * Math.sin(t * 13) + 0.02 * Math.sin(t * 29.7);
    if (active >= 0) {
      fieldLight.color.set(scopes[active].color);
      fieldLight.position
        .copy(dirs[active])
        .applyQuaternion(fluid.quaternion)
        .multiplyScalar(R + 2.6);
    }
    fieldLight.intensity = ease(fieldLight.intensity, active >= 0 ? 14 : 0, dt, 3);
    if (sparkAge < 1.6) {
      sparkAge += dt;
      const drag = Math.max(0, 1 - dt * 1.6);
      for (let k = 0; k < sparkCount * 3; k++) {
        sparkPositions[k] += sparkVelocity[k] * dt;
        sparkVelocity[k] *= drag;
      }
      sparkGeometry.attributes['position'].needsUpdate = true;
      sparkMaterial.opacity = Math.max(0, 1 - sparkAge / 1.6);
    } else sparkMaterial.opacity = 0;
    frame.rotation.y += dt * 0.025;
    rocks.forEach((rock, k) => {
      rock.theta += rock.speed * dt;
      at.set(
        Math.sin(rock.phi) * Math.cos(rock.theta) * rock.r,
        Math.cos(rock.phi) * rock.r,
        Math.sin(rock.phi) * Math.sin(rock.theta) * rock.r,
      );
      q.setFromEuler(euler.set(rock.spin.x * t, rock.spin.y * t, rock.spin.z * t));
      debris.setMatrixAt(k, m4.compose(at, q, scale.setScalar(rock.size)));
    });
    debris.instanceMatrix.needsUpdate = true;

    // Names: one per field facing the viewer, and one per page while its spike is up.
    const { width, height } = shell;
    labels.clear(width, height);
    const taken: number[][] = [];
    const nameField = (i: number) => {
      const chip = scopeChips[i];
      worldDir.copy(dirs[i]).applyQuaternion(fluid.quaternion);
      spot.copy(worldDir).multiplyScalar(R + 0.75 + Math.max(fields[i].a, 0) * 0.4);
      const facing = worldDir.dot(V().subVectors(camera.position, spot).normalize());
      const screen = facing > 0.2 ? shell.screenOf(spot) : null;
      const where = screen
        ? claimSpot(
            taken,
            chip,
            [
              [screen[0] - chip.w / 2, screen[1] - chip.h / 2],
              [screen[0] + 10, screen[1] - chip.h / 2],
              [screen[0] - chip.w - 10, screen[1] - chip.h / 2],
              ...spotsAround(screen[0], screen[1], chip, 24, 2),
            ],
            width,
            height,
          )
        : null;
      chip.place(where?.[0] ?? 0, where?.[1] ?? 0, !!where);
      chip.flag('is-dim', active >= 0 && i !== active);
      chip.flag('is-on', i === hoverField || i === active);
    };
    // The field in front and its pages claim room first; the other fields take what is left.
    if (active >= 0) nameField(active);
    for (const p of parts) {
      const show = p.scope === active && p.bead.visible && p.h > 0.5;
      if (!show) {
        p.chip.place(0, 0, false);
        continue;
      }
      const tip = shell.screenOf(p.bead.getWorldPosition(spot));
      const where = tip
        ? claimSpot(taken, p.chip, spotsAround(tip[0], tip[1], p.chip, 14), width, height)
        : null;
      p.chip.place(where?.[0] ?? 0, where?.[1] ?? 0, !!where, p.k * 45);
      p.chip.flag('is-on', p.id === target.part || p.id === hovered);
      if (where && tip)
        labels.leader(
          tip[0],
          tip[1],
          where[0] < tip[0] ? where[0] + p.chip.w : where[0],
          where[1] + p.chip.h / 2,
          scopes[p.scope].parts[p.k].color,
        );
    }
    scopes.forEach((_, i) => {
      if (i !== active) nameField(i);
    });
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
