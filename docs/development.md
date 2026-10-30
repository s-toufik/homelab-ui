# Developing homelab-ui

The dashboard UI for the homelab: a left sidebar for navigating between pages, a right sidebar for whatever the current page's settings are, and one page or link per homelab component.

Built with Angular 21 (standalone components, signals, zoneless) using a feature-first, layered structure: each page under `features/` owns its `domain` (types), `application` (state/orchestration), `infrastructure` (API clients), and `components`/`pages` (UI), and never reaches into another feature. Cross-cutting app chrome — the two sidebars, routing between pages — lives in `shell/`; what several features use lives in `shared/`.

## Project structure

```
src/app/
├── app.ts / app.routes.ts       -- bootstraps <app-layout>, declares the routes
├── app.config.ts                -- the only place that lists the features (provideXxxFeature())
│
├── shell/                       -- app chrome; knows the feature contract, never a feature
│   ├── layout/                  -- left nav + <router-outlet> + right panel
│   ├── nav-sidebar/             -- left sidebar: Homelab (overview) + every app and page, signed-in account
│   ├── page-panel/              -- generic right sidebar host
│   ├── feature-icon/            -- draws the icon a feature hands over
│   ├── application/
│   │   ├── homelab-features.ts  -- HOMELAB_FEATURES + provideHomelabFeature()
│   │   ├── feature-status.store.ts  -- runs each feature's health check
│   │   ├── homelab-resources.ts -- HOMELAB_RESOURCES + provideHomelabResource()
│   │   ├── resource-status.store.ts -- runs each resource's status check
│   │   ├── layout.store.ts      -- open/closed state of both sidebars
│   │   └── page-chrome.store.ts -- whatever the current page registered for the right panel
│   ├── directives/              -- [appPagePanelContent], how a page fills the right panel
│   └── domain/
│       ├── homelab-feature.ts   -- HomelabFeature (an app or page the shell lists), FEATURE_CATEGORIES
│       └── homelab-resource.ts  -- HomelabResource: has a status, nothing to open
│
├── features/                    -- one folder per backend, even a plain link
│   ├── home/                    -- the overview: every feature by category, with health dots
│   ├── status/                  -- /status: every homelab-infra container, its state, links, connection
│   │   ├── domain/stack-services.ts  -- the catalog: one entry per container, grouped like homelab-infra
│   │   ├── infrastructure/      -- /api/health/<key> or a Prometheus metric, per entry
│   │   ├── application/         -- StackStatusStore: states, summary, refresh
│   │   └── pages/status-page/
│   ├── agent/                   -- chat page (reference example for a page)
│   │   ├── domain/ application/ components/ pages/
│   │   │                        -- domain/answer-metadata.ts: what the agent reports about an answer
│   │   └── infrastructure/
│   │       ├── agent.json       -- port, subpath and api path of agent-runtime
│   │       ├── api/             -- SSE client, model list (/v1/models), readiness check
│   │       └── storage/         -- the user's model and auto-approve choices (localStorage)
│   ├── tasker/                  -- block canvas, split panes, groups; workflows and favorites via PostgREST
│   ├── infrastructure/          -- the menu's Infrastructure section (PostgreSQL, MongoDB, Kafka), from Prometheus
│   ├── account/                 -- link to the Keycloak account page
│   └── grafana/ prometheus/ …   -- one folder per homelab-infra web UI, opened as a link
│       ├── <name>.feature.ts    -- registration
│       └── infrastructure/<name>.json  -- port + subpath + health path
│
└── shared/
    ├── infrastructure/
    │   ├── homelab-server.json  -- the server for `npm start` ("http://<your-server>")
    │   ├── homelab-server.ts    -- builds every backend address; API_ROUTING, isReachable()
    │   ├── gateway-session.ts   -- the signed-in account, sign-out, session watch
    │   ├── prometheus.json + prometheus-query.service.ts  -- instant PromQL queries (/api/prometheus)
    │   └── connection-settings* -- a host saved in Settings → Connectors
    ├── pipes/ utils/
```

## Backend addresses

