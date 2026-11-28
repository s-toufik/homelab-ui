import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import land from 'world-atlas/land-110m.json';
import type { CenterScene, MountScene, SceneTarget } from './center-scene';
import {
  SceneShell,
  V,
  claimSpot,
  spotsAround,
  spreadRows,
  dimmer,
  ease,
  gauss,
  glowSprite,
  hdr,
  inOut,
  lerp,
  softDot,
  sphereGrid,
  stars,
  type Chip,
} from './scene-kit';

/* Where each scope's tower stands: the known scopes on their own continent, any others on spare land. */
const ANCHORS: Readonly<Record<string, readonly [number, number]>> = {
  assistant: [47, 9],
  observe: [41, -100],
  operate: [36, 100],
  automate: [-25, 134],
  life: [6, 22],
  home: [-15, -57],
};
const SPARE: readonly (readonly [number, number])[] = [
  [62, 95],
  [-34, -64],
  [64, -45],
  [-3, 113],
];

const toVec = (lat: number, lng: number, r = 1): THREE.Vector3 => {
  const a = (lat * Math.PI) / 180;
  const b = (lng * Math.PI) / 180;
  return V(Math.cos(a) * Math.sin(b) * r, Math.sin(a) * r, Math.cos(a) * Math.cos(b) * r);
};

/* Land from Natural Earth, painted on a small map so each point of the sphere can ask "is this land?". */
function landMask(): (lat: number, lng: number) => boolean {
  const W = 1024;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  if (!g) return () => false;
  g.fillStyle = '#fff';
  const topology = land as unknown as Topology;
  const shapes = feature(
    topology,
    topology.objects['land'],
  ) as unknown as GeoJSON.FeatureCollection;
  for (const shape of shapes.features) {
    const geometry = shape.geometry;
    const polygons =
      geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry.type === 'MultiPolygon'
          ? geometry.coordinates
          : [];
    for (const polygon of polygons) {
      g.beginPath();
      for (const ring of polygon) {
        ring.forEach(([lng, lat], i) => {
          const x = ((lng + 180) / 360) * W;
          const y = ((90 - lat) / 180) * H;
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        });
      }
      g.fill('evenodd');
    }
  }
  const data = g.getImageData(0, 0, W, H).data;
  return (lat, lng) =>
    data[
      (Math.min(H - 1, Math.floor(((90 - lat) / 180) * H)) * W +
        (Math.floor(((lng + 180) / 360) * W) % W)) *
        4 +
        3
    ] > 128;
}

const glass = (color: string) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uGlow: { value: 0 },
    },
    vertexShader:
      'varying vec3 vN; varying vec3 vV; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader:
      'uniform vec3 uColor; uniform float uOpacity; uniform float uGlow; varying vec3 vN; varying vec3 vV; void main() { float f = pow(max(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0), 2.0); gl_FragColor = vec4(uColor * (0.3 + 1.1 * f + uGlow * 1.2), uOpacity * (0.3 + 0.6 * f + uGlow * 0.3)); }',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

