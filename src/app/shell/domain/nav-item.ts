/**
 * The registry of routed feature pages -- the single place to add a new
 * page. Both the left nav and the home dashboard read from this list, so
 * adding a page here is enough to make it discoverable in both places; the
 * route itself still needs an entry in app.routes.ts.
 */
export interface NavItem {
  label: string;
  path: string;
  description: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Agent', path: '/agent', description: 'Chat with the homelab agent.' },
];
