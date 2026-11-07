import { TOOL_UIS, TOOL_UI_GROUPS } from './tool-links';

describe('Tool UIs catalog', () => {
  it('has unique ids, a known group and at least one link per tool', () => {
    const ids = TOOL_UIS.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const tool of TOOL_UIS) {
      expect(TOOL_UI_GROUPS).toContain(tool.group);
      expect(tool.links.length).toBeGreaterThan(0);
      for (const link of tool.links) expect(link.path.startsWith('/')).toBe(true);
    }
  });
});