export const mountAtlas: MountScene = (host, scopes, events, options): CenterScene => {
  const isLand = landMask();
  const shell = new SceneShell(host, events, options.reducedMotion, {
    fov: 38,
    background: 0x04070f,
    minDistance: 7.5,
    maxDistance: 42,
    polar: [0.12, 2.95],
    autoRotateSpeed: 0.28,
    bloom: { strength: 0.55, radius: 0.6, threshold: 0.45 },
  });
  const { scene, camera, controls, fly, labels } = shell;
  const R = 5;
  scene.add(stars(1400, 320, 1.3));
  const far = () => (shell.portrait ? 26 : 18);
  const place = () => {
    camera.fov = shell.portrait ? 50 : 38;
  };
  place();
  shell.onResize = place;
  camera.position.copy(toVec(24, -22, far()));
  const time = { value: 0 };
  const world = new THREE.Group();
  scene.add(world);

  // The ocean: matte and low in contrast, lit from the viewer's upper left, with a thin atmosphere at the rim.
  const light = { value: V() };
  world.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(R, 128, 96),
      new THREE.ShaderMaterial({
        uniforms: {
          uDeep: { value: new THREE.Color(0x02050d) },
          uLit: { value: new THREE.Color(0x0b1a35) },
          uRim: { value: new THREE.Color(0x3d74e8) },
          uLight: light,
        },
        vertexShader:
          'varying vec3 vN; varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `uniform vec3 uDeep; uniform vec3 uLit; uniform vec3 uRim; uniform vec3 uLight; varying vec3 vN; varying vec3 vW;
          void main() {
            vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
            float lit = clamp(dot(n, uLight) * 0.5 + 0.5, 0.0, 1.0);
            float rim = pow(max(1.0 - max(dot(n, v), 0.0), 0.0), 3.0);
            gl_FragColor = vec4(mix(uDeep, uLit, lit * lit) + uRim * rim * 0.35, 1.0);
          }`,
      }),
    ),
  );
  scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.13, 96, 64),
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(0x4a86ff) } },
        vertexShader:
          'varying vec3 vN; varying vec3 vV; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader:
          'uniform vec3 uColor; varying vec3 vN; varying vec3 vV; void main() { float f = pow(max(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0), 4.0); gl_FragColor = vec4(uColor, f * 0.45); }',
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    ),
  );
  world.add(sphereGrid(R * 1.002, 0x7fa7ff, 0.045, 24, 12));

  // Land as fine dots that gather into the continents when the Center opens.
  const candidates = shell.small ? 26000 : 42000;
  const at: number[] = [];
  const from: number[] = [];
  const delay: number[] = [];
  for (let i = 0; i < candidates; i++) {
    const y = 1 - (2 * (i + 0.5)) / candidates;
    const r = Math.sqrt(1 - y * y);
    const x = Math.cos(i * 2.399963) * r;
    const z = Math.sin(i * 2.399963) * r;
    if (!isLand((Math.asin(y) * 180) / Math.PI, (Math.atan2(x, z) * 180) / Math.PI)) continue;
    at.push(x * R * 1.003, y * R * 1.003, z * R * 1.003);
    const spread = 1.5 + Math.random() * 1.6;
    from.push(
      x * R * spread + gauss() * 0.8,
      y * R * spread + gauss() * 0.8,
      z * R * spread + gauss() * 0.8,
    );
    delay.push(Math.random() * 0.45);
  }
  const dotGeometry = new THREE.BufferGeometry();
  dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(at, 3));
  dotGeometry.setAttribute('aFrom', new THREE.Float32BufferAttribute(from, 3));
  dotGeometry.setAttribute('aDelay', new THREE.Float32BufferAttribute(delay, 1));
  const gather = { value: options.reducedMotion ? 1.5 : 0 };
  world.add(
    new THREE.Points(
      dotGeometry,
      new THREE.ShaderMaterial({
        uniforms: {
          uGather: gather,
          uScale: { value: shell.renderer.getPixelRatio() },
          uColor: { value: new THREE.Color(0x8db4ee) },
        },
        vertexShader: `attribute vec3 aFrom; attribute float aDelay; uniform float uGather; uniform float uScale; varying float vAlpha;
          void main() {
            float k = clamp((uGather - aDelay) / 0.9, 0.0, 1.0);
            k = 1.0 - pow(1.0 - k, 4.0);
            vec4 world = modelMatrix * vec4(mix(aFrom, position, k), 1.0);
            float facing = dot(normalize(world.xyz), normalize(cameraPosition - world.xyz));
            vAlpha = mix(0.25, smoothstep(-0.05, 0.4, facing), k) * (0.25 + 0.75 * k);
            vec4 mv = viewMatrix * world;
            gl_PointSize = uScale * 2.4 * (16.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader:
          'uniform vec3 uColor; varying float vAlpha; void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(uColor, vAlpha * smoothstep(0.5, 0.15, d)); }',
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );

  // One glass tower per scope, standing on its continent; one floor per page.
  const floorGeometry = new RoundedBoxGeometry(0.66, 0.05, 0.66, 2, 0.04);
  const floorEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.66, 0.05, 0.66));
  const gapOut = shell.small ? 0.74 : 0.6;
  const hits: THREE.Object3D[] = [];
  const towers = scopes.map((scope, i) => {
    const [lat, lng] = ANCHORS[scope.id] ?? SPARE[i % SPARE.length];
    const normal = toVec(lat, lng);
    const root = new THREE.Group();
    root.position.copy(normal).multiplyScalar(R);
    root.quaternion.setFromUnitVectors(V(0, 1, 0), normal);
    world.add(root);
    const footprint = new THREE.Group();
    footprint.add(
      new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.53, 96),
        new THREE.MeshBasicMaterial({
          color: hdr(scope.color, 1.2),
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
      new THREE.Mesh(
        new THREE.CircleGeometry(1.15, 64),
        new THREE.MeshBasicMaterial({
          map: softDot(),
          color: hdr(scope.color, 0.8),
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    footprint.rotation.x = -Math.PI / 2;
    footprint.position.y = 0.012;
    footprint.userData['scope'] = scope.id;
    root.add(footprint);
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1, 8).translate(0, 0.5, 0),
      new THREE.MeshBasicMaterial({
        color: hdr(scope.color, 1.5),
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );
    spine.userData['scope'] = scope.id;
    root.add(spine);
    hits.push(footprint, spine);
    const floors = scope.parts.map((part, k) => {
      const g = new THREE.Group();
      const material = glass(part.color);
      g.add(
        new THREE.Mesh(floorGeometry, material),
        new THREE.LineSegments(
          floorEdges,
          new THREE.LineBasicMaterial({
            color: hdr(part.color, 1.3),
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        ),
      );
      g.userData['part'] = part.id;
      root.add(g);
      hits.push(g);
      const chip = labels.chip(part.label, part.color, {
        onClick: () => events.pick(part.id),
        onEnter: () => hoverPart(part.id),
        onLeave: () => hoverPart(null),
      });
      return { g, id: part.id, color: part.color, k, material, out: 0, chip };
    });
    const beacon = glowSprite(scope.color, 1.5, 0.6);
    root.add(beacon);
    const chip = labels.chip(scope.name, scope.color, {
      count: scope.parts.length,
      scope: true,
      onClick: () => events.focus(scope.id),
    });
    return {
      id: scope.id,
      root,
      normal,
      floors,
      spine,
      beacon,
      fade: dimmer(root),
      level: 1,
      top: 0.4,
      chip,
    };
  });

  // Great-circle arcs from the first scope (the Assistant) to every other, with a slow light running along each.
  const arcs = towers.slice(1).map((tower) => {
    const a = towers[0].normal;
    const b = tower.normal;
    const turn = new THREE.Quaternion().setFromUnitVectors(a, b);
    const step = new THREE.Quaternion();
    const lift = 0.35 + a.angleTo(b) * 0.55;
    const count = 128;
    const positions = new Float32Array(count * 3);
    const along = new Float32Array(count);
    for (let k = 0; k < count; k++) {
      const s = k / (count - 1);
      step.identity().slerp(turn, s);
      const p = a
        .clone()
        .applyQuaternion(step)
        .multiplyScalar(R * 1.004 + Math.sin(Math.PI * s) * lift);
      positions.set([p.x, p.y, p.z], k * 3);
      along[k] = s;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aT', new THREE.BufferAttribute(along, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: time,
        uFrom: { value: new THREE.Color(scopes[0].color) },
        uTo: { value: new THREE.Color(scopes[towers.indexOf(tower)].color) },
        uPhase: { value: Math.random() },
        uOpacity: { value: 0.75 },
      },
      vertexShader:
        'attribute float aT; varying float vT; void main() { vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:
        'uniform float uTime; uniform vec3 uFrom; uniform vec3 uTo; uniform float uPhase; uniform float uOpacity; varying float vT; void main() { float d = vT - fract(uTime * 0.11 + uPhase); float glow = exp(-d * d * 160.0); gl_FragColor = vec4(mix(uFrom, uTo, vT) * (0.7 + glow * 1.8), (0.12 + glow * 0.75) * uOpacity); }',
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    world.add(new THREE.Line(geometry, material));
    return { id: tower.id, material };
  });

  let target: SceneTarget = { scope: null, part: null };
  let hovered: string | null = null;
  let hoverTower: string | null = null;
  const hoverPart = (id: string | null) => {
    hovered = id;
    events.hover(id);
  };
  const leadId = (): string | null =>
    towers.find((tw) => tw.floors.some((fl) => fl.id === target.part))?.id ?? target.scope;

  // Bringing a tower forward: the globe turns so the tower stands upright toward the viewer, and the camera settles beside it.
  const turning = { from: new THREE.Quaternion(), to: new THREE.Quaternion(), k: 1 };
  let shown: string | null = null;
  const bring = () => {
    const id = leadId();
    if (id === shown) return;
    shown = id;
    const towardViewer = V().subVectors(camera.position, controls.target).normalize();
    const tower = towers.find((tw) => tw.id === id);
    if (!tower) {
      fly.to(towardViewer.multiplyScalar(far()), V(), 1.5);
      return;
    }
    const up = V(0, 1, 0).sub(towardViewer.clone().multiplyScalar(towardViewer.y)).normalize();
    const stand = towardViewer
      .clone()
      .multiplyScalar(Math.cos(0.62))
      .add(up.multiplyScalar(Math.sin(0.62)))
      .normalize();
    turning.from.copy(world.quaternion);
    turning.to
      .setFromUnitVectors(tower.normal.clone().applyQuaternion(world.quaternion), stand)
      .multiply(world.quaternion);
    turning.k = options.reducedMotion ? 1 : 0;
    if (options.reducedMotion) world.quaternion.copy(turning.to);
    const aim = stand.clone().multiplyScalar(R + 0.3 + tower.floors.length * gapOut * 0.5);
    fly.to(aim.clone().add(towardViewer.multiplyScalar(shell.portrait ? 14 : 10.5)), aim, 1.5);
  };

  shell.pointer({
    hover(x, y) {
      const hit = x === null || y === null ? null : shell.cast(x, y, hits);
      if ((hit?.part ?? null) !== hovered) hoverPart(hit?.part ?? null);
      hoverTower = hit?.scope ?? null;
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
  const side = V();
  const axis = V();
  shell.start((dt, t) => {
    time.value = t;
    if (gather.value < 1.5) gather.value += dt * 0.8;
    light.value.set(-0.55, 0.62, 0.56).applyQuaternion(camera.quaternion).normalize();
    if (turning.k < 1) {
      turning.k = Math.min(1, turning.k + dt / 1.5);
      world.quaternion.slerpQuaternions(turning.from, turning.to, inOut(turning.k));
    }
    const lead = leadId();
    for (const tower of towers) {
      const isOut = tower.id === lead;
      const n = tower.floors.length;
      let y = 0.08;
      for (const floor of tower.floors) {
        floor.out = ease(
          floor.out,
          isOut ? 1 : 0,
          dt,
          isOut ? 5.2 - floor.k * 0.42 : 6.5 - (n - 1 - floor.k) * 0.5,
        );
        floor.g.position.y = y;
        floor.g.rotation.y = floor.out * floor.k * 0.13;
        floor.g.scale.setScalar(lerp(0.78, 1, floor.out));
        y += lerp(0.075, gapOut, floor.out);
        const glow =
          floor.id === target.part
            ? 1
            : floor.id === hovered
              ? 0.6
              : events.isWaiting(floor.id)
                ? 0.25 + 0.25 * Math.sin(t * 3)
                : 0;
        floor.material.uniforms['uGlow'].value = ease(
          floor.material.uniforms['uGlow'].value as number,
          glow,
          dt,
          8,
        );
      }
      tower.top = y;
      tower.spine.scale.y = y + 0.22;
      tower.beacon.position.y = y + 0.3;
      tower.beacon.scale.setScalar(0.55 + 0.08 * Math.sin(t * 2 + tower.normal.x * 5));
      const goal = lead && !isOut ? 0.22 : 1;
      if (Math.abs(tower.level - goal) > 0.002) {
        tower.level = ease(tower.level, goal, dt, 4);
        tower.fade(tower.level);
      }
    }
    for (const arc of arcs) {
      const goal = lead ? (arc.id === lead || lead === towers[0].id ? 1 : 0.15) : 0.7;
      arc.material.uniforms['uOpacity'].value = ease(
        arc.material.uniforms['uOpacity'].value as number,
        goal,
        dt,
        4,
      );
    }

    // Names: one chip per scope over its tower, and one per floor beside the risen tower.
    const { width, height } = shell;
    labels.clear(width, height);
    const taken: number[][] = [];
    const right = side.set(1, 0, 0).applyQuaternion(camera.quaternion).clone();
    // The tower in front and its floors claim room first; the other towers take what is left.
    const ordered = [...towers].sort((a, b) => Number(b.id === lead) - Number(a.id === lead));
    for (const tower of ordered) {
      const chip: Chip = tower.chip;
      tower.root.localToWorld(spot.set(0, tower.top + 0.55, 0));
      axis.copy(tower.normal).applyQuaternion(world.quaternion);
      const facing = axis.dot(V().subVectors(camera.position, spot).normalize());
      const screen = facing > 0.12 ? shell.screenOf(spot) : null;
      const where = screen
        ? claimSpot(
            taken,
            chip,
            [
              [screen[0] - chip.w / 2, screen[1] - chip.h - 6],
              [screen[0] + 8, screen[1] - chip.h / 2],
              [screen[0] - chip.w - 8, screen[1] - chip.h / 2],
              ...spotsAround(screen[0], screen[1], chip, 24, 2),
            ],
            width,
            height,
          )
        : null;
      chip.place(where?.[0] ?? 0, where?.[1] ?? 0, !!where);
      chip.flag('is-dim', !!lead && tower.id !== lead);
      chip.flag('is-on', tower.id === hoverTower);
      // A directory beside the risen tower: a name per floor, in floor order, spread so none overlap.
      const rows: {
        floor: (typeof tower.floors)[number];
        edge: [number, number];
        centre: [number, number];
      }[] = [];
      for (const floor of tower.floors) {
        floor.g.getWorldPosition(spot);
        const edge =
          tower.id === lead && floor.out >= 0.55
            ? shell.screenOf(spot.clone().addScaledVector(right, 0.42))
            : null;
        const centre = edge ? shell.screenOf(spot) : null;
        if (!edge || !centre) {
          floor.chip.place(0, 0, false);
          continue;
        }
        floor.chip.measure();
        rows.push({ floor, edge, centre });
      }
      if (!rows.length) continue;
      rows.sort((a, b) => a.edge[1] - b.edge[1]);
      const tops = spreadRows(
        rows.map(({ floor, edge }) => [edge[1] - floor.chip.h / 2, floor.chip.h]),
        4,
        6,
        height - 6,
      );
      const widest = Math.max(...rows.map(({ floor }) => floor.chip.w));
      const reach = Math.max(...rows.map(({ edge }) => edge[0]));
      const leftSide = reach + 24 + widest > width - 8;
      const mirror = ({ edge, centre }: (typeof rows)[number]) => centre[0] - (edge[0] - centre[0]);
      const column = leftSide ? Math.min(...rows.map(mirror)) - 24 : reach + 24;
      rows.forEach((row, i) => {
        const { floor, edge } = row;
        const x = leftSide ? column - floor.chip.w : column;
        const y = tops[i];
        taken.push([x - 3, y - 3, x + floor.chip.w + 3, y + floor.chip.h + 3]);
        floor.chip.place(x, y, true, floor.k * 45);
        floor.chip.flag('is-on', floor.id === target.part || floor.id === hovered);
        labels.leader(
          leftSide ? mirror(row) : edge[0],
          edge[1],
          column,
          y + floor.chip.h / 2,
          floor.color,
        );
      });
    }
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
