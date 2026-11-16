<div align="center">

<img src="public/favicon.svg" width="72" alt="Homelab logo" />

# Homelab

**Your homelab's apps and assistants, for everyone at home, on the phone, the tablet and the computer.**

</div>

## Today: a short briefing, not a wall of tiles

The first page reads like a note written for you: the date, a greeting, and one or two sentences of what matters — _"Kitchen has a plan waiting for you. The homelab is healthy: all 24 apps answer and no alert is firing."_ Below, only what has something to show:

- **Waiting for you** — plans to approve, and for admins the alerts and warnings (a disk filling up, a backup that didn't run), each with the button that deals with it;
- **Homelab** — for admins, the apps answering and the server's CPU, memory and disk;
- **Pick up where you left off** — your latest conversations.

Today never repeats the menu. Someone given only Kitchen and Travel sees only their plans and conversations; a page they weren't given isn't in any menu, its address sends them back to Today, and the homelab's gateway refuses its data anyway.

**Moving around.** On a computer or an iPad, a quiet sidebar holds Today, Assistant, Map (admins), your pages in three groups — Observe, Operate, Automate, each folds away — then People (admins), Appearance and your account. On a phone, a tab bar: Today, Assistant, More.

**One field for everything.** **⌘K** (or **/**, or the field at the top) finds any page or conversation, or asks an assistant: type _"what's for dinner"_ and pick **Ask Kitchen**. Arrow keys move, Enter opens, Esc closes.

## The homelab map

Admins get a **Map** of the cluster, laid out the way homelab-infra is: the networks (tailnet, pods, services, host ports, outbound), how a request travels from your devices through caddy and the sign-in check, every port open on the tailnet, how a question goes through the agents, then the server with its CPU, memory, disk and pods and every service as a card in five groups — Gateway & security, Apps, LLM & tools, Data & messaging, Observability.

Each card shows its live state from Kubernetes (ready, restarted today, failed, or a job's last run) every 30 seconds. **Click a card** and what it talks to and what uses it stay lit while the rest dims; its tailnet port lights up; a panel shows what it is, where it's reached, its image, and **Open**, **Logs**, **Metrics**, **Restart** (asks first) and **Ask about it**. Click a name in the panel to follow the path.

## Every tool, inside the homelab

Each tool has its own page here, in your theme, with no new tab to open:

| Page           | What you do there                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboards** | The server, containers, Kafka, the LLM and server health as charts (Grafana's three dashboards, rebuilt)                                                                                                   |
| **Metrics**    | Run a PromQL query as a chart or a table; see every scrape target and the alert rules                                                                                                                      |
| **Logs**       | Search every container's logs with LogQL, pick a label and a value, filter by level, follow them live; a line from a traced request opens its trace                                                        |
| **Traces**     | Find a request by service, operation or duration, and follow it span by span; `/traces?trace=<id>` opens one trace                                                                                         |
| **Kafka**      | Topics, their messages, consumer groups and their lag; create or delete a topic and send a message (admins)                                                                                                |
| **Pipeline**   | Alloy's components, their health, what feeds what                                                                                                                                                          |
| **Models**     | Load and unload models, follow the LLM's logs, try a prompt                                                                                                                                                |
| **Tools**      | Every tool the agent can use — its own and the ones it gets from Grafana's, MongoDB's and PostgreSQL's MCP servers (`grafana_*`, `mongodb_*`, `postgres_*`); fill in its arguments and run it              |
| **Account**    | Your name and email, your devices and sessions (sign one out), and changing your password                                                                                                                  |
| **Tool UIs**   | Links to each tool's own web interface — Grafana, Prometheus, Kafka UI, Alloy, the LLM playground, MCP Inspector, the agent's API docs, Headlamp (admins), your Keycloak account — with whether it answers |
| **Kubernetes** | Admins only: nodes, pods, workloads, services, volumes, secrets and events; scale, restart, run a cron job now, delete, edit an object's YAML, read a pod's logs and open a shell in it                    |

<table>
  <tr>
    <td><img src="docs/screenshots/dashboards.webp" alt="Dashboards: the Homelab overview with CPU, memory and disk gauges, CPU by mode and load average charts" /></td>
    <td><img src="docs/screenshots/metrics.webp" alt="Metrics: a PromQL query for memory by container drawn over the last hour" /></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/logs.webp" alt="Logs: lines over time by level, then each container's lines newest first, one opened with its labels" /></td>
    <td><img src="docs/screenshots/traces.webp" alt="Traces: a list of requests and one opened as a waterfall of its spans, a tool call selected with its attributes" /></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/kafka.webp" alt="Kafka: the topics with their size, and one topic's latest messages, one opened as formatted JSON" /></td>
    <td><img src="docs/screenshots/kubernetes.webp" alt="Kubernetes: the pods of the homelab namespace and one opened with its containers and conditions" /></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/models.webp" alt="Models: the loaded and unloaded models with Load and Unload, a prompt box and the LLM's logs" /></td>
    <td><img src="docs/screenshots/tools.webp" alt="Tools: the toolbox's tools, read_file filled in with a path and its result" /></td>
  </tr>
</table>

Admins can change things where it makes sense — scale a deployment, delete a topic, unload a model — and every change that can't be undone asks you to confirm it first, the way the server's `make` commands do.

<img src="docs/screenshots/account.webp" alt="Account: your profile, your password and when it was set, and your devices and sessions with Sign out" />

## Check every container

The **Status** page lists every container of the homelab, grouped the way the server is organised — Gateway, Repository, Message broker, Observability, LLM, Apps — each marked **Ready**, **Not ready** or **Unknown**. The top line counts how many are ready; the page checks again every 30 seconds, or at once with **Check now**.

Every service also carries what you need to use it:

- **links** to its page here — Dashboards, Metrics, Logs, Traces, Kafka, Pipeline, Models, Tools, your Account — and to the agent's API docs;
- its **connection address**, ready to copy — the MongoDB URI, Kafka's bootstrap server, the OTLP endpoints, the LLM's OpenAI-compatible URL;
- the **folder** it lives in on the server, for when you need to look at its configuration.

<img src="docs/screenshots/status.webp" alt="The Status page: every container Ready, grouped Gateway, Repository, Message broker, Observability, LLM and Apps, each with its folder, links to its page and a copyable connection address" />

## Ask the agent

Ask in plain words, the way you would ask a colleague: _"Summarise sales.csv by region"_, _"What's in change.md?"_, _"Which tools can you use?"_.

A question it can answer straight away — _"What is a KV cache?"_ — comes back **as it is written**: the words appear one after another, so you can start reading at once. While the agent works, a small swarm of dots moves in your theme's colours: calm while it thinks, faster while it runs a tool, red if something went wrong.

<img src="docs/screenshots/streaming.webp" alt="The agent writing its answer to 'What is a KV cache?', the animated swarm next to the step it is on" />

**Assistant** lists your conversations — today, this week, earlier — next to the one you have open; each says which assistant it's with (Kitchen, Travel…), chosen when you start it. When a request needs real work, the agent first shows you **its plan**, and a card under it waits for you: **Approve and run**, **Change it**, or **Dismiss**. Nothing runs until you say so, and a waiting plan shows on Today and as a number next to Assistant. Conversations are remembered on that device.

<img src="docs/screenshots/chat.webp" alt="A conversation: the agent proposes a plan, the user replies yes, the agent answers with a table; under each answer, the time it took and the tokens it used" />

Under each answer you see how long it took and how many tokens went in and out, like _(21s · ↑ 9.9k · ↓ 642 tokens)_. Hover over the answer for a button that copies it, and an arrow that opens everything the agent reported about it: the model, the tools it used, the steps it took, and any detail the agent adds later.

<img src="docs/screenshots/answer-details.webp" width="532" alt="An answer with its details open: elapsed time, input and output tokens, model, outcome, tools used, iteration and max iteration" />

## The assistant on every page

The button at the top right of a tool page opens the assistant beside it: ask about an error on the Logs page, carry on with it in Assistant. Choose the model, start a new conversation, or open the Agent page from the panel; **Esc** or ✕ closes it.

Drag the panel's left edge to make it wider or narrower (double-click it to reset); the width is remembered on that device, and on a wide screen the page makes room for it. Close the panel while the agent is working and the button keeps moving, so you know an answer is on its way.

<img src="docs/screenshots/assistant.webp" alt="The Logs page with the assistant open beside it, answering why Caddy logged an error" />

## Stay in control

The settings panel lets you choose the **agent** you talk to, the **model** that answers, start a **new conversation**, or pick up an old one by pasting its id.

- **The agents** come from the supervisor, which knows them all: the supervisor (the default, which answers what needs no data and hands the rest to the others), observation, analysis, coding, security, kitchen and travel. Under the list, a line says what the chosen agent does. Choosing another agent starts a new conversation with it.
- **The models** come from the chosen agent itself: when a new model is added there, it shows up here.

Trust the agent with a task? Turn on **Auto-approve plans** and it carries out its plans without waiting for your yes. Your agent, model and auto-approve choices are **remembered** on that device. Code blocks in Tasker ask the agent you chose here.

At the bottom, **Fixed by the server** shows the steps that always use the same model whatever you pick — for example understanding your request or writing a plan.

<img src="docs/screenshots/settings.webp" alt="The settings panel: the agent (analysis, with what it does), model, auto-approve, conversation id, new conversation, and the steps fixed by the server with their model" />

## Automate with Tasker

Build automations by connecting blocks on a canvas: a **Trigger**, **HTTP requests**, **Code**, **Transforms** and an **Output**. **Run** starts from every block nothing feeds into — a Trigger, or a block on its own — and you follow each block's result.

- **Several canvases side by side** — open tabs, split the workspace horizontally or vertically, and resize the panes freely.
- **Name your blocks** so the canvas reads like the flow; a block saved as a favorite takes the favorite's name, and comes back with it when you add the favorite.
- **Group blocks** into one reusable block, and open it to edit what is inside.
- **Saved to your account** — workflows and favourite blocks are stored in the homelab's PostgreSQL; the right panel lists your workflows, with **New canvas** to start another. Nobody else sees them.
- **Inspect any block** — select it to edit its settings and see what it returned on the last run.

<img src="docs/screenshots/tasker.webp" alt="Tasker with two canvases side by side: 'Kafka lag check' with a grouped block, and 'Nightly backup report' after a run, its HTTP request block selected with its settings and last result in the right panel" />

## Themes

**Appearance** offers **Navy** (deep blue, the default), **Light** (the same layout on white) and **Contrast** (black on white, the easy-to-read Atkinson Hyperlegible font), or **Match my device**: Light by day, Navy at night. The choice is saved on your account, so it follows you from your phone to your computer. Every text colour is checked at 4.5:1 or more against what's behind it, in every theme. With a mouse the rows are compact; on a touch screen the same layout gets finger-sized targets.

## People and what each one may open

Admins manage people from **People**: the list of everyone who can sign in beside the one you pick — their pages as switches, grouped Assistants / Apps / Tools, and **New password**, **Sign out**, **Disable** / **Enable**. A switch counts from that person's next session refresh, at most 4 minutes; admins always have everything.

**+ Add** asks a name and a username, the pages they may open, then shows a **temporary password** generated on your device, once. Give it to them: at their first sign-in they choose their own.

Each page is a Keycloak realm role (`agent:kitchen`, `app:tasker`, `page:metrics`…); the list and the terminal commands are in homelab-infra's Keycloak README.

## On your phone too

Install it like an app: open the homelab in Safari, then **Share › Add to Home Screen**. It opens full screen with its own icon, respects the notch and the home bar, keeps buttons within thumb reach, and never zooms when you type.

## How it connects

The UI is one static page served by the homelab's gateway. The browser only ever talks to one HTTPS address, and one sign-in covers the UI and every tool it links to.

```text
 Browser ── https://<server>.<tailnet>.ts.net ──► Caddy ── signed in? ──► oauth2-proxy ◄──► Keycloak
                                                    │
     /                    the UI itself ◄───────────┤
     /api/agent/…         agents list   ◄───────────┤──► agent-supervisor ─ A2A ─► the other agents
     /api/agents/<n>/…    chat, models  ◄───────────┤──► agent-<n> ──► LLM, agent-toolbox (its scope)
     /api/tasker/…        workflows     ◄───────────┤──► PostgREST ──► PostgreSQL (your rows only)
     /api/prometheus/…    Metrics       ◄───────────┤──► Prometheus
     /api/loki/ tempo/    Logs, Traces  ◄───────────┤──► Loki, Tempo
     /api/kafka/…         Kafka         ◄───────────┤──► Kafka UI's API ──► Kafka
     /api/alloy/ llm/     Pipeline, Models ◄────────┤──► Alloy, llama-swap
     /api/toolbox/mcp     Tools         ◄───────────┤──► agent-toolbox (MCP)
     /api/account/…       Account, theme ◄──────────┤──► Keycloak's account API
     /api/people/…        People        ◄───────────┤──► Keycloak's admin API (admins)
     /api/kube/…          Kubernetes    ◄───────────┤──► kube-api ──► Kubernetes API (admins)
     /api/health/<name>   Status page   ◄───────────┘──► each container's health endpoint
```

Changes (anything but reading) carry the header `X-Homelab-Request: 1`, which the gateway requires so another site can't make them in your name. Each API also needs the page that uses it: the gateway lets a person through only with the `admin` role or that page's role.

Devices on the tailnet can also reach the supervisor directly: its API on `http://<server>.<tailnet>.ts.net:8000` and its tools (MCP) on `:8001/mcp`.

## Open it

On any device on your Tailscale network, open `https://<your-server>.<tailnet>.ts.net/` and sign in. Admins add people from **People**, or on the server with `make user-add ACCOUNT=<name>` (see homelab-infra's `devops_guide.md`); the old address `http://<your-server>:8002` redirects there.

Your account's menu (bottom of the sidebar, or More on a phone) has **Sign out**, which ends the session everywhere. The **Account** page changes your profile and password; passwords expire after 90 days, and the sign-in page then asks for a new one. The Map, People, the Kubernetes page, Kafka changes and unloading a model need the `admin` role (`make user-admin ACCOUNT=<name>` on the server).

---

The screenshots show sample data; some still show the look before the Draft 2 redesign.

**Developers:** project structure, how addresses are built, adding a page or a status, the shared charts, and publishing the image — **[docs/development.md](docs/development.md)**.
