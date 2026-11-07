import { toolArguments, toolFields } from '../../domain/tool';
import { readRpc } from './mcp-client.service';

describe('MCP client', () => {
  it('reads the answer from JSON or from an event stream', () => {
    expect(readRpc('application/json', '{"id":1,"result":{"ok":true}}', 1).result).toEqual({
      ok: true,
    });
    const stream = 'event: message\ndata: {"id":3,"result":{"tools":[]}}\n\n';
    expect(readRpc('text/event-stream', stream, 3).result).toEqual({ tools: [] });
  });

  it('builds a form from the schema and typed arguments from it', () => {
    const fields = toolFields({
      properties: {
        path: { type: 'string', description: 'file' },
        limit: { type: 'integer', default: 10 },
        recursive: { type: 'boolean' },
        options: { type: 'object' },
      },
      required: ['path'],
    });
    expect(fields.map((f) => [f.name, f.kind, f.required, f.initial])).toEqual([
      ['path', 'text', true, ''],
      ['limit', 'number', false, '10'],
      ['recursive', 'boolean', false, ''],
      ['options', 'json', false, '{}'],
    ]);
    expect(
      toolArguments(fields, { path: 'a.md', limit: '5', recursive: 'true', options: '{"x":1}' }),
    ).toEqual({
      path: 'a.md',
      limit: 5,
      recursive: true,
      options: { x: 1 },
    });
  });
});
