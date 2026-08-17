import { describe, expect, it } from 'vitest';
import { getSourceLink } from './sourceLink';
import { GpxData } from '../gpx/models';

describe('getSourceLink', () => {
	it('returns the sourceLink when present', () => {
		const data: GpxData = {
			points: [],
			waypoints: [],
			sourceLink: 'https://example.com/tour/1',
		};

		expect(getSourceLink(data)).toBe('https://example.com/tour/1');
	});

	it('returns undefined when absent', () => {
		const data: GpxData = { points: [], waypoints: [] };

		expect(getSourceLink(data)).toBeUndefined();
	});
});
