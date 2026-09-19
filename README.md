# homelab-ui

The dashboard UI for the homelab: a left sidebar for navigating between pages, a right sidebar for whatever the current page's settings are, and one page per homelab component (`agent` today, more later).

Built with Angular 21 (standalone components, signals) using a feature-first, layered structure: each page under `features/` owns its `domain` (types), `application` (state/orchestration), `infrastructure` (API clients), and `components`/`pages` (UI), and never reaches into another feature. Cross-cutting app chrome — the two sidebars, routing between pages — lives in `shell/`.

## Project structure

```
src/app/
├── app.ts / app.routes.ts / app.config.ts   -- bootstraps <app-layout>, declares routes
│
├── shell/                       -- app chrome, not tied to any one page
│   ├── layout/                  -- the shell: left nav + <router-outlet> + right panel
│   ├── nav-sidebar/              -- left sidebar (Home + NAV_ITEMS)
│   ├── page-panel/               -- generic right sidebar host
│   ├── application/
│   │   ├── layout.store.ts       -- open/closed state of both sidebars (mobile)
│   │   └── page-chrome.store.ts  -- holds whatever the current page registered for the right panel
│   ├── directives/
│   │   └── page-panel-content.directive.ts  -- [appPagePanelContent], how a page fills the right panel
│   └── domain/
│       └── nav-item.ts           -- NAV_ITEMS: the page registry (left nav + home dashboard read this)
│
├── features/
│   ├── home/
│   │   └── pages/home-page/      -- dashboard, one card per NAV_ITEMS entry
│   └── agent/                    -- reference example -- copy its shape for a new page
│       ├── domain/                -- types + static data (ChatMessage, KNOWN_MODELS, ...)
│       ├── application/           -- AgentStore: state + the send/cancel/newSession use cases
│       ├── infrastructure/        -- AgentApiService, ApiConfigService (the SSE client)
│       ├── components/            -- presentational pieces (conversation, message, composer, settings-panel)
│       └── pages/agent-page/      -- the routed page, composes the above
│
└── shared/
    └── pipes/                     -- generic, reusable across any feature
```

## Development

```bash
npm install
npm start           # dev server at http://localhost:4200, proxies /api per proxy.conf.json
npm test            # vitest
npm run build        # production build to dist/homelab-ui
```

## Adding a page

Worked example: adding a `Metrics` page. Substitute your own name throughout (route path, `NAV_ITEMS` entry, folder name).

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

### 4. Add it to the left nav and the home dashboard

Both read the same list, so this one entry is enough for both:

```ts
// shell/domain/nav-item.ts
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Agent', path: '/agent', description: 'Chat with the homelab agent.' },
  { label: 'Metrics', path: '/metrics', description: 'Host and container metrics.' },
];
```

### 5. Give it a right-sidebar panel (optional)

Only do this if the page has settings/controls that belong in the right sidebar. Wrap that content in `<ng-template appPagePanelContent>` inside the page's own template:

```html
<!-- metrics-page.html -->
<ng-template appPagePanelContent>
  <app-metrics-settings />
  <!-- or inline markup -- whatever the page's settings actually are -->
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

That's the entire contract: register the template, and the shell shows/hides the right sidebar and its mobile toggle automatically. Skip this step and the page simply has no right sidebar — that's how `home` works today.

### 6. Verify

```bash
npm start
```

Open `http://localhost:4200` — the new page should appear in the left nav and as a card on the home dashboard, `/metrics` should route to it, and (if step 5 was done) its settings should show in the right sidebar.

## Path aliases

`@shell/*`, `@features/*`, `@shared/*` (see `tsconfig.json`) resolve to `src/app/shell`, `src/app/features`, `src/app/shared`. Use them for cross-boundary imports (a feature importing shell code, for instance); use relative imports for anything within the same feature.
