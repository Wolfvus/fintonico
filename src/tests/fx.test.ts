import './setupLocalStorage';
import { describe, it, expect } from 'vitest';
import { createFxTable } from '../lib/fx';
import { FxMissingError } from '../domain/errors';

describe('FX table', () => {
  it('throws when a requested rate is missing', () => {
    const fx = createFxTable();
    expect(() =>
      fx.getRate({ base: 'MXN', quote: 'USD', asOf: '2025-10-18' }),
    ).toThrow(FxMissingError);
  });

  it('returns a stored rate deterministically', () => {
    const fx = createFxTable();
    fx.ensure({ base: 'MXN', quote: 'USD', asOf: '2025-10-18', rate: 18.5 });

    expect(fx.getRate({ base: 'MXN', quote: 'USD', asOf: '2025-10-18' })).toBe(18.5);
  });

  it('uses same-currency shortcuts', () => {
    const fx = createFxTable();
    fx.ensure({ base: 'MXN', quote: 'USD', asOf: '2025-10-18', rate: 18.5 });

    expect(fx.getRate({ base: 'USD', quote: 'USD', asOf: '2025-10-18' })).toBe(1);
  });
});
