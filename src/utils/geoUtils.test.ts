import { describe, expect, it } from 'vitest';
import { calculateDistanceKm } from './geoUtils';

describe('calculateDistanceKm', () => {
  it('returns 0 for identical points', () => {
    expect(calculateDistanceKm(37.5665, 126.978, 37.5665, 126.978)).toBe(0);
  });

  it('returns the known distance between Seoul and Busan (~325km)', () => {
    const distance = calculateDistanceKm(37.5665, 126.978, 35.1796, 129.0756);
    expect(distance).toBeGreaterThan(320);
    expect(distance).toBeLessThan(330);
  });
});
