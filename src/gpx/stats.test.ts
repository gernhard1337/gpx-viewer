import { describe, expect, it } from 'vitest';
import { calculateStats } from './stats';
import { TrackPoint } from './models';

describe('calculateStats', () => {
	it('calculates distance for two points a known distance apart', () => {
		// Berlin (52.5200, 13.4050) to Hamburg (53.5511, 9.9937) ~ 255.7 km
		const points: TrackPoint[] = [
			{ lat: 52.52, lon: 13.405 },
			{ lat: 53.5511, lon: 9.9937 },
		];

		const stats = calculateStats(points);

		expect(stats.distanceKm).toBeCloseTo(255.7, 0);
	});

	it('returns zero distance for a single point', () => {
		const points: TrackPoint[] = [{ lat: 52.52, lon: 13.405 }];

		const stats = calculateStats(points);

		expect(stats.distanceKm).toBe(0);
	});

	it('sums elevation gain for a rising track', () => {
		const points: TrackPoint[] = [
			{ lat: 0, lon: 0, ele: 100 },
			{ lat: 0, lon: 0.001, ele: 150 },
			{ lat: 0, lon: 0.002, ele: 200 },
		];

		const stats = calculateStats(points);

		expect(stats.elevationGainM).toBeCloseTo(100);
		expect(stats.elevationLossM).toBeCloseTo(0);
	});

	it('sums elevation loss for a descending track', () => {
		const points: TrackPoint[] = [
			{ lat: 0, lon: 0, ele: 200 },
			{ lat: 0, lon: 0.001, ele: 150 },
			{ lat: 0, lon: 0.002, ele: 100 },
		];

		const stats = calculateStats(points);

		expect(stats.elevationLossM).toBeCloseTo(100);
		expect(stats.elevationGainM).toBeCloseTo(0);
	});

	it('sums gain and loss separately for a mixed track', () => {
		const points: TrackPoint[] = [
			{ lat: 0, lon: 0, ele: 100 },
			{ lat: 0, lon: 0.001, ele: 150 },
			{ lat: 0, lon: 0.002, ele: 120 },
			{ lat: 0, lon: 0.003, ele: 180 },
		];

		const stats = calculateStats(points);

		expect(stats.elevationGainM).toBeCloseTo(110);
		expect(stats.elevationLossM).toBeCloseTo(30);
	});

	it('skips points missing elevation without aborting the calculation', () => {
		const points: TrackPoint[] = [
			{ lat: 0, lon: 0, ele: 100 },
			{ lat: 0, lon: 0.001 }, // missing ele
			{ lat: 0, lon: 0.002, ele: 150 },
		];

		const stats = calculateStats(points);

		// no consecutive pair both has ele, so no gain/loss recorded
		expect(stats.elevationGainM).toBe(0);
		expect(stats.elevationLossM).toBe(0);
		// distance is still calculated for all point pairs
		expect(stats.distanceKm).toBeGreaterThan(0);
	});
});
