import { describe, expect, it } from 'vitest';
import { formatDistance, formatElevation } from './units';

describe('formatDistance', () => {
	it('formats metric as km', () => {
		expect(formatDistance(12.345, 'metric')).toBe('12.35 km');
	});

	it('formats imperial as mi', () => {
		expect(formatDistance(10, 'imperial')).toBe('6.21 mi');
	});
});

describe('formatElevation', () => {
	it('formats metric as m', () => {
		expect(formatElevation(123.6, 'metric')).toBe('124 m');
	});

	it('formats imperial as ft', () => {
		expect(formatElevation(100, 'imperial')).toBe('328 ft');
	});
});
