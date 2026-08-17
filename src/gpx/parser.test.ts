import { describe, expect, it } from 'vitest';
import { parseGpx } from './parser';

const MINIMAL_TRACK_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
	<metadata>
		<link href="https://example.com/tour/123">
			<text>View on Example</text>
		</link>
	</metadata>
	<wpt lat="47.0" lon="8.0">
		<name>Summit</name>
	</wpt>
	<trk>
		<name>Test track</name>
		<trkseg>
			<trkpt lat="47.0000" lon="8.0000">
				<ele>400</ele>
			</trkpt>
			<trkpt lat="47.0010" lon="8.0010">
				<ele>420</ele>
			</trkpt>
		</trkseg>
		<trkseg>
			<trkpt lat="47.0020" lon="8.0020">
				<ele>440</ele>
			</trkpt>
		</trkseg>
	</trk>
</gpx>`;

const ROUTE_ONLY_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
	<rte>
		<name>Test route</name>
		<rtept lat="47.0000" lon="8.0000">
			<ele>400</ele>
		</rtept>
		<rtept lat="47.0010" lon="8.0010">
			<ele>420</ele>
		</rtept>
	</rte>
</gpx>`;

const NO_SOURCE_LINK_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
	<trk>
		<trkseg>
			<trkpt lat="47.0000" lon="8.0000"></trkpt>
			<trkpt lat="47.0010" lon="8.0010"></trkpt>
		</trkseg>
	</trk>
</gpx>`;

describe('parseGpx', () => {
	it('parses track points across multiple segments into one list', () => {
		const data = parseGpx(MINIMAL_TRACK_GPX);

		expect(data.points).toHaveLength(3);
		expect(data.points[0]).toEqual({ lat: 47.0, lon: 8.0, ele: 400 });
		expect(data.points[2]).toEqual({ lat: 47.002, lon: 8.002, ele: 440 });
	});

	it('parses waypoints with names', () => {
		const data = parseGpx(MINIMAL_TRACK_GPX);

		expect(data.waypoints).toHaveLength(1);
		expect(data.waypoints[0]).toEqual({ lat: 47.0, lon: 8.0, name: 'Summit' });
	});

	it('extracts the source link from metadata', () => {
		const data = parseGpx(MINIMAL_TRACK_GPX);

		expect(data.sourceLink).toBe('https://example.com/tour/123');
	});

	it('falls back to route points when no track is present', () => {
		const data = parseGpx(ROUTE_ONLY_GPX);

		expect(data.points).toHaveLength(2);
		expect(data.points[0]).toEqual({ lat: 47.0, lon: 8.0, ele: 400 });
	});

	it('leaves sourceLink undefined when no link is present', () => {
		const data = parseGpx(NO_SOURCE_LINK_GPX);

		expect(data.sourceLink).toBeUndefined();
	});

	it('leaves ele undefined when missing on a point', () => {
		const data = parseGpx(NO_SOURCE_LINK_GPX);

		expect(data.points[0]?.ele).toBeUndefined();
	});

	it('throws on invalid XML', () => {
		expect(() => parseGpx('<gpx><trk>')).toThrow();
	});

	it('throws when no track or route points are present', () => {
		const gpx = `<?xml version="1.0"?><gpx xmlns="http://www.topografix.com/GPX/1/1"></gpx>`;
		expect(() => parseGpx(gpx)).toThrow();
	});
});
