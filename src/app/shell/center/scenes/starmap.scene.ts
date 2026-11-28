import * as THREE from 'three';
import type { CenterScene, MountScene, SceneTarget } from './center-scene';
import { SceneShell, TAU, V, clamp, claimSpot, ease, spotsAround, hdr, stars } from './scene-kit';

/* Where each scope's planet sits on the chart, and its size; scopes the chart does not know go round the edge. */
const PLANETS: Readonly<Record<string, readonly [number, number, number]>> = {
  assistant: [-1.2, 0.6, 1.05],
  observe: [5.6, -3.4, 0.8],
  operate: [-6.6, -3.2, 0.92],
  automate: [6.6, 3.8, 0.48],
  life: [1.9, 5.3, 0.5],
  home: [-5.8, 4.4, 0.78],
};
const ROUTE = 0xff7a2f;
const SHAPES = ['hex', 'diamond', 'ring'] as const;

function markerTexture(color: string, shape: (typeof SHAPES)[number]): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const g = canvas.getContext('2d');
  if (g) {
    g.translate(64, 64);
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineWidth = 7;
    g.shadowColor = color;
    g.shadowBlur = 10;
    g.beginPath();
    if (shape === 'hex') {
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + Math.PI / 6;
        if (k) g.lineTo(Math.cos(a) * 34, Math.sin(a) * 34);
        else g.moveTo(Math.cos(a) * 34, Math.sin(a) * 34);
      }
    } else if (shape === 'diamond') {
      g.moveTo(0, -38);
      g.lineTo(38, 0);
      g.lineTo(0, 38);
      g.lineTo(-38, 0);
    } else g.arc(0, 0, 32, 0, TAU);
    g.closePath();
    g.stroke();
    g.beginPath();
    g.arc(0, 0, 12, 0, TAU);
    g.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* A planet drawn in contour lines from 3D noise, with a bright rim. */