Every address is built from `shared/infrastructure/homelab-server.json` and the feature's own JSON:

| Feature JSON                             | Address                          |
| ---------------------------------------- | -------------------------------- |
| `{ "port": <port>, "subpath": null }`    | `http://<your-server>:<port>`    |
| `{ "port": <port>, "subpath": "ui" }`    | `http://<your-server>:<port>/ui` |
| `{ "port": null, "subpath": "grafana" }` | `http://<your-server>/grafana`   |

`healthPath` (optional) is what the status dot calls. The files are compiled in: rebuild after changing them.

**Behind the gateway.** In production the UI is served by homelab-infra's gateway (Caddy + Keycloak + oauth2-proxy), so the browser only ever talks to one HTTPS origin:

| JSON field                | Production build (`API_ROUTING = 'gateway'`)                                 | `npm start` (`'direct'`)        |
| ------------------------- | ---------------------------------------------------------------------------- | ------------------------------- |
| `api` (e.g. `/api/agent`) | API calls go to `/api/agent/…` on the same origin, signed-in cookie included | `http://<your-server>:<port>/…` |
| `healthPath`              | Status dots call `/api/health/<key>` and trust its status code               | `no-cors` probe of the port     |
| `port` / `subpath`        | Links that open a tool in a new tab, on `https://<page host>:<port>`         | `http://<your-server>:<port>`   |

In production the server address is the page's own host (`HOMELAB_SERVER_URL` follows `location`), unless a host is saved in Settings → Connectors; `homelab-server.json` is only used by `npm start`.

`GatewaySession` reads the signed-in account from `/oauth2/userinfo` at start-up, shows it in the left sidebar with a Sign out link, checks again every minute and when the tab comes back, and sends the browser to the sign-in page when the session has ended. Tasker keeps unsaved canvases per account (`homelab-ui.tasker.workspace.<account>`).

