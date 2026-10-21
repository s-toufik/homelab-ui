import { answerMetadata, compactNumber, metadataEntries, usageSummary } from './answer-metadata';

describe('answer metadata', () => {
  const reported = answerMetadata({
    elapsed_time: '1m 5s',
    input_tokens: '3412',
    output_tokens: 845,
    model: 'nvidia/nemotron-3-super-120b-a12b',
    tools: 'python_executor, file_writer',
    iteration: '3',
    max_iteration: '6',
    empty: '',
    missing: null,
  });

  it('keeps every reported field as text, in order, and drops empty ones', () => {
    expect(Object.keys(reported)).toEqual([
      'elapsed_time',
      'input_tokens',
      'output_tokens',
      'model',
      'tools',
      'iteration',
      'max_iteration',
    ]);
    expect(reported['output_tokens']).toBe('845');
  });

  it('lists fields it has never seen, with a readable label', () => {
    const entries = metadataEntries(answerMetadata({ cache_hit_ratio: '0.42', retryCount: 2 }));

    expect(entries).toEqual([
      { key: 'cache_hit_ratio', label: 'Cache hit ratio', value: '0.42' },
      { key: 'retryCount', label: 'Retry count', value: '2' },
    ]);
  });

  it('sums up time and tokens the way Claude shows them', () => {
    expect(usageSummary(reported)).toBe('(1m 5s · ↑ 3.4k · ↓ 845 tokens)');
  });

  it('shows only the parts that were reported', () => {
    expect(usageSummary(answerMetadata({ elapsed_time: '12s' }))).toBe('(12s)');
    expect(usageSummary(answerMetadata({ output_tokens: '1200' }))).toBe('(↓ 1.2k tokens)');
    expect(usageSummary(answerMetadata({ model: 'm' }))).toBeNull();
    expect(usageSummary(undefined)).toBeNull();
  });

  it('writes large numbers compactly', () => {
    expect([999, 1000, 1250, 12_345, 2_000_000].map(compactNumber)).toEqual([
      '999',
      '1k',
      '1.3k',
      '12.3k',
      '2M',
    ]);
  });
});