const planetMaterial = (color: string) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uSeed: { value: Math.random() * 10 },
      uGlow: { value: 0 },
    },
    vertexShader:
      'varying vec3 vP; varying vec3 vN; varying vec3 vV; void main() { vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; uniform float uSeed; uniform float uGlow; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 0.0)), h3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0.0, 0.0, 1.0)), h3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 1.0)), h3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
      void main() {
        vec3 p = normalize(vP) * 2.2 + uSeed;
        float h = n3(p) * 0.6 + n3(p * 2.1) * 0.3 + n3(p * 4.3) * 0.1;
        float v = h * 10.0;
        float line = 1.0 - min(abs(fract(v - 0.5) - 0.5) / max(fwidth(v), 1e-4), 1.0);
        float face = abs(dot(normalize(vN), normalize(vV)));
        float rim = pow(max(1.0 - face, 0.0), 7.0);
        gl_FragColor = vec4(uColor * (line * (0.25 + 0.6 * face) + rim * 1.8 + uGlow * 0.25) + vec3(0.01, 0.008, 0.007), uOpacity);
      }`,
    transparent: true,
  });

/* A route: a glowing tube that draws itself on, with a light travelling along it. */
const routeMaterial = (color: number, phase: number, strength: number, time: { value: number }) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uDraw: { value: 0 },
      uTime: time,
      uPhase: { value: phase },
      uOpacity: { value: strength },
    },
    vertexShader:
      'varying float vT; void main() { vT = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:
      'uniform vec3 uColor; uniform float uDraw; uniform float uTime; uniform float uPhase; uniform float uOpacity; varying float vT; void main() { if (vT > uDraw) discard; float d = vT - fract(uTime * 0.09 + uPhase); float glow = exp(-d * d * 220.0); float e = uDraw - vT; float head = exp(-e * e * 900.0) * step(uDraw, 0.999); gl_FragColor = vec4(uColor * (0.9 + glow * 2.2 + head * 2.0), (0.55 + glow * 0.45) * uOpacity); }',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

export const mountStarmap: MountScene = (host, scopes, events, options): CenterScene => {
  const shell = new SceneShell(host, events, options.reducedMotion, {
    fov: 34,
    background: 0x060504,
    minDistance: 5,
    maxDistance: 50,
    polar: [0.32, 1.12],
    autoRotateSpeed: 0.12,
    bloom: { strength: 0.75, radius: 0.5, threshold: 0.32 },
  });
  shell.host.classList.add('is-chart');
  const { scene, camera, controls, fly, labels } = shell;
  const far = () => (shell.portrait ? V(0, 27, 21) : V(0, 15.5, 14));
  const home = V(0, 0, 0.6);
  const place = () => {
    camera.fov = shell.portrait ? 50 : 34;
  };
  place();
  shell.onResize = place;
  camera.position.copy(far());
  controls.target.copy(home);
  const time = { value: 0 };
  scene.add(stars(900, 260, 1.1));

  const hits: THREE.Object3D[] = [];
  const planets = scopes.map((scope, i) => {
    const angle = (i / Math.max(scopes.length, 1)) * TAU;
    const [x, z, r] = PLANETS[scope.id] ?? [Math.cos(angle) * 8, Math.sin(angle) * 6, 0.6];
    const g = new THREE.Group();
    g.position.set(x, 0.25 * Math.sin(i * 2.1), z);
    scene.add(g);
    const material = planetMaterial(scope.color);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), material);
    globe.userData['scope'] = scope.id;
    g.add(globe);
    hits.push(globe);
    const rings = new THREE.Group();
    rings.rotation.set(0.12 * Math.sin(i), 0, 0.1 * Math.cos(i));
    g.add(rings);
    const ringMaterials: THREE.Material[] = [];
    const orbit = (radius: number, dashed: boolean) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 181 }, (_, k) =>
          V(Math.cos((k / 180) * TAU) * radius, 0, Math.sin((k / 180) * TAU) * radius * 0.92),
        ),
      );
      const material2 = dashed
        ? new THREE.LineDashedMaterial({
            color: hdr(0x8aa4c8, 1),
            dashSize: 0.12,
            gapSize: 0.09,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
          })
        : new THREE.LineBasicMaterial({
            color: hdr(0x8aa4c8, 1),
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
          });
      const line = new THREE.Line(geometry, material2);
      if (dashed) line.computeLineDistances();
      rings.add(line);
      ringMaterials.push(material2);
    };
    const n = scope.parts.length;
    const inner = r + 0.75;
    const outer = r + 1.3;
    orbit(inner, false);
    if (n > 3) orbit(outer, true);
    const moons = scope.parts.map((part, k) => {
      const onOuter = n > 3 && k % 2 === 1;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: markerTexture(part.color, SHAPES[k % 3]),
          transparent: true,
          depthWrite: false,
        }),
      );
      sprite.scale.setScalar(0.26);
      sprite.userData['part'] = part.id;
      rings.add(sprite);
      hits.push(sprite);
      const chip = labels.chip(part.label, part.color, {
        onClick: () => events.pick(part.id),
        onEnter: () => hoverPart(part.id),
        onLeave: () => hoverPart(null),
      });
      return {
        sprite,
        id: part.id,
        k,
        radius: onOuter ? outer : inner,
        angle: (k / n) * TAU + i,
        speed: (onOuter ? 0.05 : 0.08) * (i % 2 ? 1 : -1),
        chip,
      };
    });
    const chip = labels.chip(scope.name, scope.color, {
      count: n,
      scope: true,
      onClick: () => events.focus(scope.id),
    });
    return { id: scope.id, g, globe, material, rings, ringMaterials, moons, r, level: 1, chip };
  });

  // Routes from the first scope (the Assistant) to every other, plus a few long sweeps across the chart.
  const routes: { material: THREE.ShaderMaterial; scope: string | null; delay: number }[] = [];
  if (planets.length) {
    const centre = planets[0].g.position;
    planets.slice(1).forEach((planet, i) => {
      const a = centre.clone();
      const b = planet.g.position.clone();
      const side = V(-(b.z - a.z), 0, b.x - a.x)
        .normalize()
        .multiplyScalar(1.4 + (i % 3) * 0.8);
      const curve = new THREE.CatmullRomCurve3([
        a,
        a.clone().lerp(b, 0.33).add(side).setY(0.6),
        a.clone().lerp(b, 0.7).sub(side.clone().multiplyScalar(0.5)).setY(0.3),
        b,
      ]);
      const material = routeMaterial(ROUTE, Math.random(), 0.9, time);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.018, 6, false), material));
      routes.push({ material, scope: planet.id, delay: 0.3 + i * 0.25 });
    });
  }
  for (let k = 0; k < 4; k++) {
    const a = V(-14 + k * 6, -0.4, 9 - k * 5);
    const b = V(12 - k * 4, 0.4, -8 + k * 3);
    const curve = new THREE.CatmullRomCurve3([
      a,
      a
        .clone()
        .lerp(b, 0.3)
        .add(V(3 * Math.sin(k * 2), 0.5, 3 * Math.cos(k))),
      a
        .clone()
        .lerp(b, 0.65)
        .add(V(-2, 0, 2.5 * Math.sin(k + 1))),
      b,
    ]);
    const material = routeMaterial(k % 2 ? 0x4fb3e8 : ROUTE, Math.random(), 0.35, time);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.008, 5, false), material));
    routes.push({ material, scope: null, delay: 1.2 + k * 0.3 });
  }

  let target: SceneTarget = { scope: null, part: null };
  let hovered: string | null = null;
  let hoverPlanet: string | null = null;
  const hoverPart = (id: string | null) => {
    hovered = id;
    events.hover(id);
  };
  const leadId = (): string | null =>
    planets.find((planet) => planet.moons.some((moon) => moon.id === target.part))?.id ??
    target.scope;
  let shown: string | null = null;
  const bring = () => {
    const id = leadId();
    if (id === shown) return;
    shown = id;
    const planet = planets.find((p) => p.id === id);
    if (!planet) {
      fly.to(far(), home, 1.6);
      return;
    }
    const aim = planet.g.position.clone();
    fly.to(aim.clone().add(shell.portrait ? V(0, 10, 8.5) : V(0.6, 5.6, 5.2)), aim, 1.6);
  };

  shell.pointer({
    hover(x, y) {
      const hit = x === null || y === null ? null : shell.cast(x, y, hits);
      if ((hit?.part ?? null) !== hovered) hoverPart(hit?.part ?? null);
      hoverPlanet = hit?.scope ?? null;
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
    const first = planets[0]?.id;
    for (const route of routes) {
      route.material.uniforms['uDraw'].value = options.reducedMotion
        ? 1
        : clamp((t - route.delay) / 1.8, 0, 1);
      const goal = route.scope
        ? lead
          ? route.scope === lead || lead === first
            ? 1
            : 0.18
          : 0.9
        : lead
          ? 0.15
          : 0.35;
      route.material.uniforms['uOpacity'].value = ease(
        route.material.uniforms['uOpacity'].value as number,
        goal,
        dt,
        4,
      );
    }
    for (const planet of planets) {
      const isOut = planet.id === lead;
      planet.level = ease(planet.level, lead && !isOut ? 0.3 : 1, dt, 4);
      planet.material.uniforms['uOpacity'].value = planet.level;
      planet.material.uniforms['uGlow'].value = ease(
        planet.material.uniforms['uGlow'].value as number,
        isOut ? 1 : 0,
        dt,
        4,
      );
      planet.globe.rotation.y += dt * 0.08;
      planet.rings.scale.setScalar(ease(planet.rings.scale.x, isOut ? 1.25 : 1, dt, 4));
      for (const material of planet.ringMaterials)
        material.opacity = (isOut ? 0.8 : 0.5) * planet.level;
      for (const moon of planet.moons) {
        moon.angle += moon.speed * dt * (isOut ? 0.4 : 1);
        moon.sprite.position.set(
          Math.cos(moon.angle) * moon.radius,
          0,
          Math.sin(moon.angle) * moon.radius * 0.92,
        );
        const hot =
          moon.id === target.part
            ? 1
            : moon.id === hovered
              ? 0.6
              : events.isWaiting(moon.id)
                ? 0.3 + 0.3 * Math.sin(t * 3)
                : 0;
        moon.sprite.scale.setScalar(0.26 * (1 + hot * 0.5) * (isOut ? 1.25 : 1));
        moon.sprite.material.opacity = planet.level;
      }
    }

    const { width, height } = shell;
    labels.clear(width, height);
    const taken: number[][] = [];
    // The planet in front and its pages claim room first; the other planets take what is left.
    const ordered = [...planets].sort((a, b) => Number(b.id === lead) - Number(a.id === lead));
    for (const planet of ordered) {
      const screen = shell.screenOf(
        planet.g.localToWorld(spot.set(planet.r * 0.75, planet.r * 0.9, 0)),
      );
      const chip = planet.chip;
      const where = screen
        ? claimSpot(
            taken,
            chip,
            [
              [screen[0] + 6, screen[1] - chip.h],
              [screen[0] - chip.w - planet.r * 40, screen[1] - chip.h],
              [screen[0] + 6, screen[1] + 8],
              ...spotsAround(screen[0], screen[1], chip, 20, 2),
            ],
            width,
            height,
          )
        : null;
      chip.place(where?.[0] ?? 0, where?.[1] ?? 0, !!where);
      chip.flag('is-dim', !!lead && planet.id !== lead);
      chip.flag('is-on', planet.id === hoverPlanet);
      for (const moon of planet.moons) {
        if (planet.id !== lead) {
          moon.chip.place(0, 0, false);
          continue;
        }
        const at = shell.screenOf(moon.sprite.getWorldPosition(spot));
        const where2 = at
          ? claimSpot(taken, moon.chip, spotsAround(at[0], at[1], moon.chip, 14), width, height)
          : null;
        moon.chip.place(where2?.[0] ?? 0, where2?.[1] ?? 0, !!where2, moon.k * 45);
        moon.chip.flag('is-on', moon.id === target.part || moon.id === hovered);
      }
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
      shell.host.classList.remove('is-chart');
      shell.dispose();
    },
  };
};
