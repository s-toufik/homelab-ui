<div align="center">

<img src="public/favicon.svg" width="72" alt="Homelab logo" />

# Homelab

**The homelab's apps, assistants and tools in one place, for everyone at home, on a computer, a tablet or a phone.**

<img src="docs/screenshots/center.webp" alt="Center: the homelab as a globe of constellations, Observe and Assistant in front, with the constellation list and zoom buttons" />

</div>

## What's inside

| Page           | Who                                          | What it does                                                                                                                                      |
| -------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Center**     | Everyone                                     | The first page: every page you may open, grouped by scope, as a sky of constellations or one of four 3D scenes                                    |
| **Today**      | Everyone                                     | The day at a glance: plans waiting for you, alerts, the homelab's health, your latest conversations                                               |
| **Assistant**  | Everyone, for the assistants they were given | Conversations with the homelab's assistants: Kitchen, Travel, Observation, Analysis, Coding, Security, and the supervisor that hands work to them |
| **Agents**     | Everyone, for the assistants they were given | A live map: the Assistant in the middle, each agent as an animated scene, lines when the Assistant asks one                                       |
| **Map**        | Admins                                       | The Kubernetes cluster, live: every service, its state, what it talks to                                                                          |
| **People**     | Admins                                       | Accounts, and the pages each person may open                                                                                                      |
| **Tool pages** | Admins, or whoever was given the page        | Status, Dashboards, Metrics, Logs, Traces, Kafka, Pipeline, Models, Tools, Tool UIs, Kubernetes, Tasker, Kitchen                                  |
| **Account**    | Everyone                                     | Profile, password, devices and sessions, deleting your account                                                                                    |
| **Appearance** | Everyone                                     | Theme, Center style and agent cast                                                                                                                |

## Center

The homelab opens on **Center** (`/`): a globe of the night sky where each page is a star and each group of pages a constellation. It is drawn like an observatory's sky: the Milky Way with its dark dust lane, stars coloured by temperature, faint constellation lines and lettering in the theme's capitals, inside a graduated ring that turns with the globe. Each theme tints the night (`--sky-high`, `--sky-mid`, `--sky-deep`, set per theme in `scripts/themes.mjs`): violet under Wizarding, ember under Dragon Rider, Aegean under Demigod.

| Constellation                          | Stars                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------- |
| **Assistant**                          | Assistant, Agents, and each assistant you may use (Kitchen, Travel, …) |
| **Observe**, **Operate**, **Automate** | Your tool pages, as in the sidebar                                     |
| **Home**                               | Today, Map and People (admins), Account, Appearance                    |

| Do                                        | To                                                         |
| ----------------------------------------- | ---------------------------------------------------------- |
| Drag                                      | Turn the globe; it keeps spinning a little when you let go |
| Scroll, pinch, **+** / **−**              | Zoom on the pointer; names appear as you get closer        |
| Shift-drag or right-drag                  | Move the globe                                             |
| Click a constellation's name on the right | Fly to it                                                  |
| Click a star                              | Fly to it and see what it is, with **Open**                |
| Double-click a star                       | Open the page                                              |
| Arrow keys, **+**, **−**, **0**           | Turn, zoom, back to the whole sky                          |

The globe turns slowly on its own when you leave it, and the Assistant's star pulses while a plan waits for you. Screen readers get the same pages as a list.

### Center styles

**Appearance › Center** chooses how Center shows the pages. **Sky** is the globe above; the four others are 3D scenes, dark whatever the theme, with the same scopes and pages.

| Style          | What you see                                                                                                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sky**        | The globe of constellations, one star per page (the default)                                                                                                                              |
| **Ferrofluid** | A globe of black magnetic liquid in a wire shell, with orbit rings and drifting debris. Each scope is a field on it; bring one forward and the liquid rises in spikes there, one per page |
| **Atlas**      | The Earth at night, its land in fine dots, with a glass tower per scope on its continent and a floor per page. The tower you bring forward stands upright and opens floor by floor        |
| **Starmap**    | A film-style star chart: a planet per scope, its pages as moons on its orbits, and routes from the Assistant to every other scope                                                         |
| **Contour**    | A map in glowing contour lines with a mountain per scope, as tall as its pages are many, and a survey marker per page on its slopes                                                       |

