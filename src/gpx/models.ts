export interface TrackPoint {
	lat: number;
	lon: number;
	ele?: number;
}

export interface Waypoint {
	lat: number;
	lon: number;
	name?: string;
}

export interface GpxData {
	points: TrackPoint[];
	waypoints: Waypoint[];
	sourceLink?: string;
}
