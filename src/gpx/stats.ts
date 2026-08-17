import { TrackPoint } from './models';

export interface GpxStats {
	distanceKm: number;
	elevationGainM: number;
	elevationLossM: number;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
	return (deg * Math.PI) / 180;
}

export function haversineDistanceKm(a: TrackPoint, b: TrackPoint): number {
	const dLat = toRadians(b.lat - a.lat);
	const dLon = toRadians(b.lon - a.lon);
	const lat1 = toRadians(a.lat);
	const lat2 = toRadians(b.lat);

	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

	return EARTH_RADIUS_KM * c;
}

export function calculateStats(points: TrackPoint[]): GpxStats {
	let distanceKm = 0;
	let elevationGainM = 0;
	let elevationLossM = 0;

	for (let i = 1; i < points.length; i++) {
		const prev = points[i - 1];
		const curr = points[i];
		if (!prev || !curr) continue;

		distanceKm += haversineDistanceKm(prev, curr);

		if (prev.ele !== undefined && curr.ele !== undefined) {
			const delta = curr.ele - prev.ele;
			if (delta > 0) {
				elevationGainM += delta;
			} else {
				elevationLossM += -delta;
			}
		}
	}

	return { distanceKm, elevationGainM, elevationLossM };
}
