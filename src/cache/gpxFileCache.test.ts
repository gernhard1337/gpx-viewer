import { describe, expect, it } from 'vitest';
import { GpxFileCache } from './gpxFileCache';
import { GpxData } from '../gpx/models';
import { GpxStats } from '../gpx/stats';

function makeEntry(): { data: GpxData; stats: GpxStats } {
	return {
		data: { points: [{ lat: 0, lon: 0 }], waypoints: [] },
		stats: { distanceKm: 1, elevationGainM: 2, elevationLossM: 3 },
	};
}

describe('GpxFileCache', () => {
	it('returns undefined for an unknown path/mtime', () => {
		const cache = new GpxFileCache();
		expect(cache.get('tour.gpx', 100)).toBeUndefined();
	});

	it('returns the cached entry for a matching path and mtime', () => {
		const cache = new GpxFileCache();
		const entry = makeEntry();
		cache.set('tour.gpx', 100, entry);

		expect(cache.get('tour.gpx', 100)).toBe(entry);
	});

	it('misses when the mtime changed (file was modified)', () => {
		const cache = new GpxFileCache();
		cache.set('tour.gpx', 100, makeEntry());

		expect(cache.get('tour.gpx', 200)).toBeUndefined();
	});

	it('keeps entries for different paths independent', () => {
		const cache = new GpxFileCache();
		const entryA = makeEntry();
		const entryB = makeEntry();
		cache.set('a.gpx', 100, entryA);
		cache.set('b.gpx', 100, entryB);

		expect(cache.get('a.gpx', 100)).toBe(entryA);
		expect(cache.get('b.gpx', 100)).toBe(entryB);
	});
});
