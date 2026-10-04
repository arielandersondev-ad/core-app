import { describe, expect, it } from 'vitest';

import {
  CLINIC_CURRENCY,
  formatCurrency,
  fromMinorUnits,
  parseCurrency,
  payments,
  services,
  toMinorUnits,
} from '@/shared/data/clinic-data';

describe('toMinorUnits', () => {
  it('converts bolivianos to minor units', () => {
    expect(toMinorUnits(150)).toBe(15000);
    expect(toMinorUnits(150.5)).toBe(15050);
    expect(toMinorUnits(0)).toBe(0);
  });

  it('rounds away floating point noise', () => {
    // 0.1 + 0.2 === 0.30000000000000004 in IEEE 754
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
    expect(toMinorUnits(1.005)).toBe(101);
  });
});

describe('fromMinorUnits', () => {
  it('is the inverse of toMinorUnits', () => {
    expect(fromMinorUnits(15050)).toBe(150.5);
    expect(fromMinorUnits(toMinorUnits(233.75))).toBe(233.75);
  });
});

describe('formatCurrency', () => {
  it('expects minor units, not bolivianos', () => {
    expect(formatCurrency(15000)).toBe('Bs. 150.00');
    expect(formatCurrency(15050)).toBe('Bs. 150.50');
    expect(formatCurrency(0)).toBe('Bs. 0.00');
  });

  it('always shows two decimals', () => {
    expect(formatCurrency(8)).toBe('Bs. 0.08');
    expect(formatCurrency(100000)).toBe('Bs. 1000.00');
  });
});

describe('parseCurrency', () => {
  it('accepts the bolivian comma as decimal separator', () => {
    expect(parseCurrency('150,50')).toBe(15050);
    expect(parseCurrency('0,01')).toBe(1);
  });

  it('also accepts a dot', () => {
    expect(parseCurrency('150.50')).toBe(15050);
  });

  it('handles whole amounts and surrounding whitespace', () => {
    expect(parseCurrency('150')).toBe(15000);
    expect(parseCurrency('  150  ')).toBe(15000);
  });

  it('falls back to zero on garbage instead of NaN', () => {
    expect(parseCurrency('')).toBe(0);
    expect(parseCurrency('abc')).toBe(0);
    expect(parseCurrency('Bs. 150')).toBe(0);
  });

  it('round-trips with formatCurrency', () => {
    for (const amount of [0, 1, 150, 233.75, 1000]) {
      const formatted = formatCurrency(
        toMinorUnits(amount)
      ).replace('Bs. ', '');

      expect(parseCurrency(formatted)).toBe(
        toMinorUnits(amount)
      );
    }
  });
});

describe('mock money shape matches the schema', () => {
  it('every payment is in BOB minor units', () => {
    for (const payment of payments) {
      expect(payment.currency).toBe(CLINIC_CURRENCY);
      expect(Number.isSafeInteger(payment.amountMinor)).toBe(
        true
      );
      expect(payment.amountMinor).toBeGreaterThan(0);
    }
  });

  it('every service is in BOB minor units', () => {
    for (const service of services) {
      expect(service.currency).toBe(CLINIC_CURRENCY);
      expect(Number.isSafeInteger(service.basePriceMinor)).toBe(
        true
      );
      expect(service.basePriceMinor).toBeGreaterThan(0);
    }
  });
});