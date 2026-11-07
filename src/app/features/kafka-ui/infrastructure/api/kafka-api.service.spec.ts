import { parseMessageStream, toGroup, toTopic } from './kafka-api.service';

describe('Kafka UI API mapping', () => {
  it('counts a topic messages from its partition offsets', () => {
    const topic = toTopic({
      name: 'demo',
      partitionCount: 2,
      replicationFactor: 1,
      segmentSize: 2048,
      partitions: [
        { offsetMin: 0, offsetMax: 10 },
        { offsetMin: 5, offsetMax: 7 },
      ],
    });
    expect([topic.partitions, topic.messages, topic.sizeBytes]).toEqual([2, 12, 2048]);
  });

  it('reads the lag from either field name', () => {
    expect(toGroup({ groupId: 'a', consumerLag: 4 }).lag).toBe(4);
    expect(toGroup({ groupId: 'b', messagesBehind: 9 }).lag).toBe(9);
  });

  it('keeps only the MESSAGE events of the stream', () => {
    const stream = [
      'data:{"type":"PHASE","phase":{"name":"Polling"}}',
      '',
      'data:{"type":"MESSAGE","message":{"partition":0,"offset":3,"timestamp":"2026-11-07T10:00:00Z","key":"k","content":"{\\"a\\":1}"}}',
      'data:{"type":"DONE"}',
    ].join('\n');
    expect(parseMessageStream(stream)).toEqual([
      {
        partition: 0,
        offset: 3,
        timestamp: '2026-11-07T10:00:00Z',
        key: 'k',
        value: '{"a":1}',
        headers: {},
      },
    ]);
  });
});
