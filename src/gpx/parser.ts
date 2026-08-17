import { GpxData, TrackPoint, Waypoint } from './models';

function parseTrackPoint(el: Element): TrackPoint {
	const lat = Number(el.getAttribute('lat'));
	const lon = Number(el.getAttribute('lon'));
	const eleEl = el.querySelector('ele');
	const ele = eleEl?.textContent ? Number(eleEl.textContent) : undefined;
	return { lat, lon, ele: ele !== undefined && !Number.isNaN(ele) ? ele : undefined };
}

function parseWaypoint(el: Element): Waypoint {
	const lat = Number(el.getAttribute('lat'));
	const lon = Number(el.getAttribute('lon'));
	const nameEl = el.querySelector('name');
	const name = nameEl?.textContent ?? undefined;
	return { lat, lon, name };
}

export function parseGpx(content: string): GpxData {
	const doc = new DOMParser().parseFromString(content, 'application/xml');

	const parserError = doc.querySelector('parsererror');
	if (parserError) {
		throw new Error('Invalid GPX file: XML could not be parsed.');
	}

	const trackPointEls = Array.from(doc.querySelectorAll('trk trkseg trkpt'));
	let points: TrackPoint[];

	if (trackPointEls.length > 0) {
		points = trackPointEls.map(parseTrackPoint);
	} else {
		const routePointEls = Array.from(doc.querySelectorAll('rte rtept'));
		points = routePointEls.map(parseTrackPoint);
	}

	if (points.length === 0) {
		throw new Error('Invalid GPX file: no track or route points found.');
	}

	const waypoints = Array.from(doc.querySelectorAll('wpt')).map(parseWaypoint);

	const sourceLink =
		doc.querySelector('metadata > link')?.getAttribute('href') ?? undefined;

	return { points, waypoints, sourceLink };
}
