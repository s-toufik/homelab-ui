const STYLE_ID = 'tasker-rete-engine-styles';

const CSS = `
.tasker-rete-canvas-host {
  background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
  background-size: 24px 24px;
}

.tasker-rete-node {
  position: absolute;
}

.tasker-rete-node__body {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface-raised);
  cursor: grab;
  user-select: none;
}

.tasker-rete-node__body:active {
  cursor: grabbing;
}

.tasker-rete-node--group .tasker-rete-node__body {
  border-style: dashed;
  box-shadow:
    5px 5px 0 -1px var(--surface-raised),
    5px 5px 0 0 var(--border),
    10px 10px 0 -1px var(--surface-raised),
    10px 10px 0 0 var(--border);
}

.tasker-rete-node--selected .tasker-rete-node__body {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.tasker-rete-node--group.tasker-rete-node--selected .tasker-rete-node__body {
  box-shadow:
    0 0 0 3px var(--accent-soft),
    5px 5px 0 -1px var(--surface-raised),
    5px 5px 0 0 var(--accent),
    10px 10px 0 -1px var(--surface-raised),
    10px 10px 0 0 var(--accent);
}

.tasker-rete-node__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex: 0 0 auto;
}

.tasker-rete-node__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.tasker-rete-node__title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
}

.tasker-rete-node__subtitle {
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tasker-rete-node__status {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}

.tasker-rete-node__status--running {
  background: var(--warning);
  animation: tasker-rete-pulse 1s ease-in-out infinite;
}

.tasker-rete-node__status--success {
  background: var(--success);
}

.tasker-rete-node__status--error {
  background: var(--danger);
}

@keyframes tasker-rete-pulse {
  50% {
    opacity: 0.35;
  }
}

.tasker-rete-node__port {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  margin-top: -6px;
  border-radius: 50%;
  background: var(--surface);
  border: 2px solid var(--border);
  cursor: crosshair;
}

.tasker-rete-node__port:hover {
  border-color: var(--accent);
}

.tasker-rete-node__port--input {
  left: -6px;
}

.tasker-rete-node__port--output {
  right: -6px;
}

.tasker-rete-connection {
  position: absolute;
  left: 0;
  top: 0;
  width: 4000px;
  height: 3000px;
  pointer-events: none;
}

.tasker-rete-connection__path {
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 2;
  pointer-events: stroke;
  cursor: pointer;
}

.tasker-rete-connection__path:hover {
  stroke: var(--danger);
}

.tasker-rete-connection--preview .tasker-rete-connection__path {
  stroke: var(--accent);
  stroke-dasharray: 6 6;
  pointer-events: none;
}
`;

export function injectCanvasEngineStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