What the UI calls must exist on the gateway (homelab-infra's `gateway/caddy/Caddyfile`):

- a new API: an `api` path in its JSON **and** a route under `/api/`;
- a new link to a tool: a site for its port (see `gateway/caddy/README.md`);
- a new health check: `import health_route <key> <service>:<port> <path>` under `/api/*`.

Tasker's HTTP blocks run in the browser: from the HTTPS page they can only call `https://` addresses.

To try the UI against a backend running on your own machine, set `homelab-server.json` to `http://localhost` and the feature's `port` to the one your backend listens on. Every other feature then points to `localhost` too, so their status shows offline unless they run locally. Don't commit these edits.

## Development

| To…                                                                                                                               | make                              | Raw command                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Install dependencies                                                                                                              | `make install`                    | `npm install`                                                                                                                |
| Dev server at `http://localhost:4200` (direct to the ports in `homelab-server.json`, no sign-in; the Status page shows _Unknown_) | `make run`                        | `npx ng serve`                                                                                                               |
| Tests (vitest)                                                                                                                    | `make test`                       | `npx ng test --watch=false`                                                                                                  |
| Format check / fix                                                                                                                | `make lint` / `make fix`          | `npx prettier --check .` / `npx prettier --write .`                                                                          |
| Type check                                                                                                                        | `make typecheck`                  | `npx tsc -p tsconfig.app.json --noEmit`                                                                                      |
| All checks                                                                                                                        | `make check`                      | lint + typecheck + test                                                                                                      |
| Production build to `dist/homelab-ui`                                                                                             | `make build`                      | `rm -rf dist && npx ng build`                                                                                                |
| Local image                                                                                                                       | `make docker_build`               | `docker build -f devops/docker/Dockerfile -t homelab-ui:local .`                                                             |
| Publish a test image (releases: git tag, see below)                                                                               | `make docker_publish [TAG=1.4.0]` | `docker buildx build --platform linux/amd64,linux/arm64 -f devops/docker/Dockerfile -t toufik142/homelab-ui:latest --push .` |

`npm start` calls the backends directly on their ports, without the gateway, from a machine on the tailnet: the Agent page works against the server's agent-runtime (`http://<your-server>:8000`). PostgREST and the `/api/health` routes exist only behind the gateway, so Tasker's saved workflows and the Status page need the deployed UI (`https://<server>.<tailnet>.ts.net/`).

## Releasing

The server runs homelab-ui as a Helm release: the chart `oci://ghcr.io/s-toufik/charts/homelab-ui` (kube-charts' `app` chart with [`devops/helm/values.yml`](../devops/helm/values.yml) built in) and the image `toufik142/homelab-ui`, both at the version of a git tag.

1. `make check`, merge to `main`.
2. Tag the release:
   ```bash
   git tag v1.4.0
   git push origin v1.4.0
   ```
3. GitHub Actions: PUBLISH (image `1.4.0`) and CHART (chart `1.4.0`) are green.
4. In homelab-infra: `apps.homelabUi: 1.4.0` in `environments/versions.yaml`; on the server `make apply R=homelab-ui` (homelab-infra's DevOps guide, Release an app).
5. Open `https://<server>/status` and reload.

Ports, probes, resources and env variables are in `devops/helm/values.yml`; the next release carries a change there to the server.

`make docker_publish` still pushes `latest` (or `TAG=…`) from a Mac for both `linux/amd64` and `linux/arm64`: built with plain `docker build` on a Mac, an image would be arm64 only and fail on an x86-64 server with `exec format error`. The Dockerfile builds the static files once on the builder's own platform (`--platform=$BUILDPLATFORM`), then copies them into an nginx image for each target.

## Pre-commit hooks

`.pre-commit-config.yaml` runs typecheck, format-check, and tests before each commit and push. `pre-commit` itself is a standalone tool, not an npm package, so install it once, globally:

```bash
pipx install pre-commit   # or: brew install pre-commit / pip install pre-commit
```

Then wire it into this repo (or just run `make hooks`):

```bash
pre-commit install --hook-type pre-commit --hook-type pre-push
```

Run it manually against everything at any time:

```bash
pre-commit run --all-files
```

## Answer details

The agent's `final` event carries a `metadata` object. The store keeps it on the answer as it is (`domain/answer-metadata.ts` only turns every value into text and drops empty ones), and the message component shows it in two ways:

```text
 final event ─► metadata ─► answerMetadata() ─► ChatMessage.metadata
                                                  │
                    ┌─────────────────────────────┴───────────────────────┐
                    ▼                                                     ▼
   usageSummary(): "(21s · ↑ 9.9k · ↓ 642 tokens)"      metadataEntries(): every key, in the
   from elapsed_time, input_tokens, output_tokens       agent's order, labelled from its name
   (missing ones are left out)                          (shown under the arrow)
```

To show a new detail, add it to the agent's metadata: it appears under the arrow with a label made from its key (`cache_hit_ratio` → "Cache hit ratio"), with no change here. Only a field that should join the one-line summary needs code, in `usageSummary()`.

## Adding a page

Worked example: adding a `Metrics` page. Substitute your own name throughout (route path, feature id, folder name).

### 1. Scaffold the feature folder

```
src/app/features/metrics/
├── domain/
├── application/
├── infrastructure/     (only if the page talks to a backend)
├── components/         (only once you have more than one presentational piece)
└── pages/metrics-page/
```

Skip any of `domain`/`application`/`infrastructure` the page doesn't need yet — `home` has none of them. Add a layer only when it actually has something to hold; an empty folder documents nothing.

### 2. Build the page component

```ts
// features/metrics/pages/metrics-page/metrics-page.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-metrics-page',
  imports: [],
  templateUrl: './metrics-page.html',
  styleUrl: './metrics-page.scss',
})
export class MetricsPage {}
```

Give the page's `:host` this shape so it fills the space the shell gives it (see `agent-page.scss` or `home-page.scss` for the exact rule):

```scss
:host {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
}
```

### 3. Register the route

```ts
// app.routes.ts
{
  path: 'metrics',
  loadComponent: () =>
    import('./features/metrics/pages/metrics-page/metrics-page').then((m) => m.MetricsPage),
},
```

Lazy (`loadComponent`) keeps each page its own bundle chunk — a new page never grows the main bundle.

### 4. Register the feature

The left nav and the home dashboard list registered features. Add a registration next to the page:

```ts
// features/metrics/metrics.feature.ts
export function provideMetricsFeature(): Provider {
  return provideHomelabFeature(() => ({
    id: 'metrics',
    label: 'Metrics',
    description: 'Host and container metrics.',
    category: 'Observability',
    icon: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
    entry: { kind: 'page', path: '/metrics' },
  }));
}
```

and list it in `app.config.ts` (`provideMetricsFeature()`). If the page talks to a backend, give it `infrastructure/metrics.json` and a `checkHealth` (see `features/agent`).

### 5. Give it a right-sidebar panel (optional)

Only do this if the page has settings/controls that belong in the right sidebar. Wrap that content in `<ng-template appPagePanelContent>` inside the page's own template:

```html
<!-- metrics-page.html -->
<ng-template appPagePanelContent>
  <app-metrics-settings />
</ng-template>

<div class="metrics-page">... the page's main content ...</div>
```

```ts
import { PagePanelContentDirective } from '@shell/directives/page-panel-content.directive';

@Component({
  imports: [PagePanelContentDirective /* , ... */],
  // ...
})
export class MetricsPage {}
```

That's the entire contract: register the template, and the shell shows/hides the right sidebar and its mobile toggle automatically. Skip this step and the page simply has no right sidebar — that's how `home` and `status` work.

### 6. Verify

`make run`, open `http://localhost:4200`: the new page appears in the left nav and as a tile on the overview, `/metrics` routes to it, and (if step 5 was done) its settings show in the right sidebar.

## Adding a link to a homelab service

For a web UI the stack serves (a dashboard, an admin console…), no page or route is needed:

1. `features/<name>/infrastructure/<name>.json` — its `port`, `subpath` (or `null`) and a cheap `healthPath`.
2. `features/<name>/<name>.feature.ts` — copy `features/grafana/grafana.feature.ts`: label, description, colour, icon, category, `entry: { kind: 'link', url: server.url(ADDRESS) }` and `checkHealth: () => server.isReachable(ADDRESS)`.
3. List `provide<Name>Feature()` in `app.config.ts`.
4. In homelab-infra, the matching `import health_route <name> …` line in the `Caddyfile`.

It appears on the overview, with its status dot, and in the menu. A new category is one more entry in `FEATURE_CATEGORIES` (`shell/domain/homelab-feature.ts`).

## Adding a container to the Status page

Every container homelab-infra runs has an entry in `STACK_SERVICES` (`features/status/domain/stack-services.ts`):

- `group` and `folder` — where it lives in homelab-infra (`observability/logs/loki`);
- `check` — `{ kind: 'health', key }` for a container with an HTTP health endpoint (the gateway's `/api/health/<key>` route), or `{ kind: 'metric', query }` for one with only a Prometheus metric (`pg_up`, `kafka_brokers`, …);
- `links` — its web interfaces (`port` on the gateway, or `null` for this page's own host);
- `connection` (optional) — the address apps use, `{host}` replaced by the server's name.

A new group is one more entry in `SERVICE_GROUPS` (`features/status/domain/stack-service.ts`).

## Adding an infrastructure status

For the menu's Infrastructure section (a service with nothing to open):

1. Make sure Prometheus has a metric that is `1` or more while the service is up — usually from an exporter added in homelab-infra.
2. Add an entry to `INFRASTRUCTURE_RESOURCES` (`features/infrastructure/domain/infrastructure-resources.ts`): `id`, `label`, `color`, and `upWhen`, the PromQL expression.

A status from another source than Prometheus is a new feature registering its own `HomelabResource`.

## Path aliases

`@shell/*`, `@features/*`, `@shared/*` (see `tsconfig.json`) resolve to `src/app/shell`, `src/app/features`, `src/app/shared`. Use them for cross-boundary imports (a feature importing shell code, for instance); use relative imports for anything within the same feature.
