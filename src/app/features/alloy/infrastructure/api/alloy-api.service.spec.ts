import { groupByKind } from '../../domain/component';
import { toComponent } from './alloy-api.service';

describe('Alloy API mapping', () => {
  it('reads health and groups components by their kind', () => {
    const components = [
      toComponent({
        localID: 'prometheus.scrape.node',
        name: 'prometheus.scrape',
        health: { state: 'healthy' },
      }),
      toComponent({
        localID: 'loki.write.default',
        name: 'loki.write',
        health: { state: 'unhealthy', message: 'down' },
      }),
      toComponent({ localID: 'prometheus.remote_write.default', name: 'prometheus.remote_write' }),
    ];
    const groups = groupByKind(components);

    expect(groups.map((g) => [g.kind, g.components.map((c) => c.health)])).toEqual([
      ['loki', ['unhealthy']],
      ['prometheus', ['unknown', 'healthy']],
    ]);
  });
});