| Do                                                 | To                                            |
| -------------------------------------------------- | --------------------------------------------- |
| Drag                                               | Turn the scene                                |
| Scroll, pinch, **+** / **−**                       | Zoom                                          |
| Click a scope's name, in the scene or on the right | Bring it forward; click it again to let it go |
| Click a page or its name                           | See what it is, with **Open**                 |
| **Esc**                                            | Put the page down, then the scope             |
| Arrow keys, **0**                                  | Turn, back to the whole scene                 |

Left alone for a few seconds, a 3D scene turns slowly; soon after, it tours the scopes, bringing each forward for a few seconds in turn, and starts again from the first. Touch it and the tour stops. With reduced motion set on the device the scenes stay still, and a device that cannot draw 3D gets the sky. As in the sky, the Assistant's page pulses while a plan waits for you.

<table>
  <tr>
    <td><img src="docs/screenshots/center-star.webp" alt="Center zoomed on the Assistant constellation: Assistant, Agents, Kitchen, Travel, Observation, Analysis, Coding and Security, with the Assistant star's card and Open" /></td>
    <td><img src="docs/screenshots/phone-center.webp" width="260" alt="Center on a phone: the globe with the constellations to fly to along the bottom" /></td>
  </tr>
</table>

## Today

**Today** (`/today`) is the briefing.

Today opens with the date, a greeting and a short summary, for example _"Kitchen has a plan waiting for you. The homelab is healthy: all 24 apps answer and no alert is firing."_ Below it:

- **Waiting for you**: plans to approve and, for admins, firing alerts and warnings (a disk filling up, a backup that didn't run), each with a button to deal with it;
- **Homelab** (admins): how many apps answer, and the server's CPU, memory and disk;
- **Pick up where you left off**: your latest conversations.

<img src="docs/screenshots/today.webp" alt="Today: the date, a greeting and a summary, a plan waiting in Kitchen, the homelab's apps, CPU, memory and disk, and the latest conversations" />

## Finding your way

- **Computer and iPad:** a sidebar with Center, Today, Assistant, Agents, Map (admins), your pages grouped into Observe, Operate and Automate (each group folds), then People (admins), Appearance and your account. The button at its top, or **[**, folds it to icons. Folded, it opens over the page while the pointer is on it and closes when the pointer leaves; click the button again to keep it open. The choice is remembered.
- **Side panels** work the same way everywhere: the sidebar, the conversations on Assistant and a page's settings appear while you hover their button or edge, stay when you click, and go away at the next click. Drag a panel's inner edge to resize it (double-click resets it); the width is remembered.
- **Phone:** a slim top bar with the menu, the page's title and one action (search, or a new conversation on Assistant). The menu slides in from the left, or swipe right from the edge: search, a new conversation, Center, Today, Assistant, Agents and Map, **Pages** (folded until you open it), then every conversation by day, each with a bin to delete it (tap twice). The page stays visible on the right; tap it or swipe left to go back.
- **⌘K** (or **/**, or the search field at the top) finds any page or conversation, or asks an assistant directly: type _"what's for dinner"_ and pick **Ask Kitchen**. Arrow keys move, Enter opens, Esc closes.

| Shortcut      | Does                              |
| ------------- | --------------------------------- |
| **⌘K** or `/` | Search or ask                     |
| `[`           | Keep the sidebar open, or fold it |
| `n`           | New conversation, on Assistant    |
| **Esc**       | Close the palette or a panel      |

A person sees only the pages they were given. Opening any other page's address brings them back to Today, and the gateway refuses that page's data.

<img src="docs/screenshots/command-palette.webp" alt="The ⌘K palette with 'what's for dinner' typed and the choices Ask Assistant, Ask Kitchen, Ask Travel and Ask Observation" />

<img src="docs/screenshots/sidebar-peek.webp" alt="The folded sidebar opened over the Map while the pointer is on it" />

## Assistant

Ask in plain words: _"Plan five dinners with what's in the fridge"_, _"Why did caddy restart?"_, _"Which tables are the largest?"_.

- **Conversations** are listed by day (Today, This week, Earlier) next to the one that is open. Each conversation is with one assistant, picked when you start it with **+ New**. The first message opens the conversation and its answer streams in at once.
- **Delete:** the bin next to a conversation deletes it, the double bin at the top of the list deletes them all (on a phone, both are in the menu). The first tap turns the button red with a ✓; tap again to confirm.
- **On a phone** it works like the ChatGPT and Claude apps: the assistant's name is the title, tap it to pick another assistant (admins also find **Model and settings** there). Suggestions sit just above the message box, which stays at the bottom of the screen.
- **Watch the work:** while an assistant works, its answer shows what it is doing, the way Claude shows its sub-agents. Its plan lists every step as done ✓, current (spinning) or still to come ○, with the tool each step uses, and every tool call with its arguments. When the Assistant hands tasks to other agents, each one gets a card with its live scene, the task it was given, its own plan steps and tool calls in a section that folds away once it has answered, and the agents it asked in turn. Agents working at the same time sit side by side. The ⤢ button next to a card's fold arrow opens its details in a window over the conversation (a sheet from the bottom on a phone): the whole task, every plan step with its tool under it, and every tool call with its arguments or error wrapped in full, with the number that failed. It updates live and closes with ✕, Esc or a click outside. Arguments come cut to 160 characters on one line; a failed call's error comes whole, line breaks included (agent-runtime caps it at 4,000 characters). This comes from agent-runtime's `progress` events.
- **Answers stream in** word by word. A small swarm of dots shows the assistant at work: calm while it thinks, faster while it runs a tool, red if something went wrong.
- **Plans:** when a request needs real work (reading files, querying data, saving a report), the assistant first proposes a plan. A card under it offers **Approve and run**, **Change it** and **Dismiss**; nothing runs until you approve. A waiting plan also appears on Today and as a number next to Assistant.
- **Answer details:** under each answer, the time it took and the tokens used, for example _(21s · ↑ 9.9k · ↓ 642 tokens)_. Open the details for the model, the tools used and the steps taken.
- **Settings** (admins, button at the top right): the model, **Auto-approve plans**, the conversation id to pick up an old conversation, and the steps whose model is fixed by the server.
- **Beside any tool page:** the assistant button at the bottom right opens it in a panel next to the page, for example to ask about an error on the Logs page. Drag its edge to resize it; **Esc** closes it. On a phone the button sits above the page's bottom bar, if it has one, and the assistant opens full screen; ✕ brings the page back.

<img src="docs/screenshots/assistant-progress.webp" alt="The Assistant answering &quot;What do the logs of caddy say?&quot;: its plan on top, then Observation and Security working side by side, each with its plan steps (done, current, to come) and its tool calls" />

<img src="docs/screenshots/agent-details.webp" alt="Observation's details window over the conversation: its task in full, its four plan steps with the tool under each, and its three tool calls with their arguments wrapped in full" />

<img src="docs/screenshots/assistant.webp" alt="Assistant: the conversations by day, and Kitchen's plan of three steps with Approve and run, Change it and Dismiss" />

<table>
  <tr>
    <td><img src="docs/screenshots/assistant-answer.webp" alt="An answer from Observation with the time it took and the tokens used" /></td>
    <td><img src="docs/screenshots/assistant-beside-page.webp" alt="The Status page with the assistant open in a panel beside it" /></td>
  </tr>
</table>

### Where conversations are kept

| Where                     | What                                                                                                                                                 | How long                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| This browser              | The conversations you see, per account (`localStorage` key `homelab-ui.agent.conversations.<username>`), the latest 30 with their latest 40 messages | Until you delete them                       |
| agent-runtime, MongoDB    | The assistant's memory of each conversation: database `agent_<assistant>`, collections `checkpoints` and `checkpoint_writes`                         | 7 days (`CONVERSATION_TTL`), by a TTL index |
| agent-runtime, PostgreSQL | The A2A tasks: table `agent_runtime.tasks_<assistant>`                                                                                               | 7 days (`A2A_TASK_TTL`), purged hourly      |

Deleting a conversation here removes it from this browser. The server copies expire on their own after 7 days.

### Agents

**Agents** (`/agents`, next to Assistant) is a live map: the **Assistant** (the supervisor that hands work out) in the middle, the other assistants around it. Each assistant is a character in a small pixel-art scene (96 × 64 pixels, 8 frames a second), with a pose for each state: resting, working, waiting for you (a **?** bubble) and in trouble (a red **!**).

| Agent           | Character          | Resting                        | Working                                                  | Trouble                                 |
| --------------- | ------------------ | ------------------------------ | -------------------------------------------------------- | --------------------------------------- |
| **Assistant**   | The Maestro        | Polishes his baton, humming    | Conducts on a stage, task cards flying out to the sides  | Baton snapped, sheet music on the floor |
| **Kitchen**     | Chef Basile        | Dozes, blue pilot light        | Stirs the pot, steam and bubbles, a bead of sweat        | The pot boils over in smoke             |
| **Travel**      | Pip the Navigator  | Sits on the backpack, hat down | Map flapping, compass spinning, a paper plane overhead   | Map upside down, the plane crashed      |
| **Observation** | The Night Owl      | Dozes in the watchtower        | Head turning, telescope sweeping, the log scroll unrolls | Feathers ruffled, the lantern red       |
| **Analysis**    | Professor Tortoise | Reads by a green lamp          | Draws the bars and the trend line on the chalkboard      | Chalk broken, an eraser cloud           |
| **Coding**      | The Hacker Cat     | Curled up on the desk          | Types in bursts, code scrolling, tail flicking           | A bug crawls across the screen          |
| **Security**    | The Gate Bulldog   | Snores by the castle gate      | Sniffs each letter and stamps it, the gate lamp green    | Barks, a refused letter, the lamp red   |

That is the **Homelab** cast; Appearance offers seven more (see [Agent casts](#agent-casts)). The scenes are drawn pixel by pixel into a small frame buffer (`agent-scene/pixel-frame.ts`, one file per cast in `agent-scene/casts/`, sharing the figures, props and marks of `kit.ts`) and put on a canvas scaled with sharp pixels; one shared clock animates the scenes on screen. An agent without its own scene gets the cast's Assistant.

While the Assistant waits on a task it handed to an agent, the line between them lights up and flows (_"asking Kitchen…"_; on a phone the card says _"asked by Assistant"_). Click an agent for what it is doing, **Ask** and its last conversation or waiting plan.

An agent works while it answers anyone: the page reads the agents' open requests from Prometheus every 5 seconds (`http_server_active_requests` by `agent-<name>`), for people who can open Metrics or Dashboards; for others it shows what their own browser is asking. Lines are exact: agent-runtime counts each task it is waiting on (`agent_delegations_active` by `peer`), and the answer streaming in this browser says which agents it asked. Scenes hold still when the device asks for reduced motion.

<img src="docs/screenshots/agents.webp" alt="The Agents map in pixel art: the Maestro conducting in the middle, Chef Basile stirring in the Kitchen, the Night Owl asked by the Assistant, the Bulldog, the Cat, Pip and the Tortoise resting around it" />

## Map

The Map (admins) draws the cluster in sections:

- **Networks:** tailnet, pods, services, host ports, outbound;
- **The way in:** from your devices over the tailnet to caddy, then the sign-in and page check by oauth2-proxy and Keycloak;
- **Open on the tailnet:** each port, its service, and whether it uses HTTPS;
- **Agent pipeline:** from your question through the supervisor to the assistants, their tools and the model;
- **The server:** CPU, memory, disk and pods, then every service as a card in five groups: Gateway & security, Apps, LLM & tools, Data & messaging, Observability.

Each card shows the service's live state from Kubernetes, refreshed every 30 seconds: ready, restarted today, failed, or a job's last run. Click a card to highlight what it talks to and what uses it, light up its tailnet port, and open its details: what it does, where it's reached, its image, and **Open**, **Logs**, **Metrics**, **Restart** (asks for confirmation) and **Ask about it**. Click a name in the details to move to that service.

<img src="docs/screenshots/map.webp" alt="The map: networks and legend, the way in through caddy and oauth2-proxy, the ports open on the tailnet, the agent pipeline, then the server with its services as cards; backups is selected, showing its failed last run, what it talks to and its actions" />

## Tool pages

| Page           | What you do there                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | Every container grouped as on the server (Gateway, Repository, Message broker, Observability, LLM, Apps), marked Ready, Not ready or Unknown, with links, copyable connection addresses and the folder it lives in; checks every 30 seconds or with **Check now**                                                                                                                                                                                               |
| **Dashboards** | The server, containers, Kafka, the LLM and server health as charts; zoom and move every chart (below)                                                                                                                                                                                                                                                                                                                                                           |
| **Metrics**    | PromQL queries as a chart or a table; scrape targets and alert rules                                                                                                                                                                                                                                                                                                                                                                                            |
| **Logs**       | Every container's logs with LogQL: pick a label and a value, filter by level, follow live; a line from a traced request opens its trace                                                                                                                                                                                                                                                                                                                         |
| **Traces**     | Find a request by service, operation or duration and follow it span by span; `/traces?trace=<id>` opens one trace                                                                                                                                                                                                                                                                                                                                               |
| **Kafka**      | Topics, messages, consumer groups and their lag; create or delete a topic and send a message (admins)                                                                                                                                                                                                                                                                                                                                                           |
| **Pipeline**   | Alloy's components, their health and what feeds what                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Models**     | Load and unload models, follow the LLM's logs, try a prompt                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Tools**      | Every tool the assistants can use, including those from the Grafana, MongoDB and PostgreSQL MCP servers; fill in the arguments and run one                                                                                                                                                                                                                                                                                                                      |
| **Tool UIs**   | Links to each tool's own web interface, with whether it answers                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Kubernetes** | Admins: nodes, pods, workloads, services, volumes, secrets and events; scale, restart, run a cron job now, delete, edit YAML, read a pod's logs and open a shell                                                                                                                                                                                                                                                                                                |
| **Tasker**     | Automations as blocks on a canvas (Trigger, HTTP request, Code, Transform, Output): several canvases side by side, named and grouped blocks, favourites, each block's last result; saved to your account                                                                                                                                                                                                                                                        |
| **Kitchen**    | A recipe and nutrition card: ingredients with live per-portion macros, method steps, tasting notes, versioned saves; two sibling pages search the shared ingredient catalog and your saved recipes. Overview, Ingredients, Method and Macros stay at the top as you scroll. Next to them (at the bottom of the screen on a phone): the macros per portion (tap them for the details), **Save**, and **⋯** to open, copy or start a recipe or browse the catalog |

<table>
  <tr>
    <td><img src="docs/screenshots/status.webp" alt="Status: every container grouped as on the server, all Ready, with links and a copyable connection address" /></td>
    <td><img src="docs/screenshots/kubernetes.webp" alt="Kubernetes: the overview of pods and recent warnings, with the resource list on the left" /></td>
  </tr>
</table>

<img src="docs/screenshots/kitchen.webp" alt="Kitchen: a recipe card for Seared Duck Breast with live per-portion macros, ingredients with catalog macros, and tagged method steps" />

Changes that can't be undone ask for confirmation first.

**Charts** (Dashboards, Metrics) can be explored:

| Do                                          | To                                                                |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Drag across the chart                       | Zoom on that time span; drag a tall box to zoom on the values too |
| Scroll over the time axis or the value axis | Zoom on that axis around the pointer                              |
| Pinch, or ⌘ / Ctrl + scroll on the chart    | Zoom on time                                                      |
| Drag an axis                                | Move along it                                                     |
| Double-click, or **Reset zoom**             | Back to the whole range                                           |

<img src="docs/screenshots/chart-zoom.webp" alt="Dashboards with the CPU chart zoomed on a few hours and a Reset zoom button" />

## People and access

Admins manage accounts from **People**: the list of everyone who can sign in, next to the selected person's details.

- **Pages** appear as switches, grouped into Assistants, Apps and Tools. A change applies at the person's next session refresh, within 4 minutes. Admins always have every page.
- **New password**, **Sign out**, **Disable**, **Enable** and **Delete account** act on the selected person (not yourself). Delete asks once more (_"Delete Dora for good?"_) and removes the Keycloak account; `make user-remove` on the server also deletes their Tasker data.
- **Everyone** can delete their own account from **Account › Delete my account**: Keycloak asks to confirm, deletes it and signs them out.
- **+ Add** creates an account: name, username and email (checked as you type, optional), the pages the person may open, then a **temporary password**, shown once. The person chooses their own password at their first sign-in.
- If the gateway has no People API yet, the page says so: deploy homelab-infra's Keycloak and Caddy changes (`make apply R=keycloak`, then `make apply R=caddy`).

Each page is a Keycloak realm role (`agent:kitchen`, `app:tasker`, `page:metrics`, …). The list of roles and the terminal commands are in homelab-infra's Keycloak README.

<img src="docs/screenshots/people.webp" alt="People: the list of accounts beside Dora, whose pages are switches: Kitchen and Travel on, everything else off" />

## Appearance

Ten themes, or **Match my device**, which uses Light by day and Navy at night.

**Everyday** themes change colours and fonts:

| Theme              | Look                          | Headings              |
| ------------------ | ----------------------------- | --------------------- |
| **Navy** (default) | Deep blue, dark               | Geist                 |
| **Light**          | White and grey                | Geist                 |
| **Contrast**       | Black on white                | Atkinson Hyperlegible |
| **Blossom**        | Soft pink, raspberry buttons  | Quicksand             |
| **Lilac**          | Lavender and violet           | Quicksand             |
| **Forest**         | Moss and cream, green buttons | Fraunces              |

**Storybook** themes change the whole appearance: textures, card frames, button shapes, the sidebar, ornaments under titles and the fonts of text, headings and labels.

| Theme            | After           | What you see                                                                                                                                                     |
| ---------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wizarding**    | _Harry Potter_  | Parchment pages and cards with a double ruled frame, a leather sidebar with a gold rule, ink-brown Garamond text, an illuminated first letter, a wax-seal avatar |
| **Dragon Rider** | _Fourth Wing_   | Obsidian with a faint scale pattern and an ember glow, armour-plate cards with cut corners, Cinzel headings in gold fading to ember, ember buttons               |
| **Demigod**      | _Percy Jackson_ | Marble, bronze and Aegean blue, a Greek key under titles, a deep-sea sidebar, cards capped in bronze, Marcellus headings, a bronze-coin avatar                   |
| **Regency**      | _Bridgerton_    | Wedgwood blue with a small floral damask, gilt double frames, script titles with a gold flourish, pill buttons, Garamond text, a cameo avatar                    |

The choice is saved on your account, so it is the same on every device. Text meets the WCAG AA contrast ratio in every theme, the sidebars included, and touch screens get larger tap targets.

<img src="docs/screenshots/themes.webp" alt="Today in the four storybook themes: Wizarding, Dragon Rider, Demigod and Regency" />

<img src="docs/screenshots/wizarding-status.webp" alt="The Status page in the Wizarding theme: parchment cards, small-capital labels and a leather sidebar" />

### Center

**Appearance › Center** picks how Center shows the pages: **Sky**, **Ferrofluid**, **Atlas**, **Starmap** or **Contour**, each with a small preview (see [Center styles](#center-styles)). The choice is saved on your account (`homelabCenter`) like the theme.

### Agent casts

**Appearance › Agents** chooses who plays the agents, apart from the theme: any cast goes with any theme. **Match my theme** (the default) gives the storybook themes their own cast and the others the Homelab one; once you pick a cast it stays when you change the theme. A preview shows all seven agents at work, and the choice is saved on your account (`homelabCast`) like the theme.

| Cast                 | Assistant                                          | Kitchen                                       | Travel                                  | Observation                                  | Analysis                              | Coding                              | Security                          |
| -------------------- | -------------------------------------------------- | --------------------------------------------- | --------------------------------------- | -------------------------------------------- | ------------------------------------- | ----------------------------------- | --------------------------------- |
| **Homelab**          | The Maestro                                        | Chef Basile                                   | Pip the Navigator                       | The Night Owl                                | Professor Tortoise                    | The Hacker Cat                      | The Gate Bulldog                  |
| **Wizarding**        | An archmage                                        | A potioneer                                   | A broom courier                         | A stargazer                                  | An archivist                          | A rune scribe                       | A gate warden                     |
| **Dragon Rider**     | A wing leader                                      | A camp cook                                   | A rider on her dragon                   | A scout on watch                             | A quartermaster                       | A smith                             | A gate guard                      |
| **Demigod**          | An oracle                                          | A satyr cook                                  | A winged messenger                      | A centaur archer                             | A philosopher                         | An automaton maker                  | A hoplite                         |
| **Regency**          | A hostess                                          | A cook                                        | A coachman                              | A lady at the window                         | An accountant                         | A letter writer                     | A butler                          |
| **Pocket monsters**  | Chorumble, a bee                                   | Simmercrab                                    | Kitekin, a kite                         | Lumoth, a moth                               | Sproutgraph                           | Circuitoad                          | Bastionail, a snail               |
| **Digital monsters** | Bytedrake                                          | Chefbit                                       | Pathpix                                 | Scanbug                                      | Graphrex                              | Codekit                             | Firewyrm                          |
| **Machines**         | A dispatch robot sending data cubes down two belts | A kettle bot whisking                         | A rover on a red planet                 | A searchlight drone                          | A tape-reel computer printing a chart | A many-armed typist robot           | A tank-tread vault guard          |
| **Neural**           | Lumen, conducting helper orbs                      | Mise, tossing ingredients into a floating pot | A glass being steering a hologram globe | Watching live metric panels                  | Raising a 3D bar chart                | Typing on a light keyboard          | Aegis, at a hexagon shield        |
| **Sylvan**           | Saelin, a herald with a crystal staff              | Orrin, at a copper cauldron                   | Punting a leaf boat down a river        | A seer at a moonwell                         | A lorekeeper at a root lectern        | A weaver at a loom of light         | Ithra, an archer at a living gate |
| **Deepforge**        | Thane Hrodna at the mine map                       | Dunmar at the stone hearth                    | Riding a mine cart                      | Watching the peaks through a brass telescope | Weighing gems on brass scales         | Carving runes into a standing stone | Kelda, at the rune vault door     |

The pocket and digital monsters and the machines are original characters, made for this homelab. Neural, Sylvan and Deepforge are smooth, shaded scenes rather than pixel art: they are drawn as vector shapes on a canvas at the screen's resolution and animate fluidly (up to 30 frames a second, only while on screen, and still under reduced motion). The digital monsters live on an old four-shade LCD screen and glitch when in trouble; the machines work in a riveted factory with hazard stripes, steam pipes and status lights (the rover drives across a red planet). Only the Homelab cast is in the main bundle: each other cast loads the first time it is shown.

**Your own sprites:** put one PNG per agent in `public/sprites/`, named after the agent (`supervisor.png` for the Assistant, `kitchen.png`, `travel.png`, `observation.png`, `analysis.png`, `coding.png`, `security.png`), then release homelab-ui. Each image has four rows, top to bottom: resting, working, waiting, in trouble. A row holds as many frames as you like, each 1.5 times as wide as the row is tall (96 × 64 like the drawn scenes, or any size), played at 8 frames a second with sharp pixels. An agent without an image keeps its Homelab scene, and until there is at least one image the option shows an empty frame saying so.

<table>
  <tr>
    <td><img src="docs/screenshots/agents-wizarding.webp" alt="The Agents map in the Wizarding theme and cast: the archmage conducting owls, the potioneer at the cauldron, the stargazer at his telescope" /></td>
    <td><img src="docs/screenshots/agents-dragon.webp" alt="The Agents map in the Dragon Rider theme and cast: the wing leader at the war table, the rider on her dragon, the smith at the forge" /></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/agents-pocket.webp" alt="The Regency theme with the pocket monsters: the bee conducting, the crab cooking, the moth asked by the Assistant" /></td>
    <td><img src="docs/screenshots/agents-digital.webp" alt="The Navy theme with the digital monsters on their LCD screens" /></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/agents-machines.webp" alt="The Forest theme with the machines: the dispatch robot sorting data cubes, the kettle bot, the searchlight drone asked by the Assistant, the rover resting" /></td>
    <td><img src="docs/screenshots/agents-neural.webp" alt="The Navy theme with the Neural cast: glass AI beings with glowing eyes conducting orbs, cooking and watching metrics" /></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/agents-sylvan.webp" alt="The Forest theme with the Sylvan elves: the herald with her crystal staff, the cook at the cauldron, the seer at the moonwell asked by the Assistant" /></td>
    <td><img src="docs/screenshots/agents-deepforge.webp" alt="The Dragon Rider theme with the Deepforge dwarfs: the thane at the mine map, the cook at the hearth, the watcher at the telescope" /></td>
  </tr>
</table>

<table>
  <tr>
    <td><img src="docs/screenshots/appearance-cast.webp" alt="Appearance › Agents in the Blossom theme: the pocket monsters at work, and the list of casts with Match my theme" /></td>
    <td><img src="docs/screenshots/phone-appearance-cast.webp" width="260" alt="Appearance › Agents on a phone in the Lilac theme with the digital monsters" /></td>
  </tr>
</table>

<table>
  <tr>
    <td><img src="docs/screenshots/appearance.webp" alt="Appearance: a preview, Match my device, and the Everyday themes" /></td>
    <td><img src="docs/screenshots/today-light.webp" alt="Today in the Light theme" /></td>
  </tr>
</table>

## On a phone or tablet

Open the homelab in Safari, then **Share › Add to Home Screen**. It opens full screen with its own icon and respects the notch and the home indicator. Pages scroll with the phone's own scrolling; the top bar and the message box stay in place.

<table>
  <tr>
    <td><img src="docs/screenshots/phone-today.webp" width="200" alt="Today on a phone, with the top bar: menu, Today, search" /></td>
    <td><img src="docs/screenshots/phone-drawer.webp" width="200" alt="The menu open on a phone: search, Today, Assistant, Map, the folded Pages group, then the conversations by day with a bin each" /></td>
    <td><img src="docs/screenshots/phone-assistant.webp" width="200" alt="Kitchen's plan on a phone, with Approve and run" /></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/phone-assistant-new.webp" width="200" alt="A new conversation on a phone: Kitchen as the title, suggestions above the rounded message box" /></td>
    <td><img src="docs/screenshots/phone-picker.webp" width="200" alt="The assistant picker on a phone, a sheet listing every assistant and Model and settings" /></td>
    <td><img src="docs/screenshots/phone-agents.webp" width="200" alt="The Agents map on a phone: the Assistant on top, lines down to Kitchen and Observation, asked by Assistant" /></td>
    <td><img src="docs/screenshots/phone-map.webp" width="200" alt="The map on a phone: networks, legend and ports" /></td>
  </tr>
</table>

## How it connects

The UI is a static page served by the homelab's gateway. The browser talks to one HTTPS address, and one sign-in covers the UI and every tool it links to.

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
     /api/kube/…          Kubernetes, Map ◄─────────┤──► kube-api ──► Kubernetes API (admins)
     /api/health/<name>   Status page   ◄───────────┘──► each container's health endpoint
```

- Changes (anything but reading) carry the header `X-Homelab-Request: 1`, which the gateway requires.
- Each API also requires the page that uses it: the `admin` role or that page's role.
- Devices on the tailnet can also reach the supervisor's API on `http://<server>.<tailnet>.ts.net:8000` and its tools (MCP) on `:8001/mcp`.

## Open it

On a device on your Tailscale network, open `https://<your-server>.<tailnet>.ts.net/` and sign in. The old address `http://<your-server>:8002` redirects there.

- **Accounts:** admins add people from **People**, or on the server with `make user-add ACCOUNT=<name>` (see homelab-infra's `devops_guide.md`).
- **Admin role:** the Map, People, the Kubernetes page, Kafka changes and unloading a model need it (`make user-admin ACCOUNT=<name>` on the server).
- **Sign out** is in your account's menu (bottom of the sidebar, or of the menu on a phone) and ends the session everywhere.
- **Passwords** expire after 90 days; the sign-in page then asks for a new one. **Account** changes your profile and password.

---

The screenshots show sample data.

**Developers:** project structure, themes, how addresses are built, adding a page, and publishing the image are in **[docs/development.md](docs/development.md)**.
